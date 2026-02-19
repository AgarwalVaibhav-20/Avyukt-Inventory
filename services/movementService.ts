import { mockDb } from './mockDb';
import { InternalMovement, StockAdjustment, ScrapEntry, ConsignmentEntry, InventoryItem } from '../types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const movementService = {
  // --- Internal Movement ---
  getInternalMovements: async () => { await delay(200); return mockDb.getInternalMovements(); },

  createInternalMovement: async (data: Omit<InternalMovement, 'id' | 'reference' | 'date'>) => {
    await delay(300);
    const list = mockDb.getInternalMovements();
    const newRec: InternalMovement = {
        ...data,
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString().split('T')[0],
        reference: `IM-${new Date().getFullYear()}-${String(list.length + 1).padStart(4, '0')}`
    };
    mockDb.saveInternalMovements([newRec, ...list]);
    return newRec;
  },

  // --- Adjustments (Correction / Damage / Loss) ---
  getAdjustments: async () => { await delay(200); return mockDb.getAdjustments(); },

  createAdjustment: async (data: Omit<StockAdjustment, 'id' | 'reference' | 'date' | 'impact'>) => {
    await delay(400);
    const list = mockDb.getAdjustments();
    const isNegative = ['Damage', 'Loss', 'Theft'].includes(data.type);
    const impact = isNegative ? 'Deduct' : 'Add'; // Correction can be add, assumed add for simplicity unless specialized
    // NOTE: In a real system "Correction" usually asks if it's + or - 

    const newRec: StockAdjustment = {
        ...data,
        impact: impact, 
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString().split('T')[0],
        reference: `ADJ-${new Date().getFullYear()}-${String(list.length + 1).padStart(4, '0')}`
    };
    mockDb.saveAdjustments([newRec, ...list]);

    // Update Stock
    const items = mockDb.getItems();
    const itemIdx = items.findIndex(i => i.id === data.itemId);
    if(itemIdx !== -1) {
        if(impact === 'Deduct') {
            items[itemIdx].stock -= data.quantity;
            if(items[itemIdx].stock < 0) items[itemIdx].stock = 0;
        } else {
            items[itemIdx].stock += data.quantity;
        }
        mockDb.saveItems(items);
    }

    return newRec;
  },

  // --- Scrap ---
  getScrapEntries: async () => { await delay(200); return mockDb.getScrap(); },

  createScrapEntry: async (data: Omit<ScrapEntry, 'id' | 'reference' | 'date' | 'status'>) => {
    await delay(300);
    const list = mockDb.getScrap();
    const newRec: ScrapEntry = {
        ...data,
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString().split('T')[0],
        status: 'Approved', // Auto approve for demo
        reference: `SCR-${new Date().getFullYear()}-${String(list.length + 1).padStart(4, '0')}`
    };
    mockDb.saveScrap([newRec, ...list]);

    // Deduct Stock
    const items = mockDb.getItems();
    const itemIdx = items.findIndex(i => i.id === data.itemId);
    if(itemIdx !== -1) {
        items[itemIdx].stock -= data.quantity;
        if(items[itemIdx].stock < 0) items[itemIdx].stock = 0;
        mockDb.saveItems(items);
    }
    return newRec;
  },

  // --- Consignment ---
  getConsignmentEntries: async () => { await delay(200); return mockDb.getConsignment(); },

  createConsignment: async (data: Omit<ConsignmentEntry, 'id' | 'reference' | 'date' | 'status'>) => {
      await delay(400);
      const list = mockDb.getConsignment();
      const newRec: ConsignmentEntry = {
          ...data,
          id: Math.random().toString(36).substr(2, 9),
          date: new Date().toISOString().split('T')[0],
          status: 'Active',
          reference: `CS-${data.type === 'Outward' ? 'OUT' : 'IN'}-${String(list.length + 1).padStart(3, '0')}`
      };
      mockDb.saveConsignment([newRec, ...list]);

      // Move Stock Logic
      const items = mockDb.getItems();
      const itemIdx = items.findIndex(i => i.id === data.itemId);
      if(itemIdx !== -1) {
          const item = items[itemIdx];
          if(data.type === 'Outward') {
              // Move from Main Stock -> Consignment Stock
              item.stock -= data.quantity;
              item.consignmentStock = (item.consignmentStock || 0) + data.quantity;
          } else {
               // Inward (Return) from Consignment -> Main Stock
               item.consignmentStock = (item.consignmentStock || 0) - data.quantity;
               item.stock += data.quantity;
          }
          if(item.stock < 0) item.stock = 0;
          if(item.consignmentStock < 0) item.consignmentStock = 0;
          
          mockDb.saveItems(items);
      }
      return newRec;
  }
};
