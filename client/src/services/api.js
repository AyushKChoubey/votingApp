import axios from 'axios';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        method: error.config?.method,
        url: error.config?.url,
        baseURL: error.config?.baseURL
      }
    });
    
    const message = error.response?.data?.error || error.response?.data?.message || error.message;
    
    // Handle CORS errors
    if (error.message.includes('Network Error') || error.code === 'ERR_NETWORK') {
      console.error('🚨 CORS or Network Error - Check if server is running on localhost:5000');
    }
    
    // Handle 401 unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login?message=session_expired';
    }
    
    // Preserve the original error structure but with our message
    const enhancedError = new Error(message);
    enhancedError.response = error.response;
    enhancedError.status = error.response?.status;
    enhancedError.data = error.response?.data;
    
    return Promise.reject(enhancedError);
  }
);

// Authentication Services
export const authService = {
  async login(email, password) {
    return api.post('/api/user/login', { email, password });
  },

  async register(userData) {
    return api.post('/api/user/register', userData);
  },

  async logout() {
    return api.post('/api/user/logout');
  },

  async getProfile() {
    return api.get('/api/user/profile');
  },

  async updateProfile(userData) {
    return api.put('/api/user/profile', userData);
  },

  async updatePassword(passwordData) {
    return api.put('/api/user/password', passwordData);
  },

  async getUserStats() {
    return api.get('/api/user/stats');
  },

  async refreshToken() {
    return api.post('/api/user/refresh-token');
  }
};

// Booth Services
export const boothService = {
  async getBooths() {
    return api.get('/api/booth/user/booths');
  },

  async getBooth(boothId) {
    return api.get(`/api/booth/${boothId}`);
  },

  async createBooth(boothData) {
    return api.post('/api/booth/create', boothData);
  },

  async updateBooth(boothId, boothData) {
    return api.post(`/api/booth/${boothId}/edit`, boothData);
  },

  async deleteBooth(boothId) {
    return api.delete(`/api/booth/${boothId}/delete`);
  },

  async joinBooth(inviteCode) {
    return api.post(`/api/booth/join/${inviteCode}`);
  },

  async vote(boothId, candidateIndex) {
    return api.post(`/api/booth/${boothId}/vote`, { candidateIndex });
  },

  async getResults(boothId) {
    return api.get(`/api/booth/${boothId}/results`);
  },

  async resetInviteCode(boothId) {
    return api.post(`/api/booth/${boothId}/reset-code`);
  },

  async updateSettings(boothId, settings) {
    return api.put(`/api/booth/${boothId}/settings`, settings);
  },

  async removeMember(boothId, memberId) {
    return api.post(`/api/booth/${boothId}/remove-member/${memberId}`);
  },

  async toggleStatus(boothId) {
    return api.post(`/api/booth/${boothId}/toggle-status`);
  },

  async exportData(boothId, format) {
    const response = await api.get(`/api/booth/${boothId}/export/${format}`, {
      responseType: 'blob'
    });
    return response;
  },


};

// General API Services
export const apiService = {
  async healthCheck() {
    return api.get('/api/health');
  },

  async getStatus() {
    return api.get('/api/status');
  },

  async submitContact(contactData) {
    return api.post('/contact', contactData);
  }
};

export default api;