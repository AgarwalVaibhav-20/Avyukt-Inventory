import { mockDb } from './mockDb';
import { Vendor, PurchaseOrder, GRN, POItem, GRNItem, PutAwayTask, PurchaseReturn } from '../types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const procurementService = {
  // --- Vendors ---
  getVendors: async () => { await delay(200); return mockDb.getVendors(); },
  addVendor: async (data: Omit<Vendor, 'id'>) => {
    await delay(200);
    const list = mockDb.getVendors();
    const newRec = { ...data, id: Math.random().toString(36).substr(2, 9) };
    mockDb.saveVendors([...list, newRec]);
    return newRec;
  },
  deleteVendor: async (id: string) => {
    await delay(200);
    mockDb.saveVendors(mockDb.getVendors().filter(i => i.id !== id));
  },

  // --- Purchase Orders ---
  getAllPOs: async () => { await delay(300); return mockDb.getPOs(); },
  
  createPO: async (po: Omit<PurchaseOrder, 'id' | 'poNumber' | 'status'>): Promise<PurchaseOrder> => {
    await delay(400);
    const list = mockDb.getPOs();
    const newPO: PurchaseOrder = {
        ...po,
        id: Math.random().toString(36).substr(2, 9),
        poNumber: `PO-${new Date().getFullYear()}-${String(list.length + 1).padStart(3, '0')}`,
        status: 'Sent' // Auto send for demo
    };
    mockDb.savePOs([newPO, ...list]);
    return newPO;
  },

  // --- GRN (Goods Receipt Note) ---
  getAllGRNs: async () => { await delay(300); return mockDb.getGRNs(); },

  createGRN: async (poId: string, challanNo: string, items: GRNItem[]): Promise<GRN> => {
    await delay(500);
    const pos = mockDb.getPOs();
    const poIndex = pos.findIndex(p => p.id === poId);
    if (poIndex === -1) throw new Error("PO not found");
    const po = pos[poIndex];

    const list = mockDb.getGRNs();
    const newGRN: GRN = {
        id: Math.random().toString(36).substr(2, 9),
        grnNumber: `GRN-${new Date().getFullYear()}-${String(list.length + 1).padStart(3, '0')}`,
        poId,
        poNumber: po.poNumber,
        vendorId: po.vendorId,
        vendorName: po.vendorName,
        date: new Date().toISOString().split('T')[0],
        challanNumber: challanNo,
        status: 'Pending QC',
        items
    };

    // Update PO Received Qty status (Simple logic)
    const updatedPOItems = po.items.map(pItem => {
        const received = items.find(i => i.itemId === pItem.itemId)?.receivedQty || 0;
        return { ...pItem, receivedQty: pItem.receivedQty + received };
    });
    
    // Check if fully received
    const isFullyReceived = updatedPOItems.every(i => i.receivedQty >= i.quantity);
    const newStatus = isFullyReceived ? 'Completed' : 'Partially Received';
    
    pos[poIndex] = { ...po, items: updatedPOItems, status: newStatus };
    mockDb.savePOs(pos);
    mockDb.saveGRNs([newGRN, ...list]);
    
    return newGRN;
  },

  // --- QC Process ---
  updateQC: async (grnId: string, qcItems: GRNItem[]): Promise<void> => {
    await delay(400);
    const grns = mockDb.getGRNs();
    const index = grns.findIndex(g => g.id === grnId);
    if (index === -1) throw new Error("GRN not found");

    const grn = grns[index];
    
    // 1. Update GRN status
    grns[index] = {
        ...grn,
        items: qcItems,
        status: 'QC Completed'
    };
    mockDb.saveGRNs(grns);

    // 2. Generate PutAway Tasks for ACCEPTED items
    const putAwayTasks = mockDb.getPutAwayTasks();
    const newTasks: PutAwayTask[] = qcItems
        .filter(i => i.acceptedQty > 0)
        .map(i => ({
            id: Math.random().toString(36).substr(2, 9),
            grnId: grn.id,
            grnNumber: grn.grnNumber,
            itemId: i.itemId,
            itemName: i.itemName,
            quantity: i.acceptedQty,
            status: 'Pending'
        }));
    
    if (newTasks.length > 0) {
        mockDb.savePutAwayTasks([...newTasks, ...putAwayTasks]);
    }
    
    // NOTE: Main stock is NOT updated here anymore. 
    // It is updated only after "Put Away" is completed to ensure process discipline.
  },

  // --- Put Away Process ---
  getPutAwayTasks: async () => { await delay(300); return mockDb.getPutAwayTasks(); },

  completePutAway: async (taskId: string, location: string): Promise<void> => {
    await delay(400);
    const tasks = mockDb.getPutAwayTasks();
    const index = tasks.findIndex(t => t.id === taskId);
    if (index === -1) throw new Error("Task not found");

    const task = tasks[index];
    
    // 1. Update Task
    tasks[index] = { ...task, status: 'Completed', assignedLocation: location };
    mockDb.savePutAwayTasks(tasks);

    // 2. Update Inventory Master Stock
    const inventory = mockDb.getItems();
    const invIndex = inventory.findIndex(i => i.id === task.itemId);
    if (invIndex !== -1) {
        inventory[invIndex].stock += task.quantity;
        inventory[invIndex].lastUpdated = new Date().toISOString().split('T')[0];
        if(inventory[invIndex].stock > inventory[invIndex].reorderLevel) {
            inventory[invIndex].status = 'In Stock';
        }
    }
    mockDb.saveItems(inventory);

    // 3. Check if all tasks for a GRN are done to update GRN status? 
    // For simplicity, we assume GRN stays "QC Completed" or can be marked "Put Away Completed" if we check all tasks.
  },

  // --- Inward Returns ---
  getPurchaseReturns: async () => { await delay(300); return mockDb.getPurchaseReturns(); },

  createPurchaseReturn: async (returnNote: Omit<PurchaseReturn, 'id' | 'returnNumber'>): Promise<PurchaseReturn> => {
      await delay(400);
      const list = mockDb.getPurchaseReturns();
      const newReturn: PurchaseReturn = {
          ...returnNote,
          id: Math.random().toString(36).substr(2, 9),
          returnNumber: `PR-${new Date().getFullYear()}-${String(list.length + 1).padStart(3, '0')}`,
      };
      mockDb.savePurchaseReturns([newReturn, ...list]);
      return newReturn;
  }
};
