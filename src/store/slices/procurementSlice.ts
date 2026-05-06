import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { procurementService } from '@/services/procurementService';
import { PurchaseOrder, GRN, Vendor, PutAwayTask, PurchaseReturn } from '@/types';

interface ProcurementState {
  pos: PurchaseOrder[];
  grns: GRN[];
  vendors: Vendor[];
  qcQueue: GRN[];
  putAwayTasks: PutAwayTask[];
  returns: PurchaseReturn[];
  loading: boolean;
  error: string | null;
}

const initialState: ProcurementState = {
  pos: [],
  grns: [],
  vendors: [],
  qcQueue: [],
  putAwayTasks: [],
  returns: [],
  loading: false,
  error: null,
};

export const fetchPOs = createAsyncThunk('procurement/fetchPOs', async () => {
  return await procurementService.getAllPOs();
});

export const fetchGRNs = createAsyncThunk('procurement/fetchGRNs', async () => {
  return await procurementService.getAllGRNs();
});

export const fetchVendors = createAsyncThunk('procurement/fetchVendors', async () => {
  return await procurementService.getVendors();
});

export const fetchQCQueue = createAsyncThunk('procurement/fetchQCQueue', async () => {
  return await procurementService.getQualityQueue();
});

export const fetchPutAwayTasks = createAsyncThunk('procurement/fetchPutAwayTasks', async () => {
  return await procurementService.getPutAwayTasks();
});

export const fetchReturns = createAsyncThunk('procurement/fetchReturns', async () => {
  return await procurementService.getPurchaseReturns();
});

export const createVendor = createAsyncThunk('procurement/createVendor', async (data: Omit<Vendor, 'id' | 'rating'>) => {
  return await procurementService.addVendor(data);
});

export const updateVendor = createAsyncThunk('procurement/updateVendor', async ({ id, updates }: { id: string, updates: Partial<Vendor> }) => {
  // Since we don't have a specific updateVendor in procurementService yet, we'll assume it exists or use a generic one.
  // Actually, let's add it to procurementService if not present.
  await procurementService.updateVendor(id, updates);
  return { id, updates };
});

export const deleteVendor = createAsyncThunk('procurement/deleteVendor', async (id: string) => {
  await procurementService.deleteVendor(id);
  return id;
});

const procurementSlice = createSlice({
  name: 'procurement',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPOs.pending, (state) => { state.loading = true; })
      .addCase(fetchPOs.fulfilled, (state, action) => {
        state.loading = false;
        state.pos = action.payload;
      })
      .addCase(fetchPOs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch POs';
      })
      .addCase(fetchGRNs.fulfilled, (state, action) => {
        state.grns = action.payload;
      })
      .addCase(fetchVendors.fulfilled, (state, action) => {
        state.vendors = action.payload;
      })
      .addCase(createVendor.fulfilled, (state, action) => {
        state.vendors.unshift(action.payload);
      })
      .addCase(updateVendor.fulfilled, (state, action) => {
        const index = state.vendors.findIndex(v => v.id === action.payload.id);
        if (index !== -1) {
          state.vendors[index] = { ...state.vendors[index], ...action.payload.updates };
        }
      })
      .addCase(deleteVendor.fulfilled, (state, action) => {
        state.vendors = state.vendors.filter(v => v.id !== action.payload);
      })
      .addCase(fetchQCQueue.fulfilled, (state, action) => {
        state.qcQueue = action.payload;
      })
      .addCase(fetchPutAwayTasks.fulfilled, (state, action) => {
        state.putAwayTasks = action.payload;
      })
      .addCase(fetchReturns.fulfilled, (state, action) => {
        state.returns = action.payload;
      });
  },
});

export default procurementSlice.reducer;
