import { Request } from 'express';

/**
 * EXTENDED REQUEST INTERFACE
 * Custom Express Request type that includes the 'user' object populated
 * by the authentication middleware (JWT).
 */
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

/**
 * AUTHENTICATION & IDENTITY TYPES
 * Defines the core structures for user registration, login, and token management.
 */
export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

/**
 * JWT PAYLOAD
 * Data encoded within the JWT. Keep this minimal to avoid heavy headers.
 */
export interface JWTPayload {
  id: string;
  email: string;
  role: string;
}

/**
 * VEHICLE DOMAIN TYPES
 * Interfaces for managing the fleet, filtering search results, and database persistence.
 */
export interface VehicleFilter {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  transmission?: string;
  fuelType?: string;
  seats?: number;
}

export interface CreateVehicleData {
  brand: string;
  model: string;
  year: number;
  category: string;
  pricePerDay: number;
  seats: number;
  transmission: string;
  fuelType: string;
  imageUrl?: string;
  features?: string[];
  description?: string;
  licensePlate?: string;
}

/**
 * BOOKING & RESERVATION TYPES
 * Handling the lifecycle of a vehicle rental.
 */
export interface CreateBookingData {
  vehicleId: string;
  startDate: string | Date;
  endDate: string | Date;
  notes?: string;
}

export interface BookingFilter {
  status?: string;
  userId?: string;
  vehicleId?: string;
  startDate?: Date;
  endDate?: Date;
}

/**
 * GLOBAL API ARCHITECTURE
 * Standardized structure for all server responses to ensure consistency 
 * for the frontend consumer.
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

/**
 * ANALYTICS & DASHBOARD TYPES
 * Aggregated data used for the Admin overview panel.
 */
export interface DashboardStats {
  totalVehicles: number;
  availableVehicles: number;
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  totalRevenue: number;
  recentBookings: any[]; // Consider using a 'Booking' interface here once defined
}