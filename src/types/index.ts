// Core API Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  total?: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page?: number;
  limit?: number;
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: "customer" | "driver" | "admin";
    createdAt: string;
    updatedAt: string;
  };
  token: string;
  refreshToken: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface VerifyEmailRequest {
  email: string;
  verificationCode: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: "customer" | "driver" | "admin";
  createdAt: string;
  updatedAt: string;
}

// User Types
export interface Driver {
  id: string;
  uid: string;
  name: string;
  email: string;
  phone: string;
  role: "driver";
  status: "active" | "inactive" | "suspended";
  taxiTypeId: string;
  vehicleTypeId: string;
  vehicleNumber: string;
  rating: number;
  rides: number;
  earnings: number;
  joined: string;
  createdAt: string;
  updatedAt: string;
}

export interface BackendDriverResponse {
  id: string;
  uid: string;
  name: string;
  email: string;
  phone: string;
  role: "driver";
  status: "active" | "inactive" | "suspended";
  taxiTypeId: string;
  vehicleTypeId: string;
  vehicleNumber: string;
  rating: number;
  rides: number;
  earnings: number;
  joined: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDriverRequest {
  name: string;
  email?: string;
  phone: string;
  taxiTypeId: string;
  vehicleTypeId: string;
  vehicleNumber: string;
  status: "active" | "inactive" | "suspended";
}

export interface UpdateDriverRequest {
  name?: string;
  email?: string;
  phone?: string;
  taxiTypeId?: string;
  vehicleTypeId?: string;
  vehicleNumber?: string;
  status?: "active" | "inactive" | "suspended";
}

// Vehicle Types
export interface Vehicle {
  id: string;
  name: string;
  transportId?: string;
  imageUrl: string;
  description: string;
  basePrice: number;
  perKmPrice: number;
  perMinPrice: number;
  capacity: number;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleWithTransport extends Vehicle {
  transport?: {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
  };
}

export interface CreateVehicleRequest {
  name: string;
  transportId?: string;
  imageUrl: string;
  description: string;
  basePrice: number;
  perKmPrice: number;
  perMinPrice: number;
  capacity: number;
}

export interface UpdateVehicleRequest {
  name?: string;
  transportId?: string;
  imageUrl?: string;
  description?: string;
  basePrice?: number;
  perKmPrice?: number;
  perMinPrice?: number;
  capacity?: number;
}

export interface VehicleFilters {
  transportId?: string;
  minPrice?: number;
  maxPrice?: number;
  minCapacity?: number;
  maxCapacity?: number;
  search?: string;
}

// Transport Types
export interface Transport {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransportWithVehicles extends Transport {
  vehicles: Array<{
    id: string;
    name: string;
    imageUrl: string;
    description: string;
    basePrice: number;
    perKmPrice: number;
    perMinPrice: number;
    capacity: number;
  }>;
  vehicleCount: number;
}

export interface TransportStats {
  total: number;
  totalVehicles: number;
  averageVehiclesPerTransport: number;
}

export interface CreateTransportRequest {
  name: string;
  description: string;
  imageUrl: string;
}

export interface UpdateTransportRequest {
  name?: string;
  description?: string;
  imageUrl?: string;
}

export interface TransportFilters {
  search?: string;
  minVehicleCount?: number;
}

// Booking Types
export interface Location {
  name: string;
  address: string;
  placeId: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export interface PaymentInfo {
  trackingId?: string;
  status: string;
  amount: number;
  currency: string;
  method: "cash" | "online";
  bankRefNo?: string;
  orderStatus?: string;
  paymentMode?: string;
  cardName?: string;
  transactionDate?: string;
}

export interface Booking {
  id: string;
  bookingType: "ride" | "rent";
  userId: string;
  vehicleId: string;
  status:
    | "initiated"
    | "awaiting"
    | "assigned"
    | "pickup"
    | "completed"
    | "cancelled";
  pickupLocation: Location;
  dropoffLocation?: Location;
  pickupDate: string;
  amount: number;
  paymentInfo: PaymentInfo;
  createdAt: string;
  updatedAt: string;
}

export interface BookingForm {
  bookingType: "ride" | "rent";
  userId: string;
  vehicleId: string;
  status:
    | "initiated"
    | "awaiting"
    | "assigned"
    | "pickup"
    | "completed"
    | "cancelled";
  pickupLocation: Location;
  dropoffLocation?: Location;
  pickupDate?: number;
  paymentInfo?: PaymentInfo;
}

export interface BookingWithRelations extends Booking {
  user?: User;
  vehicle?: {
    id: string;
    name: string;
    imageUrl: string;
    description: string;
    basePrice: number;
    perKmPrice: number;
    perMinPrice: number;
    capacity: number;
  };
}

export interface CreateBookingRequest {
  bookingType: "ride" | "rent";
  userId: string;
  vehicleId: string;
  pickupLocation: Location;
  dropoffLocation?: Location;
  pickupDate?: number;
  paymentInfo?: PaymentInfo;
  amount: number;
}

export interface UpdateBookingRequest {
  status?:
    | "initiated"
    | "awaiting"
    | "assigned"
    | "pickup"
    | "completed"
    | "cancelled";
  pickupLocation?: Location;
  dropoffLocation?: Location;
  paymentInfo?: Partial<PaymentInfo>;
}

export interface BookingFilters {
  userId?: string;
  vehicleId?: string;
  status?: string;
  bookingType?: "ride" | "rent";
  startDate?: string;
  endDate?: string;
}

// Payment Types
export interface PaymentRequest {
  orderId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  billingAddress?: string;
  billingCity?: string;
  billingState?: string;
  billingZip?: string;
  billingCountry?: string;
  billingTel?: string;
  deliveryName?: string;
  deliveryAddress?: string;
  deliveryCity?: string;
  deliveryState?: string;
  deliveryZip?: string;
  deliveryCountry?: string;
  deliveryTel?: string;
  merchantParam1?: string;
  merchantParam2?: string;
  merchantParam3?: string;
  merchantParam4?: string;
  merchantParam5?: string;
  promoCode?: string;
  customerIdentifier?: string;
  rsaKey?: string;
}

export interface PaymentResponse {
  success: boolean;
  message: string;
  data?: {
    encRequest: string;
    access_code: string;
    paymentUrl: string;
  };
  error?: string;
}

export interface PaymentStatusResponse {
  success: boolean;
  message: string;
  data?: {
    orderId: string;
    trackingId: string;
    orderStatus: string;
    statusMessage: string;
    bankRefNo: string;
    transactionDate: string;
    isSuccessful: boolean;
  };
  error?: string;
}

export interface PaymentHistoryResponse {
  success: boolean;
  message: string;
  data?: {
    payments: any[];
  };
  error?: string;
}

// Admin Types
export interface AdminStats {
  totalUsers: number;
  totalDrivers: number;
  totalBookings: number;
  totalRevenue: number;
  monthlyBookings: number;
  monthlyRevenue: number;
  activeDrivers: number;
  pendingBookings: number;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
  role?: "customer" | "driver" | "admin";
  driverDetails?: Driver
}

export interface AdminDriver {
  id: string;
  uid: string;
  name: string;
  email: string;
  phone: string;
  role: "driver";
  status: "active" | "inactive" | "suspended";
  taxiTypeId: string;
  vehicleTypeId: string;
  vehicleNumber: string;
  rating: number;
  rides: number;
  earnings: number;
  joined: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminBooking {
  id: string;
  bookingType: "ride" | "rent";
  userId: string;
  vehicleId: string;
  status: string;
  pickupLocation: any;
  dropoffLocation?: any;
  paymentInfo: any;
  pickupDate: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
  vehicle?: any;
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isAdmin?: boolean;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  isAdmin?: boolean;
}

export interface AdminCreateDriverRequest {
  name: string;
  email?: string;
  phone: string;
  taxiTypeId: string;
  vehicleTypeId: string;
  vehicleNumber: string;
  status: "active" | "inactive" | "suspended";
}

export interface AdminUpdateDriverRequest {
  name?: string;
  email?: string;
  phone?: string;
  taxiTypeId?: string;
  vehicleTypeId?: string;
  vehicleNumber?: string;
  status?: "active" | "inactive" | "suspended";
}

// Component-specific types
export interface VehicleDisplay {
  id: string;
  name: string;
  description: string;
  image: string;
  price: number;
  features: {
    icon: string;
    text: string;
  }[];
  taxiTypeId: string;
  taxiTypeName: string;
  capacity: number;
  basePrice: number;
  perKmPrice: number;
  perMinutePrice: number;
  images: string[];
}

export const DEFAULT_MAP_CENTER = {
  longitude: 55.2708,
  latitude: 25.2048,
  zoom: 10,
};

export const bookingStatuses = [
  { id: "initiated", label: "Booking Initiated", completed: true },
  { id: "awaiting", label: "Awaiting Confirmation", completed: false },
  { id: "assigned", label: "Driver Assigned", completed: false },
  { id: "pickup", label: "Pickup Done", completed: false },
  { id: "dropped", label: "Dropped at Location", completed: false },
];
