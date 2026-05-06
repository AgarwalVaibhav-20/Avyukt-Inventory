import api from './api';
import { authService } from './authService';
import { mockDb } from './mockDb';
import { InventoryItem, Category, Brand, UOM, HSN, Attribute } from '@/types';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
    const products = response.data.products || [];
    return products.map((item: any) => ({
      id: item._id,
      name: item.name,
      sku: item.sku,
      category: item.category || '',
      brand: item.brand || '',
      uom: item.unitOfMeasure || 'PCS',
      stock: (item.stocks || []).reduce((sum: number, stock: any) => sum + Number(stock.quantity || 0), 0),
      consignmentStock: 0,
      reorderLevel: Number(item.minStock || 0),
      unitPrice: Number(item.purchasePrice || 0),
      mrp: Number(item.mrp || item.salesPrice || 0),
      salePrice: Number(item.salesPrice || 0),
      hsnCode: item.hsnCode || '',
      barcode: item.barcode || '',
      status:
        item.status === 'out-of-stock'
          ? 'Out of Stock'
          : item.status === 'low-stock'
            ? 'Low Stock'
            : 'In Stock',
      lastUpdated: item.updatedAt
        ? new Date(item.updatedAt).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      attributes: item.attributes || {},
    }));
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
    const item = (await productService.getAllItems()).find((record) => record.id === id);
    if (!item) {
      throw new Error('Item not found');
    }

    await api.post('/api/stockcontrol/monitoring/config', {
      organisationId: getOrgId(),
      itemType: 'product',
      itemId: id,
      item: item.name,
      sku: item.sku,
      unit: item.uom || 'pcs',
      category: item.category,
      cost: Number(item.unitPrice || 0),
      stock: Number(item.stock || 0),
      reorder: Number(reorderLevel || 0),
      safety: Math.max(0, Math.floor(Number(reorderLevel || 0) / 2)),
      maxStock: Math.max(Number(item.stock || 0) * 2, Number(reorderLevel || 0) * 4, 1),
      leadDays: 7,
    });
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
    return (response.data.items || []).map((i: any) => ({ ...i, id: i._id }));
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
    return (response.data.items || []).map((i: any) => ({ ...i, id: i._id }));
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
    return (response.data.items || []).map((i: any) => ({ ...i, id: i._id }));
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
    return (response.data.items || []).map((i: any) => ({ ...i, id: i._id }));
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
