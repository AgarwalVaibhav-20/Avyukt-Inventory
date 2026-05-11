import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { auditService } from '@/services/auditService';
import { AuditSession, AuditLog } from '@/types';
import { reportService } from '@/services/reportService';

interface AuditState {
  sessions: AuditSession[];
  logs: AuditLog[];
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
}

const initialState: AuditState = {
  sessions: [],
  logs: [],
  loading: false,
  actionLoading: false,
  error: null,
};

export const fetchAuditSessions = createAsyncThunk(
  'audit/fetchSessions',
  async (_, { rejectWithValue }) => {
    try {
      return await auditService.getAuditSessions();
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to load audit sessions');
    }
  }
);

export const fetchAuditLogs = createAsyncThunk(
  'audit/fetchLogs',
  async (_, { rejectWithValue }) => {
    try {
      return await reportService.getAuditLogs();
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to load audit logs');
    }
  }
);

export const createAuditSession = createAsyncThunk(
  'audit/createSession',
  async (payload: { type: 'Full' | 'Cycle'; warehouseId: string; categoryFilter?: string }, { dispatch, rejectWithValue }) => {
    try {
      await auditService.createAuditSession(payload.type, payload.warehouseId, payload.categoryFilter);
      dispatch(fetchAuditSessions());
      return true;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to create session');
    }
  }
);

export const startAuditSession = createAsyncThunk(
  'audit/startSession',
  async (id: string, { dispatch, rejectWithValue }) => {
    try {
      await auditService.startAudit(id);
      dispatch(fetchAuditSessions());
      return true;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to start session');
    }
  }
);

export const finalizeAuditSession = createAsyncThunk(
  'audit/finalizeSession',
  async (id: string, { dispatch, rejectWithValue }) => {
    try {
      await auditService.finalizeAudit(id);
      dispatch(fetchAuditSessions());
      return true;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to finalize session');
    }
  }
);

const auditSlice = createSlice({
  name: 'audit',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Sessions
      .addCase(fetchAuditSessions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAuditSessions.fulfilled, (state, action) => {
        state.loading = false;
        state.sessions = action.payload;
      })
      .addCase(fetchAuditSessions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Logs
      .addCase(fetchAuditLogs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAuditLogs.fulfilled, (state, action) => {
        state.loading = false;
        state.logs = action.payload;
      })
      .addCase(fetchAuditLogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Action handlers
      .addMatcher(
        (action) => action.type.startsWith('audit/') && action.type.endsWith('/pending') && !action.type.includes('fetch'),
        (state) => {
          state.actionLoading = true;
        }
      )
      .addMatcher(
        (action) => action.type.startsWith('audit/') && (action.type.endsWith('/fulfilled') || action.type.endsWith('/rejected')) && !action.type.includes('fetch'),
        (state) => {
          state.actionLoading = false;
        }
      );
  },
});

export default auditSlice.reducer;
