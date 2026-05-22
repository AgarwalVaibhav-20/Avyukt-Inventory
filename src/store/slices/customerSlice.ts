import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  customerService,
  type CustomerInput,
  type CustomerRecord,
} from "@/services/customerService";

interface CustomerState {
  customers: CustomerRecord[];
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
}

const initialState: CustomerState = {
  customers: [],
  loading: false,
  actionLoading: false,
  error: null,
};

export const fetchCustomers = createAsyncThunk(
  "customers/fetchCustomers",
  async (_, { rejectWithValue }) => {
    try {
      return await customerService.getCustomers();
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || "Failed to fetch customers");
    }
  }
);

export const createCustomer = createAsyncThunk(
  "customers/createCustomer",
  async (payload: CustomerInput, { rejectWithValue }) => {
    try {
      return await customerService.createCustomer(payload);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || "Failed to create customer");
    }
  }
);

export const deleteCustomer = createAsyncThunk(
  "customers/deleteCustomer",
  async (id: string, { rejectWithValue }) => {
    try {
      await customerService.deleteCustomer(id);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || "Failed to delete customer");
    }
  }
);

const customerSlice = createSlice({
  name: "customers",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.customers = action.payload;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = String(action.payload || action.error.message || "Failed to fetch customers");
      })
      .addCase(createCustomer.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createCustomer.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.customers.unshift(action.payload);
      })
      .addCase(createCustomer.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = String(action.payload || action.error.message || "Failed to create customer");
      })
      .addCase(deleteCustomer.fulfilled, (state, action) => {
        state.customers = state.customers.filter((customer) => customer.id !== action.payload);
      });
  },
});

export default customerSlice.reducer;
