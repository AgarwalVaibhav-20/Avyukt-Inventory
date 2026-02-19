import { mockDb } from './mockDb';
import { Vendor, VendorItemMap, VendorPerformanceReview } from '../types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const vendorService = {
  // --- Vendors ---
  getVendors: async (): Promise<Vendor[]> => {
    await delay(300);
    return mockDb.getVendors();
  },

  createVendor: async (data: Omit<Vendor, 'id' | 'rating'>): Promise<Vendor> => {
    await delay(300);
    const list = mockDb.getVendors();
    const newVendor: Vendor = {
        ...data,
        id: Math.random().toString(36).substr(2, 9),
        rating: 0 // Initial rating
    };
    mockDb.saveVendors([newVendor, ...list]);
    return newVendor;
  },

  updateVendor: async (id: string, updates: Partial<Vendor>): Promise<void> => {
    await delay(300);
    const list = mockDb.getVendors();
    const index = list.findIndex(v => v.id === id);
    if(index !== -1) {
        list[index] = { ...list[index], ...updates };
        mockDb.saveVendors(list);
    }
  },

  deleteVendor: async (id: string): Promise<void> => {
    await delay(200);
    mockDb.saveVendors(mockDb.getVendors().filter(v => v.id !== id));
  },

  // --- Price List & Item Mapping ---
  getVendorItemMaps: async (): Promise<VendorItemMap[]> => {
    await delay(300);
    return mockDb.getVendorItemMaps();
  },

  saveVendorItemMap: async (data: Omit<VendorItemMap, 'id' | 'lastUpdated'>): Promise<VendorItemMap> => {
    await delay(300);
    const list = mockDb.getVendorItemMaps();
    // Check if mapping exists
    const existingIndex = list.findIndex(m => m.vendorId === data.vendorId && m.itemId === data.itemId);
    
    const record: VendorItemMap = {
        ...data,
        id: existingIndex !== -1 ? list[existingIndex].id : Math.random().toString(36).substr(2, 9),
        lastUpdated: new Date().toISOString().split('T')[0]
    };

    if(existingIndex !== -1) {
        list[existingIndex] = record;
    } else {
        list.push(record);
    }
    
    mockDb.saveVendorItemMaps(list);
    return record;
  },

  deleteVendorItemMap: async (id: string): Promise<void> => {
    await delay(200);
    mockDb.saveVendorItemMaps(mockDb.getVendorItemMaps().filter(m => m.id !== id));
  },

  // --- Performance Reviews ---
  getReviews: async (): Promise<VendorPerformanceReview[]> => {
    await delay(300);
    return mockDb.getVendorReviews().sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  addReview: async (data: Omit<VendorPerformanceReview, 'id' | 'date'>): Promise<VendorPerformanceReview> => {
    await delay(400);
    const list = mockDb.getVendorReviews();
    const newReview: VendorPerformanceReview = {
        ...data,
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString().split('T')[0]
    };
    mockDb.saveVendorReviews([newReview, ...list]);

    // Update Vendor Rating (Average of last 5 reviews)
    const vendorReviews = [newReview, ...list].filter(r => r.vendorId === data.vendorId).slice(0, 5);
    const avgScore = vendorReviews.reduce((sum, r) => sum + r.score, 0) / vendorReviews.length;
    const rating = Math.min(5, Math.max(0, (avgScore / 20))); // Scale 100 to 5

    const vendors = mockDb.getVendors();
    const vIndex = vendors.findIndex(v => v.id === data.vendorId);
    if(vIndex !== -1) {
        vendors[vIndex].rating = parseFloat(rating.toFixed(1));
        mockDb.saveVendors(vendors);
    }

    return newReview;
  }
};
