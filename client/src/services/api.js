import axios from 'axios';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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
    const message = error.response?.data?.error || error.response?.data?.message || error.message;
    
    // Handle 401 unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login?message=session_expired';
    }
    
    return Promise.reject(new Error(message));
  }
);

// Authentication Services
export const authService = {
  async login(email, password) {
    return api.post('/user/login', { email, password });
  },

  async register(userData) {
    return api.post('/user/register', userData);
  },

  async logout() {
    return api.post('/user/logout');
  },

  async getProfile() {
    return api.get('/user/api/profile');
  },

  async updateProfile(userData) {
    return api.put('/user/api/profile', userData);
  },

  async updatePassword(passwordData) {
    return api.put('/user/api/password', passwordData);
  },

  async getUserStats() {
    return api.get('/user/api/stats');
  },

  async refreshToken() {
    return api.post('/user/api/refresh-token');
  }
};

// Booth Services
export const boothService = {
  async getBooths() {
    return api.get('/booth/api/user/booths');
  },

  async getBooth(boothId) {
    return api.get(`/booth/api/${boothId}`);
  },

  async createBooth(boothData) {
    return api.post('/booth/create', boothData);
  },

  async updateBooth(boothId, boothData) {
    return api.post(`/booth/${boothId}/edit`, boothData);
  },

  async deleteBooth(boothId) {
    return api.delete(`/booth/${boothId}/delete`);
  },

  async joinBooth(inviteCode) {
    return api.post(`/booth/join/${inviteCode}`);
  },

  async vote(boothId, candidateId) {
    return api.post(`/booth/${boothId}/vote`, { candidateId });
  },

  async getResults(boothId) {
    return api.get(`/booth/api/${boothId}/results`);
  },

  async resetInviteCode(boothId) {
    return api.post(`/booth/${boothId}/reset-code`);
  },

  async updateSettings(boothId, settings) {
    return api.put(`/booth/${boothId}/settings`, settings);
  },

  async removeMember(boothId, memberId) {
    return api.post(`/booth/${boothId}/remove-member/${memberId}`);
  },

  async toggleStatus(boothId) {
    return api.post(`/booth/${boothId}/toggle-status`);
  },

  async exportData(boothId, format) {
    const response = await api.get(`/booth/${boothId}/export/${format}`, {
      responseType: 'blob'
    });
    return response;
  }
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