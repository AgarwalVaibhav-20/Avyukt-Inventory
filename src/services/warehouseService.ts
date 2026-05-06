import api from './api';
import { authService } from './authService';
import { mockDb } from './mockDb';
import { Warehouse, StockTransfer, Zone, Rack, Bin, WarehouseCapacityStats } from '@/types';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getOrganisationId = () => authService.getOrganisationId();

export const warehouseService = {
  // --- Warehouse Master ---
  getAllWarehouses: async (): Promise<Warehouse[]> => {
    const response = await api.get('/getall/warehouse');
    return (response.data.warehouses || []).map((warehouse: any) => ({
      id: warehouse._id,
      name: warehouse.name,
      location:
        typeof warehouse.location === 'object'
          ? warehouse.location?.name || ''
          : warehouse.location || '',
      type: warehouse.type || 'General',
      capacity: Number(warehouse.capacity || 0),
      contactPerson: warehouse.contact || warehouse.phone || '',
    }));
  },

  addWarehouse: async (data: Omit<Warehouse, 'id'>): Promise<Warehouse> => {
    const response = await api.post('/warehouse/create', data);
    return response.data;
  },

  deleteWarehouse: async (id: string): Promise<void> => {
    await api.delete(`/warehouse/delete/${id}`);
  },

  // --- Transfers ---
  getAllTransfers: async (): Promise<StockTransfer[]> => {
    const response = await api.get('/stock-transfers');
    return (response.data.transfers || []).map((transfer: any) => ({
      id: transfer._id,
      sourceWarehouseId:
        typeof transfer.fromWarehouse === 'object'
          ? transfer.fromWarehouse?._id
          : transfer.fromWarehouse,
      destinationWarehouseId:
        typeof transfer.toWarehouse === 'object'
          ? transfer.toWarehouse?._id
          : transfer.toWarehouse,
      items: [
        {
          itemId:
            typeof transfer.productId === 'object'
              ? transfer.productId?._id
              : transfer.productId,
          itemName: transfer.productName || 'Unknown Item',
          quantity: Number(transfer.quantity || 0),
        },
      ],
      status:
        transfer.status === 'delivered'
          ? 'Completed'
          : transfer.status === 'in-transit'
            ? 'In Transit'
            : 'Pending',
      date: transfer.transportTime
        ? new Date(transfer.transportTime).toISOString().split('T')[0]
        : new Date(transfer.createdAt).toISOString().split('T')[0],
      referenceNo: `TRF-${String(transfer._id).slice(-6).toUpperCase()}`,
    }));
  },

  createTransfer: async (transfer: Omit<StockTransfer, 'id' | 'referenceNo' | 'date' | 'status'>): Promise<StockTransfer> => {
    const organisationId = getOrganisationId();
    const firstItem = transfer.items[0];

    const response = await api.post('/inventory/stock/transfer', {
      organisationId,
      productId: firstItem.itemId,
      fromWarehouse: transfer.sourceWarehouseId,
      toWarehouse: transfer.destinationWarehouseId,
      quantity: firstItem.quantity,
      transportType: 'Truck',
      notes: '',
    });

    const created = response.data.transfer;
    return {
      id: created._id,
      sourceWarehouseId: created.fromWarehouse,
      destinationWarehouseId: created.toWarehouse,
      items: [
        {
          itemId: created.productId,
          itemName: created.productName || firstItem.itemName,
          quantity: Number(created.quantity || firstItem.quantity),
        },
      ],
      status: 'Completed',
      date: created.transportTime
        ? new Date(created.transportTime).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      referenceNo: `TRF-${String(created._id).slice(-6).toUpperCase()}`,
    };
  },

  // --- Hierarchy: Zones ---
  getZones: async (warehouseId: string): Promise<Zone[]> => {
    await delay(200);
    return mockDb.getZones().filter(z => z.warehouseId === warehouseId);
  },

  saveZone: async (zone: Omit<Zone, 'id'>): Promise<Zone> => {
    await delay(200);
    const list = mockDb.getZones();
    const newRec = { ...zone, id: Math.random().toString(36).substr(2, 9) };
    mockDb.saveZones([...list, newRec]);
    return newRec;
  },

  deleteZone: async (id: string): Promise<void> => {
    await delay(200);
    mockDb.saveZones(mockDb.getZones().filter(z => z.id !== id));
  },

  // --- Hierarchy: Racks ---
  getRacks: async (zoneId: string): Promise<Rack[]> => {
    await delay(200);
    return mockDb.getRacks().filter(r => r.zoneId === zoneId);
  },

  saveRack: async (rack: Omit<Rack, 'id'>): Promise<Rack> => {
    await delay(200);
    const list = mockDb.getRacks();
    const newRec = { ...rack, id: Math.random().toString(36).substr(2, 9) };
    mockDb.saveRacks([...list, newRec]);
    return newRec;
  },

  deleteRack: async (id: string): Promise<void> => {
    await delay(200);
    mockDb.saveRacks(mockDb.getRacks().filter(r => r.id !== id));
  },

  // --- Hierarchy: Bins ---
  getAllBins: async (): Promise<Bin[]> => {
    await delay(200);
    return mockDb.getBins();
  },

  getBinsByRack: async (rackId: string): Promise<Bin[]> => {
    await delay(200);
    return mockDb.getBins().filter(b => b.rackId === rackId);
  },

  saveBin: async (bin: Omit<Bin, 'id'>): Promise<Bin> => {
    await delay(200);
    const list = mockDb.getBins();
    const newRec = { ...bin, id: Math.random().toString(36).substr(2, 9) };
    mockDb.saveBins([...list, newRec]);
    return newRec;
  },

  deleteBin: async (id: string): Promise<void> => {
    await delay(200);
    mockDb.saveBins(mockDb.getBins().filter(b => b.id !== id));
  },

  // --- Capacity Stats ---
  getWarehouseCapacityStats: async (): Promise<WarehouseCapacityStats[]> => {
    await delay(400);
    const warehouses = mockDb.getWarehouses();
    const zones = mockDb.getZones();
    const racks = mockDb.getRacks();
    const bins = mockDb.getBins();

    return warehouses.map(wh => {
      const whZones = zones.filter(z => z.warehouseId === wh.id);
      const whRacks = racks.filter(r => whZones.some(z => z.id === r.zoneId));
      const whBins = bins.filter(b => whRacks.some(r => r.id === b.rackId));

      // Calculate stats per zone
      const zoneStats = whZones.map(z => {
        const zRacks = whRacks.filter(r => r.zoneId === z.id);
        const zBins = bins.filter(b => zRacks.some(r => r.id === b.rackId));
        const capacity = zBins.reduce((sum, b) => sum + b.maxCapacity, 0);
        const used = zBins.reduce((sum, b) => sum + b.currentOccupancy, 0);
        return { zoneName: z.name, capacity, used };
      });

      const totalBins = whBins.length;
      const occupiedBins = whBins.filter(b => b.status !== 'Empty').length;
      const utilizationRate = totalBins > 0 ? Math.round((occupiedBins / totalBins) * 100) : 0;

      return {
        warehouseId: wh.id,
        warehouseName: wh.name,
        totalBins,
        occupiedBins,
        utilizationRate,
        zoneStats
      };
    });
  }
};
