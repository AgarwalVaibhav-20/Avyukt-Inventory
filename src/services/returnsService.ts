import { ReplacementOrder, FinancialNote } from '@/types';
import api from './api';

const unwrapList = <T,>(response: any): T[] => response?.data?.data ?? response?.data ?? [];

const mapReplacementStatus = (status?: string): ReplacementOrder['status'] => {
  switch (status) {
    case 'Dispatched':
    case 'Shipped':
      return 'Shipped';
    case 'Delivered':
    case 'Received':
      return 'Received';
    case 'Pending':
    case 'Draft':
    default:
      return 'Pending';
  }
};

const mapNoteType = (type?: string): FinancialNote['type'] =>
  type === 'Debit Note' ? 'Debit Note' : 'Credit Note';

const mapNoteStatus = (status?: string): FinancialNote['status'] => {
  switch (status) {
    case 'Adjusted':
      return 'Adjusted';
    case 'Draft':
      return 'Draft';
    case 'Issued':
    case 'Cancelled':
    default:
      return 'Issued';
  }
};

const mapReplacementType = (type?: string): ReplacementOrder['type'] =>
  type === 'Vendor' ? 'Vendor' : 'Customer';

const toFrontendReplacement = (item: any): ReplacementOrder => ({
    id: item.id || item._id,
    reference: item.orderNo || item.reference || `RO-${String(item.id || item._id || '').slice(-6)}`,
    date: (item.date || item.createdAt || new Date().toISOString()).toString().slice(0, 10),
    type: mapReplacementType(item.partyType || item.type),
    originalReturnId: item.refReturn || item.originalReturnId || '',
    itemId: String(item.items?.[0]?.itemId || item.items?.[0]?.productId || ''),
    itemName: item.items?.[0]?.name || item.items?.[0]?.itemName || item.items?.[0]?.description || '',
    quantity: Number(item.items?.[0]?.qty || item.items?.[0]?.quantity || 0),
    status: mapReplacementStatus(item.status),
});

const toFrontendFinancialNote = (item: any): FinancialNote => ({
  id: item.id || item._id,
  noteNumber: item.noteNo || item.noteNumber || `FN-${String(item.id || item._id || '').slice(-6)}`,
  date: (item.date || item.createdAt || new Date().toISOString()).toString().slice(0, 10),
  type: mapNoteType(item.noteType || item.type),
  referenceId: item.referenceId || '',
  partyName: item.partyName || '',
  amount: Number(item.amount || 0),
  reason: item.reason || '',
  status: mapNoteStatus(item.status),
});

export const returnsService = {
  // --- Replacements ---
  getReplacements: async (): Promise<ReplacementOrder[]> => {
    try {
      const response = await api.get('/api/replacement-orders');
      return unwrapList<ReplacementOrder>(response).map(toFrontendReplacement);
    } catch (error) {
      return [];
    }
  },

  createReplacement: async (data: Omit<ReplacementOrder, 'id' | 'reference' | 'status' | 'date'>): Promise<ReplacementOrder> => {
    const payload = {
      type: data.type,
      partyType: data.type,
      partyName: data.type === 'Customer' ? data.itemName || 'Customer' : data.itemName || 'Vendor',
      originalReturnId: data.originalReturnId,
      refReturn: data.originalReturnId,
      items: [
        {
          itemId: data.itemId,
          productId: data.itemId,
          name: data.itemName,
          description: data.itemName,
          qty: data.quantity,
          unit: 'Unit',
          reason: 'Replacement',
        },
      ],
      status: 'Pending',
    };
    try {
      const response = await api.post('/api/replacement-orders', payload);
      return toFrontendReplacement(response.data.data ?? response.data);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create replacement order');
    }
  },

  updateReplacementStatus: async (id: string, status: ReplacementOrder['status']): Promise<void> => {
      await api.put(`/api/replacement-orders/${id}`, { status });
  },

  // --- Financial Notes (Debit/Credit) ---
  getFinancialNotes: async (): Promise<FinancialNote[]> => {
      try {
        const response = await api.get('/api/financial-notes');
        return unwrapList<FinancialNote>(response).map(toFrontendFinancialNote);
      } catch (error) {
        return [];
      }
  },

  createFinancialNote: async (data: Omit<FinancialNote, 'id' | 'noteNumber' | 'date' | 'status'>): Promise<FinancialNote> => {
      try {
        const response = await api.post('/api/financial-notes', {
          noteType: data.type,
          referenceId: data.referenceId,
          referenceType: data.type === 'Debit Note' ? 'Purchase Return' : 'Sales Return',
          partyName: data.partyName,
          amount: data.amount,
          reason: data.reason,
          status: 'Issued',
        });
        return toFrontendFinancialNote(response.data.data ?? response.data);
      } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to create financial note');
      }
  }
};
