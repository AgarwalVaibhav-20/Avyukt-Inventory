import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { productService } from '@/services/productService';
import { stockControlService } from '@/services/stockControlService';
import { Batch, InventoryItem, SerialNumber, StockLedgerEntry, StockReservation } from '@/types';

interface StockControlState {
  items: InventoryItem[];
  ledger: StockLedgerEntry[];
  batches: Batch[];
  expiryBatches: Batch[];
  serials: SerialNumber[];
  reservations: StockReservation[];
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
}

const initialState: StockControlState = {
  items: [],
  ledger: [],
  batches: [],
  expiryBatches: [],
  serials: [],
  reservations: [],
  loading: false,
  actionLoading: false,
  error: null,
};

const fetchAllStockControlData = async () => {
  const [items, ledger, batches, expiryBatches, serials, reservations] = await Promise.all([
    productService.getAllItems(),
    stockControlService.getLedger(),
    stockControlService.getBatches(),
    stockControlService.getExpiryTracking(),
    stockControlService.getSerials(),
    stockControlService.getReservations(),
  ]);

  return {
    items,
    ledger,
    batches,
    expiryBatches,
    serials,
    reservations,
  };
};

export const fetchStockControlData = createAsyncThunk(
  'stockControl/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchAllStockControlData();
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load stock control data');
    }
  }
);

export const createBatchRecord = createAsyncThunk(
  'stockControl/createBatch',
  async (payload: Omit<Batch, 'id' | 'status'> & { sku?: string }, { rejectWithValue }) => {
    try {
      await stockControlService.createBatch(payload);
      return await fetchAllStockControlData();
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create batch');
    }
  }
);

export const createSerialRecord = createAsyncThunk(
  'stockControl/createSerial',
  async (
    payload: Omit<SerialNumber, 'id' | 'status'> & { sku?: string },
    { rejectWithValue }
  ) => {
    try {
      await stockControlService.addSerial(payload);
      return await fetchAllStockControlData();
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to register serial number');
    }
  }
);

export const createReservationRecord = createAsyncThunk(
  'stockControl/createReservation',
  async (
    payload: Omit<StockReservation, 'id' | 'status'> & { sku?: string },
    { rejectWithValue }
  ) => {
    try {
      await stockControlService.createReservation(payload);
      return await fetchAllStockControlData();
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create reservation');
    }
  }
);

export const releaseReservationRecord = createAsyncThunk(
  'stockControl/releaseReservation',
  async (id: string, { rejectWithValue }) => {
    try {
      await stockControlService.releaseReservation(id);
      return await fetchAllStockControlData();
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to release reservation');
    }
  }
);

export const updateReservationRecord = createAsyncThunk(
  'stockControl/updateReservation',
  async ({ id, data }: { id: string; data: Partial<StockReservation> }, { rejectWithValue }) => {
    try {
      await stockControlService.updateReservation(id, data);
      return await fetchAllStockControlData();
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update reservation');
    }
  }
);

export const deleteReservationRecord = createAsyncThunk(
  'stockControl/deleteReservation',
  async (id: string, { rejectWithValue }) => {
    try {
      await stockControlService.deleteReservation(id);
      return await fetchAllStockControlData();
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete reservation');
    }
  }
);

export const updateReorderLevelRecord = createAsyncThunk(
  'stockControl/updateReorderLevel',
  async (payload: { id: string; reorderLevel: number }, { rejectWithValue }) => {
    try {
      await productService.updateReorderLevel(payload.id, payload.reorderLevel);
      return await fetchAllStockControlData();
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update reorder level');
    }
  }
);

const applyPayload = (state: StockControlState, payload: any) => {
  state.items = payload.items;
  state.ledger = payload.ledger;
  state.batches = payload.batches;
  state.expiryBatches = payload.expiryBatches;
  state.serials = payload.serials;
  state.reservations = payload.reservations;
};

const stockControlSlice = createSlice({
  name: 'stockControl',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchStockControlData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStockControlData.fulfilled, (state, action) => {
        state.loading = false;
        applyPayload(state, action.payload);
      })
      .addCase(fetchStockControlData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    [
      createBatchRecord,
      createSerialRecord,
      createReservationRecord,
      updateReservationRecord,
      deleteReservationRecord,
      releaseReservationRecord,
      updateReorderLevelRecord,
    ].forEach((thunk) => {
      builder
        .addCase(thunk.pending, (state) => {
          state.actionLoading = true;
          state.error = null;
        })
        .addCase(thunk.fulfilled, (state, action) => {
          state.actionLoading = false;
          applyPayload(state, action.payload);
        })
        .addCase(thunk.rejected, (state, action) => {
          state.actionLoading = false;
          state.error = action.payload as string;
        });
    });
  },
});

export default stockControlSlice.reducer;
