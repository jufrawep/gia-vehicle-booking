import axios from 'axios';
import { RegisterData, LoginData, VehicleFilters, BookingFormData } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Global Axios instance with base configuration
 */
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Request Interceptor: Adds the JWT Bearer token to headers
 */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Response Interceptor: Global 401 (Unauthorized) Handler
 * Clears local storage and redirects to login if the session expires,
 * except for routes that are part of the initial auth handshake.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || '';
    const isAuthRoute = requestUrl.includes('/auth/me') || requestUrl.includes('/auth/login');

    if (error.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem('token');
      // Force reload to clear React state and trigger redirect logic
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

// --- Auth Endpoints ---
export const authAPI = {
  register: (data: RegisterData) => api.post('/auth/register', data),
  login: (data: LoginData) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me')
};

// --- Vehicle Endpoints ---
export const vehicleAPI = {
  getAll: (params?: VehicleFilters) => api.get('/vehicles', { params }),
  getById: (id: string) => api.get(`/vehicles/${id}`),
  checkAvailability: (id: string, startDate: string, endDate: string) =>
    api.get(`/vehicles/${id}/availability`, { params: { startDate, endDate } }),
  create: (data: any) => api.post('/vehicles', data),
  update: (id: string, data: any) => api.patch(`/vehicles/${id}`, data),
  delete: (id: string) => api.delete(`/vehicles/${id}`)
};

// --- Booking Endpoints ---
export const bookingAPI = {
  create: (data: BookingFormData) => api.post('/bookings', {
    ...data,
    // Ensure dates are sent in ISO format for the backend to parse correctly
    startDate: data.startDate.toISOString(),
    endDate: data.endDate.toISOString()
  }),
  getMyBookings: () => api.get('/bookings/my-bookings'),
  getAll: () => api.get('/bookings'),
  getById: (id: string) => api.get(`/bookings/${id}`),
  updateStatus: (id: string, status: string) =>
    api.patch(`/bookings/${id}/status`, { status }),
  delete: (id: string) => api.delete(`/bookings/${id}`),
  getStats: () => api.get('/bookings/stats/dashboard')
};

// --- Newsletter Endpoints ---
export const newsletterAPI = {
  subscribe: (email: string) => api.post('/newsletter/subscribe', { email })
};

export default api;