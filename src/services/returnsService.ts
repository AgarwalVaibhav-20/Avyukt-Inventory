import { mockDb } from './mockDb';
import { ReplacementOrder, FinancialNote, InventoryItem } from '@/types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const returnsService = {
  // --- Replacements ---
  getReplacements: async (): Promise<ReplacementOrder[]> => {
    await delay(200);
    return mockDb.getReplacements();
  },

  createReplacement: async (data: Omit<ReplacementOrder, 'id' | 'reference' | 'status' | 'date'>): Promise<ReplacementOrder> => {
    await delay(300);
    const list = mockDb.getReplacements();
    const newRec: ReplacementOrder = {
        ...data,
        id: Math.random().toString(36).substr(2, 9),
        reference: `REP-${new Date().getFullYear()}-${String(list.length + 1).padStart(3, '0')}`,
        status: 'Pending',
        date: new Date().toISOString().split('T')[0]
    };
    mockDb.saveReplacements([newRec, ...list]);

    // Handle Stock Impact
    const items = mockDb.getItems();
    const itemIndex = items.findIndex(i => i.id === data.itemId);
    if(itemIndex !== -1) {
        if(data.type === 'Customer') {
            // Sending replacement to customer -> Deduct Stock
            items[itemIndex].stock -= data.quantity;
            if(items[itemIndex].stock < 0) items[itemIndex].stock = 0;
        } else {
            // Receiving replacement from vendor -> Add Stock
            items[itemIndex].stock += data.quantity;
        }
        mockDb.saveItems(items);
    }

    return newRec;
  },

  updateReplacementStatus: async (id: string, status: ReplacementOrder['status']): Promise<void> => {
      await delay(200);
      const list = mockDb.getReplacements();
      const idx = list.findIndex(r => r.id === id);
      if(idx !== -1) {
          list[idx].status = status;
          mockDb.saveReplacements(list);
      }
  },

  // --- Financial Notes (Debit/Credit) ---
  getFinancialNotes: async (): Promise<FinancialNote[]> => {
      await delay(200);
      return mockDb.getFinancialNotes();
  },

  createFinancialNote: async (data: Omit<FinancialNote, 'id' | 'noteNumber' | 'date' | 'status'>): Promise<FinancialNote> => {
      await delay(300);
      const list = mockDb.getFinancialNotes();
      const prefix = data.type === 'Debit Note' ? 'DN' : 'CN';
      const newNote: FinancialNote = {
          ...data,
          id: Math.random().toString(36).substr(2, 9),
          noteNumber: `${prefix}-${new Date().getFullYear()}-${String(list.length + 1).padStart(3, '0')}`,
          date: new Date().toISOString().split('T')[0],
          status: 'Issued'
      };
      mockDb.saveFinancialNotes([newNote, ...list]);
      return newNote;
  }
};
