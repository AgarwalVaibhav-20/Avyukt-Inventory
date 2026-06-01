import api from './api';
import { authService } from './authService';
import { InventoryItem, ScanLog, LabelTemplate } from '@/types';

const getOrgId = () => {
    const user = authService.getCurrentUser();
    return user?.organisationId;
};

export const automationService = {
  
  // 1. Generate URLs for visualization
  getBarcodeImageUrl: (text: string, type: 'code128' | 'ean13' | 'qr' = 'code128') => {
      // Point to backend generator
      const API_URL = api.defaults.baseURL || "http://localhost:4001";
      return `${API_URL}/utils/bc-gen?text=${encodeURIComponent(text)}&type=${type}`;
  },

  getQrCodeImageUrl: (text: string) => {
      const API_URL = api.defaults.baseURL || "http://localhost:4001";
      return `${API_URL}/utils/bc-gen?text=${encodeURIComponent(text)}&type=qr`;
  },

  // 2. Scan Logic
  scanItem: async (code: string, action: string = 'Check'): Promise<InventoryItem | null> => {
      const orgId = getOrgId();
      if (!orgId) return null;

      try {
          // First, find the item by barcode/sku
          const response = await api.get(`/inventory/product/all/${orgId}`);
          const products = response.data.products || [];
          const item = products.find((p: any) => 
            p.barcode === code || 
            (p.barcodes && p.barcodes.includes(code)) || 
            p.sku === code ||
            p.itemCode === code
          );

          if (item) {
              // Log the successful scan in backend
              await api.post('/barcode-scans/create', {
                  organisationId: orgId,
                  location: item.warehouseId || item.stocks?.[0]?.warehouseId,
                  code: code,
                  item: item.name,
                  action: action,
                  status: 'success'
              });
              
              // Map to frontend type
              return {
                  ...item,
                  id: item._id,
                  stock: (item.stocks || []).reduce((acc: number, s: any) => acc + (s.quantity || 0), 0)
              } as InventoryItem;
          } else {
              // Log failed scan
              await api.post('/barcode-scans/create', {
                organisationId: orgId,
                location: '000000000000000000000000', // Dummy or generic location
                code: code,
                item: 'Unknown',
                action: action,
                status: 'error'
            });
            return null;
          }
      } catch (error) {
          console.error("Scan error:", error);
          return null;
      }
  },

  // 3. Logging & History
  logScan: async (log: Omit<ScanLog, 'id' | 'date' | 'timestamp'>) => {
      const orgId = getOrgId();
      if (!orgId) return null;

      const response = await api.post('/barcode-scans/create', {
          organisationId: orgId,
          location: '000000000000000000000000',
          code: log.scannedCode,
          item: log.itemName || 'Manual Entry',
          action: log.actionType,
          status: log.status === 'Success' ? 'success' : 'error'
      });
      return response.data.data;
  },

  getScanHistory: async (): Promise<ScanLog[]> => {
      const orgId = getOrgId();
      if (!orgId) return [];

      const response = await api.get('/barcode-scans/fetch', {
          params: { organisationId: orgId }
      });
      
      const items = response.data.data || [];
      return items.map((i: any) => ({
          id: i._id,
          scannedCode: i.code,
          itemId: i.item, // Backend uses item name/string
          itemName: i.item,
          actionType: i.action,
          status: i.status === 'success' ? 'Success' : 'error',
          timestamp: new Date(i.createdAt).toLocaleTimeString(),
          date: new Date(i.createdAt).toISOString().split('T')[0]
      }));
  },

  // 4. Label Templates
  getLabelTemplates: async (): Promise<LabelTemplate[]> => {
      // These could be fetched from backend if we had a dedicated endpoint, 
      // but for now keeping them as standard defaults
      return [
          { id: 't1', name: 'Standard Product (2x1)', width: '2in', height: '1in', type: 'Product' },
          { id: 't2', name: 'Shipping Label (4x6)', width: '4in', height: '6in', type: 'Shipping' },
          { id: 't3', name: 'Bin/Rack Label (4x2)', width: '4in', height: '2in', type: 'Rack' },
          { id: 't4', name: 'Small QR (1x1)', width: '1in', height: '1in', type: 'Product' }
      ];
  }
};
