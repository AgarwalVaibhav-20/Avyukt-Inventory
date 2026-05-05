import { mockDb } from './mockDb';
import { StockLedgerEntry, Batch, SerialNumber, StockReservation, ClosingStockSnapshot } from '@/types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const stockControlService = {
  // --- Stock Ledger ---
  getLedger: async () => { await delay(300); return mockDb.getStockLedger().sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()); },
  
  addLedgerEntry: async (entry: Omit<StockLedgerEntry, 'id' | 'runningBalance'>) => {
      // Note: Real ledger logic needs recalculating running balance for all subsequent entries if backdated
      const list = mockDb.getStockLedger();
      const itemEntries = list.filter(e => e.itemId === entry.itemId).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      const lastBalance = itemEntries.length > 0 ? (itemEntries[itemEntries.length - 1].runningBalance || 0) : 0;
      const newBalance = lastBalance + entry.quantityChange;

      const newEntry: StockLedgerEntry = {
          ...entry,
          id: Math.random().toString(36).substr(2, 9),
          runningBalance: newBalance
      };
      
      mockDb.saveStockLedger([...list, newEntry]);
      return newEntry;
  },

  // --- Batches ---
  getBatches: async () => { await delay(200); return mockDb.getBatches(); },
  
  createBatch: async (data: Omit<Batch, 'id' | 'status'>) => {
      await delay(300);
      const list = mockDb.getBatches();
      const newBatch: Batch = {
          ...data,
          id: Math.random().toString(36).substr(2, 9),
          status: 'Active'
      };
      mockDb.saveBatches([...list, newBatch]);
      return newBatch;
  },

  // --- Serials ---
  getSerials: async () => { await delay(200); return mockDb.getSerials(); },
  
  addSerial: async (data: Omit<SerialNumber, 'id' | 'status'>) => {
      await delay(200);
      const list = mockDb.getSerials();
      const newSerial: SerialNumber = {
          ...data,
          id: Math.random().toString(36).substr(2, 9),
          status: 'Available'
      };
      mockDb.saveSerials([...list, newSerial]);
      return newSerial;
  },

  // --- Reservations ---
  getReservations: async () => { await delay(200); return mockDb.getReservations(); },
  
  createReservation: async (data: Omit<StockReservation, 'id' | 'status'>) => {
      await delay(300);
      const list = mockDb.getReservations();
      const newRes: StockReservation = {
          ...data,
          id: Math.random().toString(36).substr(2, 9),
          status: 'Active'
      };
      mockDb.saveReservations([...list, newRes]);
      return newRes;
  },

  releaseReservation: async (id: string) => {
      await delay(200);
      const list = mockDb.getReservations();
      const index = list.findIndex(r => r.id === id);
      if(index !== -1) {
          list[index].status = 'Released';
          mockDb.saveReservations(list);
      }
  },

  // --- Valuation Analysis ---
  
  getValuationMethod: async (): Promise<'FIFO' | 'LIFO' | 'Avg'> => {
      return mockDb.getValuationMethod();
  },

  setValuationMethod: async (method: 'FIFO' | 'LIFO' | 'Avg'): Promise<void> => {
      await delay(200);
      mockDb.saveValuationMethod(method);
  },

  // Calculates value based on selected method: FIFO, LIFO, Weighted Average
  getValuationReport: async (overrideMethod?: 'FIFO' | 'LIFO' | 'Avg') => {
      await delay(500);
      const method = overrideMethod || mockDb.getValuationMethod();
      const items = mockDb.getItems();
      const batches = mockDb.getBatches();

      return items.map(item => {
          const itemBatches = batches.filter(b => b.itemId === item.id && b.status !== 'Depleted');
          let totalValue = 0;
          let stock = item.stock;

          if (stock <= 0) return { ...item, valuation: 0, method };

          if (method === 'Avg') {
              // Using standard unit price as average cost for simplicity in this mock
              totalValue = stock * item.unitPrice;
          } else {
              // FIFO/LIFO Simulation using batches
              // Sort batches
              const sortedBatches = [...itemBatches].sort((a,b) => {
                  const dateA = new Date(a.mfgDate).getTime();
                  const dateB = new Date(b.mfgDate).getTime();
                  return method === 'FIFO' ? dateA - dateB : dateB - dateA;
              });

              let remainingStockToValue = stock;
              for (const batch of sortedBatches) {
                  const qtyToValue = Math.min(remainingStockToValue, batch.quantity);
                  totalValue += qtyToValue * batch.costPrice;
                  remainingStockToValue -= qtyToValue;
                  if(remainingStockToValue <= 0) break;
              }
              // If stock remains (no batches), value at standard cost
              if(remainingStockToValue > 0) {
                  totalValue += remainingStockToValue * item.unitPrice;
              }
          }

          return {
              itemId: item.id,
              itemName: item.name,
              sku: item.sku,
              category: item.category,
              stock,
              method,
              unitValuation: totalValue / stock,
              totalValuation: totalValue
          };
      });
  },

  getWarehouseValuation: async () => {
      await delay(400);
      const items = await stockControlService.getValuationReport(); // Re-use logic
      const warehouses = mockDb.getWarehouses();
      const totalGlobalValue = items.reduce((acc, curr) => acc + curr.totalValuation, 0);

      // Simulate warehouse distribution logic
      // In a real app, we would sum ItemWarehouse.quantity * Item.cost
      return warehouses.map((w, idx) => {
          // Weighted pseudo-random distribution for demo
          const weight = (warehouses.length - idx + 1) * 10; 
          const share = weight / warehouses.reduce((acc, _, i) => acc + (warehouses.length - i + 1) * 10, 0);
          
          return {
              warehouseId: w.id,
              warehouseName: w.name,
              location: w.location,
              valuation: totalGlobalValue * share,
              itemCount: Math.floor(items.length * (0.5 + Math.random() * 0.5))
          };
      });
  },

  getClosingStockHistory: async (): Promise<ClosingStockSnapshot[]> => {
      await delay(300);
      return mockDb.getValuationSnapshots();
  },

  recalculateCosts: async () => {
      await delay(1500); // Simulate heavy processing
      // In a real app, this would re-run weighted average calculations based on all GRNs
      return new Date().toLocaleString();
  }
};
