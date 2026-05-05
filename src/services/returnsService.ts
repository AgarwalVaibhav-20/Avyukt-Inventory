import { mockDb } from './mockDb';
import { ReplacementOrder, FinancialNote, InventoryItem } from '@/types';
import api from './api';

const unwrapList = <T,>(response: any): T[] => response?.data?.data ?? response?.data ?? [];

const toFrontendReplacement = (item: any): ReplacementOrder => ({
    id: item.id || item._id,
    reference: item.orderNo || item.reference || `RO-${String(item.id || item._id || '').slice(-6)}`,
    date: (item.date || item.createdAt || new Date().toISOString()).toString().slice(0, 10),
    type: 'Vendor',
    originalReturnId: item.refReturn || item.originalReturnId || '',
    itemId: String(item.items?.[0]?.itemId || ''),
    itemName: item.items?.[0]?.name || item.items?.[0]?.itemName || '',
    quantity: Number(item.items?.[0]?.qty || item.items?.[0]?.quantity || 0),
    status: item.status || 'Pending',
});

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const returnsService = {
  // --- Replacements ---
  getReplacements: async (): Promise<ReplacementOrder[]> => {
    const response = await api.get('/api/replacement-orders');
    return unwrapList<ReplacementOrder>(response).map(toFrontendReplacement);
  },

  createReplacement: async (data: Omit<ReplacementOrder, 'id' | 'reference' | 'status' | 'date'>): Promise<ReplacementOrder> => {
    const response = await api.post('/api/replacement-orders', data);
    return toFrontendReplacement(response.data.data ?? response.data);
  },

  updateReplacementStatus: async (id: string, status: ReplacementOrder['status']): Promise<void> => {
      await api.put(`/api/replacement-orders/${id}`, { status });
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
