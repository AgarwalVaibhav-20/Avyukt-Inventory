import api from './api';
import {
  ConsignmentEntry,
  InternalMovement,
  ScrapEntry,
  StockAdjustment,
} from '@/types';

export interface ConsignmentCustomerOption {
  id: string;
  name: string;
}

const normalizeScrapReason = (reason: string) => {
  const value = reason.toLowerCase();
  if (value.includes('expir')) return 'expired';
  if (value.includes('loss')) return 'lost';
  if (value.includes('obsolete')) return 'obsolete';
  return 'damaged';
};

const mapInternalMovement = (movement: any): InternalMovement => {
  const [fromWarehouseName = '', fromBin = ''] = String(movement.source || '').split(' - ');
  const [toWarehouseName = '', toBin = ''] = String(movement.destination || '').split(' - ');

  return {
    id: movement._id,
    reference: `IM-${String(movement._id).slice(-6).toUpperCase()}`,
    date: movement.movementDate
      ? new Date(movement.movementDate).toISOString().split('T')[0]
      : '',
    warehouseId: movement.referenceId || '',
    itemId:
      typeof movement.productId === 'object'
        ? movement.productId?._id
        : movement.productId,
    itemName: movement.productId?.name || '',
    fromBin,
    toBin,
    quantity: Number(movement.quantity || 0),
    performedBy: fromWarehouseName || 'System',
  };
};

const mapAdjustment = (adjustment: any): StockAdjustment => {
  const delta = Number(adjustment.delta || 0);
  const quantity = Math.abs(delta || adjustment.adjustedQty || 0);
  const isDeduct = delta < 0;

  return {
    id: adjustment._id,
    reference: `ADJ-${String(adjustment._id).slice(-6).toUpperCase()}`,
    date: adjustment.createdAt
      ? new Date(adjustment.createdAt).toISOString().split('T')[0]
      : '',
    itemId: adjustment.itemId,
    itemName: adjustment.itemName || 'Inventory Item',
    warehouseId: adjustment.warehouseId,
    type:
      adjustment.type ||
      (isDeduct ? 'Damage' : 'Correction'),
    quantity,
    impact: isDeduct ? 'Deduct' : 'Add',
    reason: adjustment.reason || adjustment.notes || '',
    status: adjustment.status || 'Pending',
  };
};

const mapScrap = (scrap: any): ScrapEntry => ({
  id: scrap._id,
  reference: `SCR-${String(scrap._id).slice(-6).toUpperCase()}`,
  date: scrap.date || (scrap.createdAt ? new Date(scrap.createdAt).toISOString().split('T')[0] : ''),
  itemId: typeof scrap.productId === 'object' ? scrap.productId?._id : scrap.productId,
  itemName: scrap.productId?.name || scrap.itemName || 'Item',
  quantity: Number(scrap.quantity || 0),
  reason: scrap.remark || scrap.reason || '',
  salvageValue: Number(scrap.salvageValue || 0),
  status:
    scrap.status === 'approved'
      ? 'Approved'
      : scrap.status === 'completed'
        ? 'Disposed'
        : 'Pending',
});

const mapConsignment = (entry: any): ConsignmentEntry => ({
  id: entry._id,
  reference: entry.reference || `CSG-${String(entry._id).slice(-6).toUpperCase()}`,
  date:
    entry.date ||
    (entry.createdAt ? new Date(entry.createdAt).toISOString().split('T')[0] : ''),
  partyId: entry.partyId || '',
  partyName: entry.partyName || 'Unknown Customer',
  itemId: typeof entry.itemId === 'object' ? entry.itemId?._id : entry.itemId,
  itemName: entry.itemName || entry.itemId?.name || 'Inventory Item',
  quantity: Number(entry.quantity || 0),
  type: entry.type === 'Inward' ? 'Inward' : 'Outward',
  status:
    entry.status === 'Returned'
      ? 'Returned'
      : entry.status === 'Settled' || entry.status === 'Sold'
        ? 'Settled'
        : 'Active',
});

export const movementService = {
  getInternalMovements: async (): Promise<InternalMovement[]> => {
    try {
      const response = await api.get('/api/internal-movement/history');
      return (response.data.data || []).map(mapInternalMovement);
    } catch (err) {
      console.error('Error fetching internal movements:', err);
      return [];
    }
  },

  createInternalMovement: async (
    data: Omit<InternalMovement, 'id' | 'reference' | 'date'>
  ) => {
    try {
      const payload = {
        warehouseId: data.warehouseId,
        itemType: 'product',
        itemId: data.itemId,
        fromBin: data.fromBin,
        toBin: data.toBin,
        quantity: data.quantity,
        notes: `Moved by ${data.performedBy}`,
      };

      const response = await api.post('/api/internal-movement/bin-transfer', payload);
      return mapInternalMovement(response.data.data || response.data);
    } catch (err: any) {
      console.error('Error creating internal movement:', err);
      throw new Error(err.response?.data?.message || 'Failed to create internal movement');
    }
  },

  getAdjustments: async (): Promise<StockAdjustment[]> => {
    try {
      const response = await api.get('/api/stock-adjustments', {
        params: { page: 1, limit: 200 },
      });
      return (response.data.data || []).map(mapAdjustment);
    } catch (err) {
      console.error('Error fetching adjustments:', err);
      return [];
    }
  },

  createAdjustment: async (
    data: Omit<StockAdjustment, 'id' | 'reference' | 'date' | 'impact'>
  ) => {
    try {
      const isDeduct = ['Damage', 'Loss', 'Theft'].includes(data.type);
      const quantity = Number(data.quantity || 0);
      const payload = {
        itemType: 'product',
        itemId: data.itemId,
        itemName: data.itemName,
        warehouseId: data.warehouseId,
        currentQty: 0,
        adjustedQty: quantity,
        delta: isDeduct ? -quantity : quantity,
        reason: data.reason,
        notes: data.type,
        type: data.type,
        status: 'Approved',
      };

      const response = await api.post('/api/stock-adjustments', payload);
      return mapAdjustment(response.data.data || response.data);
    } catch (err: any) {
      console.error('Error creating adjustment:', err);
      throw new Error(err.response?.data?.message || 'Failed to create stock adjustment');
    }
  },

  getScrapEntries: async (): Promise<ScrapEntry[]> => {
    try {
      const response = await api.get('/scrap/get/all');
      return (response.data.data || []).map(mapScrap);
    } catch (err) {
      console.error('Error fetching scrap entries:', err);
      return [];
    }
  },

  createScrapEntry: async (
    data: Omit<ScrapEntry, 'id' | 'reference' | 'date' | 'status'>
  ) => {
    try {
      const payload = {
        productId: data.itemId,
        quantity: data.quantity,
        reason: normalizeScrapReason(data.reason),
        scrapLocation: 'Main Scrap Yard',
        salvageValue: data.salvageValue,
        remark: data.reason,
      };

      const response = await api.post('/scrap/create', payload);
      return mapScrap(response.data.data || response.data);
    } catch (err: any) {
      console.error('Error creating scrap entry:', err);
      throw new Error(err.response?.data?.message || 'Failed to create scrap entry');
    }
  },

  getConsignmentEntries: async (): Promise<ConsignmentEntry[]> => {
    try {
      const response = await api.get('/api/consignments');
      return (response.data.data || []).map(mapConsignment);
    } catch (err) {
      console.error('Error fetching consignment entries:', err);
      return [];
    }
  },

  getConsignmentCustomers: async (): Promise<ConsignmentCustomerOption[]> => {
    try {
      const [salesOrdersResponse, consignmentsResponse] = await Promise.allSettled([
        api.get('/api/sales-orders', { params: { page: 1, limit: 200 } }),
        api.get('/api/consignments'),
      ]);

      const options = new Map<string, ConsignmentCustomerOption>();

      if (salesOrdersResponse.status === 'fulfilled') {
        const orders = salesOrdersResponse.value.data?.data || [];
        orders.forEach((order: any) => {
          const id = String(order.customerId || order._id || order.customerName || '').trim();
          const name = String(order.customerName || '').trim();
          if (!name) return;
          options.set(name.toLowerCase(), { id, name });
        });
      }

      if (consignmentsResponse.status === 'fulfilled') {
        const consignments = consignmentsResponse.value.data?.data || [];
        consignments.forEach((entry: any) => {
          const name = String(entry.partyName || '').trim();
          if (!name) return;
          const id = String(entry.partyId || name).trim();
          if (!options.has(name.toLowerCase())) {
            options.set(name.toLowerCase(), { id, name });
          }
        });
      }

      return Array.from(options.values()).sort((a, b) => a.name.localeCompare(b.name));
    } catch (err) {
      console.error('Error fetching consignment customers:', err);
      return [];
    }
  },

  createConsignment: async (
    data: Omit<ConsignmentEntry, 'id' | 'reference' | 'date' | 'status'>
  ) => {
    try {
      const response = await api.post('/api/consignments', data);
      return mapConsignment(response.data.data || response.data);
    } catch (err: any) {
      console.error('Error creating consignment:', err);
      throw new Error(err.response?.data?.message || 'Failed to create consignment entry');
    }
  },
};
