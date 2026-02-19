import { mockDb } from './mockDb';
import { InventoryItem, Category, Brand, UOM, HSN, Attribute } from '../types';

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const productService = {
  // --- Item Master Operations ---
  getAllItems: async (): Promise<InventoryItem[]> => {
    await delay(300);
    return mockDb.getItems();
  },

  createItem: async (item: Omit<InventoryItem, 'id'>): Promise<InventoryItem> => {
    await delay(300);
    const items = mockDb.getItems();
    const newItem = { ...item, id: Math.random().toString(36).substr(2, 9) };
    mockDb.saveItems([...items, newItem]);
    return newItem;
  },

  updateItem: async (id: string, updates: Partial<InventoryItem>): Promise<InventoryItem> => {
    await delay(200);
    const items = mockDb.getItems();
    const index = items.findIndex(i => i.id === id);
    if (index === -1) throw new Error("Item not found");
    
    const updatedItem = { ...items[index], ...updates };
    items[index] = updatedItem;
    mockDb.saveItems(items);
    return updatedItem;
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
    await delay(200);
    const items = mockDb.getItems().filter(i => i.id !== id);
    mockDb.saveItems(items);
  },

  // --- Category Operations ---
  getCategories: async () => { await delay(200); return mockDb.getCategories(); },
  addCategory: async (data: Omit<Category, 'id'>) => {
    await delay(200);
    const list = mockDb.getCategories();
    const newRec = { ...data, id: Math.random().toString(36).substr(2, 9) };
    mockDb.saveCategories([...list, newRec]);
    return newRec;
  },
  deleteCategory: async (id: string) => {
    await delay(200);
    mockDb.saveCategories(mockDb.getCategories().filter(i => i.id !== id));
  },

  // --- Brand Operations ---
  getBrands: async () => { await delay(200); return mockDb.getBrands(); },
  addBrand: async (data: Omit<Brand, 'id'>) => {
    await delay(200);
    const list = mockDb.getBrands();
    const newRec = { ...data, id: Math.random().toString(36).substr(2, 9) };
    mockDb.saveBrands([...list, newRec]);
    return newRec;
  },
  deleteBrand: async (id: string) => {
    await delay(200);
    mockDb.saveBrands(mockDb.getBrands().filter(i => i.id !== id));
  },

  // --- UOM Operations ---
  getUOMs: async () => { await delay(200); return mockDb.getUOMs(); },
  addUOM: async (data: Omit<UOM, 'id'>) => {
    await delay(200);
    const list = mockDb.getUOMs();
    const newRec = { ...data, id: Math.random().toString(36).substr(2, 9) };
    mockDb.saveUOMs([...list, newRec]);
    return newRec;
  },
  deleteUOM: async (id: string) => {
    await delay(200);
    mockDb.saveUOMs(mockDb.getUOMs().filter(i => i.id !== id));
  },

  // --- HSN Operations ---
  getHSN: async () => { await delay(200); return mockDb.getHSN(); },
  addHSN: async (data: Omit<HSN, 'id'>) => {
    await delay(200);
    const list = mockDb.getHSN();
    const newRec = { ...data, id: Math.random().toString(36).substr(2, 9) };
    mockDb.saveHSN([...list, newRec]);
    return newRec;
  },
  deleteHSN: async (id: string) => {
    await delay(200);
    mockDb.saveHSN(mockDb.getHSN().filter(i => i.id !== id));
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
