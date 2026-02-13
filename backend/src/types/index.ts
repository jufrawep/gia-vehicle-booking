/**
 * @file  types/index.ts
 * @desc  Shared TypeScript types for the GIA Vehicle Booking backend.
 *
 * Conventions:
 *   - All enum string literals are UPPERCASE to match Prisma / PostgreSQL values.
 *   - DB fields remain snake_case inside Prisma queries; API responses use camelCase.
 */

import { Request } from 'express';

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface JWTPayload {
  id:          string;
  email:       string;
  role:        string;        // 'USER' | 'ADMIN'
  permissions: string[];      // 'READ' | 'CREATE' | 'DELETE'
}

/**
 * Express Request augmented with the decoded JWT user identity.
 * Populated by the `protect` middleware.
 */
export interface AuthRequest extends Request {
  user?: {
    id:          string;
    email:       string;
    role:        string;      // 'USER' | 'ADMIN'
    permissions: string[];    // 'READ' | 'CREATE' | 'DELETE'
  };
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface User {
  id:            string;
  email:         string;
  firstName:     string;
  lastName:      string;
  phone?:        string;
  role:          'USER' | 'ADMIN';
  status:        'ACTIVE' | 'BLOCKED';
  permissions:   ('READ' | 'CREATE' | 'DELETE')[];
  isActive:      boolean;
  emailVerified: boolean;
  createdAt:     string;
  updatedAt:     string;
}

// ─── Vehicle ──────────────────────────────────────────────────────────────────

export interface Vehicle {
  id:              string;
  brand:           string;
  model:           string;
  year:            number;
  category:        'ECONOMY' | 'COMFORT' | 'LUXURY' | 'SUV' | 'VAN';
  pricePerDay:     number;
  seats:           number;
  transmission:    'MANUAL' | 'AUTOMATIC';
  fuelType:        'PETROL' | 'DIESEL' | 'ELECTRIC' | 'HYBRID';
  imageUrl?:       string;
  features?:       string[];
  description?:    string;
  status:          'AVAILABLE' | 'UNAVAILABLE' | 'MAINTENANCE' | 'RENTED';
  isAvailable:     boolean;
  licensePlate?:   string;
  mileage?:        number;
  location?:       string;
  locationAddress?: string;
  isActive:        boolean;
  createdAt:       string;
  updatedAt:       string;
}

// ─── Booking ──────────────────────────────────────────────────────────────────

export interface Booking {
  id:              string;
  userId:          string;
  vehicleId:       string;
  startDate:       string;
  endDate:         string;
  totalDays:       number;
  totalPrice:      number;
  status:          'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  paymentStatus:   'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  notes?:          string;
  createdAt:       string;
  updatedAt:       string;
  vehicle?:        Partial<Vehicle>;
  user?:           Partial<User>;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalVehicles:     number;
  availableVehicles: number;
  totalBookings:     number;
  pendingBookings:   number;
  confirmedBookings: number;
  totalRevenue:      number;
  recentBookings:    Booking[];
}

// ─── API ──────────────────────────────────────────────────────────────────────

export interface ApiResponse<T = any> {
  success:  boolean;
  message?: string;
  data?:    T;
  errors?:  { field: string; message: string }[];
}