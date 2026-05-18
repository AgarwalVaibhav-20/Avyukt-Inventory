import api from './api';
import { authService } from './authService';
import { Vendor, PurchaseOrder, GRN, POItem, GRNItem, PutAwayTask, PurchaseReturn, PurchaseRequisition, PurchaseInvoice } from '@/types';

const unwrapList = <T,>(response: any): T[] => 
  response?.data?.data ?? 
  response?.data?.vendors ?? 
  response?.data?.purchaseOrders ?? 
  response?.data ?? [];

const toFrontendGRNStatus = (status?: string): GRN['status'] => {
  switch (status) {
    case 'QC Pending':
    case 'Pending QC':
      return 'Pending QC';
    case 'QC Completed':
      return 'Pending';
    case 'Stocked':
      return 'Put Away Completed';
    case 'Approved':
      return 'Approved';
    case 'Rejected':
    case 'QC Failed':
      return 'Rejected';
    default:
      return 'Pending QC';
  }
};

const getItemId = (item: any) =>
  String(item.itemId || item.productId || item.materialId || item._id || '');

const toFrontendGRNItem = (item: any): GRNItem & { grnItemId?: string } => ({
  grnItemId: String(item.grnItemId || item._id || ''),
  itemId: getItemId(item),
  itemName: item.itemName || item.name || '',
  poQty: Number(item.poQty ?? item.orderedQty ?? item.quantity ?? item.qty ?? 0),
  receivedQty: Number(item.receivedQty ?? item.inspectedQty ?? item.qty ?? item.quantity ?? 0),
  acceptedQty: Number(item.acceptedQty ?? 0),
  rejectedQty: Number(item.rejectedQty ?? 0),
  batchNo: item.batchNo || '',
  mfgDate: (item.mfgDate || item.manufacturingDate || '').toString().slice(0, 10),
  expiryDate: (item.expDate || item.expiryDate || '').toString().slice(0, 10),
  serialNumbers: Array.isArray(item.serialNumbers) ? item.serialNumbers : [],
  qcRemarks: item.qcRemarks || item.remarks || '',
  hsnCode: item.hsnCode || '',
  taxRate: Number(item.taxPercentage || 0),
  unitPrice: Number(item.unitValue || item.unitPrice || 0),
});

const toFrontendGRN = (grn: any, inspection?: any): GRN & { inspectionId?: string } => {
  const supplier = grn?.supplierId;
  const po = grn?.purchaseOrderId;

  return {
    inspectionId: inspection?._id || inspection?.id,
    id: String(grn?._id || grn?.id || ''),
    grnNumber: grn?.grnNumber || '',
    poId: String(po?._id || po || grn?.poId || ''),
    poNumber: po?.poNo || po?.poNumber || grn?.poNumber || '',
    vendorId: String(supplier?._id || supplier || grn?.vendorId || ''),
    vendorName: supplier?.vendorName || po?.vendor || grn?.vendorName || '',
    date: (grn?.date || grn?.createdAt || new Date().toISOString()).toString().slice(0, 10),
    challanNumber: grn?.challanNumber || grn?.transportInfo?.challanNumber || '',
    status: toFrontendGRNStatus(grn?.status),
    items: (grn?.items || []).map(toFrontendGRNItem),
  };
};

const toFrontendQCInspection = (inspection: any): GRN & { inspectionId?: string } => {
  const grn = toFrontendGRN(inspection.grnId || {}, inspection);
  const inspectionItems = Array.isArray(inspection.items) ? inspection.items : [];
  const grnItemsById = new Map(
    (grn.items || []).map((item: any) => [String((item as any).grnItemId || item.itemId || ''), item]),
  );

  return {
    ...grn,
    status: 'Pending QC',
    items: inspectionItems.length
      ? inspectionItems.map((item: any) => {
          const mapped = toFrontendGRNItem(item);
          const sourceGrnItem = grnItemsById.get(String(item.grnItemId || item._id || ''));

          return {
            ...mapped,
            receivedQty: sourceGrnItem?.receivedQty ?? sourceGrnItem?.poQty ?? mapped.receivedQty,
            poQty: sourceGrnItem?.poQty ?? mapped.poQty,
            itemName: sourceGrnItem?.itemName || mapped.itemName,
            itemId: sourceGrnItem?.itemId || mapped.itemId,
            hsnCode: sourceGrnItem?.hsnCode || mapped.hsnCode,
            taxRate: sourceGrnItem?.taxRate || mapped.taxRate,
            unitPrice: sourceGrnItem?.unitPrice || mapped.unitPrice,
          };
        })
      : grn.items,
  };
};

const toFrontendPO = (po: any): PurchaseOrder => ({
  id: String(po._id || po.id || ''),
  poNumber: po.poNo || '',
  vendorId: String(po.vendorId?._id || po.vendorId || ''),
  vendorName: po.vendor || '',
  date: (po.orderDate || po.createdAt || new Date().toISOString()).toString().slice(0, 10),
  deliveryDate: (po.deliveryDate || po.scheduledDeliveryDate || '').toString().slice(0, 10),
  totalAmount: Number(po.totalAmount || 0),
  status: po.status ? po.status.charAt(0).toUpperCase() + po.status.slice(1) : 'Open',
  items: (po.productLines || []).map((line: any) => ({
    itemId: String(line.materialId || line.productId || line._id || ''),
    itemName: line.product || '',
    quantity: Number(line.quantity || 0),
    unitPrice: Number(line.unitPrice || 0),
    receivedQty: Number(line.receivedQuantity || 0),
    hsnCode: line.hsnCode || '',
    taxRate: Number(line.taxPercentage || 0),
  })),
});

export const procurementService = {
  // --- Vendors ---
  getVendors: async () => {
    const response = await api.get('/purchase/vendors');
    const list = unwrapList<any>(response);
    return list.map((v: any) => ({
      id: v.id || v._id,
      name: v.name || v.vendorName || '',
      code: v.code || v.vendorCode || '',
      contactPerson: v.contactPerson || '',
      email: v.email || '',
      phone: v.phone || '',
      status: v.status || (v.isActive ? 'Active' : 'Inactive'),
      rating: v.rating || v.vendorRating || 0,
    }));
  },
  addVendor: async (data: Omit<Vendor, 'id'>) => {
    const response = await api.post('/purchase/vendors', {
      vendorName: data.name,
      vendorCode: data.code,
      contactPerson: data.contactPerson,
      email: data.email,
      phone: data.phone,
      status: data.status,
    });
    const v = response.data.vendor ?? response.data.data ?? response.data;
    return {
      id: v.id || v._id,
      name: v.name || v.vendorName || '',
      code: v.code || v.vendorCode || '',
      contactPerson: v.contactPerson || '',
      email: v.email || '',
      phone: v.phone || '',
      status: v.status || (v.isActive ? 'Active' : 'Inactive'),
      rating: v.rating || v.vendorRating || 0,
    };
  },
  updateVendor: async (id: string, updates: Partial<Vendor>) => {
    await api.put(`/purchase/vendors/${id}`, {
      vendorName: updates.name,
      contactPerson: updates.contactPerson,
      email: updates.email,
      phone: updates.phone,
      status: updates.status,
    });
  },
  deleteVendor: async (id: string) => {
    await api.delete(`/purchase/vendors/${id}`);
  },

  // --- Purchase Orders ---
  getAllPOs: async (): Promise<PurchaseOrder[]> => {
    const response = await api.get('/purchase/orders');
    return unwrapList<any>(response).map(toFrontendPO);
  },
  
  createPO: async (po: Omit<PurchaseOrder, 'id' | 'poNumber' | 'status'>): Promise<PurchaseOrder> => {
    const user = authService.getCurrentUser();
    const organisationId = user?.organisationId || localStorage.getItem('organisationId');
    const response = await api.post('/purchase/orders', {
      ...po,
      organisationId,
      vendor: po.vendorName,
      orderDate: po.date,
      deliveryDate: po.deliveryDate,
      scheduledDeliveryDate: po.deliveryDate,
      productLines: po.items.map(item => ({
        product: item.itemName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        materialId: item.itemId,
        hsnCode: item.hsnCode || '',
        taxPercentage: item.taxRate,
      }))
    });
    return toFrontendPO(response.data.purchaseOrder || response.data);
  },

  updatePO: async (id: string, updates: any): Promise<void> => {
    const payload = { ...updates };
    if (updates.items) {
      payload.productLines = updates.items.map((item: any) => ({
        product: item.itemName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        materialId: item.itemId,
        hsnCode: item.hsnCode,
        taxPercentage: item.taxRate,
      }));
      delete payload.items;
    }
    await api.put(`/purchase/orders/${id}`, payload);
  },

  // --- GRN (Goods Receipt Note) ---
  getAllGRNs: async (): Promise<GRN[]> => {
    const response = await api.get('/api/inward/grns', { params: { limit: 1000 } });
    return unwrapList<any>(response).map((grn) => toFrontendGRN(grn));
  },

  getQualityQueue: async (): Promise<(GRN & { inspectionId?: string })[]> => {
    const response = await api.get('/api/inward/qc-queue', { params: { limit: 1000 } });
    return unwrapList<any>(response).map(toFrontendQCInspection);
  },

  createGRN: async (poId: string, challanNo: string, items: GRNItem[], location?: string): Promise<GRN> => {
    const po = (await procurementService.getAllPOs()).find((order: PurchaseOrder) => order.id === poId);
    const response = await api.post('/api/inward/grn', {
      purchaseOrderId: poId,
      supplierId: po?.vendorId,
      challanNumber: challanNo,
      location: location || '',
      items: items.map((item: any) => ({
        productId: item.productId || item.itemId,
        materialId: item.materialId,
        itemName: item.itemName,
        qty: Number(item.receivedQty || item.quantity || 0),
        batchNo: item.batchNo || '',
        mfgDate: item.mfgDate || null,
        expDate: item.expiryDate || null,
        serialNumbers: Array.isArray(item.serialNumbers) ? item.serialNumbers : [],
        orderedQty: Number(item.poQty || item.quantity || 0),
        hsnCode: item.hsnCode,
        taxPercentage: item.taxRate || item.taxPercentage || 0,
        unitPrice: item.unitPrice || 0,
        unitValue: item.unitPrice || 0,
      })),
    });

    return toFrontendGRN(response.data.data ?? response.data);
  },

  // --- QC Process ---
  updateQC: async (grnId: string, qcItems: GRNItem[]): Promise<void> => {
    const hasRejected = qcItems.some((item) => Number(item.rejectedQty || 0) > 0);
    const hasAccepted = qcItems.some((item) => Number(item.acceptedQty || 0) > 0);

    await api.post('/api/inward/qc', {
      inspectionId: grnId,
      overallResult: hasRejected && hasAccepted ? 'Partial' : hasRejected ? 'Fail' : 'Pass',
      items: qcItems.map((item: any) => ({
        grnItemId: item.grnItemId || item.id || item.itemId,
        acceptedQty: Number(item.acceptedQty || 0),
        rejectedQty: Number(item.rejectedQty || 0),
        result: Number(item.rejectedQty || 0) > 0
          ? Number(item.acceptedQty || 0) > 0 ? 'Partial' : 'Fail'
          : 'Pass',
        remarks: item.qcRemarks || '',
      })),
    });
  },

  // --- Put Away Process ---
  getPutAwayTasks: async (): Promise<PutAwayTask[]> => {
    const response = await api.get('/api/inward/put-away-queue', { params: { limit: 1000 } });
    return unwrapList<any>(response).map((task: any) => ({
      id: String(task.grnItemId || task.id || task._id || ''),
      grnId: String(task.grnId || ''),
      grnNumber: task.grnNumber || '',
      itemId: String(task.materialId || task.productId || task.grnItemId || ''),
      itemName: task.itemName || '',
      quantity: Number(task.qty || task.quantity || 0),
      batchNo: task.batchNo || '',
      expiryDate: (task.expDate || task.expiryDate || '').toString().slice(0, 10),
      serialNumbers: Array.isArray(task.serialNumbers) ? task.serialNumbers : [],
      status: 'Pending',
      assignedLocation: task.suggestedLocation || '',
      warehouseId: task.warehouseId || '',
      hsnCode: task.hsnCode || '',
      taxRate: Number(task.taxPercentage || 0),
    }));
  },

  completePutAway: async (taskId: string, binId: string, warehouseId: string): Promise<void> => {
    const tasks = await procurementService.getPutAwayTasks();
    const task = tasks.find((item) => item.id === taskId);
    if (!task) throw new Error("Task not found");

    await api.post('/api/inward/put-away', {
      location: warehouseId,
      items: [{
        grnId: task.grnId,
        grnItemId: task.id,
        qty: task.quantity,
        itemName: task.itemName,
        materialId: task.itemId,
        productId: task.itemId,
        batchNo: (task as any).batchNo || '',
        expiryDate: (task as any).expiryDate || null,
        serialNumbers: Array.isArray((task as any).serialNumbers) ? (task as any).serialNumbers : [],
        binId: binId,
      }],
    });
  },

  // --- Purchase Requisitions (PR) ---
  getAllPRs: async (): Promise<PurchaseRequisition[]> => {
    const response = await api.get('/purchase/requisitions');
    return unwrapList<any>(response).map((pr: any) => ({
      id: String(pr._id || pr.id || ''),
      prNumber: pr.prNumber || '',
      department: pr.department || '',
      requestedBy: pr.requestedBy || '',
      date: (pr.date || pr.createdAt || new Date().toISOString()).toString().slice(0, 10),
      requiredDate: (pr.requiredDate || new Date().toISOString()).toString().slice(0, 10),
      justification: pr.justification || '',
      status: pr.status || 'Draft',
      source: pr.source || 'Manual',
      items: (pr.items || []).map((i: any) => ({
        itemId: String(i.itemCode || i.itemId || ''),
        itemName: i.name || i.itemName || '',
        quantity: Number(i.qty || i.quantity || 0),
        hsnCode: i.hsnCode || i.hsn || '',
        taxRate: Number(i.taxPercentage || 0),
      }))
    }));
  },

  createPR: async (pr: Omit<PurchaseRequisition, 'id' | 'prNumber' | 'status'>): Promise<PurchaseRequisition> => {
    const response = await api.post('/purchase/requisitions', pr);
    return response.data.data ?? response.data;
  },

  approvePR: async (id: string): Promise<void> => {
    await api.patch(`/purchase/requisitions/${id}/approve`);
  },

  updatePR: async (id: string, updates: Partial<PurchaseRequisition>): Promise<void> => {
    await api.put(`/purchase/requisitions/${id}`, updates);
  },

  deletePR: async (id: string): Promise<void> => {
    await api.delete(`/purchase/requisitions/${id}`);
  },

  // --- Purchase Invoices (3-Way Match) ---
  getAllPurchaseInvoices: async (): Promise<PurchaseInvoice[]> => {
    const response = await api.get('/purchase/invoices');
    return unwrapList<any>(response).map((inv: any) => ({
      id: String(inv._id || inv.id || ''),
      invoiceNumber: inv.invoiceNumber || '',
      vendorId: String(inv.vendorId || ''),
      vendorName: inv.vendorName || '',
      poId: String(inv.poId || ''),
      poNumber: inv.poNumber || '',
      grnId: String(inv.grnId || ''),
      grnNumber: inv.grnNumber || '',
      date: (inv.date || inv.createdAt || new Date().toISOString()).toString().slice(0, 10),
      dueDate: (inv.dueDate || new Date().toISOString()).toString().slice(0, 10),
      totalAmount: Number(inv.totalAmount || 0),
      status: inv.status || 'Draft',
      items: (inv.items || []).map((i: any) => ({
        itemId: String(i.itemId || ''),
        itemName: i.itemName || '',
        poQty: Number(i.poQty || 0),
        grnQty: Number(i.grnQty || 0),
        invoiceQty: Number(i.invoiceQty || 0),
        unitPrice: Number(i.unitPrice || 0),
        variance: Number(i.variance || 0)
      }))
    }));
  },

  createPurchaseInvoice: async (invoice: Omit<PurchaseInvoice, 'id' | 'status'>): Promise<PurchaseInvoice> => {
    const response = await api.post('/purchase/invoices', invoice);
    return response.data.data ?? response.data;
  },

  // --- Inward Returns ---
  getPurchaseReturns: async () => {
    const response = await api.get('/api/purchase-returns');
    return unwrapList<PurchaseReturn>(response).map((item: any) => ({
      id: item.id || item._id,
      returnNumber: item.returnNo || item.returnNumber,
      grnId: item.grnId || '',
      vendorId: String(item.vendorId || ''),
      vendorName: item.vendor || item.vendorName || '',
      date: (item.date || item.createdAt || new Date().toISOString()).toString().slice(0, 10),
      items: (item.items || []).map((line: any) => ({
        itemId: String(line.itemId || ''),
        itemName: line.name || line.itemName || '',
        quantity: Number(line.qty || line.quantity || 0),
        reason: line.reason || '',
      })),
      status: item.status || 'Draft',
    }));
  },

  createPurchaseReturn: async (returnNote: Omit<PurchaseReturn, 'id' | 'returnNumber'>): Promise<PurchaseReturn> => {
      const response = await api.post('/api/purchase-returns', returnNote);
      const item = response.data.data ?? response.data;
      return {
          id: item.id || item._id,
          returnNumber: item.returnNo || item.returnNumber,
          grnId: item.grnId || '',
          vendorId: String(item.vendorId || ''),
          vendorName: item.vendor || item.vendorName || '',
          date: (item.date || item.createdAt || new Date().toISOString()).toString().slice(0, 10),
          items: (item.items || []).map((line: any) => ({
              itemId: String(line.itemId || ''),
              itemName: line.name || line.itemName || '',
              quantity: Number(line.qty || line.quantity || 0),
              reason: line.reason || '',
          })),
          status: item.status || 'Draft',
      };
  }
};
