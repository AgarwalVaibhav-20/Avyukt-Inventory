import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '@/services/authService';

interface AuthState {
  user: any | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  profileLoading: boolean;
  updateLoading: boolean;
  error: string | null;
  // Delegated session fields
  isDelegatedSession: boolean;
  originalUser: any | null;
  originalToken: string | null;
  delegatedAccessRequestId: string | null;
  delegatedPermissionLevel: 'view' | 'edit' | 'delete' | null;
}

const initialState: AuthState = {
  user: authService.getCurrentUser(),
  token: authService.getToken(),
  isAuthenticated: !!authService.getToken(),
  loading: false,
  profileLoading: false,
  updateLoading: false,
  error: null,
  isDelegatedSession: false,
  originalUser: null,
  originalToken: null,
  delegatedAccessRequestId: null,
  delegatedPermissionLevel: null,
};

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: any, { rejectWithValue }) => {
    try {
      const data = await authService.login(credentials);
      return data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.response?.data?.error || 'Login failed'
      );
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData: any, { rejectWithValue }) => {
    try {
      const data = await authService.register(userData);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Registration failed');
    }
  }
);

export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async (otpData: { email: string; otp: string }, { rejectWithValue }) => {
    try {
      const data = await authService.verifyOtp(otpData);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Verification failed');
    }
  }
);

export const resendOtp = createAsyncThunk(
  'auth/resendOtp',
  async ({ email }: { email: string }, { rejectWithValue }) => {
    try {
      const data = await authService.resendOtp(email);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to resend OTP');
    }
  }
);

export const fetchProfile = createAsyncThunk(
  'auth/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const data = await authService.getProfile();
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch profile');
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData: any, { rejectWithValue }) => {
    try {
      const data = await authService.updateProfile(profileData);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update profile');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      authService.logout();
      try { localStorage.removeItem('originalToken'); } catch {}
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isDelegatedSession = false;
      state.originalUser = null;
      state.originalToken = null;
      state.delegatedAccessRequestId = null;
      state.delegatedPermissionLevel = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    startDelegatedSession: (state, action) => {
      const { delegatedUser, token, requestId, permissionLevel } = action.payload;

      // Store original user/token if not already in a delegated session
      if (!state.isDelegatedSession) {
        state.originalUser = { ...state.user };
        state.originalToken = state.token;
        try {
          if (state.token) localStorage.setItem('originalToken', state.token);
        } catch {}
      }

      // Switch to delegated user (and token, if provided)
      state.user = delegatedUser;
      if (token) {
        state.token = token;
        try { localStorage.setItem('token', token); } catch {}
      }
      state.isDelegatedSession = true;
      state.delegatedAccessRequestId = requestId || null;
      state.delegatedPermissionLevel = permissionLevel || null;
    },
    endDelegatedSession: (state) => {
      // Restore original user
      if (state.originalUser) {
        state.user = state.originalUser;
      }

      // Restore original token (from state or fallback to localStorage)
      let restoredToken: string | null = state.originalToken;
      if (!restoredToken) {
        try { restoredToken = localStorage.getItem('originalToken'); } catch { restoredToken = null; }
      }
      if (restoredToken) {
        state.token = restoredToken;
        try { localStorage.setItem('token', restoredToken); } catch {}
      }
      try { localStorage.removeItem('originalToken'); } catch {}

      state.isDelegatedSession = false;
      state.originalUser = null;
      state.originalToken = null;
      state.delegatedAccessRequestId = null;
      state.delegatedPermissionLevel = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isDelegatedSession = false;
        state.originalUser = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        // Depending on backend, we might auto-login or just stay on signup
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(verifyOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.isDelegatedSession = false;
        state.originalUser = null;
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(resendOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resendOtp.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(resendOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchProfile.pending, (state) => {
        state.profileLoading = true;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
<<<<<<< Updated upstream
        state.profileLoading = false;
=======
        state.loading = false;
        // In a delegated session the profile call runs under the delegated
        // token, so action.payload.user is the *delegated* user, not the
        // original. Update state.user (the active identity) but never
        // overwrite originalUser — that must remain the admin we'll
        // return to via endDelegatedSession.
>>>>>>> Stashed changes
        state.user = action.payload.user;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.profileLoading = false;
        state.error = action.payload as string;
      })
      .addCase(updateProfile.pending, (state) => {
        state.updateLoading = true;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.updateLoading = false;
        state.user = action.payload.user;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.updateLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { logout, clearError, startDelegatedSession, endDelegatedSession } = authSlice.actions;
export default authSlice.reducer;
