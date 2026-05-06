import api from './api';
import { authService } from './authService';
import { mockDb } from './mockDb';
import { ApprovalItem, MovementAnalysis, WarehouseStockReport, InOutSummary, InventoryItem } from '@/types';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getOrgId = () => {
  const user = authService.getCurrentUser();
  return user?.organisationId;
};

export const dashboardService = {
  
  // 1. Pending Approvals
  getPendingApprovals: async (): Promise<ApprovalItem[]> => {
    const orgId = getOrgId();
    if (!orgId) return [];
    const response = await api.get(`/inventory/dashboard/overview/${orgId}`);
    // Assuming the backend returns approvals in the format we expect or we map them here
    return response.data.approvals || [];
  },

  // 2. Expiry Alerts (Reusing logic slightly but formatting for dashboard)
  getExpiryAlerts: async () => {
      await delay(200);
      const batches = mockDb.getBatches();
      const today = new Date();
      
      // Filter for expired or expiring in 30 days
      return batches.filter(b => {
          if (b.status === 'Depleted') return false;
          const expDate = new Date(b.expiryDate);
          const diffDays = (expDate.getTime() - today.getTime()) / (1000 * 3600 * 24);
          return diffDays < 30; // Includes expired (negative days)
      }).sort((a,b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
  },

  // 3. Fast / Slow / Non-Moving Analysis
  getMovementAnalysis: async (): Promise<MovementAnalysis[]> => {
      await delay(500);
      const items = mockDb.getItems();
      const ledger = mockDb.getStockLedger();
      const today = new Date();
      const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));

      return items.map(item => {
          // Get outgoing transactions in last 30 days
          const recentOut = ledger.filter(e => 
              e.itemId === item.id && 
              e.quantityChange < 0 && 
              new Date(e.date) >= thirtyDaysAgo
          );
          
          const totalOutQty = recentOut.reduce((sum, e) => sum + Math.abs(e.quantityChange), 0);
          
          let classification: MovementAnalysis['classification'] = 'Non-Moving';
          if (totalOutQty > 50) classification = 'Fast Moving';
          else if (totalOutQty > 0) classification = 'Slow Moving';

          // Find last movement date
          const allItemMoves = ledger.filter(e => e.itemId === item.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          const lastMove = allItemMoves.length > 0 ? allItemMoves[0].date : 'N/A';

          return {
              itemId: item.id,
              itemName: item.name,
              sku: item.sku,
              category: item.category,
              turnoverRate: totalOutQty, // Simplified metric
              classification,
              lastMovementDate: lastMove
          };
      });
  },

  // 4. Warehouse-wise Stock
  getWarehouseStockReport: async (): Promise<WarehouseStockReport[]> => {
      await delay(400);
      const warehouses = mockDb.getWarehouses();
      const items = mockDb.getItems();
      const totalGlobalValue = items.reduce((sum, i) => sum + (i.stock * i.unitPrice), 0);

      // Simulate distribution since we don't have granular warehouse-item mapping table in this mock
      // In a real app, we would query the ItemWarehouse table
      return warehouses.map((w, idx) => {
          // distribute pseudo-randomly for demo visualization
          const share = (idx + 1) / (warehouses.length * (warehouses.length + 1) / 2); // weighted share
          const estimatedValue = totalGlobalValue * (0.2 + (Math.random() * 0.3)); // Random chunk
          
          return {
              warehouseId: w.id,
              warehouseName: w.name,
              totalItems: Math.floor(items.length * 0.8), // Assuming most items exist in most warehouses
              totalValue: estimatedValue,
              utilization: Math.floor(40 + Math.random() * 50) // 40-90% utilization
          };
      });
  },

  // 5. Inward vs Outward Summary
  getInOutSummary: async (): Promise<InOutSummary[]> => {
      await delay(400);
      const ledger = mockDb.getStockLedger();
      const items = mockDb.getItems();
      
      // Group by Month (last 6 months)
      const months = [];
      for(let i=5; i>=0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          months.push(d.toLocaleString('default', { month: 'short', year: 'numeric' })); // e.g. "Oct 2023"
      }

      // Initialize map
      const summaryMap: Record<string, InOutSummary> = {};
      months.forEach(m => {
          summaryMap[m] = { period: m, inwardQty: 0, outwardQty: 0, inwardValue: 0, outwardValue: 0 };
      });

      ledger.forEach(entry => {
          const date = new Date(entry.date);
          const key = date.toLocaleString('default', { month: 'short', year: 'numeric' });
          
          if(summaryMap[key]) {
              const item = items.find(i => i.id === entry.itemId);
              const cost = item?.unitPrice || 0;
              const sale = item?.salePrice || 0;

              if(entry.quantityChange > 0) {
                  summaryMap[key].inwardQty += entry.quantityChange;
                  summaryMap[key].inwardValue += entry.quantityChange * cost;
              } else {
                  const qty = Math.abs(entry.quantityChange);
                  summaryMap[key].outwardQty += qty;
                  summaryMap[key].outwardValue += qty * sale;
              }
          }
      });

      return Object.values(summaryMap);
  }
};
