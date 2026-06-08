import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { productService } from '@/services/productService';
import { InventoryItem } from '@/types';

interface InventoryState {
  items: InventoryItem[];
  loading: boolean;
  hasLoaded: boolean;
  error: string | null;
}

const initialState: InventoryState = {
  items: [],
  loading: false,
  hasLoaded: false,
  error: null,
};

export const fetchItems = createAsyncThunk(
  'inventory/fetchItems',
  async (filters: Record<string, any> | void, { rejectWithValue }) => {
    try {
      return await productService.getAllItems(filters || undefined);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch items');
    }
  }
);

export const updateInventoryItem = createAsyncThunk(
  'inventory/updateItem',
  async ({ id, updates }: { id: string; updates: any }, { rejectWithValue }) => {
    try {
      return await productService.updateItem(id, updates);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update item');
    }
  }
);

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchItems.fulfilled, (state, action) => {
        state.loading = false;
        state.hasLoaded = true;
        state.items = action.payload;
      })
      .addCase(fetchItems.rejected, (state, action) => {
        state.loading = false;
        state.hasLoaded = true;
        state.error = action.payload as string;
      })
      .addCase(updateInventoryItem.fulfilled, (state, action) => {
        const index = state.items.findIndex(i => i.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = { ...state.items[index], ...action.payload };
        }
      });
  },
});

export default inventorySlice.reducer;
