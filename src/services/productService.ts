import api from './api';
import { authService } from './authService';
import { InventoryItem, Category, Brand, UOM, HSN, Attribute } from '@/types';

const getOrgId = () => {
  const user = authService.getCurrentUser();
  return user?.organisationId;
};

export const productService = {
  // --- Item Master Operations ---
  getAllItems: async (): Promise<InventoryItem[]> => {
    const orgId = getOrgId();
    if (!orgId) return [];
    const response = await api.get(`/inventory/product/all/${orgId}`);
    return response.data;
  },

  createItem: async (item: Omit<InventoryItem, 'id'>): Promise<InventoryItem> => {
    const response = await api.post('/inventory/product/create', item);
    return response.data;
  },

  updateItem: async (id: string, updates: Partial<InventoryItem>): Promise<InventoryItem> => {
    const response = await api.put(`/product/update/${id}`, updates);
    return response.data;
  },

  // Specific Updates for Sub-modules
  updateItemPricing: async (id: string, pricing: { unitPrice: number; mrp: number; salePrice: number }): Promise<void> => {
    await delay(200);
    const items = mockDb.getItems();
    const index = items.findIndex(i => i.id === id);
    if (index !== -1) {
      items[index] = { ...items[index], ...pricing };
      mockDb.saveItems(items);
    }
  },

  updateReorderLevel: async (id: string, reorderLevel: number): Promise<void> => {
    await delay(200);
    const items = mockDb.getItems();
    const index = items.findIndex(i => i.id === id);
    if (index !== -1) {
      items[index].reorderLevel = reorderLevel;
      // Auto update status based on new level
      if (items[index].stock <= reorderLevel) {
          items[index].status = items[index].stock === 0 ? 'Out of Stock' : 'Low Stock';
      } else {
          items[index].status = 'In Stock';
      }
      mockDb.saveItems(items);
    }
  },

  updateBarcode: async (id: string, barcode: string): Promise<void> => {
    await delay(200);
    const items = mockDb.getItems();
    const index = items.findIndex(i => i.id === id);
    if (index !== -1) {
      items[index].barcode = barcode;
      mockDb.saveItems(items);
    }
  },

  deleteItem: async (id: string): Promise<void> => {
    await api.delete(`/product/delete/${id}`);
  },

  // --- Category Operations ---
  getCategories: async () => { 
    const response = await api.get('/inventory/category');
    return response.data;
  },
  addCategory: async (data: Omit<Category, 'id'>) => {
    const response = await api.post('/inventory', { ...data, type: 'category' });
    return response.data;
  },
  deleteCategory: async (id: string) => {
    await api.delete(`/inventory/${id}`);
  },

  // --- Brand Operations ---
  getBrands: async () => {
    const response = await api.get('/inventory/brand');
    return response.data;
  },
  addBrand: async (data: Omit<Brand, 'id'>) => {
    const response = await api.post('/inventory', { ...data, type: 'brand' });
    return response.data;
  },
  deleteBrand: async (id: string) => {
    await api.delete(`/inventory/${id}`);
  },

  // --- UOM Operations ---
  getUOMs: async () => {
    const response = await api.get('/inventory/uom');
    return response.data;
  },
  addUOM: async (data: Omit<UOM, 'id'>) => {
    const response = await api.post('/inventory', { ...data, type: 'uom' });
    return response.data;
  },
  deleteUOM: async (id: string) => {
    await api.delete(`/inventory/${id}`);
  },

  // --- HSN Operations ---
  getHSN: async () => {
    const response = await api.get('/inventory/hsn');
    return response.data;
  },
  addHSN: async (data: Omit<HSN, 'id'>) => {
    const response = await api.post('/inventory', { ...data, type: 'hsn' });
    return response.data;
  },
  deleteHSN: async (id: string) => {
    await api.delete(`/inventory/${id}`);
  },

  // --- Attributes Operations ---
  getAttributes: async () => { await delay(200); return mockDb.getAttributes(); },
  addAttribute: async (data: Omit<Attribute, 'id'>) => {
    await delay(200);
    const list = mockDb.getAttributes();
    const newRec = { ...data, id: Math.random().toString(36).substr(2, 9) };
    mockDb.saveAttributes([...list, newRec]);
    return newRec;
  },
  deleteAttribute: async (id: string) => {
    await delay(200);
    mockDb.saveAttributes(mockDb.getAttributes().filter(i => i.id !== id));
  }
};
