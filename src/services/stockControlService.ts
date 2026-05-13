import api from './api';
import { authService } from './authService';
import {
  Batch,
  ClosingStockSnapshot,
  SerialNumber,
  StockLedgerEntry,
  StockReservation,
} from '@/types';

const getOrganisationId = () => authService.getOrganisationId();

const requireOrganisationId = () => {
  const organisationId = getOrganisationId();
  if (!organisationId) {
    throw new Error('Organisation ID is required');
  }
  return organisationId;
};

const formatDate = (value?: string | Date | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
};

const mapLedgerType = (type?: string): StockLedgerEntry['transactionType'] => {
  switch (String(type || '').toLowerCase()) {
    case 'purchase':
      return 'Purchase';
    case 'sale':
      return 'Sales';
    case 'transfer':
      return 'Transfer';
    case 'adjustment':
      return 'Adjustment';
    case 'initial':
      return 'Initial';
    default:
      return 'Audit';
  }
};

const mapLedgerEntry = (entry: any): StockLedgerEntry => ({
  id: entry._id,
  date: formatDate(entry.createdAt),
  itemId:
    typeof entry.productId === 'object'
      ? entry.productId?._id || ''
      : entry.productId || '',
  itemName:
    typeof entry.productId === 'object'
      ? entry.productId?.name || 'Unknown Item'
      : 'Unknown Item',
  transactionType: mapLedgerType(entry.type),
  reference: entry.referenceId || entry.note || '-',
  quantityChange:
    String(entry.direction || '').toLowerCase() === 'out'
      ? -Math.abs(Number(entry.quantity || 0))
      : Math.abs(Number(entry.quantity || 0)),
  runningBalance: Number(entry.balanceAfter || 0),
});

const mapBatchStatus = (batch: any): Batch['status'] => {
  const expiryDate = batch.expDate ? new Date(batch.expDate) : null;
  if (expiryDate && expiryDate.getTime() < Date.now()) {
    return 'Expired';
  }
  if (batch.status === 'Depleted') {
    return 'Depleted';
  }
  return 'Active';
};

const mapBatch = (batch: any): Batch => ({
  id: batch._id,
  batchNumber: batch.batchNo || '',
  itemId:
    typeof batch.itemId === 'object' ? batch.itemId?._id || '' : batch.itemId || '',
  itemName: batch.itemName || 'Unknown Item',
  quantity: Number(batch.quantity || 0),
  mfgDate: formatDate(batch.mfgDate),
  expiryDate: formatDate(batch.expDate),
  costPrice: Number(batch.unitCost || 0),
  status: mapBatchStatus(batch),
});

const mapSerialStatus = (status?: string): SerialNumber['status'] => {
  switch (status) {
    case 'Available':
    case 'Sold':
    case 'Defective':
      return status;
    case 'Returned':
    case 'Scrapped':
    case 'In Service':
      return 'Defective';
    default:
      return 'Reserved';
  }
};

const mapSerial = (serial: any): SerialNumber => ({
  id: serial._id,
  serialNumber: serial.serialNumber || '',
  itemId:
    typeof serial.itemId === 'object' ? serial.itemId?._id || '' : serial.itemId || '',
  itemName: serial.itemName || 'Unknown Item',
  status: mapSerialStatus(serial.status),
  currentLocation: serial.locationName || 'Unassigned',
});

const mapReservationStatus = (status?: string): StockReservation['status'] => {
  switch (status) {
    case 'Released':
      return 'Released';
    case 'Fulfilled':
      return 'Fulfilled';
    default:
      return 'Active';
  }
};

const mapReservation = (reservation: any): StockReservation => ({
  id: reservation._id,
  reference: reservation.ref || '',
  itemId:
    typeof reservation.itemId === 'object'
      ? reservation.itemId?._id || ''
      : reservation.itemId || '',
  itemName: reservation.item || reservation.itemName || 'Unknown Item',
  quantity: Number(reservation.qty || 0),
  reservedDate: formatDate(reservation.createdAt),
  expiryDate: formatDate(reservation.expires),
  status: mapReservationStatus(reservation.status),
});

const mapMethodFromBackend = (method?: string): 'FIFO' | 'LIFO' | 'Avg' => {
  if (method === 'Average Cost') return 'Avg';
  if (method === 'LIFO') return 'LIFO';
  return 'FIFO';
};

const mapMethodToBackend = (method: 'FIFO' | 'LIFO' | 'Avg') =>
  method === 'Avg' ? 'Average Cost' : method;

export const stockControlService = {
  getLedger: async (): Promise<StockLedgerEntry[]> => {
    try {
      const response = await api.get('/api/stock/ledger');
      return (response.data.data || []).map(mapLedgerEntry);
    } catch (err) {
      console.error('Error fetching ledger:', err);
      return [];
    }
  },

  createBatch: async (
    data: Omit<Batch, 'id' | 'status'> & { sku?: string }
  ): Promise<Batch> => {
    try {
      const organisationId = requireOrganisationId();
      const response = await api.post('/api/batch-lot', {
        organisationId,
        batchNo: data.batchNumber,
        itemType: 'product',
        itemId: data.itemId,
        itemName: data.itemName,
        sku: data.sku || '',
        quantity: Number(data.quantity || 0),
        unitCost: Number(data.costPrice || 0),
        mfgDate: data.mfgDate || null,
        expDate: data.expiryDate || null,
        status: 'Active',
      });
      return mapBatch(response.data.batchLOT);
    } catch (err: any) {
      console.error('Error creating batch:', err);
      throw new Error(err.response?.data?.message || 'Failed to create batch');
    }
  },

  getBatches: async (): Promise<Batch[]> => {
    try {
      const organisationId = requireOrganisationId();
      const response = await api.get('/api/batch-lot', {
        params: { organisationId, limit: 200 },
      });
      return (response.data.batchLOTS || []).map(mapBatch);
    } catch (err) {
      console.error('Error fetching batches:', err);
      return [];
    }
  },

  getExpiryTracking: async (): Promise<Batch[]> => {
    try {
      const response = await api.get('/api/stockcontrol/expiry-tracking', {
        params: { limit: 200 },
      });

      return (response.data.data || []).map((row: any) => ({
        id: row.id,
        batchNumber: row.batch || '',
        itemId: row.sourceItemId || '',
        itemName: row.item || 'Unknown Item',
        quantity: Number(row.qty || 0),
        mfgDate: '',
        expiryDate: formatDate(row.expiry),
        costPrice: 0,
        status: row.status === 'Expired' ? 'Expired' : 'Active',
      }));
    } catch (err) {
      console.error('Error fetching expiry tracking:', err);
      return [];
    }
  },

  addSerial: async (
    data: Omit<SerialNumber, 'id' | 'status'> & { sku?: string }
  ): Promise<SerialNumber> => {
    try {
      const response = await api.post('/api/serial-numbers', {
        serialNumber: data.serialNumber,
        itemId: data.itemId || null,
        itemName: data.itemName,
        sku: data.sku || '',
        itemType: 'product',
        locationName: data.currentLocation || '',
        status: 'Available',
      });
      return mapSerial(response.data);
    } catch (err: any) {
      console.error('Error adding serial:', err);
      throw new Error(err.response?.data?.message || 'Failed to register serial number');
    }
  },

  getSerials: async (): Promise<SerialNumber[]> => {
    try {
      const response = await api.get('/api/serial-numbers', {
        params: { limit: 200 },
      });
      return (response.data.data || []).map(mapSerial);
    } catch (err) {
      console.error('Error fetching serials:', err);
      return [];
    }
  },

  createReservation: async (
    data: Omit<StockReservation, 'id' | 'status'> & { sku?: string }
  ): Promise<StockReservation> => {
    try {
      const organisationId = requireOrganisationId();
      const response = await api.post('/api/stock-reservations', {
        organisationId,
        ref: data.reference,
        itemType: 'product',
        itemId: data.itemId,
        item: data.itemName,
        sku: data.sku || '',
        qty: Number(data.quantity || 0),
        status: 'Active',
        expires: data.expiryDate,
      });
      return mapReservation(response.data);
    } catch (err: any) {
      console.error('Error creating reservation:', err);
      throw new Error(err.response?.data?.message || 'Failed to create reservation');
    }
  },

  getReservations: async (): Promise<StockReservation[]> => {
    try {
      const response = await api.get('/api/stock-reservations');
      return (response.data.data || []).map(mapReservation);
    } catch (err) {
      console.error('Error fetching reservations:', err);
      return [];
    }
  },

  updateReservation: async (id: string, data: Partial<StockReservation>): Promise<void> => {
    try {
      const organisationId = requireOrganisationId();
      await api.put(`/api/stock-reservations/${id}`, {
        organisationId,
        ...data,
        // Map frontend field names to backend if necessary
        ref: data.reference,
        item: data.itemName,
        qty: data.quantity,
        expires: data.expiryDate,
      });
    } catch (err: any) {
      console.error('Error updating reservation:', err);
      throw new Error(err.response?.data?.message || 'Failed to update reservation');
    }
  },

  deleteReservation: async (id: string): Promise<void> => {
    try {
      const organisationId = requireOrganisationId();
      await api.delete(`/api/stock-reservations/${id}`, {
        params: { organisationId },
      });
    } catch (err: any) {
      console.error('Error deleting reservation:', err);
      throw new Error(err.response?.data?.message || 'Failed to delete reservation');
    }
  },

  releaseReservation: async (id: string): Promise<void> => {
    return stockControlService.updateReservation(id, { status: 'Released' });
  },

  getValuationMethod: async (): Promise<'FIFO' | 'LIFO' | 'Avg'> => {
    try {
      const organisationId = requireOrganisationId();
      const response = await api.get(`/valuation/method/${organisationId}`);
      return mapMethodFromBackend(response.data.setting?.method);
    } catch (err) {
      console.error('Error fetching valuation method:', err);
      return 'FIFO';
    }
  },

  setValuationMethod: async (method: 'FIFO' | 'LIFO' | 'Avg'): Promise<void> => {
    try {
      const organisationId = requireOrganisationId();
      await api.put(`/valuation/method/${organisationId}`, {
        organisationId,
        method: mapMethodToBackend(method),
      });
    } catch (err: any) {
      console.error('Error setting valuation method:', err);
      throw new Error(err.response?.data?.message || 'Failed to set valuation method');
    }
  },

  getValuationReport: async (
    options: {
      search?: string;
      category?: string;
      warehouse?: string;
      itemType?: string;
      includeZero?: boolean;
      valueMin?: number | string;
      valueMax?: number | string;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortDir?: 'asc' | 'desc';
    } = {}
  ): Promise<any> => {
    try {
      const organisationId = requireOrganisationId();
      const response = await api.get(`/valuation/item-wise/${organisationId}`, {
        params: {
          limit: options.limit || 500,
          page: options.page || 1,
          search: options.search || '',
          category: options.category || 'All',
          warehouse: options.warehouse || 'All',
          itemType: options.itemType || 'all',
          includeZero: options.includeZero === false ? 'false' : 'true',
          valueMin: options.valueMin ?? '',
          valueMax: options.valueMax ?? '',
          sortBy: options.sortBy || 'totalValue',
          sortDir: options.sortDir || 'desc',
        },
      });
      const method = mapMethodFromBackend(response.data.method);

      const items = (response.data.items || []).map((item: any) => ({
          itemId: item.id,
          itemName: item.name,
          sku: item.sku || '',
          category: item.category || '',
          stock: Number(item.qty || 0),
          method,
          unitValuation: Number(item.unitValue || item.unit || 0),
          totalValuation: Number(item.totalValue || 0),
          itemType: item.itemType || '',
          warehouseNames: item.warehouseNames || [],
          sourceModules: item.sourceModules || [],
      }));

      return Object.assign(items, {
        method,
        summary: response.data.summary || {},
        categories: response.data.categories || [],
        warehouses: response.data.warehouses || [],
        pagination: response.data.pagination || { page: 1, limit: 500, totalItems: 0, totalPages: 1 },
      });
    } catch (err) {
      console.error('Error fetching valuation report:', err);
      const empty: any[] = [];
      return Object.assign(empty, {
        method: 'FIFO',
        summary: {},
        categories: [],
        warehouses: [],
        pagination: { page: 1, limit: 500, totalItems: 0, totalPages: 1 },
      });
    }
  },

  getWarehouseValuation: async () => {
    try {
      const organisationId = requireOrganisationId();
      const response = await api.get(`/valuation/warehouse/${organisationId}`, {
        params: { includeZero: true },
      });

      return (response.data.warehouses || []).map((warehouse: any) => ({
        warehouseId: warehouse.warehouseId,
        warehouseName: warehouse.warehouseName,
        location: warehouse.location || '',
        valuation: Number(warehouse.valuation || 0),
        itemCount: Number(warehouse.itemCount || 0),
        quantity: Number(warehouse.quantity || 0),
        avgUnitValue: Number(warehouse.avgUnitValue || 0),
      }));
    } catch (err) {
      console.error('Error fetching warehouse valuation:', err);
      return [];
    }
  },

  getClosingStockHistory: async (): Promise<ClosingStockSnapshot[]> => {
    try {
      const organisationId = requireOrganisationId();
      const response = await api.get(`/valuation/closing-stock/${organisationId}`, {
        params: { limit: 24 },
      });

      return (response.data.reports || []).map((report: any) => ({
        id: String(report.id),
        date: formatDate(report.date),
        totalValue: Number(report.value || 0),
        itemCount: Number(report.skus || 0),
        method: mapMethodFromBackend(report.method === 'WAC' ? 'Average Cost' : report.method),
      }));
    } catch (err) {
      console.error('Error fetching closing stock history:', err);
      return [];
    }
  },

  recalculateCosts: async (): Promise<string> => {
    try {
      const organisationId = requireOrganisationId();
      const method = await stockControlService.getValuationMethod();
      const response = await api.post(`/valuation/recalculate/${organisationId}`, {
        organisationId,
        method: mapMethodToBackend(method),
        scope: 'all',
        scheduled: false,
      });

      return response.data.job?.createdAt
        ? new Date(response.data.job.createdAt).toLocaleString()
        : new Date().toLocaleString();
    } catch (err: any) {
      console.error('Error recalculating costs:', err);
      throw new Error(err.response?.data?.message || 'Failed to recalculate costs');
    }
  },

  getCOGSData: async (): Promise<any[]> => {
    try {
      const organisationId = requireOrganisationId();
      const response = await api.get('/material-movements', {
        params: { organisationId, movementType: 'outbound' }
      });

      return (response.data.data || []).map((m: any) => ({
        id: m._id,
        date: m.movementDate || m.createdAt,
        itemName: m.materialName,
        quantity: m.quantity,
        unit: m.unit,
        unitCost: m.unitCost || 0,
        totalCost: m.totalCost || 0,
        reference: m.referenceNumber,
        destination: m.destination
      }));
    } catch (err) {
      console.error('Error fetching COGS data:', err);
      return [];
    }
  }
};
