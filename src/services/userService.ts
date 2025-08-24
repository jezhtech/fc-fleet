import { apiClient, API_ENDPOINTS } from "@/lib/api";
import type {
  ApiResponse,
  Driver,
  BackendDriverResponse,
  CreateDriverRequest,
  UpdateDriverRequest,
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
    driverData: CreateDriverRequest
  ): Promise<ApiResponse<BackendDriverResponse>> {
    return apiClient.post<BackendDriverResponse>(
      API_ENDPOINTS.DRIVERS.BASE,
      driverData
    );
  }

  /**
   * Get all drivers
   */
  async getDrivers(): Promise<ApiResponse<BackendDriverResponse[]>> {
    return apiClient.get<BackendDriverResponse[]>(API_ENDPOINTS.DRIVERS.BASE);
  }

  /**
   * Get driver by ID
   */
  async getDriver(id: string): Promise<ApiResponse<BackendDriverResponse>> {
    return apiClient.get<BackendDriverResponse>(
      `${API_ENDPOINTS.DRIVERS.BASE}/${id}`
    );
  }

  /**
   * Update driver
   */
  async updateDriver(
    id: string,
    updateData: UpdateDriverRequest
  ): Promise<ApiResponse<{ message: string }>> {
    return apiClient.put<{ message: string }>(
      `${API_ENDPOINTS.DRIVERS.BASE}/${id}`,
      updateData
    );
  }

  /**
   * Delete driver
   */
  async deleteDriver(id: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<{ message: string }>(
      `${API_ENDPOINTS.DRIVERS.BASE}/${id}`
    );
  }

  /**
   * Update driver status
   */
  async updateDriverStatus(
    id: string,
    status: "active" | "inactive" | "suspended"
  ): Promise<ApiResponse<{ message: string }>> {
    return apiClient.patch<{ message: string }>(
      `${API_ENDPOINTS.DRIVERS.BASE}/${id}/status`,
      { status }
    );
  }

  /**
   * Get driver profile
   */
  async getDriverProfile(): Promise<ApiResponse<BackendDriverResponse>> {
    return apiClient.get<BackendDriverResponse>(API_ENDPOINTS.DRIVERS.PROFILE);
  }

  /**
   * Update driver profile
   */
  async updateDriverProfile(
    updateData: UpdateDriverRequest
  ): Promise<ApiResponse<BackendDriverResponse>> {
    return apiClient.put<BackendDriverResponse>(
      API_ENDPOINTS.DRIVERS.PROFILE,
      updateData
    );
  }

  /**
   * Get driver earnings
   */
  async getDriverEarnings(): Promise<
    ApiResponse<{ earnings: number; history: any[] }>
  > {
    return apiClient.get<{ earnings: number; history: any[] }>(
      API_ENDPOINTS.DRIVERS.EARNINGS
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
    bankDetails: any
  ): Promise<ApiResponse<{ message: string }>> {
    return apiClient.put<{ message: string }>(
      API_ENDPOINTS.DRIVERS.BANK_DETAILS,
      bankDetails
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
    settings: any
  ): Promise<ApiResponse<{ message: string }>> {
    return apiClient.put<{ message: string }>(
      API_ENDPOINTS.DRIVERS.SETTINGS,
      settings
    );
  }
}

// Export singleton instance
export const userService = new UserService();

// Legacy function exports for backward compatibility
export const getAuthToken = async (): Promise<string> => {
  return userService.getAuthToken();
};

export const createDriver = async (driverData: CreateDriverRequest) => {
  return userService.createDriver(driverData);
};

export const getDrivers = async () => {
  return userService.getDrivers();
};

export const getDriver = async (id: string) => {
  return userService.getDriver(id);
};

export const updateDriver = async (
  id: string,
  updateData: UpdateDriverRequest
) => {
  return userService.updateDriver(id, updateData);
};

export const deleteDriver = async (id: string) => {
  return userService.deleteDriver(id);
};

export const updateDriverStatus = async (
  id: string,
  status: "active" | "inactive" | "suspended"
) => {
  return userService.updateDriverStatus(id, status);
};
