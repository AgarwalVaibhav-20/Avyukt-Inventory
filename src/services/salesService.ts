import { mockDb } from './mockDb';
import { Customer, SalesOrder, PickList, PackList, DeliveryChallan, DispatchNote, SalesReturn } from '@/types';
import api from './api';
import { authService } from './authService';

const unwrapList = <T,>(response: any): T[] => response?.data?.data ?? response?.data ?? [];

const mapId = (item: any) => ({
    ...item,
    id: item.id || item._id
});

const mapWorkflowItems = (item: any) => ({
    ...item,
    id: item.id || item._id,
    items: (item.items || []).map((i: any) => ({
        ...i,
        productId: i.productId?._id || i.productId || i.product?._id || i.product || i.itemId || i._id || i.id,
        itemId: i.productId?._id || i.productId || i.product?._id || i.product || i.itemId || i._id || i.id
    }))
});

const toFrontendSO = (item: any): SalesOrder => ({
    id: item.id || item._id,
    soNumber: item.soNumber,
    customerId: item.customer,
    customerName: item.customer,
    date: (item.date || '').toString().slice(0, 10),
    status: item.status,
    totalAmount: item.amount || 0,
    items: (item.items || []).map((line: any) => ({
        itemId: String(line.productId || ''),
        itemName: line.description || '',
        quantity: line.qty || 0,
        unitPrice: line.unitPrice || 0,
    }))
});

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
  
  createSO: async (so: any): Promise<SalesOrder> => {
    // Map frontend fields to backend model schema
    const backendSO = {
      customer: so.customerName || so.customerId,
      date: so.date,
      amount: so.totalAmount,
      items: so.items.map((item: any) => ({
        productId: item.itemId,
        description: item.itemName,
        qty: item.quantity,
        unitPrice: item.unitPrice
      }))
    };
    const response = await api.post('/api/sales-orders', backendSO);
    return toFrontendSO(response.data);
  },

  updateSO: async (id: string, so: any): Promise<SalesOrder> => {
    const backendSO = {
      customer: so.customerName || so.customerId,
      date: so.date,
      amount: so.totalAmount,
      status: so.status,
      items: so.items.map((item: any) => ({
        productId: item.itemId,
        description: item.itemName,
        qty: item.quantity,
        unitPrice: item.unitPrice
      }))
    };
    const response = await api.put(`/api/sales-orders/${id}`, backendSO);
    return toFrontendSO(response.data);
  },

  deleteSO: async (id: string): Promise<void> => {
    await api.delete(`/api/sales-orders/${id}`);
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
      return unwrapList<any>(response).map(toFrontendSO);
    } catch (err) {
      console.error('Error fetching workflow sales orders:', err);
      return [];
    }
  },

  getWorkflowPickLists: async () => {
    try {
      const response = await api.get('/api/pick-lists');
      return unwrapList(response).map(mapWorkflowItems);
    } catch (err) {
      console.error('Error fetching pick lists:', err);
      return [];
    }
  },

  getWorkflowPackingOrders: async () => {
    try {
      const response = await api.get('/api/packing-orders');
      return unwrapList(response).map(mapWorkflowItems);
    } catch (err) {
      console.error('Error fetching packing orders:', err);
      return [];
    }
  },

  getWorkflowChallans: async () => {
    try {
      const response = await api.get('/api/delivery-challans');
      return unwrapList(response).map(mapWorkflowItems);
    } catch (err) {
      console.error('Error fetching challans:', err);
      return [];
    }
  },

  getWorkflowDispatches: async () => {
    try {
      const response = await api.get('/api/dispatches');
      return unwrapList(response).map(mapWorkflowItems);
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
        items: (salesOrder.items || []).map(item => ({
          productId: item.itemId || (item as any).productId || (item as any).product || (item as any).id || (item as any)._id,
          sku: (item as any).sku || '',
          description: item.itemName || item.description,
          required: item.quantity || (item as any).qty
        })),
        assignedTo: 'Warehouse Team', // Placeholder for now
      });
      return mapId(response.data);
    } catch (err: any) {
      console.error('Error creating pick list:', err);
      throw new Error(err.response?.data?.message || 'Failed to create pick list');
    }
  },

  completeWorkflowPickList: async (pickList: any) => {
    try {
      const response = await api.put(`/api/pick-lists/${pickList.id}`, {
        ...pickList,
        status: 'Completed',
      });
      return mapId(response.data);
    } catch (err: any) {
      console.error('Error completing pick list:', err);
      throw new Error(err.response?.data?.message || 'Failed to complete pick list');
    }
  },

  createWorkflowPackingOrder: async (pickList: any, salesOrder: SalesOrder) => {
    try {
      const response = await api.post('/api/packing-orders', {
        pickListId: pickList.id,
        salesOrderId: salesOrder.id,
        soNumber: salesOrder.soNumber || (salesOrder as any).soReference,
        customer: salesOrder.customerName || salesOrder.customerId || 'Customer',
        items: (pickList.items || []).map((item: any) => ({
          productId: item.productId?._id || item.productId || item.product?._id || item.product || item.itemId || item._id || item.id,
          sku: item.sku,
          description: item.description,
          qtyOrdered: item.required || item.qtyOrdered || item.qty,
          qtyPacked: item.picked || item.qtyPacked || 0,
          packed: (item.picked || item.qtyPacked || 0) >= (item.required || item.qtyOrdered)
        })),
      });
      return mapId(response.data);
    } catch (err: any) {
      console.error('Error creating packing order:', err);
      throw new Error(err.response?.data?.message || 'Failed to create packing order');
    }
  },

  createWorkflowChallan: async (packingOrder: any) => {
    try {
      const response = await api.post('/api/delivery-challans', {
        packingOrderIds: [packingOrder.id],
        soReference: packingOrder.soNumber || 'N/A',
        poReference: (packingOrder as any).poNumber || 'N/A',
        customer: packingOrder.customer || 'Customer',
        generatedOn: new Date().toISOString(),
        items: (packingOrder.items || []).map((item: any) => ({
          productId: item.productId?._id || item.productId || item.product?._id || item.product || item.itemId || item._id || item.id,
          description: item.description,
          packedQty: item.qtyPacked || item.picked || item.quantity || 1,
          unit: (item as any).unit || 'Unit',
          serialNumbers: Array.isArray(item.serialNumbers) ? item.serialNumbers : [],
        })),
      });
      return mapId(response.data);
    } catch (err: any) {
      console.error('Error creating challan:', err);
      throw new Error(err.response?.data?.message || 'Failed to create challan');
    }
  },

  createWorkflowDispatch: async (challan: any, packingOrder?: any) => {
    try {
      const response = await api.post('/api/dispatches', {
        deliveryChallanId: challan.id,
        salesOrderId: challan.salesOrderId,
        challanRef: challan.challanNo,
        soReference: challan.soReference || 'N/A',
        customer: challan.customer || 'Customer',
        transporter: challan.transporter || 'Self/Third Party',
        vehicleNo: challan.vehicleNo || 'TBD',
        dispatchedOn: new Date().toISOString(),
        items: (challan.items || []).map((item: any) => ({
          productId: item.productId?._id || item.productId || item.product?._id || item.product || item.itemId || item._id || item.id,
          description: item.description,
          qty: item.packedQty || item.qty || item.quantity || 1,
          unit: item.unit || 'Unit',
          serialNumbers: Array.isArray(item.serialNumbers) ? item.serialNumbers : [],
        }))
      });
      return mapId(response.data);
    } catch (err: any) {
      console.error('Error creating dispatch:', err);
      throw new Error(err.response?.data?.message || 'Failed to create dispatch');
    }
  },

  // --- Returns ---
  getSalesReturns: async () => {
    try {
      const response = await api.get('/api/sales-returns');
      return unwrapList<SalesReturn>(response).map(toFrontendSalesReturn);
    } catch (err) {
      console.error('Error fetching sales returns:', err);
      return [];
    }
  },

  createSalesReturn: async (data: any) => {
    try {
      const response = await api.post('/api/sales-returns', data);
      return toFrontendSalesReturn(response.data.data ?? response.data);
    } catch (err: any) {
      console.error('Error creating sales return:', err);
      throw new Error(err.response?.data?.message || 'Failed to create sales return');
    }
  },

  updateSalesReturnQC: async (id: string, qcStatus: 'Pass' | 'Fail' | 'Completed' | 'Partial', updateBody?: any) => {
    try {
      const payload = {
        qcStatus,
        status: qcStatus === 'Pass' || qcStatus === 'Completed' ? 'Approved' : 'Rejected',
        ...(updateBody || {})
      };
      const response = await api.put(`/api/sales-returns/${id}`, payload);
      return toFrontendSalesReturn(response.data.data ?? response.data);
    } catch (err: any) {
      console.error('Error updating QC:', err);
      throw new Error(err.response?.data?.message || 'Failed to update QC');
    }
  },

  // --- Invoice Mapping ---
  getInvoiceMappings: async () => {
    try {
      const response = await api.get('/api/invoice-mappings');
      return unwrapList<any>(response).map(mapId);
    } catch (err) {
      console.error('Error fetching invoice mappings:', err);
      return [];
    }
  },

  updateInvoiceMapping: async (id: string, data: any) => {
    try {
      const response = await api.put(`/api/invoice-mappings/${id}`, data);
      return mapId(response.data);
    } catch (err: any) {
      console.error('Error updating invoice mapping:', err);
      throw new Error(err.response?.data?.message || 'Failed to update invoice mapping');
    }
  },

  uploadInvoiceFile: async (id: string, file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post(`/api/invoice-mappings/${id}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return mapId(response.data);
    } catch (err: any) {
      console.error('Error uploading invoice file:', err);
      throw new Error(err.response?.data?.message || 'Failed to upload invoice file');
    }
  }
};
