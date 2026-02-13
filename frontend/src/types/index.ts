export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
}

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  category: 'economic' | 'comfort' | 'luxury' | 'suv' | 'van';
  pricePerDay: string | number;
  seats: number;
  transmission: 'manual' | 'automatic';
  fuelType: 'petrol' | 'diesel' | 'electric' | 'hybrid';
  imageUrl?: string;
  features?: string[];
  description?: string;
  isAvailable: boolean;
  status: string;
  location?: {
    address: string;
    lat: number | null;
    lng: number | null;
  };
  licensePlate?: string;
  createdAt: string;
  updatedAt: string;
  locationAddress:string
}

export interface Booking {
  id: string;
  userId: string;
  vehicleId: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  vehicle?: Vehicle;
  user?: User;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
}

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

export interface VehicleFilters {
  category?: string;
  transmission?: string;
  fuelType?: string;
  minPrice?: number;
  maxPrice?: number;
  seats?: number;
  available?: boolean;
}

export interface BookingFormData {
  vehicleId: string;
  startDate: Date;
  endDate: Date;
  notes?: string;
}

export interface DashboardStats {
  totalVehicles: number;
  availableVehicles: number;
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  totalRevenue: number;
  recentBookings: Booking[];
}
