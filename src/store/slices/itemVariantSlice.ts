import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/services/api';

interface ItemVariant {
  _id: string;
  productId: any;
  variantName: string;
  sku: string;
  barcode: string;
  unit?: string;
  attributes: { name: string; value: string }[];
  price: number;
  stocks: { warehouseId: string; quantity: number }[];
}

interface ItemVariantState {
  variants: ItemVariant[];
  loading: boolean;
  error: string | null;
}

const initialState: ItemVariantState = {
  variants: [],
  loading: false,
  error: null,
};

export const fetchVariants = createAsyncThunk(
  'itemVariants/fetchAll',
  async (productId?: string) => {
    const response = await api.get('/inventory/item-variant', { params: { productId } });
    return response.data.data;
  }
);

export const createVariant = createAsyncThunk(
  'itemVariants/create',
  async (data: any) => {
    const response = await api.post('/inventory/item-variant', data);
    return response.data.data;
  }
);

export const updateVariant = createAsyncThunk(
  'itemVariants/update',
  async ({ id, data }: { id: string; data: any }) => {
    const response = await api.put(`/inventory/item-variant/${id}`, data);
    return response.data.data;
  }
);

export const deleteVariant = createAsyncThunk(
  'itemVariants/delete',
  async (id: string) => {
    await api.delete(`/inventory/item-variant/${id}`);
    return id;
  }
);

const itemVariantSlice = createSlice({
  name: 'itemVariants',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchVariants.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchVariants.fulfilled, (state, action) => {
        state.loading = false;
        state.variants = action.payload;
      })
      .addCase(fetchVariants.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch';
      })
      .addCase(createVariant.fulfilled, (state, action) => {
        state.variants.unshift(action.payload);
      })
      .addCase(updateVariant.fulfilled, (state, action) => {
        const index = state.variants.findIndex(v => v._id === action.payload._id);
        if (index !== -1) {
          state.variants[index] = action.payload;
        }
      })
      .addCase(deleteVariant.fulfilled, (state, action) => {
        state.variants = state.variants.filter(v => v._id !== action.payload);
      });
  },
});

export default itemVariantSlice.reducer;
