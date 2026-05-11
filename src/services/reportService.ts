import { mockDb } from './mockDb';
import { InventoryItem, WarehouseStockReport, AgingAnalysisItem, GstReportItem, AuditLog, MovementAnalysis } from '@/types';
import { dashboardService } from './dashboardService';
import { stockControlService } from './stockControlService';
import axios from 'axios';
import api from './api';

const API_BASE_URL = (import.meta.env.VITE_API_URL || "https://inventory-backend-alpha-eight.vercel.app") + "/api";
const REPORTS_API = `${API_BASE_URL}/reports`;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to call backend API with fallback to mock data
const callReportAPI = async (endpoint: string, fallbackFn: () => any) => {
  try {
    const response = await axios.get(`${REPORTS_API}${endpoint}`);
    return response.data;
  } catch (error) {
    console.warn(`API call failed for ${endpoint}, using mock data:`, error);
    // Fallback to mock data
    return fallbackFn();
  }
};

export const reportService = {
  
  // 1. Stock Summary (Simplified stats)
  getStockSummary: async () => {
    return callReportAPI('/stock-summary', () => {
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
    });
  },

  // 2. Item-wise Stock
  getItemStockReport: async (): Promise<InventoryItem[]> => {
    return callReportAPI('/item-stock', async () => {
      await delay(300);
      return mockDb.getItems();
    });
  },

  // 3. Warehouse-wise (Reuse dashboard logic but can extend)
  getWarehouseReport: async (): Promise<WarehouseStockReport[]> => {
    return callReportAPI('/warehouse', () => {
      return dashboardService.getWarehouseStockReport();
    });
  },

  // 4. Aging Analysis
  getAgingReport: async (): Promise<AgingAnalysisItem[]> => {
    return callReportAPI('/aging-analysis', () => {
      const items = mockDb.getItems();
      const batches = mockDb.getBatches();
      
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
              const updated = new Date(item.lastUpdated);
              const today = new Date();
              const diffDays = Math.floor((today.getTime() - updated.getTime()) / (1000 * 3600 * 24));
              
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
    });
  },

  // 5. Expiry Analysis (Reuse dashboard logic, returns batches)
  getExpiryReport: async () => {
    return callReportAPI('/expiry-analysis', () => {
      return mockDb.getBatches()
        .filter(b => b.status === 'Active')
        .sort((a,b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
    });
  },

  // 6. Movement Analysis
  getMovementReport: async (): Promise<MovementAnalysis[]> => {
    return callReportAPI('/movement-analysis', () => {
      return dashboardService.getMovementAnalysis();
    });
  },

  // 7. Valuation Report
  getValuationReport: async () => {
    return callReportAPI('/valuation', () => {
      return stockControlService.getValuationReport();
    });
  },

  // 8. GST/Tax Reports
  getGstReport: async (): Promise<GstReportItem[]> => {
    return callReportAPI('/gst-tax', () => {
      const invoices = mockDb.getInvoices();
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
              igst: 0,
              totalAmount: inv.totalAmount
          };
      });
    });
  },

  // 9. Audit Reports
  getAuditLogs: async (): Promise<AuditLog[]> => {
    const response = await api.get('/api/reports/audit-logs', {
      params: { limit: 500 },
    });
    return response.data || [];
  },

  // 10. Low Stock Report
  getLowStockReport: async () => {
    return callReportAPI('/low-stock', () => {
      const items = mockDb.getItems();
      return items.filter(i => i.stock <= i.reorderLevel)
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 50);
    });
  },

  // 11. Dashboard Report (combined metrics)
  getDashboardReport: async () => {
    return callReportAPI('/dashboard', () => {
      // Fallback to mock data
      return Promise.all([
        reportService.getStockSummary(),
        reportService.getLowStockReport(),
        reportService.getWarehouseReport(),
        reportService.getAgingReport()
      ]).then(([summary, lowStock, warehouses, aging]) => ({
        summary,
        lowStock: lowStock.slice(0, 5),
        warehouses,
        aging,
        timestamp: new Date()
      }));
    });
  }
};

