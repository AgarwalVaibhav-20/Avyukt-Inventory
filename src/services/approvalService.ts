import { mockDb } from './mockDb';
import api from './api';
import { PurchaseOrder, GRN, StockAdjustment, StockTransfer, PurchaseReturn, SalesReturn, PutAwayTask, PurchaseRequisition } from '@/types';
import { shouldAutoApprove, fireNotifications } from './workflowEngine';

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

const toFrontendPurchaseReturn = (item: any): PurchaseReturn => ({
  id: String(item._id || item.id || ''),
  returnNumber: item.returnNo || item.returnNumber || '',
  grnId: String(item.grnId || ''),
  vendorId: String(item.vendorId || ''),
  vendorName: item.vendor || item.vendorName || '',
  date: (item.date || item.createdAt || new Date().toISOString()).toString().slice(0, 10),
  items: (item.items || []).map((line: any) => ({
    itemId: String(line.productId || line.itemId || ''),
    itemName: line.name || line.itemName || '',
    quantity: Number(line.qty || line.quantity || 0),
    reason: line.reason || '',
  })),
  status: item.status || 'Draft',
});

const toFrontendSalesReturn = (item: any): SalesReturn => ({
  id: String(item._id || item.id || ''),
  returnNumber: item.returnNo || item.returnNumber || '',
  soId: String(item.salesOrderId || item.soId || ''),
  soNumber: item.soRef || item.soNumber || '',
  customerName: item.customerName || '',
  date: (item.returnDate || item.date || item.createdAt || new Date().toISOString()).toString().slice(0, 10),
  items: (item.items || []).map((line: any) => ({
    itemId: String(line.productId || line.itemId || ''),
    itemName: line.description || line.itemName || '',
    quantity: Number(line.returnQty || line.quantity || line.qty || 0),
    reason: line.reason || '',
  })),
  status: item.status || 'Pending',
});

type ApprovalKind =
  | 'Purchase Requisition'
  | 'Purchase Order'
  | 'GRN'
  | 'Stock Adjustment'
  | 'Stock Transfer'
  | 'Purchase Return'
  | 'Sales Return';

async function filterAutoApproved<T extends Record<string, unknown>>(
  items: T[],
  kind: ApprovalKind,
  approveFn: (id: string) => Promise<void>,
): Promise<T[]> {
  const remaining: T[] = [];
  for (const item of items) {
    if (await shouldAutoApprove(item, kind)) {
      try {
        await approveFn(item.id as string);
        console.log(`⚡ Auto-approved ${kind} #${item.id}`);
      } catch (e) {
        console.warn(`⚠️ Auto-approve failed for ${kind} #${item.id}`, e);
        remaining.push(item);
      }
    } else {
      remaining.push(item);
    }
  }
  return remaining;
}

export const approvalService = {
  // --- Purchase Requisitions (PR) ---
  getPendingPRs: async (): Promise<PurchaseRequisition[]> => {
    try {
      console.log("🌐 Fetching pending PRs from API...");
      const response = await api.get('/purchase/requisitions/pending');
      const data = response.data.data ?? [];
      console.log(`API Success: Found ${data.length} pending PRs`);
      let items = data.map((pr: any) => ({
        ...pr,
        id: String(pr._id || pr.id || ''),
        items: (pr.items || []).map((item: any) => ({
            ...item,
            itemName: item.name || item.itemName || "Unknown Item",
            quantity: Number(item.qty || item.quantity || 0),
            estimatedPrice: Number(item.unitPrice || item.estimatedPrice || 0)
        }))
      }));
      items = await filterAutoApproved(items, 'Purchase Requisition', (id) => approvalService.approvePR(id));
      return items;
    } catch (e: any) {
      console.error("❌ API Error fetching pending PRs:", e.response?.data || e.message);
      await delay(200);
      let mockData = mockDb.getPRs().filter(p => p.status === 'Pending Approval');
      console.log(`⚠️ Falling back to mock data: ${mockData.length} items`);
      mockData = await filterAutoApproved(mockData, 'Purchase Requisition', (id) => approvalService.approvePR(id));
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
    const prs = mockDb.getPRs();
    const pr = prs.find(p => p.id === id);
    if (pr) fireNotifications('Update', pr as any, 'Purchase Requisition');
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
    const prs = mockDb.getPRs();
    const pr = prs.find(p => p.id === id);
    if (pr) fireNotifications('Update', pr as any, 'Purchase Requisition');
  },

  // --- Purchase Orders ---
  getPendingPOs: async (): Promise<PurchaseOrder[]> => {
    try {
      const response = await api.get('/purchase/orders', {
        params: { status: 'Pending', limit: 1000 }
      });
      const data = response.data.purchaseOrders ?? response.data.data ?? [];
      let items = data.map((po: any) => ({
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
      items = await filterAutoApproved(items, 'Purchase Order', (id) => approvalService.approvePO(id));
      return items;
    } catch (e) {
      await delay(200);
      let mockData = mockDb.getPOs().filter(
        p => p.status === 'Draft' || p.status === 'Pending Approval' || p.status === 'Pending'
      );
      mockData = await filterAutoApproved(mockData, 'Purchase Order', (id) => approvalService.approvePO(id));
      return mockData;
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
    const pos = mockDb.getPOs();
    const po = pos.find(p => p.id === id);
    if (po) fireNotifications('Update', po as any, 'Purchase Order');
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
    const pos = mockDb.getPOs();
    const po = pos.find(p => p.id === id);
    if (po) fireNotifications('Update', po as any, 'Purchase Order');
  },

  // --- GRN (Goods Receipt Note) ---
  getPendingGRNs: async (): Promise<GRN[]> => {
    try {
      const response = await api.get('/api/inward/grns/for-approval', {
        params: { limit: 1000 }
      });
      let items = (response.data.data ?? []).map(toFrontendGRN);
      items = await filterAutoApproved(items, 'GRN', (id) => approvalService.approveGRN(id));
      return items;
    } catch (e) {
      await delay(200);
      let mockData = mockDb.getGRNs().filter(g => g.status === 'QC Completed');
      mockData = await filterAutoApproved(mockData, 'GRN', (id) => approvalService.approveGRN(id));
      return mockData;
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
    const grns = mockDb.getGRNs();
    const grn = grns.find(g => g.id === id);
    if (grn) fireNotifications('Approve', grn as any, 'GRN');
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
    const grns = mockDb.getGRNs();
    const grn = grns.find(g => g.id === id);
    if (grn) fireNotifications('Update', grn as any, 'GRN');
  },

  // --- Stock Adjustments ---
  getPendingAdjustments: async (): Promise<StockAdjustment[]> => {
    try {
      const response = await api.get('/api/stock-adjustments', {
        params: { status: 'Pending', page: 1, limit: 200 },
      });
      const data = response.data.data ?? [];
      let items = data.map((adjustment: any) => {
        const delta = Number(adjustment.delta || 0);
        const quantity = Math.abs(delta || adjustment.quantity || adjustment.adjustedQty || 0);
        return {
          id: String(adjustment._id || adjustment.id || ''),
          reference: `ADJ-${String(adjustment._id || adjustment.id || '').slice(-6).toUpperCase()}`,
          date: adjustment.createdAt
            ? new Date(adjustment.createdAt).toISOString().split('T')[0]
            : '',
          itemId: String(adjustment.itemId || ''),
          itemName: adjustment.itemName || 'Inventory Item',
          warehouseId: String(adjustment.warehouseId || ''),
          type: adjustment.type || adjustment.notes || 'Correction',
          quantity,
          impact: adjustment.impact || (delta < 0 ? 'Deduct' : 'Add'),
          reason: adjustment.reason || adjustment.notes || '',
          status: adjustment.status || 'Pending',
        };
      });
      items = await filterAutoApproved(items, 'Stock Adjustment', (id) => approvalService.approveAdjustment(id));
      return items;
    } catch (e) {
      await delay(200);
      let mockData = mockDb.getAdjustments().filter(a => a.status === 'Pending');
      mockData = await filterAutoApproved(mockData, 'Stock Adjustment', (id) => approvalService.approveAdjustment(id));
      return mockData;
    }
  },

  approveAdjustment: async (id: string): Promise<void> => {
    try {
      await api.patch(`/api/stock-adjustments/${id}/status`, { status: 'Approved' });
      return;
    } catch (e) {
      await delay(300);
    }
    const adjustments = mockDb.getAdjustments();
    const idx = adjustments.findIndex(a => a.id === id);
    if(idx !== -1) {
        adjustments[idx].status = 'Approved';
        mockDb.saveAdjustments(adjustments);

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
    const adjustments2 = mockDb.getAdjustments();
    const adj2 = adjustments2.find(a => a.id === id);
    if (adj2) fireNotifications('Approve', adj2 as any, 'Stock Adjustment');
  },

  rejectAdjustment: async (id: string): Promise<void> => {
    try {
      await api.patch(`/api/stock-adjustments/${id}/status`, { status: 'Rejected' });
      return;
    } catch (e) {
      await delay(300);
    }
    const adjustments = mockDb.getAdjustments();
    const idx = adjustments.findIndex(a => a.id === id);
    if(idx !== -1) {
        adjustments[idx].status = 'Rejected';
        mockDb.saveAdjustments(adjustments);
    }
    const adj = mockDb.getAdjustments().find(a => a.id === id);
    if (adj) fireNotifications('Update', adj as any, 'Stock Adjustment');
  },

  // --- Stock Transfers ---
  getPendingTransfers: async (): Promise<StockTransfer[]> => {
    try {
      const response = await api.get('/api/transfer');
      const transfers = (response.data.transfers || []).map((transfer: any) => ({
        id: transfer._id,
        sourceWarehouseId:
          typeof transfer.sourceWarehouse === "object"
            ? transfer.sourceWarehouse?._id
            : transfer.sourceWarehouse,
        destinationWarehouseId:
          typeof transfer.destinationWarehouse === "object"
            ? transfer.destinationWarehouse?._id
            : transfer.destinationWarehouse,
        items: (transfer.items || []).map((item: any) => ({
          itemId: item.itemId,
          itemName: item.itemName || "Item",
          quantity: Number(item.quantity || 0),
        })),
        status: transfer.status || "Pending",
        date: new Date(transfer.createdAt).toISOString().split("T")[0],
        referenceNo: transfer.ref || `TRF-${String(transfer._id).slice(-6).toUpperCase()}`,
      }));
      const filtered = transfers.filter((t: StockTransfer) => t.status === 'Pending');
      return await filterAutoApproved(filtered, 'Stock Transfer', (id) => approvalService.approveTransfer(id));
    } catch (e) {
      console.error("Failed to fetch pending transfers", e);
      return [];
    }
  },

  approveTransfer: async (id: string): Promise<void> => {
    await api.put(`/api/transfer/complete/${id}`);
    fireNotifications('Approve', { id } as any, 'Stock Transfer');
  },

  rejectTransfer: async (id: string): Promise<void> => {
    await api.put(`/api/transfer/cancel/${id}`);
    fireNotifications('Update', { id } as any, 'Stock Transfer');
  },

  // --- Returns (Purchase & Sales) ---
  getPendingPurchaseReturns: async (): Promise<PurchaseReturn[]> => {
    try {
      const response = await api.get('/api/purchase-returns', {
        params: { limit: 1000 },
      });
      const data = response.data.data ?? [];
      let items = data
        .map(toFrontendPurchaseReturn)
        .filter((ret) => ret.status === 'Draft' || ret.status === 'Pending Approval' || ret.status === 'Pending');
      items = await filterAutoApproved(items, 'Purchase Return', (id) => approvalService.approvePurchaseReturn(id));
      return items;
    } catch (e) {
      await delay(200);
      let mockData = mockDb.getPurchaseReturns().filter(r => r.status === 'Draft' || r.status === 'Pending Approval');
      mockData = await filterAutoApproved(mockData, 'Purchase Return', (id) => approvalService.approvePurchaseReturn(id));
      return mockData;
    }
  },

  approvePurchaseReturn: async (id: string): Promise<void> => {
    try {
      await api.put(`/api/purchase-returns/${id}`, { status: 'Sent' });
      return;
    } catch (e) {
      await delay(300);
    }
    const returns = mockDb.getPurchaseReturns();
    const idx = returns.findIndex(r => r.id === id);
    if(idx !== -1) {
        returns[idx].status = 'Sent';
        mockDb.savePurchaseReturns(returns);
    }
    const ret = mockDb.getPurchaseReturns().find(r => r.id === id);
    if (ret) fireNotifications('Approve', ret as any, 'Purchase Return');
  },

  rejectPurchaseReturn: async (id: string): Promise<void> => {
    try {
      await api.put(`/api/purchase-returns/${id}`, { status: 'Rejected' });
      return;
    } catch (e) {
      await delay(300);
    }
    const returns = mockDb.getPurchaseReturns();
    const idx = returns.findIndex(r => r.id === id);
    if(idx !== -1) {
        returns[idx].status = 'Rejected';
        mockDb.savePurchaseReturns(returns);
    }
    const ret = mockDb.getPurchaseReturns().find(r => r.id === id);
    if (ret) fireNotifications('Update', ret as any, 'Purchase Return');
  },

  getPendingSalesReturns: async (): Promise<SalesReturn[]> => {
    try {
      const response = await api.get('/api/sales-returns', {
        params: { limit: 1000 },
      });
      const data = response.data.data ?? [];
      let items = data
        .map(toFrontendSalesReturn)
        .filter((ret) => ret.status === 'Received' || ret.status === 'Pending Approval' || ret.status === 'Pending');
      items = await filterAutoApproved(items, 'Sales Return', (id) => approvalService.approveSalesReturn(id));
      return items;
    } catch (e) {
      await delay(200);
      let mockData = mockDb.getSalesReturns().filter(r => r.status === 'Received' || r.status === 'Pending Approval');
      mockData = await filterAutoApproved(mockData, 'Sales Return', (id) => approvalService.approveSalesReturn(id));
      return mockData;
    }
  },

  approveSalesReturn: async (id: string): Promise<void> => {
    try {
      await api.put(`/api/sales-returns/${id}`, { status: 'Processed' });
      return;
    } catch (e) {
      await delay(300);
    }
    const returns = mockDb.getSalesReturns();
    const idx = returns.findIndex(r => r.id === id);
    if(idx !== -1) {
        returns[idx].status = 'Processed';
        mockDb.saveSalesReturns(returns);
    }
    const ret = mockDb.getSalesReturns().find(r => r.id === id);
    if (ret) fireNotifications('Approve', ret as any, 'Sales Return');
  },

  rejectSalesReturn: async (id: string): Promise<void> => {
    try {
      await api.put(`/api/sales-returns/${id}`, { status: 'Rejected' });
      return;
    } catch (e) {
      await delay(300);
    }
    const returns = mockDb.getSalesReturns();
    const idx = returns.findIndex(r => r.id === id);
    if(idx !== -1) {
        returns[idx].status = 'Rejected';
        mockDb.saveSalesReturns(returns);
    }
    const ret = mockDb.getSalesReturns().find(r => r.id === id);
    if (ret) fireNotifications('Update', ret as any, 'Sales Return');
  }
};
