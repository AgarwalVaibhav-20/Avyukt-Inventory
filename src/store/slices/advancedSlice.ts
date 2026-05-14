import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

interface AdvancedState {
  forecasts: any[];
  reorderSuggestions: any[];
  companies: any[];
  currencies: any[];
  iotDevices: any[];
  complianceStatus: any[];
  summary: {
    activeEntities: number;
    totalWarehouses: number;
    totalItems: number;
    currencyMix: number;
  } | null;
  forecastSummary: any | null;
  aiSummary: any | null;
  currencySummary: any | null;
  iotSummary: any | null;
  complianceSummary: any | null;
  pagination: Record<string, { total: number; page: number; limit: number }>;
  loading: boolean;
  error: string | null;
}

const initialState: AdvancedState = {
  forecasts: [],
  reorderSuggestions: [],
  companies: [],
  currencies: [],
  iotDevices: [],
  complianceStatus: [],
  summary: null,
  forecastSummary: null,
  aiSummary: null,
  currencySummary: null,
  iotSummary: null,
  complianceSummary: null,
  pagination: {
    forecasts: { total: 0, page: 1, limit: 10 },
    reorderSuggestions: { total: 0, page: 1, limit: 10 },
    companies: { total: 0, page: 1, limit: 10 },
    currencies: { total: 0, page: 1, limit: 10 },
    iotDevices: { total: 0, page: 1, limit: 10 },
    complianceStatus: { total: 0, page: 1, limit: 10 },
  },
  loading: false,
  error: null,
};

// Async Thunks
export const fetchForecasts = createAsyncThunk(
  "advanced/fetchForecasts",
  async ({ page, limit, search, filter }: { page: number; limit: number; search?: string; filter?: string }) => {
    const response = await api.get("/api/advanced/forecasts", { params: { page, limit, search, filter } });
    return response.data;
  }
);

export const fetchReorderSuggestions = createAsyncThunk(
  "advanced/fetchReorderSuggestions",
  async ({ page, limit, search, filter }: { page: number; limit: number; search?: string; filter?: string }) => {
    const response = await api.get("/api/advanced/reorder-suggestions", { params: { page, limit, search, filter } });
    return response.data;
  }
);

export const fetchCompanies = createAsyncThunk(
  "advanced/fetchCompanies",
  async ({ page, limit, search, filter }: { page: number; limit: number; search?: string; filter?: string }) => {
    const response = await api.get("/api/advanced/companies", { params: { page, limit, search, filter } });
    return response.data;
  }
);

export const fetchCurrencies = createAsyncThunk(
  "advanced/fetchCurrencies",
  async ({ page, limit, search, filter }: { page: number; limit: number; search?: string; filter?: string }) => {
    const response = await api.get("/api/advanced/currencies", { params: { page, limit, search, filter } });
    return response.data;
  }
);

export const fetchIotDevices = createAsyncThunk(
  "advanced/fetchIotDevices",
  async ({ page, limit, search, filter }: { page: number; limit: number; search?: string; filter?: string }) => {
    const response = await api.get("/api/advanced/iot-devices", { params: { page, limit, search, filter } });
    return response.data;
  }
);

export const fetchComplianceStatus = createAsyncThunk(
  "advanced/fetchComplianceStatus",
  async ({ page, limit, search, filter }: { page: number; limit: number; search?: string; filter?: string }) => {
    const response = await api.get("/api/advanced/compliance-status", { params: { page, limit, search, filter } });
    return response.data;
  }
);

const advancedSlice = createSlice({
  name: 'advanced',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchForecasts.fulfilled, (state, action) => {
        state.loading = false;
        state.forecasts = action.payload.data;
        state.forecastSummary = action.payload.summary;
        state.pagination.forecasts = action.payload.pagination;
      })
      .addCase(fetchReorderSuggestions.fulfilled, (state, action) => {
        state.reorderSuggestions = action.payload.data;
        state.aiSummary = action.payload.summary;
        state.pagination.reorderSuggestions = action.payload.pagination;
      })
      .addCase(fetchCompanies.fulfilled, (state, action) => {
        state.companies = action.payload.data;
        state.summary = action.payload.summary;
        state.pagination.companies = action.payload.pagination;
      })
      .addCase(fetchCurrencies.fulfilled, (state, action) => {
        state.currencies = action.payload.data;
        state.currencySummary = action.payload.summary;
        state.pagination.currencies = action.payload.pagination;
      })
      .addCase(fetchIotDevices.fulfilled, (state, action) => {
        state.iotDevices = action.payload.data;
        state.iotSummary = action.payload.summary;
        state.pagination.iotDevices = action.payload.pagination;
      })
      .addCase(fetchComplianceStatus.fulfilled, (state, action) => {
        state.complianceStatus = action.payload.data;
        state.complianceSummary = action.payload.summary;
        state.pagination.complianceStatus = action.payload.pagination;
      });
  },
});

export default advancedSlice.reducer;
