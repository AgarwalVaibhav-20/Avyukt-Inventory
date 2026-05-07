import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { procurementService } from '@/services/procurementService';
import { PurchaseOrder, GRN, Vendor, PutAwayTask, PurchaseReturn, PurchaseRequisition, PurchaseInvoice } from '@/types';

interface ProcurementState {
  prs: PurchaseRequisition[];
  pos: PurchaseOrder[];
  grns: GRN[];
  invoices: PurchaseInvoice[];
  vendors: Vendor[];
  qcQueue: GRN[];
  putAwayTasks: PutAwayTask[];
  returns: PurchaseReturn[];
  loading: boolean;
  error: string | null;
}

const initialState: ProcurementState = {
  prs: [],
  pos: [],
  grns: [],
  invoices: [],
  vendors: [],
  qcQueue: [],
  putAwayTasks: [],
  returns: [],
  loading: false,
  error: null,
};

export const fetchPRs = createAsyncThunk('procurement/fetchPRs', async () => {
  return await procurementService.getAllPRs();
});

export const fetchPOs = createAsyncThunk('procurement/fetchPOs', async () => {
  return await procurementService.getAllPOs();
});

export const fetchGRNs = createAsyncThunk('procurement/fetchGRNs', async () => {
  return await procurementService.getAllGRNs();
});

export const fetchInvoices = createAsyncThunk('procurement/fetchInvoices', async () => {
  return await procurementService.getAllPurchaseInvoices();
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
      .addCase(fetchPRs.pending, (state) => { state.loading = true; })
      .addCase(fetchPRs.fulfilled, (state, action) => {
        state.loading = false;
        state.prs = action.payload;
      })
      .addCase(fetchPRs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch PRs';
      })
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
      .addCase(fetchInvoices.fulfilled, (state, action) => {
        state.invoices = action.payload;
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
