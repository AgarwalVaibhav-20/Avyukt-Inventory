import api from './api';
import { Vendor, PurchaseOrder, GRN, POItem, GRNItem, PutAwayTask, PurchaseReturn } from '@/types';

const unwrapList = <T,>(response: any): T[] => response?.data?.data ?? response?.data?.vendors ?? response?.data ?? [];

const toFrontendGRNStatus = (status?: string): GRN['status'] => {
  switch (status) {
    case 'QC Pending':
    case 'Pending QC':
      return 'Pending QC';
    case 'QC Completed':
    case 'Stocked':
      return 'QC Completed';
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
  qcRemarks: item.qcRemarks || item.remarks || '',
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

  return {
    ...grn,
    status: 'Pending QC',
    items: inspectionItems.length ? inspectionItems.map(toFrontendGRNItem) : grn.items,
  };
};

export const procurementService = {
  // --- Vendors ---
  getVendors: async () => {
    const response = await api.get('/purchase/vendors');
    return response.data;
  },
  addVendor: async (data: Omit<Vendor, 'id'>) => {
    const response = await api.post('/purchase/vendors', data);
    return response.data;
  },
  deleteVendor: async (id: string) => {
    await api.delete(`/purchase/vendors/${id}`);
  },

  // --- Purchase Orders ---
  getAllPOs: async () => {
    const response = await api.get('/purchase/orders');
    return response.data;
  },
  
  createPO: async (po: Omit<PurchaseOrder, 'id' | 'poNumber' | 'status'>): Promise<PurchaseOrder> => {
    const response = await api.post('/purchase/orders', po);
    return response.data;
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

  createGRN: async (poId: string, challanNo: string, items: GRNItem[]): Promise<GRN> => {
    const po = (await procurementService.getAllPOs()).find((order: PurchaseOrder) => order.id === poId);
    const response = await api.post('/api/inward/grn', {
      purchaseOrderId: poId,
      supplierId: po?.vendorId,
      challanNumber: challanNo,
      items: items.map((item: any) => ({
        productId: item.productId || item.itemId,
        materialId: item.materialId,
        itemName: item.itemName,
        qty: Number(item.receivedQty || item.quantity || 0),
        orderedQty: Number(item.poQty || item.quantity || 0),
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
      status: 'Pending',
      assignedLocation: task.suggestedLocation || task.warehouseId,
    }));
  },

  completePutAway: async (taskId: string, location: string): Promise<void> => {
    const tasks = await procurementService.getPutAwayTasks();
    const task = tasks.find((item) => item.id === taskId);
    if (!task) throw new Error("Task not found");

    await api.post('/api/inward/put-away', {
      location,
      items: [{
        grnId: task.grnId,
        grnItemId: task.id,
        qty: task.quantity,
        itemName: task.itemName,
      }],
    });
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
