import axios from "axios";
import { getFriendlyErrorMessage } from "../utils/errorMessages";

// API Configuration
const API_BASE_URL =
  import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "" : "http://localhost:5000");

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Prevent multiple simultaneous auth redirects (keeps UI from blinking)
let authRedirectInProgress = false;

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // API errors are propagated to callers; avoid noisy console output here.

    // Extract error message from various possible response formats
    const rawMessage =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.response?.data?.msg ||
      error.message ||
      "An unexpected error occurred";
    const message = getFriendlyErrorMessage(
      { ...error, status: error.response?.status, message: rawMessage },
      "We could not complete that request. Please try again.",
    );
    const safeResponse = error.response
      ? {
          ...error.response,
          data: {
            ...(error.response.data || {}),
            error: message,
            message,
          },
        }
      : undefined;

    // Handle 401 unauthorized or 403 forbidden (token expired or invalid)
    const status = error.response?.status;
    const serverMsg =
      (error.response?.data &&
        (error.response.data.error ||
          error.response.data.message ||
          error.response.data.msg)) ||
      "";

    const isTokenExpiredMsg =
      /token expired|jwt expired|session expired|invalid token/i.test(
        serverMsg,
      );

    // IMPORTANT: Check if we're on an auth page FIRST, BEFORE any redirect logic
    // Auth pages should NEVER redirect - they handle their own errors
    const currentPath = window.location.pathname;
    const isAuthPage =
      currentPath === "/login" ||
      currentPath === "/register" ||
      currentPath.startsWith("/login") ||
      currentPath.startsWith("/register") ||
      currentPath.startsWith("/forgot-password") ||
      currentPath.startsWith("/reset-password") ||
      currentPath.startsWith("/auth/") ||
      currentPath.includes("login") ||
      currentPath.includes("register");

    // If on auth page, NEVER redirect - just propagate the error
    if (isAuthPage) {
      const enhancedError = new Error(message);
      enhancedError.response = safeResponse;
      enhancedError.status = error.response?.status;
      enhancedError.data = safeResponse?.data;
      return Promise.reject(enhancedError);
    }

    // Only redirect for token expiry on NON-auth pages
    if (status === 401 || isTokenExpiredMsg) {
      // Clear token immediately
      try {
        localStorage.removeItem("token");
      } catch (e) {
        // ignore
      }

      // Prevent multiple redirects from concurrent failing requests
      if (!authRedirectInProgress) {
        authRedirectInProgress = true;
        // Use replace to land directly on the home page cleanly
        window.location.replace("/");
      }

      // Never resolve to prevent further execution or error toasts while redirecting
      return new Promise(() => {});
    }

    // Preserve the original error structure but with our message
    const enhancedError = new Error(message);
    enhancedError.response = safeResponse;
    enhancedError.status = error.response?.status;
    enhancedError.data = safeResponse?.data;

    return Promise.reject(enhancedError);
  },
);

// Authentication Services
export const authService = {
  async login(email, password) {
    return api.post("/api/user/login", { email, password });
  },

  async register(userData) {
    return api.post("/api/user/register", userData);
  },

  async logout() {
    return api.post("/api/user/logout");
  },

  async getProfile() {
    return api.get("/api/user/profile");
  },

  async updateProfile(userData) {
    return api.put("/api/user/profile", userData);
  },

  async updatePassword(passwordData) {
    return api.put("/api/user/password", passwordData);
  },

  async getUserStats() {
    return api.get("/api/user/stats");
  },

  async refreshToken() {
    return api.post("/api/user/refresh-token");
  },

  async uploadAvatar(formData) {
    return api.post("/api/user/avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  async deleteAvatar() {
    return api.delete("/api/user/avatar");
  },
};

// Booth Services
export const boothService = {
  async getBooths() {
    return api.get("/api/booth/user/booths");
  },

  async getBooth(boothId) {
    return api.get(`/api/booth/${boothId}`);
  },

  async createBooth(boothData) {
    return api.post("/api/booth/create", boothData);
  },

  async updateBooth(boothId, boothData) {
    return api.post(`/api/booth/${boothId}/edit`, boothData);
  },

  async deleteBooth(boothId) {
    return api.delete(`/api/booth/${boothId}`);
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

  async getAdmin(boothId) {
    return api.get(`/api/booth/${boothId}/admin`);
  },

  async approveRequest(boothId, userId) {
    return api.post(`/api/booth/${boothId}/requests/${userId}/approve`);
  },

  async rejectRequest(boothId, userId) {
    return api.post(`/api/booth/${boothId}/requests/${userId}/reject`);
  },

  async removeMember(boothId, memberId) {
    return api.delete(`/api/booth/${boothId}/members/${memberId}`);
  },

  async toggleStatus(boothId) {
    return api.post(`/api/booth/${boothId}/toggle-status`);
  },

  async getActivity(boothId) {
    return api.get(`/api/booth/${boothId}/activity`);
  },

  async exportData(boothId, format) {
    const response = await api.get(`/api/booth/${boothId}/export/${format}`, {
      responseType: "blob",
    });
    return response;
  },
};

// General API Services
export const apiService = {
  async healthCheck() {
    return api.get("/api/health");
  },

  async getStatus() {
    return api.get("/api/status");
  },

  async submitContact(contactData) {
    return api.post("/contact", contactData);
  },
};

export default api;
