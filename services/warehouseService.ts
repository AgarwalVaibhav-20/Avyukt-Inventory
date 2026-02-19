import { mockDb } from './mockDb';
import { Warehouse, StockTransfer, Zone, Rack, Bin, WarehouseCapacityStats } from '../types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const warehouseService = {
  // --- Warehouse Master ---
  getAllWarehouses: async (): Promise<Warehouse[]> => {
    await delay(300);
    return mockDb.getWarehouses();
  },

  addWarehouse: async (data: Omit<Warehouse, 'id'>): Promise<Warehouse> => {
    await delay(300);
    const list = mockDb.getWarehouses();
    const newRec = { ...data, id: Math.random().toString(36).substr(2, 9) };
    mockDb.saveWarehouses([...list, newRec]);
    return newRec;
  },

  deleteWarehouse: async (id: string): Promise<void> => {
    await delay(200);
    const list = mockDb.getWarehouses().filter(w => w.id !== id);
    mockDb.saveWarehouses(list);
  },

  // --- Transfers ---
  getAllTransfers: async (): Promise<StockTransfer[]> => {
    await delay(300);
    return mockDb.getTransfers().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  createTransfer: async (transfer: Omit<StockTransfer, 'id' | 'referenceNo' | 'date' | 'status'>): Promise<StockTransfer> => {
    await delay(500);
    const list = mockDb.getTransfers();
    
    // Auto-generate metadata
    const newTransfer: StockTransfer = {
      ...transfer,
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString().split('T')[0],
      status: 'In Transit',
      referenceNo: `TRF-${new Date().getFullYear()}-${list.length + 1}`
    };

    mockDb.saveTransfers([newTransfer, ...list]);
    return newTransfer;
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
