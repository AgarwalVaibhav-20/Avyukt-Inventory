import { mockDb } from './mockDb';
import { Customer, SalesOrder, PickList, PackList, DeliveryChallan, DispatchNote, SalesReturn } from '@/types';
import api from './api';
import { authService } from './authService';

const unwrapList = <T,>(response: any): T[] => response?.data?.data ?? response?.data ?? [];

const toFrontendSalesReturn = (item: any): SalesReturn => ({
    id: item.id || item._id,
    returnNumber: item.returnNo || item.returnNumber,
    soId: String(item.salesOrderId || item.soId || ''),
    soNumber: item.soRef || item.soNumber || '',
    customerName: item.customerName || '',
    date: (item.returnDate || item.date || item.createdAt || new Date().toISOString()).toString().slice(0, 10),
    items: (item.items || []).map((line: any) => ({
        itemId: String(line.productId || line.itemId || ''),
        itemName: line.description || line.itemName || '',
        quantity: Number(line.returnQty || line.quantity || 0),
        reason: line.reason || '',
    })),
    status: item.status || 'Pending',
});

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const salesService = {
  // --- Customers ---
  getCustomers: async () => { await delay(200); return mockDb.getCustomers(); },
  addCustomer: async (data: Omit<Customer, 'id'>) => {
    await delay(200);
    const list = mockDb.getCustomers();
    const newRec = { ...data, id: Math.random().toString(36).substr(2, 9) };
    mockDb.saveCustomers([...list, newRec]);
    return newRec;
  },

  // --- Sales Orders ---
  getAllSOs: async () => { await delay(300); return mockDb.getSOs(); },
  
  createSO: async (so: Omit<SalesOrder, 'id' | 'soNumber' | 'status'>): Promise<SalesOrder> => {
    await delay(300);
    const list = mockDb.getSOs();
    const newSO: SalesOrder = {
        ...so,
        id: Math.random().toString(36).substr(2, 9),
        soNumber: `SO-${new Date().getFullYear()}-${String(list.length + 1).padStart(3, '0')}`,
        status: 'Confirmed' // Direct confirm for demo
    };
    mockDb.saveSOs([newSO, ...list]);
    return newSO;
  },

  // --- Outward Workflow ---
  
  // 1. Generate Pick List from SO
  createPickList: async (soId: string): Promise<PickList> => {
    await delay(300);
    const sos = mockDb.getSOs();
    const soIndex = sos.findIndex(s => s.id === soId);
    if (soIndex === -1) throw new Error("SO not found");
    
    // Update SO
    sos[soIndex].status = 'Picking';
    mockDb.saveSOs(sos);

    const list = mockDb.getPickLists();
    const newPick: PickList = {
        id: Math.random().toString(36).substr(2, 9),
        pickNumber: `PL-${String(list.length + 1).padStart(4, '0')}`,
        soId: sos[soIndex].id,
        soNumber: sos[soIndex].soNumber,
        date: new Date().toISOString().split('T')[0],
        status: 'Pending',
        items: sos[soIndex].items.map(i => ({
            itemId: i.itemId,
            itemName: i.itemName,
            quantity: i.quantity,
            location: 'Zone A-12' // Mock location
        }))
    };
    mockDb.savePickLists([newPick, ...list]);
    return newPick;
  },

  getPickLists: async () => { await delay(200); return mockDb.getPickLists(); },

  completePickList: async (id: string): Promise<void> => {
    await delay(200);
    const list = mockDb.getPickLists();
    const idx = list.findIndex(p => p.id === id);
    if(idx !== -1) {
        list[idx].status = 'Picked';
        mockDb.savePickLists(list);
    }
  },

  // 2. Generate Pack List from Pick List
  createPackList: async (pickListId: string, boxCount: number): Promise<PackList> => {
    await delay(300);
    const picks = mockDb.getPickLists();
    const pick = picks.find(p => p.id === pickListId);
    if(!pick) throw new Error("Pick List not found");

    // Update SO status logic would go here ideally to 'Packed' via finding SO
    const sos = mockDb.getSOs();
    const soIdx = sos.findIndex(s => s.id === pick.soId);
    if (soIdx !== -1) {
        sos[soIdx].status = 'Packed';
        mockDb.saveSOs(sos);
    }

    const list = mockDb.getPackLists();
    const newPack: PackList = {
        id: Math.random().toString(36).substr(2, 9),
        packNumber: `PK-${String(list.length + 1).padStart(4, '0')}`,
        soId: pick.soId,
        soNumber: pick.soNumber,
        date: new Date().toISOString().split('T')[0],
        status: 'Packed',
        boxCount
    };
    mockDb.savePackLists([newPack, ...list]);
    return newPack;
  },

  getPackLists: async () => { await delay(200); return mockDb.getPackLists(); },

  // 3. Generate Delivery Challan
  createChallan: async (packListId: string): Promise<DeliveryChallan> => {
      await delay(300);
      const packs = mockDb.getPackLists();
      const pack = packs.find(p => p.id === packListId);
      if(!pack) throw new Error("Pack List not found");

      // Get customer name from SO
      const sos = mockDb.getSOs();
      const so = sos.find(s => s.id === pack.soId);
      if(so) {
          so.status = 'Challan Generated';
          mockDb.saveSOs(sos);
      }

      const list = mockDb.getChallans();
      const newChallan: DeliveryChallan = {
          id: Math.random().toString(36).substr(2, 9),
          challanNumber: `DC-${new Date().getFullYear()}-${String(list.length + 1).padStart(4, '0')}`,
          soId: pack.soId,
          soNumber: pack.soNumber,
          customerName: so?.customerName || 'Unknown',
          date: new Date().toISOString().split('T')[0],
          status: 'Generated'
      };
      mockDb.saveChallans([newChallan, ...list]);
      return newChallan;
  },

  getChallans: async () => { await delay(200); return mockDb.getChallans(); },

  // 4. Dispatch Note
  createDispatch: async (challanId: string, details: {transporter: string, vehicleNo: string, trackingId: string}): Promise<DispatchNote> => {
      await delay(400);
      const challans = mockDb.getChallans();
      const cIdx = challans.findIndex(c => c.id === challanId);
      if(cIdx === -1) throw new Error("Challan not found");
      
      challans[cIdx].status = 'Dispatched';
      mockDb.saveChallans(challans);

      // Final SO Update
      const sos = mockDb.getSOs();
      const soIdx = sos.findIndex(s => s.id === challans[cIdx].soId);
      if(soIdx !== -1) {
          sos[soIdx].status = 'Dispatched';
          mockDb.saveSOs(sos);
          
          // Deduct Stock here
          const inventory = mockDb.getItems();
          sos[soIdx].items.forEach(item => {
              const invItem = inventory.find(i => i.id === item.itemId);
              if(invItem) {
                  invItem.stock -= item.quantity;
                  if(invItem.stock < 0) invItem.stock = 0; // Prevent negative
                  invItem.lastUpdated = new Date().toISOString().split('T')[0];
              }
          });
          mockDb.saveItems(inventory);
      }

      const list = mockDb.getDispatchNotes();
      const newDisp: DispatchNote = {
          id: Math.random().toString(36).substr(2, 9),
          dispatchNumber: `DN-${String(list.length + 1).padStart(4, '0')}`,
          challanId,
          challanNumber: challans[cIdx].challanNumber,
          date: new Date().toISOString().split('T')[0],
          ...details
      };
      mockDb.saveDispatchNotes([newDisp, ...list]);
      return newDisp;
  },

  getDispatchNotes: async () => { await delay(200); return mockDb.getDispatchNotes(); },

  // --- Outward Workflow Methods ---
  getWorkflowSalesOrders: async () => {
    try {
      const response = await api.get('/api/sales-orders');
      return unwrapList<SalesOrder>(response);
    } catch (err) {
      console.error('Error fetching workflow sales orders:', err);
      return [];
    }
  },

  getWorkflowPickLists: async () => {
    try {
      const response = await api.get('/api/pick-lists');
      return unwrapList(response);
    } catch (err) {
      console.error('Error fetching pick lists:', err);
      return [];
    }
  },

  getWorkflowPackingOrders: async () => {
    try {
      const response = await api.get('/api/packing-lists');
      return unwrapList(response);
    } catch (err) {
      console.error('Error fetching packing orders:', err);
      return [];
    }
  },

  getWorkflowChallans: async () => {
    try {
      const response = await api.get('/api/delivery-challans');
      return unwrapList(response);
    } catch (err) {
      console.error('Error fetching challans:', err);
      return [];
    }
  },

  getWorkflowDispatches: async () => {
    try {
      const response = await api.get('/api/dispatches');
      return unwrapList(response);
    } catch (err) {
      console.error('Error fetching dispatches:', err);
      return [];
    }
  },

  createWorkflowPickList: async (salesOrder: SalesOrder) => {
    try {
      const response = await api.post('/api/pick-lists', {
        salesOrderId: salesOrder.id,
        soNumber: salesOrder.soNumber,
        items: salesOrder.items || [],
      });
      return response.data;
    } catch (err: any) {
      console.error('Error creating pick list:', err);
      throw new Error(err.response?.data?.message || 'Failed to create pick list');
    }
  },

  completeWorkflowPickList: async (pickList: any) => {
    try {
      const response = await api.put(`/api/pick-lists/${pickList.id}`, {
        status: 'Completed',
      });
      return response.data;
    } catch (err: any) {
      console.error('Error completing pick list:', err);
      throw new Error(err.response?.data?.message || 'Failed to complete pick list');
    }
  },

  createWorkflowPackingOrder: async (pickList: any, salesOrder: SalesOrder) => {
    try {
      const response = await api.post('/api/packing-lists', {
        pickListId: pickList.id,
        salesOrderId: salesOrder.id,
        soNumber: salesOrder.soNumber,
        items: pickList.items || [],
      });
      return response.data;
    } catch (err: any) {
      console.error('Error creating packing order:', err);
      throw new Error(err.response?.data?.message || 'Failed to create packing order');
    }
  },

  createWorkflowChallan: async (packingOrder: any) => {
    try {
      const response = await api.post('/api/delivery-challans', {
        packingOrderId: packingOrder.id,
        items: packingOrder.items || [],
      });
      return response.data;
    } catch (err: any) {
      console.error('Error creating challan:', err);
      throw new Error(err.response?.data?.message || 'Failed to create challan');
    }
  },

  createWorkflowDispatch: async (challan: any, packingOrder?: any) => {
    try {
      const response = await api.post('/api/dispatches', {
        deliveryChallanId: challan.id,
        transporter: challan.transporter || '',
        vehicleNo: challan.vehicleNo || '',
      });
      return response.data;
    } catch (err: any) {
      console.error('Error creating dispatch:', err);
      throw new Error(err.response?.data?.message || 'Failed to create dispatch');
    }
  },

  // --- Returns ---
    getSalesReturns: async () => {
        const response = await api.get('/api/sales-returns');
        return unwrapList<SalesReturn>(response).map(toFrontendSalesReturn);
    },
  
  createSalesReturn: async (data: Omit<SalesReturn, 'id' | 'returnNumber' | 'status'>) => {
            const response = await api.post('/api/sales-returns', data);
            return toFrontendSalesReturn(response.data.data ?? response.data);
  }
};
