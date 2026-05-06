import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { productService } from '@/services/productService';
import { InventoryItem } from '@/types';

interface InventoryState {
  items: InventoryItem[];
  loading: boolean;
  error: string | null;
}

const initialState: InventoryState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchItems = createAsyncThunk(
  'inventory/fetchItems',
  async (_, { rejectWithValue }) => {
    try {
      return await productService.getAllItems();
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
      })
      .addCase(fetchItems.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchItems.rejected, (state, action) => {
        state.loading = false;
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
