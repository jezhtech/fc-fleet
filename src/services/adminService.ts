import { apiClient, API_ENDPOINTS } from "@/lib/api";
import type {
  ApiResponse,
  AdminStats,
  User,
  AdminDriver,
  AdminBooking,
  CreateUserRequest,
  UpdateUserRequest,
  AdminCreateDriverRequest,
  AdminUpdateDriverRequest,
  Vehicle,
  Transport,
} from "@/types";

// Admin Service Class
class AdminService {
  /**
   * Get admin dashboard statistics
   */
  async getAdminStats(): Promise<ApiResponse<AdminStats>> {
    return apiClient.get<AdminStats>(API_ENDPOINTS.ADMIN.STATS);
  }

  // User Management
  /**
   * Get all users
   */
  async getAllUsers(filters?: {
    search?: string;
    status?: string;
    isAdmin?: boolean;
  }): Promise<ApiResponse<User[]>> {
    return apiClient.get<User[]>(API_ENDPOINTS.ADMIN.USERS, filters);
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<ApiResponse<User>> {
    return apiClient.get<User>(`${API_ENDPOINTS.ADMIN.USERS}/${id}`);
  }

  /**
   * Create new user
   */
  async createUser(data: CreateUserRequest): Promise<ApiResponse<User>> {
    return apiClient.post<User>(API_ENDPOINTS.ADMIN.USERS, data);
  }

  /**
   * Update user
   */
  async updateUser(
    id: string,
    data: UpdateUserRequest,
  ): Promise<ApiResponse<User>> {
    return apiClient.put<User>(`${API_ENDPOINTS.ADMIN.USERS}/${id}`, data);
  }

  /**
   * Delete user
   */
  async deleteUser(id: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<{ message: string }>(
      `${API_ENDPOINTS.ADMIN.USERS}/${id}`,
    );
  }

  /**
   * Update user status
   */
  async updateUserStatus(
    id: string,
    status: "active" | "inactive" | "blocked",
  ): Promise<ApiResponse<User>> {
    return apiClient.patch<User>(`${API_ENDPOINTS.ADMIN.USERS}/${id}/status`, {
      status,
    });
  }

  // Driver Management
  /**
   * Get all drivers
   */
  async getAllDrivers(filters?: {
    search?: string;
    status?: string;
  }): Promise<ApiResponse<AdminDriver[]>> {
    return apiClient.get<AdminDriver[]>(API_ENDPOINTS.ADMIN.DRIVERS, filters);
  }

  /**
   * Get driver by ID
   */
  async getDriverById(id: string): Promise<ApiResponse<AdminDriver>> {
    return apiClient.get<AdminDriver>(`${API_ENDPOINTS.ADMIN.DRIVERS}/${id}`);
  }

  /**
   * Create new driver
   */
  async createDriver(
    data: AdminCreateDriverRequest,
  ): Promise<ApiResponse<AdminDriver>> {
    return apiClient.post<AdminDriver>(API_ENDPOINTS.ADMIN.DRIVERS, data);
  }

  /**
   * Update driver
   */
  async updateDriver(
    id: string,
    data: AdminUpdateDriverRequest,
  ): Promise<ApiResponse<AdminDriver>> {
    return apiClient.put<AdminDriver>(
      `${API_ENDPOINTS.ADMIN.DRIVERS}/${id}`,
      data,
    );
  }

  /**
   * Delete driver
   */
  async deleteDriver(id: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<{ message: string }>(
      `${API_ENDPOINTS.ADMIN.DRIVERS}/${id}`,
    );
  }

  /**
   * Update driver status
   */
  async updateDriverStatus(
    id: string,
    status: "active" | "inactive" | "suspended",
  ): Promise<ApiResponse<AdminDriver>> {
    return apiClient.patch<AdminDriver>(
      `${API_ENDPOINTS.ADMIN.DRIVERS}/${id}/status`,
      { status },
    );
  }

  // Booking Management
  /**
   * Get all bookings
   */
  async getAllBookings(filters?: {
    status?: string;
    bookingType?: string;
    startDate?: string;
    endDate?: string;
    userId?: string;
    vehicleId?: string;
  }): Promise<ApiResponse<AdminBooking[]>> {
    return apiClient.get<AdminBooking[]>(API_ENDPOINTS.BOOKINGS.BASE, filters);
  }

  /**
   * Get booking by ID
   */
  async getBookingById(id: string): Promise<ApiResponse<AdminBooking>> {
    return apiClient.get<AdminBooking>(`${API_ENDPOINTS.ADMIN.BOOKINGS}/${id}`);
  }

  /**
   * Update booking status
   */
  async updateBookingStatus(
    id: string,
    status: string,
  ): Promise<ApiResponse<AdminBooking>> {
    return apiClient.patch<AdminBooking>(
      `${API_ENDPOINTS.ADMIN.BOOKINGS}/${id}/status`,
      { status },
    );
  }

  /**
   * Assign driver to booking
   */
  async assignDriverToBooking(
    bookingId: string,
    driverId: string,
  ): Promise<ApiResponse<AdminBooking>> {
    return apiClient.post<AdminBooking>(
      `${API_ENDPOINTS.ADMIN.BOOKINGS}/${bookingId}/assign-driver`,
      { driverId },
    );
  }

  /**
   * Cancel booking
   */
  async cancelBooking(
    bookingId: string,
    reason: string,
  ): Promise<ApiResponse<AdminBooking>> {
    return apiClient.post<AdminBooking>(
      `${API_ENDPOINTS.ADMIN.BOOKINGS}/${bookingId}/cancel`,
      { reason },
    );
  }

  // Vehicle Management
  /**
   * Get all vehicles
   */
  async getAllVehicles(filters?: {
    transportId?: string;
    search?: string;
  }): Promise<ApiResponse<any[]>> {
    return apiClient.get<any[]>(API_ENDPOINTS.ADMIN.VEHICLES, filters);
  }

  /**
   * Get vehicle by ID
   */
  async getVehicleById(id: string): Promise<ApiResponse<Vehicle>> {
    return apiClient.get<Vehicle>(`${API_ENDPOINTS.VEHICLES.BASE}/${id}`);
  }

  // Transport Management
  /**
   * Get all transports
   */
  async getAllTransports(filters?: {
    search?: string;
    isActive?: boolean;
  }): Promise<ApiResponse<Transport[]>> {
    return apiClient.get<Transport[]>(API_ENDPOINTS.TRANSPORTS.BASE, filters);
  }

  /**
   * Get transport by ID
   */
  async getTransportById(id: string): Promise<ApiResponse<Transport>> {
    return apiClient.get<Transport>(`${API_ENDPOINTS.ADMIN.TRANSPORTS}/${id}`);
  }

  // Settings
  /**
   * Get admin settings
   */
  async getAdminSettings(): Promise<ApiResponse<any>> {
    return apiClient.get<any>(API_ENDPOINTS.ADMIN.SETTINGS);
  }

  /**
   * Update admin settings
   */
  async updateAdminSettings(
    settings: any,
  ): Promise<ApiResponse<{ message: string }>> {
    return apiClient.put<{ message: string }>(
      API_ENDPOINTS.ADMIN.SETTINGS,
      settings,
    );
  }

  // Analytics and Reports
  /**
   * Get revenue analytics
   */
  async getRevenueAnalytics(
    period: "daily" | "weekly" | "monthly" | "yearly",
    startDate?: string,
    endDate?: string,
  ): Promise<ApiResponse<any>> {
    return apiClient.get<any>(`${API_ENDPOINTS.ADMIN.STATS}/revenue`, {
      period,
      startDate,
      endDate,
    });
  }

  /**
   * Get booking analytics
   */
  async getBookingAnalytics(
    period: "daily" | "weekly" | "monthly" | "yearly",
    startDate?: string,
    endDate?: string,
  ): Promise<ApiResponse<any>> {
    return apiClient.get<any>(`${API_ENDPOINTS.ADMIN.STATS}/bookings`, {
      period,
      startDate,
      endDate,
    });
  }

  /**
   * Get driver performance analytics
   */
  async getDriverPerformanceAnalytics(
    driverId?: string,
    period?: "daily" | "weekly" | "monthly" | "yearly",
  ): Promise<ApiResponse<any>> {
    return apiClient.get<any>(
      `${API_ENDPOINTS.ADMIN.STATS}/driver-performance`,
      { driverId, period },
    );
  }

  /**
   * Export data to CSV/Excel
   */
  async exportData(
    type: "users" | "drivers" | "bookings" | "vehicles" | "transports",
    format: "csv" | "excel",
    filters?: any,
  ): Promise<ApiResponse<{ downloadUrl: string }>> {
    return apiClient.post<{ downloadUrl: string }>(
      `${API_ENDPOINTS.ADMIN.STATS}/export`,
      { type, format, filters },
    );
  }
}

// Export singleton instance
export const adminService = new AdminService();
