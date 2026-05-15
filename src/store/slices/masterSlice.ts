import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/services/api';

interface MasterData {
  _id: string;
  type: string;
  name?: string;
  code?: string;
  description?: string;
  manufacturer?: string;
  hsnCode?: number;
  taxPercentage?: number;
}

interface MasterState {
  data: Record<string, MasterData[]>; // type -> items[]
  loading: boolean;
  error: string | null;
}

const initialState: MasterState = {
  data: {},
  loading: false,
  error: null,
};

export const fetchMasterData = createAsyncThunk(
  'master/fetchAll',
  async ({ type, organisationId, page = 1, limit = 5000, search = '', filters = {} }: { type: string; organisationId: string; page?: number; limit?: number; search?: string; filters?: any }) => {
    const response = await api.get(`/inventory/${type}`, { 
      params: { 
        organisationId,
        page,
        limit,
        search,
        filters: JSON.stringify(filters)
      } 
    });
    return { type, items: response.data.items || [] };
  }
);

export const addMasterData = createAsyncThunk(
  'master/add',
  async (payload: any) => {
    const response = await api.post('/inventory', payload);
    return response.data;
  }
);

export const deleteMasterData = createAsyncThunk(
  'master/delete',
  async ({ id, organisationId, type }: { id: string; organisationId: string; type: string }) => {
    await api.delete(`/inventory/${id}`, { params: { organisationId } });
    return { id, type };
  }
);

export const updateMasterData = createAsyncThunk(
  'master/update',
  async ({ id, payload }: { id: string; payload: any }) => {
    const response = await api.put(`/inventory/${id}`, payload);
    return response.data;
  }
);

const masterSlice = createSlice({
  name: 'master',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMasterData.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMasterData.fulfilled, (state, action) => {
        state.loading = false;
        state.data[action.payload.type] = action.payload.items;
      })
      .addCase(fetchMasterData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch';
      })
      .addCase(addMasterData.fulfilled, (state, action) => {
        const item = action.payload.data || action.payload;
        const type = item.type;
        if (!state.data[type]) state.data[type] = [];
        state.data[type].unshift(item);
      })
      .addCase(updateMasterData.fulfilled, (state, action) => {
        const item = action.payload.data || action.payload;
        const type = item.type;
        if (state.data[type]) {
          const index = state.data[type].findIndex(i => i._id === item._id);
          if (index !== -1) {
            state.data[type][index] = item;
          }
        }
      })
      .addCase(deleteMasterData.fulfilled, (state, action) => {
        const { id, type } = action.payload;
        if (state.data[type]) {
          state.data[type] = state.data[type].filter(item => item._id !== id);
        }
      });
  },
});

export default masterSlice.reducer;
