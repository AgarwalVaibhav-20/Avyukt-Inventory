import api from './api';

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
