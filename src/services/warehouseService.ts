import api from "./api";
import { authService } from "./authService";
import { mockDb } from "./mockDb";
import {
  Warehouse,
  StockTransfer,
  Zone,
  Rack,
  Shelf,
  Bin,
  WarehouseCapacityStats,
} from "@/types";

const getOrgId = () => {
  const user = authService.getCurrentUser();
  return user?.organisationId;
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getOrganisationId = () => authService.getOrganisationId();

export const warehouseService = {
  // --- Warehouse Master ---
  getAllWarehouses: async (_organisationId?: string): Promise<Warehouse[]> => {
    const response = await api.get("/getall/warehouse");
    const data = response.data;
    const warehouses = Array.isArray(data)
      ? data
      : data.warehouses || data.items || data.data || [];
    return warehouses.map((w: any) => ({ ...w, id: w._id || w.id }));
  },

  addWarehouse: async (data: Omit<Warehouse, "id">): Promise<Warehouse> => {
    const orgId = getOrgId();
    const payload = { ...data, organisationId: orgId };
    const response = await api.post("/warehouse/create", payload);
    const w = response.data.warehouse || response.data;
    return { ...w, id: w._id };
  },

  deleteWarehouse: async (id: string): Promise<void> => {
    await api.delete(`/warehouse/delete/${id}`);
  },

  updateWarehouse: async (id: string, data: Partial<Warehouse>): Promise<Warehouse> => {
    const response = await api.put(`/warehouse/update/${id}`, data);
    const w = response.data.warehouse || response.data;
    return { ...w, id: w._id || w.id };
  },

  // --- Transfers ---
  getAllTransfers: async (): Promise<StockTransfer[]> => {
    const response = await api.get("/api/transfer");
    return (response.data.transfers || []).map((transfer: any) => ({
      id: transfer._id,
      sourceWarehouseId:
        typeof transfer.sourceWarehouse === "object"
          ? transfer.sourceWarehouse?._id
          : transfer.sourceWarehouse,
      destinationWarehouseId:
        typeof transfer.destinationWarehouse === "object"
          ? transfer.destinationWarehouse?._id
          : transfer.destinationWarehouse,
      items: (transfer.items || []).map((item: any) => ({
        itemId: item.itemId,
        itemName: item.itemName || "Unknown Item",
        quantity: Number(item.quantity || 0),
      })),
      status:
        transfer.status === "delivered"
          ? "Completed"
          : transfer.status === "in-transit"
            ? "In Transit"
            : transfer.status || "Pending",
      date: transfer.transportTime
        ? new Date(transfer.transportTime).toISOString().split("T")[0]
        : new Date(transfer.createdAt).toISOString().split("T")[0],
      referenceNo: transfer.ref || `TRF-${String(transfer._id).slice(-6).toUpperCase()}`,
    }));
  },

  createTransfer: async (
    transfer: Omit<StockTransfer, "id" | "referenceNo" | "date" | "status">,
  ): Promise<StockTransfer> => {
    const organisationId = getOrganisationId();

    const response = await api.post("/api/transfer/create", {
      organisationId,
      sourceWarehouse: transfer.sourceWarehouseId,
      destinationWarehouse: transfer.destinationWarehouseId,
      items: transfer.items, // Already mapped in component
      notes: "",
    });

    const created = response.data.transfer;
    return {
      id: created._id,
      sourceWarehouseId: created.sourceWarehouse,
      destinationWarehouseId: created.destinationWarehouse,
      items: created.items.map((item: any) => ({
        itemId: item.itemId,
        itemName: item.itemName || "Item",
        quantity: item.quantity,
      })),
      status: created.status || "Completed",
      date: new Date(created.createdAt).toISOString().split("T")[0],
      referenceNo:
        created.ref || `TRF-${String(created._id).slice(-6).toUpperCase()}`,
    };
  },

  // --- Hierarchy: Zones ---
  getZones: async (warehouseId: string): Promise<Zone[]> => {
    const response = await api.get("/api/zones", { params: { warehouseId } });
    const data = response.data.data || [];
    return data.map((z: any) => ({
      ...z,
      id: z._id,
      warehouseId: z.warehouseId || z.warehouse,
    }));
  },

  saveZone: async (zone: Omit<Zone, "id">): Promise<Zone> => {
    const response = await api.post("/api/zones", zone);
    const z = response.data.data;
    return { ...z, id: z._id };
  },

  deleteZone: async (id: string): Promise<void> => {
    await api.delete(`/api/zones/${id}`);
  },

  // --- Hierarchy: Racks ---
  getRacks: async (warehouseId: string, zoneId?: string): Promise<Rack[]> => {
    const response = await api.get(`/api/racks/get/${warehouseId}`, {
      params: { zoneId },
    });
    const data = response.data.racks || [];
    return data.map((r: any) => ({
      ...r,
      id: r._id,
      name: r.rackName,
      code: r.code || r.rackCode || String(r._id).slice(-4).toUpperCase(),
      levels: r.shelvesCount,
      warehouseId: r.warehouseId || r.warehouse, // Handle both field names
    }));
  },

  saveRack: async (rack: Omit<Rack, "id">): Promise<Rack> => {
    const payload = {
      ...rack,
      rackName: rack.name,
      code: rack.code,
      shelvesCount: rack.levels,
      warehouseId: rack.warehouseId,
    };
    const response = await api.post("/api/racks", payload);
    const r = response.data.data;
    return {
      ...r,
      id: r._id,
      name: r.rackName,
      code: r.code || rack.code,
      levels: r.shelvesCount,
      warehouseId: r.warehouseId,
      zoneId: r.zoneId,
    };
  },

  deleteRack: async (id: string): Promise<void> => {
    await api.delete(`/api/racks/${id}`);
  },

  // --- Hierarchy: Shelves ---
  getShelves: async (rackId: string): Promise<Shelf[]> => {
    const response = await api.get(`/api/shelves/shelf/get/${rackId}`);
    const data = response.data.shelves || [];
    return data.map((s: any) => ({
      ...s,
      id: s._id,
      name: s.shelfName,
      level: s.level || Number(String(s.shelfName || "").match(/\d+/)?.[0] || 1),
    }));
  },

  saveShelf: async (shelf: Omit<Shelf, "id">): Promise<Shelf> => {
    const response = await api.post("/api/shelves/shelf/create", {
      shelfName: shelf.name,
      rackId: shelf.rackId,
      warehouseId: shelf.warehouseId,
      zoneId: shelf.zoneId,
      level: shelf.level,
    });
    const s = response.data.shelf;
    return {
      ...s,
      id: s._id,
      name: s.shelfName,
      level: s.level,
    };
  },

  // --- Hierarchy: Bins ---
  getAllBins: async (filters?: {
    warehouseId?: string;
    zoneId?: string;
    rackId?: string;
  }): Promise<Bin[]> => {
    const response = await api.get("/api/bins", { params: filters });
    const data = response.data;
    const items = Array.isArray(data)
      ? data
      : data.items || data.data || data.bins || [];
    return items.map((b: any) => ({
      ...b,
      id: b._id || b.id,
      binCode: b.code || b.binCode || b.name,
      maxCapacity: b.capacity || b.maxCapacity || 0,
      currentOccupancy: b.current || b.currentOccupancy || 0
    }));
  },

  getBinsByRack: async (rackId: string): Promise<Bin[]> => {
    await delay(200);
    return mockDb.getBins().filter((b) => b.rackId === rackId);
  },

  saveBin: async (bin: Omit<Bin, "id">): Promise<Bin> => {
    const response = await api.post("/api/bins", bin);
    const b = response.data;
    return { ...b, id: b._id };
  },

  deleteBin: async (id: string): Promise<void> => {
    await api.delete(`/api/bins/${id}`);
  },

  // --- Capacity Stats ---
  getWarehouseCapacityStats: async (): Promise<WarehouseCapacityStats[]> => {
    try {
      const orgId = getOrgId();
      const response = await api.get("/warehouse/capacity-stats", {
        params: { organisationId: orgId }
      });
      const data = response.data.data || [];
      return data.map((wh: any) => ({
        ...wh,
        id: wh.warehouseId || wh._id || wh.id,
        zoneStats: (wh.zoneStats || []).map((z: any) => ({
          ...z,
          id: z._id || z.id
        }))
      }));
    } catch (error) {
      console.error("Failed to fetch warehouse capacity stats", error);
      return [];
    }
  },
};
