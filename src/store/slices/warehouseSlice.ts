import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { warehouseService } from '@/services/warehouseService';
import { Warehouse } from '@/types';
import { authService } from '@/services/authService';

interface WarehouseState {
  warehouses: Warehouse[];
  capacityStats: any[];
  loading: boolean;
  error: string | null;
}

const initialState: WarehouseState = {
  warehouses: [],
  capacityStats: [],
  loading: false,
  error: null,
};

export const fetchWarehouses = createAsyncThunk(
  'warehouse/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const user = authService.getCurrentUser();
      const orgId = user?.organisationId;
      return await warehouseService.getAllWarehouses(orgId);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch warehouses');
    }
  }
);

export const fetchCapacityStats = createAsyncThunk(
  'warehouse/fetchCapacityStats',
  async (_, { rejectWithValue }) => {
    try {
      return await warehouseService.getWarehouseCapacityStats();
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch capacity stats');
    }
  }
);

export const addWarehouse = createAsyncThunk(
  'warehouse/add',
  async (data: Omit<Warehouse, 'id'>, { rejectWithValue }) => {
    try {
      return await warehouseService.addWarehouse(data);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to add warehouse');
    }
  }
);

export const removeWarehouse = createAsyncThunk(
  'warehouse/remove',
  async (id: string, { rejectWithValue }) => {
    try {
      await warehouseService.deleteWarehouse(id);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete warehouse');
    }
  }
);

const warehouseSlice = createSlice({
  name: 'warehouse',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchWarehouses.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchWarehouses.fulfilled, (state, action) => {
        state.loading = false;
        state.warehouses = action.payload;
      })
      .addCase(fetchWarehouses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchCapacityStats.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCapacityStats.fulfilled, (state, action) => {
        state.loading = false;
        state.capacityStats = action.payload;
      })
      .addCase(fetchCapacityStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(addWarehouse.fulfilled, (state, action) => {
        state.warehouses.unshift(action.payload);
      })
      .addCase(removeWarehouse.fulfilled, (state, action) => {
        state.warehouses = state.warehouses.filter(w => w.id !== action.payload);
      });
  },
});

export default warehouseSlice.reducer;
