/**
 * @file  services/api.ts
 * @desc  Axios instance + all API endpoint wrappers.
 *
 * Changes:
 *   - userAPI endpoints added (getAllUsers, updateStatus, updatePermissions, updateRole, delete)
 *   - bookingAPI.adminCreate added
 *   - Request/response interceptors now log via the frontend logger
 */

import axios from 'axios';
import { RegisterData, LoginData, VehicleFilters, BookingFormData } from '../types';
import { logger } from '../utils/logger';

const API_URL = import.meta.env.VITE_API_URL || 'https://gia-vehicle-booking-hbem.onrender.com';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach JWT ──────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  logger.debug('API', `→ ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

// ── Response interceptor: log + handle 401 ───────────────────────────────────
api.interceptors.response.use(
  (response) => {
    logger.debug('API', `← ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    const status     = error.response?.status;
    const requestUrl = error.config?.url || '';
    const isAuthRoute = requestUrl.includes('/auth/me') || requestUrl.includes('/auth/login');

    logger.warn('API', `← ${status} ${requestUrl}`, {
      message: error.response?.data?.message,
    });

    if (status === 401 && !isAuthRoute) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data: RegisterData)             => api.post('/auth/register', data),
  login:    (data: LoginData)                => api.post('/auth/login', data),
  getMe:    ()                               => api.get('/auth/me'),
  forgotPassword: (email: string)            => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, newPassword: string) =>
    api.post('/auth/reset-password', { token, newPassword }),
};

// ── Vehicles ──────────────────────────────────────────────────────────────────
export const vehicleAPI = {
  getAll:             (params?: VehicleFilters) => api.get('/vehicles', { params }),
  getById:            (id: string)              => api.get(`/vehicles/${id}`),
  checkAvailability:  (id: string, startDate: string, endDate: string) =>
    api.get(`/vehicles/${id}/availability`, { params: { startDate, endDate } }),
  create:  (data: any)                => api.post('/vehicles', data),
  update:  (id: string, data: any)    => api.patch(`/vehicles/${id}`, data),
  delete:  (id: string)               => api.delete(`/vehicles/${id}`),
};

// ── Bookings ──────────────────────────────────────────────────────────────────
export const bookingAPI = {
  create: (data: BookingFormData) => api.post('/bookings', {
    ...data,
    startDate: data.startDate instanceof Date ? data.startDate.toISOString() : data.startDate,
    endDate:   data.endDate   instanceof Date ? data.endDate.toISOString()   : data.endDate,
  }),
  adminCreate: (data: {
    vehicleId: string;
    userId: string;
    startDate: string;
    endDate: string;
    notes?: string;
  }) => api.post('/bookings/admin-create', data),
  getMyBookings:  ()                              => api.get('/bookings/my-bookings'),
  getAll:         ()                              => api.get('/bookings'),
  getById:        (id: string)                    => api.get(`/bookings/${id}`),
  updateStatus:   (id: string, status: string)    => api.patch(`/bookings/${id}/status`, { status }),
  delete:         (id: string)                    => api.delete(`/bookings/${id}`),
  getStats:       ()                              => api.get('/bookings/stats/dashboard'),
};

// ── Users (admin) ─────────────────────────────────────────────────────────────
export const userAPI = {
  getAll:             ()                                    => api.get('/users'),
  updateStatus:       (id: string, status: 'ACTIVE' | 'BLOCKED') =>
    api.patch(`/users/${id}/status`, { status }),
  updatePermissions:  (id: string, permissions: string[])  =>
    api.patch(`/users/${id}/permissions`, { permissions }),
  updateRole:         (id: string, role: 'USER' | 'ADMIN') =>
    api.patch(`/users/${id}/role`, { role }),
  delete:             (id: string)                          => api.delete(`/users/${id}`),
};

// ── Newsletter ────────────────────────────────────────────────────────────────
export const newsletterAPI = {
  subscribe: (email: string) => api.post('/newsletter/subscribe', { email }),
};


// ── Payments ──────────────────────────────────────────────────────────────────
export const paymentAPI = {
  process: (data: {
    bookingId:     string;
    cardNumber:    string;
    cardHolder:    string;
    expiryDate:    string;
    cvv:           string;
    paymentMethod?: string;
  }) => api.post('/payments/process', data),

  getTicket: (bookingId: string) => api.get(`/payments/${bookingId}`),
  getAll: (filters?: {
    dateFrom?:     string;
    dateTo?:       string;
    status?:       string;
    paymentMethod?: string;
  }) => api.get('/payments', { params: filters }),
};

export default api;