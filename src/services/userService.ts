import { apiClient, API_ENDPOINTS } from "@/lib/api";
import type {
  ApiResponse,
  DriverDetails,
  CreateDriverRequest,
  UpdateDriverRequest,
  UserWithDriverDetail,
  User,
} from "@/types";

// User Service Class
class UserService {
  /**
   * Get authentication token
   */
  async getAuthToken(): Promise<string> {
    if (typeof window !== "undefined") {
      return (
        localStorage.getItem("authToken") ||
        localStorage.getItem("firebaseToken") ||
        ""
      );
    }
    return "";
  }

  /**
   * Create a new driver
   */
  async createDriver(
    driverData: CreateDriverRequest,
  ): Promise<ApiResponse<UserWithDriverDetail>> {
    return apiClient.post<UserWithDriverDetail>(
      API_ENDPOINTS.DRIVERS.BASE,
      driverData,
    );
  }

  async checkUserExists(phone: string): Promise<ApiResponse<void>> {
    return apiClient.get<void>(
      `${API_ENDPOINTS.USERS.BASE}/check?phone=${phone}`,
    );
  }

  async getAllUsers(): Promise<ApiResponse<User[]>> {
    return apiClient.get<User[]>(`${API_ENDPOINTS.USERS.BASE}/all`);
  }

  /**
   * Create a new user
   */
  async createUser(
    userData: Omit<User, "id" | "createdAt" | "updatedAt">,
  ): Promise<ApiResponse<User>> {
    return apiClient.post<User>(API_ENDPOINTS.USERS.BASE, userData);
  }

  /**
   * Update a user
   */
  async updateUser(
    id: string,
    updateData: Partial<Omit<User, "id" | "createdAt" | "updatedAt">>,
  ): Promise<ApiResponse<User>> {
    return apiClient.put<User>(`${API_ENDPOINTS.USERS.BASE}/${id}`, updateData);
  }

  /**
   * Delete a user
   */
  async deleteUser(id: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<{ message: string }>(
      `${API_ENDPOINTS.USERS.BASE}/${id}`,
    );
  }

  /**
   * Get all drivers
   */
  async getAllDrivers(): Promise<ApiResponse<UserWithDriverDetail[]>> {
    return apiClient.get<UserWithDriverDetail[]>(
      `${API_ENDPOINTS.USERS.BASE}/all/drivers`,
    );
  }

  /**
   * Get driver by ID
   */
  async getDriver(id: string): Promise<ApiResponse<UserWithDriverDetail>> {
    return apiClient.get<UserWithDriverDetail>(
      `${API_ENDPOINTS.DRIVERS.BASE}/${id}`,
    );
  }

  /**
   * Update driver
   */
  async updateDriver(
    id: string,
    updateData: UpdateDriverRequest,
  ): Promise<ApiResponse<{ message: string }>> {
    return apiClient.put<{ message: string }>(
      `${API_ENDPOINTS.DRIVERS.BASE}/${id}`,
      updateData,
    );
  }

  /**
   * Delete driver
   */
  async deleteDriver(id: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<{ message: string }>(
      `${API_ENDPOINTS.DRIVERS.BASE}/${id}`,
    );
  }

  /**
   * Update driver status
   */
  async updateDriverStatus(
    id: string,
    status: "active" | "inactive" | "suspended",
  ): Promise<ApiResponse<{ message: string }>> {
    return apiClient.patch<{ message: string }>(
      `${API_ENDPOINTS.DRIVERS.BASE}/${id}/status`,
      { status },
    );
  }

  /**
   * Get driver profile
   */
  async getDriverProfile(): Promise<ApiResponse<DriverDetails>> {
    return apiClient.get<DriverDetails>(API_ENDPOINTS.DRIVERS.PROFILE);
  }

  /**
   * Update driver profile
   */
  async updateDriverProfile(
    updateData: UpdateDriverRequest,
  ): Promise<ApiResponse<DriverDetails>> {
    return apiClient.put<DriverDetails>(
      API_ENDPOINTS.DRIVERS.PROFILE,
      updateData,
    );
  }

  /**
   * Get driver earnings
   */
  async getDriverEarnings(): Promise<
    ApiResponse<{ earnings: number; history: any[] }>
  > {
    return apiClient.get<{ earnings: number; history: any[] }>(
      API_ENDPOINTS.DRIVERS.EARNINGS,
    );
  }

  /**
   * Get driver rides
   */
  async getDriverRides(): Promise<ApiResponse<any[]>> {
    return apiClient.get<any[]>(API_ENDPOINTS.DRIVERS.RIDES);
  }

  /**
   * Get driver bank details
   */
  async getDriverBankDetails(): Promise<ApiResponse<any>> {
    return apiClient.get<any>(API_ENDPOINTS.DRIVERS.BANK_DETAILS);
  }

  /**
   * Update driver bank details
   */
  async updateDriverBankDetails(
    bankDetails: any,
  ): Promise<ApiResponse<{ message: string }>> {
    return apiClient.put<{ message: string }>(
      API_ENDPOINTS.DRIVERS.BANK_DETAILS,
      bankDetails,
    );
  }

  /**
   * Get driver settings
   */
  async getDriverSettings(): Promise<ApiResponse<any>> {
    return apiClient.get<any>(API_ENDPOINTS.DRIVERS.SETTINGS);
  }

  /**
   * Update driver settings
   */
  async updateDriverSettings(
    settings: any,
  ): Promise<ApiResponse<{ message: string }>> {
    return apiClient.put<{ message: string }>(
      API_ENDPOINTS.DRIVERS.SETTINGS,
      settings,
    );
  }
}

// Export singleton instance
export const userService = new UserService();

// Legacy function exports for backward compatibility
export const getAuthToken = async (): Promise<string> => {
  return userService.getAuthToken();
};

export const checkUserExists = async (
  phone: string,
): Promise<{
  success: boolean;
  message: string;
  error?: string;
}> => {
  return await userService.checkUserExists(phone);
};
