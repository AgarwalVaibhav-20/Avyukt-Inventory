import { mockDb } from './mockDb';
import { InventoryItem, ScanLog, LabelTemplate } from '../types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const automationService = {
  
  // 1. Generate URLs for visualization
  getBarcodeImageUrl: (text: string, type: 'code128' | 'ean13' = 'code128') => {
      // Using bwip-js API for free barcode generation
      return `https://bwipjs-api.metafloor.com/?bcid=${type}&text=${text}&scale=2&includetext`;
  },

  getQrCodeImageUrl: (text: string) => {
      // Using QR Server API
      return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(text)}`;
  },

  // 2. Scan Logic
  scanItem: async (code: string): Promise<InventoryItem | null> => {
      await delay(300); // Simulate processing time
      const items = mockDb.getItems();
      // Try finding by exact barcode match first
      let item = items.find(i => i.barcode === code);
      // If not, try SKU
      if (!item) {
          item = items.find(i => i.sku.toLowerCase() === code.toLowerCase());
      }
      return item || null;
  },

  // 3. Logging
  logScan: async (log: Omit<ScanLog, 'id' | 'date' | 'timestamp'>) => {
      // Do not delay logging for snappy UI feel in scanner
      const list = mockDb.getScanLogs();
      const now = new Date();
      const newLog: ScanLog = {
          ...log,
          id: Math.random().toString(36).substr(2, 9),
          date: now.toISOString().split('T')[0],
          timestamp: now.toLocaleTimeString(),
      };
      mockDb.saveScanLogs([newLog, ...list]);
      return newLog;
  },

  getScanHistory: async (): Promise<ScanLog[]> => {
      await delay(200);
      return mockDb.getScanLogs();
  },

  // 4. Label Templates
  getLabelTemplates: async (): Promise<LabelTemplate[]> => {
      await delay(100);
      return [
          { id: 't1', name: 'Standard Product (2x1)', width: '2in', height: '1in', type: 'Product' },
          { id: 't2', name: 'Shipping Label (4x6)', width: '4in', height: '6in', type: 'Shipping' },
          { id: 't3', name: 'Bin/Rack Label (4x2)', width: '4in', height: '2in', type: 'Rack' },
          { id: 't4', name: 'Small QR (1x1)', width: '1in', height: '1in', type: 'Product' }
      ];
  }
};
