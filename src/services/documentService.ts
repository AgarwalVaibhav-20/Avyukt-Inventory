import api from './api';
import { Invoice, EWayBill, InspectionReport, DocumentAttachment } from '@/types';
const unwrapList = <T>(response: any): T[] => {
  if (response.data && Array.isArray(response.data)) return response.data;
  if (response.data?.data && Array.isArray(response.data.data)) return response.data.data;
  return [];
};

const mapId = (item: any) => ({
  ...item,
  id: item._id || item.id
});

const mapAttachment = (item: any): DocumentAttachment => {
  const latestVersion = item.versions?.[item.versions.length - 1];
  return {
    id: item._id || item.id,
    fileName: item.name || latestVersion?.originalName || item.fileName || 'Untitled document',
    fileType: item.category || item.fileType || 'Document',
    size: item.size || latestVersion?.size || '',
    uploadDate: item.uploadedOn
      ? new Date(item.uploadedOn).toISOString().split('T')[0]
      : item.uploadDate || '',
    uploadedBy: item.uploadedBy || 'Admin User',
    referenceType: item.referenceType || 'General',
    referenceId: item.referenceId || '',
    referenceLabel: item.referenceLabel || '',
    version: item.currentVersion || item.version || 1,
    url: latestVersion?.fileUrl || item.url,
    versions: item.versions || [],
  };
};

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
    return [];
  },

  // --- Attachments ---
  getAttachments: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    tag?: string;
    referenceType?: string;
    referenceId?: string;
  }): Promise<DocumentAttachment[]> => {
    try {
      const response = await api.get('/api/attachments', { params });
      return (response.data?.data || []).map(mapAttachment);
    } catch (err) {
      console.error('Error fetching attachments:', err);
      return [];
    }
  },

  uploadAttachment: async (
    file: File,
    data: {
      name?: string;
      category?: string;
      tag?: string;
      uploadedBy?: string;
      notes?: string;
      referenceType?: DocumentAttachment['referenceType'];
      referenceId?: string;
      referenceLabel?: string;
    } = {},
  ): Promise<DocumentAttachment> => {
    const formData = new FormData();
    formData.append('file', file);
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        formData.append(key, String(value));
      }
    });

    // Let the browser set multipart boundary automatically.
    const response = await api.post('/api/attachments', formData);
    return mapAttachment(response.data);
  },

  uploadAttachmentVersion: async (
    id: string,
    file: File,
    data: { uploadedBy?: string; notes?: string } = {},
  ): Promise<DocumentAttachment> => {
    const formData = new FormData();
    formData.append('file', file);
    Object.entries(data).forEach(([key, value]) => {
      if (value) formData.append(key, String(value));
    });

    // Let the browser set multipart boundary automatically.
    const response = await api.post(`/api/attachments/${id}/version`, formData);
    return mapAttachment(response.data);
  },

  deleteAttachment: async (id: string): Promise<void> => {
    await api.delete(`/api/attachments/${id}`);
  }
};
