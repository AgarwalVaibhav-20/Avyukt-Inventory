import api from './api';
import { Invoice, EWayBill, InspectionReport, DocumentAttachment } from '@/types';
import { mockDb } from './mockDb';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const unwrapList = <T>(response: any): T[] => {
  if (response.data && Array.isArray(response.data)) return response.data;
  if (response.data?.data && Array.isArray(response.data.data)) return response.data.data;
  return [];
};

const mapId = (item: any) => ({
  ...item,
  id: item._id || item.id
});

export const documentService = {
  // --- Invoices ---
  getInvoices: async (): Promise<Invoice[]> => {
    try {
      const response = await api.get('/api/invoice-mappings');
      return unwrapList<any>(response).map(mapId);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      return [];
    }
  },

  createInvoice: async (data: any): Promise<Invoice> => {
    try {
      const response = await api.post('/api/invoice-mappings', data);
      return mapId(response.data.data || response.data);
    } catch (err: any) {
      console.error('Error creating invoice:', err);
      throw new Error(err.response?.data?.message || 'Failed to create invoice');
    }
  },

  // --- E-Way Bills ---
  getEWayBills: async (params?: { page?: number; limit?: number; search?: string; status?: string }): Promise<{ data: EWayBill[]; total: number; totalPages: number; page: number }> => {
    try {
      const response = await api.get('/api/eway-bills', { params });
      const data = response.data;
      return {
        data: (data.data || []).map(mapId),
        total: data.total || 0,
        totalPages: data.totalPages || 1,
        page: data.page || 1
      };
    } catch (err) {
      console.error('Error fetching e-way bills:', err);
      return { data: [], total: 0, totalPages: 1, page: 1 };
    }
  },

  createEWayBill: async (data: any): Promise<EWayBill> => {
    try {
      const response = await api.post('/api/eway-bills', data);
      return mapId(response.data.data || response.data);
    } catch (err: any) {
      console.error('Error creating e-way bill:', err);
      throw new Error(err.response?.data?.message || 'Failed to create e-way bill');
    }
  },

  updateEWayBill: async (id: string, data: any): Promise<EWayBill> => {
    try {
      const response = await api.put(`/api/eway-bills/${id}`, data);
      return mapId(response.data.data || response.data);
    } catch (err: any) {
      console.error('Error updating e-way bill:', err);
      throw new Error(err.response?.data?.message || 'Failed to update e-way bill');
    }
  },

  deleteEWayBill: async (id: string): Promise<void> => {
    try {
      await api.delete(`/api/eway-bills/${id}`);
    } catch (err: any) {
      console.error('Error deleting e-way bill:', err);
      throw new Error(err.response?.data?.message || 'Failed to delete e-way bill');
    }
  },

  // --- Inspection Reports ---
  getInspectionReports: async (): Promise<InspectionReport[]> => {
    await delay(200);
    return mockDb.getInspectionReports();
  },

  // --- Attachments ---
  getAttachments: async (): Promise<DocumentAttachment[]> => {
    await delay(200);
    return mockDb.getAttachments();
  },

  uploadAttachment: async (data: Omit<DocumentAttachment, 'id' | 'uploadDate'>): Promise<DocumentAttachment> => {
    await delay(500); // Simulate upload
    const list = mockDb.getAttachments();
    const newRec: DocumentAttachment = {
        ...data,
        id: Math.random().toString(36).substr(2, 9),
        uploadDate: new Date().toISOString().split('T')[0]
    };
    mockDb.saveAttachments([newRec, ...list]);
    return newRec;
  },

  deleteAttachment: async (id: string): Promise<void> => {
    await delay(200);
    const list = mockDb.getAttachments().filter(a => a.id !== id);
    mockDb.saveAttachments(list);
  }
};
