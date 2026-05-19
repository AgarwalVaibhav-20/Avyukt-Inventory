import api from './api';

const parseJwtPayload = (token: string) => {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(normalized);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

export const authService = {
  login: async (credentials: any) => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      if (response.data.user.organisationId) {
        localStorage.setItem('organisationId', response.data.user.organisationId);
      }
    }
    return response.data;
  },

  register: async (userData: any) => {
    const response = await api.post('/auth/signup', userData);
    return response.data;
  },

  verifyOtp: async (otpData: { email: string; otp: string }) => {
    const response = await api.post('/auth/verify-otp', otpData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      if (response.data.user.organisationId) {
        localStorage.setItem('organisationId', response.data.user.organisationId);
      }
    }
    return response.data;
  },

  resendOtp: async (email: string) => {
    const response = await api.post('/auth/resend-otp', { email });
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (resetData: { email: string; otp: string; newPassword: string }) => {
    const response = await api.post('/auth/reset-password', resetData);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('organisationId');
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  getOrganisationId: () => {
    const user = localStorage.getItem('user');
    if (!user) return null;

    try {
      const parsedUser = JSON.parse(user);
      return parsedUser?.organisationId || null;
    } catch {
      return null;
    }
  },

  getToken: () => {
    return localStorage.getItem('token');
  },

  hasValidToken: () => {
    const token = localStorage.getItem('token');
    if (!token) return false;

    const payload = parseJwtPayload(token);
    if (!payload?.exp) return true;

    const isValid = payload.exp * 1000 > Date.now();
    if (!isValid) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('organisationId');
    }

    return isValid;
  },

  clearSession: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('organisationId');
  },
  
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    if (response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
      if (response.data.user.organisationId) {
        localStorage.setItem('organisationId', response.data.user.organisationId);
      }
    }
    return response.data;
  },

  updateProfile: async (profileData: any) => {
    const response = await api.put('/auth/profile', profileData);
    if (response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  }
};
