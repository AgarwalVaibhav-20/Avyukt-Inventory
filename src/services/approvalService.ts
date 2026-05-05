import { mockDb } from './mockDb';
import { PurchaseOrder, GRN, StockAdjustment, StockTransfer, PurchaseReturn, SalesReturn, PutAwayTask } from '@/types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const approvalService = {
  // --- Purchase Orders ---
  getPendingPOs: async (): Promise<PurchaseOrder[]> => {
    await delay(200);
    return mockDb.getPOs().filter(p => p.status === 'Draft' || p.status === 'Pending Approval');
  },

  approvePO: async (id: string): Promise<void> => {
    await delay(300);
    const pos = mockDb.getPOs();
    const idx = pos.findIndex(p => p.id === id);
    if(idx !== -1) {
        pos[idx].status = 'Sent';
        mockDb.savePOs(pos);
    }
  },

  rejectPO: async (id: string): Promise<void> => {
    await delay(300);
    const pos = mockDb.getPOs();
    const idx = pos.findIndex(p => p.id === id);
    if(idx !== -1) {
        pos[idx].status = 'Rejected';
        mockDb.savePOs(pos);
    }
  },

  // --- GRN (Goods Receipt Note) ---
  getPendingGRNs: async (): Promise<GRN[]> => {
    await delay(200);
    // After QC completion, GRN needs final approval before Putaway logic is officially triggered
    return mockDb.getGRNs().filter(g => g.status === 'QC Completed');
  },

  approveGRN: async (id: string): Promise<void> => {
    await delay(300);
    const grns = mockDb.getGRNs();
    const idx = grns.findIndex(g => g.id === id);
    if(idx !== -1) {
        grns[idx].status = 'Approved'; // Or directly 'Put Away Pending'
        mockDb.saveGRNs(grns);
        
        // At this point we could also trigger PutAway tasks if not done in QC step
        // In previous implementation QC triggered it, but approval step is a safeguard.
        // We will assume QC triggered tasks, this just formalizes the document status.
    }
  },

  rejectGRN: async (id: string): Promise<void> => {
    await delay(300);
    const grns = mockDb.getGRNs();
    const idx = grns.findIndex(g => g.id === id);
    if(idx !== -1) {
        grns[idx].status = 'Rejected';
        mockDb.saveGRNs(grns);
        // Should also cancel PutAway tasks conceptually
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
