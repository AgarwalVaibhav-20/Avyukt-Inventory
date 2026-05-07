import { mockDb } from './mockDb';
import api from './api';
import { PurchaseOrder, GRN, StockAdjustment, StockTransfer, PurchaseReturn, SalesReturn, PutAwayTask, PurchaseRequisition } from '@/types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const toFrontendGRN = (grn: any): GRN => ({
  id: String(grn._id || grn.id || ''),
  grnNumber: grn.grnNumber || '',
  poId: String(grn.purchaseOrderId?._id || grn.purchaseOrderId || ''),
  poNumber: grn.purchaseOrderId?.poNo || grn.poNumber || '',
  vendorId: String(grn.supplierId?._id || grn.supplierId || ''),
  vendorName: grn.supplierId?.vendorName || grn.vendorName || grn.purchaseOrderId?.vendor || '',
  date: (grn.date || grn.createdAt || new Date().toISOString()).toString().slice(0, 10),
  challanNumber: grn.challanNumber || grn.transportInfo?.challanNumber || '',
  status: grn.status || 'Pending QC',
  items: (grn.items || []).map((item: any) => ({
    grnItemId: String(item._id || item.grnItemId || ''),
    itemId: String(item.materialId || item.productId || item._id || ''),
    itemName: item.itemName || '',
    poQty: Number(item.poQty ?? item.orderedQty ?? item.quantity ?? 0),
    receivedQty: Number(item.receivedQty ?? item.qty ?? item.acceptedQty ?? 0),
    acceptedQty: Number(item.acceptedQty ?? 0),
    rejectedQty: Number(item.rejectedQty ?? 0),
    qcRemarks: item.qcRemarks || item.remarks || '',
  })),
});

export const approvalService = {
  // --- Purchase Requisitions (PR) ---
  getPendingPRs: async (): Promise<PurchaseRequisition[]> => {
    // Attempt real API if available, fallback to mock logic for PRs
    try {
      console.log("🌐 Fetching pending PRs from API...");
      const response = await api.get('/purchase/requisitions/pending');
      const data = response.data.data ?? [];
      console.log(`✅ API Success: Found ${data.length} pending PRs`);
      return data.map((pr: any) => ({
        ...pr,
        id: String(pr._id || pr.id || ''),
        items: (pr.items || []).map((item: any) => ({
            ...item,
            itemName: item.name || item.itemName || "Unknown Item",
            quantity: Number(item.qty || item.quantity || 0),
            estimatedPrice: Number(item.unitPrice || item.estimatedPrice || 0)
        }))
      }));
    } catch (e: any) {
      console.error("❌ API Error fetching pending PRs:", e.response?.data || e.message);
      await delay(200);
      const mockData = mockDb.getPRs().filter(p => p.status === 'Pending Approval');
      console.log(`⚠️ Falling back to mock data: ${mockData.length} items`);
      return mockData;
    }
  },

  approvePR: async (id: string): Promise<void> => {
    try {
      await api.patch(`/purchase/requisitions/${id}/approve`);
    } catch (e) {
      await delay(300);
      const prs = mockDb.getPRs();
      const idx = prs.findIndex(p => p.id === id);
      if(idx !== -1) {
          prs[idx].status = 'Approved';
          mockDb.savePRs(prs);
      }
    }
  },

  rejectPR: async (id: string): Promise<void> => {
    try {
      await api.patch(`/purchase/requisitions/${id}/reject`);
    } catch (e) {
      await delay(300);
      const prs = mockDb.getPRs();
      const idx = prs.findIndex(p => p.id === id);
      if(idx !== -1) {
          prs[idx].status = 'Rejected';
          mockDb.savePRs(prs);
      }
    }
  },

  // --- Purchase Orders ---
  getPendingPOs: async (): Promise<PurchaseOrder[]> => {
    try {
      const response = await api.get('/purchase/orders', {
        params: { status: 'Pending', limit: 1000 }
      });
      const data = response.data.purchaseOrders ?? response.data.data ?? [];
      return data.map((po: any) => ({
        ...po,
        id: String(po._id || po.id || ''),
        items: (po.productLines || []).map((line: any) => ({
          itemId: String(line.materialId || line.productId || line._id || ''),
          itemName: line.product || '',
          quantity: Number(line.quantity || 0),
          unitPrice: Number(line.unitPrice || 0),
          receivedQty: Number(line.receivedQuantity || 0),
        })),
      }));
    } catch (e) {
      await delay(200);
      return mockDb.getPOs().filter(
        p => p.status === 'Draft' || p.status === 'Pending Approval' || p.status === 'Pending'
      );
    }
  },

  approvePO: async (id: string): Promise<void> => {
    try {
      await api.put(`/purchase/orders/${id}`, { status: 'Sent' });
    } catch (e) {
      await delay(300);
      const pos = mockDb.getPOs();
      const idx = pos.findIndex(p => p.id === id);
      if(idx !== -1) {
          pos[idx].status = 'Sent';
          mockDb.savePOs(pos);
      }
    }
  },

  rejectPO: async (id: string): Promise<void> => {
    try {
      await api.put(`/purchase/orders/${id}`, { status: 'Rejected' });
    } catch (e) {
      await delay(300);
      const pos = mockDb.getPOs();
      const idx = pos.findIndex(p => p.id === id);
      if(idx !== -1) {
          pos[idx].status = 'Rejected';
          mockDb.savePOs(pos);
      }
    }
  },

  // --- GRN (Goods Receipt Note) ---
  getPendingGRNs: async (): Promise<GRN[]> => {
    try {
      const response = await api.get('/api/inward/grns/for-approval', {
        params: { limit: 1000 }
      });
      return (response.data.data ?? []).map(toFrontendGRN);
    } catch (e) {
      await delay(200);
      return mockDb.getGRNs().filter(g => g.status === 'QC Completed');
    }
  },

  approveGRN: async (id: string): Promise<void> => {
    try {
      await api.post('/api/inward/grn/approve', { grnId: id, status: 'Approved' });
    } catch (e) {
      await delay(300);
      const grns = mockDb.getGRNs();
      const idx = grns.findIndex(g => g.id === id);
      if(idx !== -1) {
          grns[idx].status = 'Approved';
          mockDb.saveGRNs(grns);
      }
    }
  },

  rejectGRN: async (id: string): Promise<void> => {
    try {
      await api.post('/api/inward/grn/approve', { grnId: id, status: 'Rejected' });
    } catch (e) {
      await delay(300);
      const grns = mockDb.getGRNs();
      const idx = grns.findIndex(g => g.id === id);
      if(idx !== -1) {
          grns[idx].status = 'Rejected';
          mockDb.saveGRNs(grns);
      }
    }
  },

  // --- Stock Adjustments ---
  getPendingAdjustments: async (): Promise<StockAdjustment[]> => {
    await delay(200);
    return mockDb.getAdjustments().filter(a => a.status === 'Pending');
  },

  approveAdjustment: async (id: string): Promise<void> => {
    await delay(300);
    const adjustments = mockDb.getAdjustments();
    const idx = adjustments.findIndex(a => a.id === id);
    if(idx !== -1) {
        adjustments[idx].status = 'Approved';
        mockDb.saveAdjustments(adjustments);

        // Update Actual Stock Here (Moved logic from creation to approval for 'Pending' items)
        const adj = adjustments[idx];
        const items = mockDb.getItems();
        const itemIdx = items.findIndex(i => i.id === adj.itemId);
        if(itemIdx !== -1) {
            if(adj.impact === 'Deduct') {
                items[itemIdx].stock -= adj.quantity;
                if(items[itemIdx].stock < 0) items[itemIdx].stock = 0;
            } else {
                items[itemIdx].stock += adj.quantity;
            }
            mockDb.saveItems(items);
        }
    }
  },

  rejectAdjustment: async (id: string): Promise<void> => {
    await delay(300);
    const adjustments = mockDb.getAdjustments();
    const idx = adjustments.findIndex(a => a.id === id);
    if(idx !== -1) {
        adjustments[idx].status = 'Rejected';
        mockDb.saveAdjustments(adjustments);
    }
  },

  // --- Stock Transfers ---
  getPendingTransfers: async (): Promise<StockTransfer[]> => {
    await delay(200);
    return mockDb.getTransfers().filter(t => t.status === 'Pending');
  },

  approveTransfer: async (id: string): Promise<void> => {
    await delay(300);
    const transfers = mockDb.getTransfers();
    const idx = transfers.findIndex(t => t.id === id);
    if(idx !== -1) {
        transfers[idx].status = 'In Transit';
        mockDb.saveTransfers(transfers);
        
        // Deduct from Source Warehouse (Simulated globally in item stock usually, 
        // but here we just change status. Real app would move stock to 'In Transit' location)
    }
  },

  rejectTransfer: async (id: string): Promise<void> => {
    await delay(300);
    const transfers = mockDb.getTransfers();
    const idx = transfers.findIndex(t => t.id === id);
    if(idx !== -1) {
        transfers[idx].status = 'Rejected';
        mockDb.saveTransfers(transfers);
    }
  },

  // --- Returns (Purchase & Sales) ---
  getPendingPurchaseReturns: async (): Promise<PurchaseReturn[]> => {
    await delay(200);
    return mockDb.getPurchaseReturns().filter(r => r.status === 'Draft' || r.status === 'Pending Approval');
  },

  approvePurchaseReturn: async (id: string): Promise<void> => {
    await delay(300);
    const returns = mockDb.getPurchaseReturns();
    const idx = returns.findIndex(r => r.id === id);
    if(idx !== -1) {
        returns[idx].status = 'Sent';
        mockDb.savePurchaseReturns(returns);
        
        // Stock Deduction logic for Purchase Return
        const ret = returns[idx];
        const items = mockDb.getItems();
        ret.items.forEach(rItem => {
            const iIdx = items.findIndex(i => i.id === rItem.itemId);
            if(iIdx !== -1) {
                items[iIdx].stock -= rItem.quantity;
                if(items[iIdx].stock < 0) items[iIdx].stock = 0;
            }
        });
        mockDb.saveItems(items);
    }
  },

  rejectPurchaseReturn: async (id: string): Promise<void> => {
    await delay(300);
    const returns = mockDb.getPurchaseReturns();
    const idx = returns.findIndex(r => r.id === id);
    if(idx !== -1) {
        returns[idx].status = 'Rejected';
        mockDb.savePurchaseReturns(returns);
    }
  },

  getPendingSalesReturns: async (): Promise<SalesReturn[]> => {
    await delay(200);
    return mockDb.getSalesReturns().filter(r => r.status === 'Received' || r.status === 'Pending Approval');
  },

  approveSalesReturn: async (id: string): Promise<void> => {
    await delay(300);
    const returns = mockDb.getSalesReturns();
    const idx = returns.findIndex(r => r.id === id);
    if(idx !== -1) {
        returns[idx].status = 'Processed';
        mockDb.saveSalesReturns(returns);

        // Stock Addition logic for Sales Return (Restock)
        const ret = returns[idx];
        const items = mockDb.getItems();
        ret.items.forEach(rItem => {
            const iIdx = items.findIndex(i => i.id === rItem.itemId);
            if(iIdx !== -1) {
                items[iIdx].stock += rItem.quantity;
            }
        });
        mockDb.saveItems(items);
    }
  },

  rejectSalesReturn: async (id: string): Promise<void> => {
    await delay(300);
    const returns = mockDb.getSalesReturns();
    const idx = returns.findIndex(r => r.id === id);
    if(idx !== -1) {
        returns[idx].status = 'Rejected';
        mockDb.saveSalesReturns(returns);
    }
  }
};
