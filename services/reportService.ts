import { mockDb } from './mockDb';
import { InventoryItem, WarehouseStockReport, AgingAnalysisItem, GstReportItem, AuditLog, MovementAnalysis } from '../types';
import { dashboardService } from './dashboardService';
import { stockControlService } from './stockControlService';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const reportService = {
  
  // 1. Stock Summary (Simplified stats)
  getStockSummary: async () => {
    await delay(300);
    const items = mockDb.getItems();
    const totalItems = items.length;
    const totalStock = items.reduce((sum, i) => sum + i.stock, 0);
    const totalValue = items.reduce((sum, i) => sum + (i.stock * i.unitPrice), 0);
    const lowStock = items.filter(i => i.stock <= i.reorderLevel).length;
    
    return {
        totalItems,
        totalStock,
        totalValue,
        lowStock
    };
  },

  // 2. Item-wise Stock
  getItemStockReport: async (): Promise<InventoryItem[]> => {
    await delay(300);
    return mockDb.getItems();
  },

  // 3. Warehouse-wise (Reuse dashboard logic but can extend)
  getWarehouseReport: async (): Promise<WarehouseStockReport[]> => {
    return dashboardService.getWarehouseStockReport();
  },

  // 4. Aging Analysis
  getAgingReport: async (): Promise<AgingAnalysisItem[]> => {
    await delay(500);
    const items = mockDb.getItems();
    const batches = mockDb.getBatches();
    
    // In a real scenario, this uses FIFO logic against GRN dates.
    // Here we simulate using Batches + Random distribution for non-batched items.
    
    return items.map(item => {
        const itemBatches = batches.filter(b => b.itemId === item.id);
        const buckets = {
            "0-30 Days": 0,
            "31-60 Days": 0,
            "61-90 Days": 0,
            ">90 Days": 0
        };

        if (itemBatches.length > 0) {
            const today = new Date();
            itemBatches.forEach(b => {
                const mfg = new Date(b.mfgDate);
                const diffDays = Math.floor((today.getTime() - mfg.getTime()) / (1000 * 3600 * 24));
                
                if (diffDays <= 30) buckets["0-30 Days"] += b.quantity;
                else if (diffDays <= 60) buckets["31-60 Days"] += b.quantity;
                else if (diffDays <= 90) buckets["61-90 Days"] += b.quantity;
                else buckets[">90 Days"] += b.quantity;
            });
        } else {
            // Simulate for non-batched items based on lastUpdated
            const updated = new Date(item.lastUpdated);
            const today = new Date();
            const diffDays = Math.floor((today.getTime() - updated.getTime()) / (1000 * 3600 * 24));
            
            // Assume most stock is fresh if updated recently, otherwise spread it
            if (diffDays <= 30) buckets["0-30 Days"] = item.stock;
            else buckets[">90 Days"] = item.stock; 
        }

        const bucketArray = Object.keys(buckets).map(key => ({
            range: key,
            quantity: buckets[key as keyof typeof buckets],
            value: buckets[key as keyof typeof buckets] * item.unitPrice
        }));

        return {
            itemId: item.id,
            itemName: item.name,
            totalStock: item.stock,
            buckets: bucketArray
        };
    });
  },

  // 5. Expiry Analysis (Reuse dashboard logic, returns batches)
  getExpiryReport: async () => {
      // Reusing dashboard logic but returning all active batches sorted by expiry
      await delay(300);
      return mockDb.getBatches()
        .filter(b => b.status === 'Active')
        .sort((a,b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
  },

  // 6. Movement Analysis
  getMovementReport: async (): Promise<MovementAnalysis[]> => {
      return dashboardService.getMovementAnalysis();
  },

  // 7. Valuation Report
  getValuationReport: async () => {
      return stockControlService.getValuationReport();
  },

  // 8. GST/Tax Reports
  getGstReport: async (): Promise<GstReportItem[]> => {
      await delay(400);
      const invoices = mockDb.getInvoices();
      // Assume 18% GST split into SGST/CGST or IGST based on logic (simplified here)
      return invoices.map(inv => {
          const taxable = inv.totalAmount - inv.taxAmount;
          const tax = inv.taxAmount;
          return {
              invoiceNo: inv.invoiceNumber,
              date: inv.date,
              customerName: inv.customerName,
              taxableAmount: taxable,
              sgst: tax / 2,
              cgst: tax / 2,
              igst: 0, // Simplified: Assume intra-state
              totalAmount: inv.totalAmount
          };
      });
  },

  // 9. Audit Reports
  getAuditLogs: async (): Promise<AuditLog[]> => {
      await delay(300);
      return mockDb.getAuditLogs().sort((a,b) => new Date(b.date + 'T' + b.timestamp).getTime() - new Date(a.date + 'T' + a.timestamp).getTime());
  }
};
