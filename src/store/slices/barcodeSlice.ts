import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '@/services/api';
import { InventoryItem, ScanLog, LabelTemplate } from '@/types';

interface BarcodeState {
  scanHistory: ScanLog[];
  lastScannedItem: InventoryItem | null;
  loading: boolean;
  error: string | null;
  templates: LabelTemplate[];
}

const initialState: BarcodeState = {
  scanHistory: [],
  lastScannedItem: null,
  loading: false,
  error: null,
  templates: [],
};

export const fetchScanHistory = createAsyncThunk(
  'barcode/fetchScanHistory',
  async (organisationId: string) => {
    const response = await api.get(`/barcode-scans/fetch`, {
      params: { organisationId }
    });
    return response.data.data.map((i: any) => ({
      id: i._id,
      scannedCode: i.code,
      itemId: i.item,
      itemName: i.item,
      actionType: i.action,
      status: i.status === 'success' ? 'Success' : 'error',
      timestamp: new Date(i.createdAt).toLocaleTimeString(),
      date: new Date(i.createdAt).toISOString().split('T')[0]
    }));
  }
);

export const performScan = createAsyncThunk(
  'barcode/performScan',
  async ({ code, organisationId, actionType, locationId }: { code: string; organisationId: string; actionType: string; locationId?: string }) => {
    const response = await api.post('/barcode-scans/process', {
      code,
      organisationId,
      action: actionType,
      location: locationId,
    });
    return response.data;
  }
);

export const fetchLabelTemplates = createAsyncThunk(
  'barcode/fetchLabelTemplates',
  async () => {
    // This could be from backend or local static
    const templates: LabelTemplate[] = [
      { id: 't1', name: 'Standard Product (2x1)', width: '2in', height: '1in', type: 'Product' },
      { id: 't2', name: 'Shipping Label (4x6)', width: '4in', height: '6in', type: 'Shipping' },
      { id: 't3', name: 'Bin/Rack Label (4x2)', width: '4in', height: '2in', type: 'Rack' },
      { id: 't4', name: 'Small QR (1x1)', width: '1in', height: '1in', type: 'Product' }
    ];
    return templates;
  }
);

const barcodeSlice = createSlice({
  name: 'barcode',
  initialState,
  reducers: {
    clearLastScannedItem: (state) => {
      state.lastScannedItem = null;
    },
    addScanToHistory: (state, action: PayloadAction<ScanLog>) => {
      state.scanHistory = [action.payload, ...state.scanHistory];
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchScanHistory.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchScanHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.scanHistory = action.payload;
      })
      .addCase(fetchScanHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch scan history';
      })
      .addCase(performScan.fulfilled, (state, action) => {
        const rawItem = action.payload.data?.item;
        if (rawItem) {
           const totalStock = (rawItem.stocks || []).reduce((acc: number, s: any) => acc + (s.quantity || 0), 0);
           state.lastScannedItem = {
               ...rawItem,
               id: rawItem._id,
               stock: totalStock,
               salePrice: rawItem.salesPrice || rawItem.salePrice || 0
           };
        } else {
           state.lastScannedItem = null;
        }
        // The history is usually updated by fetchScanHistory or manually
      })
      .addCase(fetchLabelTemplates.fulfilled, (state, action) => {
        state.templates = action.payload;
      });
  },
});

export const { clearLastScannedItem, addScanToHistory } = barcodeSlice.actions;
export default barcodeSlice.reducer;
