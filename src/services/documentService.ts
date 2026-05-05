import { mockDb } from './mockDb';
import { Invoice, EWayBill, InspectionReport, DocumentAttachment } from '@/types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const documentService = {
  // --- Invoices ---
  getInvoices: async (): Promise<Invoice[]> => {
    await delay(300);
    return mockDb.getInvoices();
  },

  createInvoice: async (data: Omit<Invoice, 'id' | 'invoiceNumber'>): Promise<Invoice> => {
    await delay(300);
    const list = mockDb.getInvoices();
    const newRec: Invoice = {
        ...data,
        id: Math.random().toString(36).substr(2, 9),
        invoiceNumber: `INV-${new Date().getFullYear()}-${String(list.length + 1).padStart(4, '0')}`
    };
    mockDb.saveInvoices([newRec, ...list]);
    return newRec;
  },

  // --- E-Way Bills ---
  getEWayBills: async (): Promise<EWayBill[]> => {
    await delay(300);
    return mockDb.getEWayBills();
  },

  createEWayBill: async (data: Omit<EWayBill, 'id' | 'billNumber' | 'generatedDate'>): Promise<EWayBill> => {
    await delay(400);
    const list = mockDb.getEWayBills();
    const newRec: EWayBill = {
        ...data,
        id: Math.random().toString(36).substr(2, 9),
        billNumber: `EWB-${Math.floor(Math.random() * 100000000000)}`, // Random 12 digit mock
        generatedDate: new Date().toISOString().split('T')[0]
    };
    mockDb.saveEWayBills([newRec, ...list]);
    return newRec;
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
