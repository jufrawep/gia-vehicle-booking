// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface RegisterData {
  email:      string;
  password:   string;
  firstName:  string;
  lastName:   string;
  phone?:     string;
}

export interface LoginData {
  email:    string;
  password: string;
}

export interface AuthContextType {
  user:            User | null;
  token:           string | null;
  login:           (email: string, password: string) => Promise<void>;
  register:        (data: RegisterData) => Promise<void>;
  logout:          () => void;
  isAuthenticated: boolean;
  isAdmin:         boolean;
  loading:         boolean;
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface User {
  id:          string;
  email:       string;
  firstName:   string;
  lastName:    string;
  phone?:      string;
  role:        'USER' | 'ADMIN';
  status:      'ACTIVE' | 'BLOCKED';   // ← ajouté (manquait)
  permissions: string[];               // ← ajouté (manquait)
  createdAt:   string;
  updatedAt:   string;
}

// ─── Vehicle ──────────────────────────────────────────────────────────────────

// Types exportés pour réutilisation dans les formulaires et filtres
export type VehicleCategory  = 'ECONOMY' | 'COMFORT' | 'LUXURY' | 'SUV' | 'VAN';
export type VehicleStatus    = 'AVAILABLE' | 'UNAVAILABLE' | 'MAINTENANCE' | 'RENTED';
export type TransmissionType = 'MANUAL' | 'AUTOMATIC';
export type FuelTypeEnum     = 'PETROL' | 'DIESEL' | 'ELECTRIC' | 'HYBRID';

export interface Vehicle {
  id:           string;
  brand:        string;
  model:        string;
  year:         number;
  // UPPERCASE enums — ancienne version avait 'economic'/'manual' en minuscules
  category:     VehicleCategory;
  pricePerDay:  number;               // ← était string | number, normalisé en number
  seats:        number;
  transmission: TransmissionType;
  fuelType:     FuelTypeEnum;
  imageUrl?:    string;
  features?:    string[];
  description?: string;
  isAvailable:  boolean;              // ← conservé pour compatibilité legacy
  status:       VehicleStatus;        // ← UPPERCASE enum (était string)
  mileage?:     number;               // ← ajouté
  location?: {
    address: string;
    lat:     number | null;
    lng:     number | null;
  };
  licensePlate?:   string;
  locationAddress: string;
  createdAt:       string;
  updatedAt:       string;
}

// Utilisé dans le formulaire Create/Update véhicule (AdminDashboard)
export interface VehicleFormData {
  brand:        string;
  model:        string;
  year:         number;
  licensePlate: string;
  category:     VehicleCategory;
  pricePerDay:  number;
  seats:        number;
  transmission: TransmissionType;
  fuelType:     FuelTypeEnum;
  imageUrl:     string;
  description:  string;
  status:       VehicleStatus;
  features:     string;   // saisie CSV, parsée avant envoi API
  mileage:      number;
  location:     string;
}

export interface VehicleFilters {
  category?:     string;
  transmission?: string;
  fuelType?:     string;
  minPrice?:     number;
  maxPrice?:     number;
  seats?:        number;
  available?:    boolean;
}

// ─── Booking ──────────────────────────────────────────────────────────────────

// UPPERCASE — ancienne version avait 'pending'/'confirmed' en minuscules
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export interface Booking {
  id:         string;
  userId:     string;
  vehicleId:  string;
  startDate:  string;
  endDate:    string;
  totalDays?: number;          // ← ajouté
  totalPrice: number;
  status:     BookingStatus;   // ← UPPERCASE enum (était minuscules)
  notes?:     string;
  createdAt:  string;
  updatedAt:  string;
  vehicle?:   Vehicle;
  user?:      User;
}

export interface BookingFormData {
  vehicleId:  string;
  startDate:  Date;
  endDate:    Date;
  notes?:     string;
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