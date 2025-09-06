import type { ApiResponse } from "@/types";

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

// API Client Class
class ApiClient {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  // Set authentication token
  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  // Get authentication token from localStorage
  private getStoredToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("authToken");
    }
    return null;
  }

  // Get headers for requests
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    const token = this.authToken || this.getStoredToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  }

  // Generic request method
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const config: RequestInit = {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      };

      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.message || `HTTP ${response.status}`,
        );
      }

      return data;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";

      // Show toast for user-facing errors
      if (typeof window !== "undefined") {
        console.error(error);
      }

      return {
        success: false,
        message: "Request failed",
        error: errorMessage,
      };
    }
  }

  // GET request
  async get<T>(
    endpoint: string,
    params?: Record<string, any>,
  ): Promise<ApiResponse<T>> {
    const queryString = params
      ? `?${new URLSearchParams(params).toString()}`
      : "";
    return this.request<T>(`${endpoint}${queryString}`, { method: "GET" });
  }

  // POST request
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT request
  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PATCH request
  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  // Upload file
  async upload<T>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, any>,
  ): Promise<ApiResponse<T>> {
    try {
      const formData = new FormData();
      formData.append("file", file);

      if (additionalData) {
        Object.entries(additionalData).forEach(([key, value]) => {
          formData.append(key, value);
        });
      }

      const url = `${this.baseUrl}${endpoint}`;
      const headers: HeadersInit = {};

      const token = this.authToken || this.getStoredToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.message || `HTTP ${response.status}`,
        );
      }

      return data;
    } catch (error) {
      console.error(`Upload Error (${endpoint}):`, error);

      const errorMessage =
        error instanceof Error ? error.message : "Upload failed";

      if (typeof window !== "undefined") {
        console.error(error);
      }

      return {
        success: false,
        message: "Upload failed",
        error: errorMessage,
      };
    }
  }
}

// Create and export API client instance
export const apiClient = new ApiClient(API_BASE_URL);

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    LOGOUT: "/auth/logout",
    REFRESH: "/auth/refresh",
    VERIFY: "/auth/verify",
  },

  // Users
  USERS: {
    BASE: "/user",
    PROFILE: "/user/profile",
    UPDATE: "/user/profile",
    DELETE: "/user/profile",
  },

  // Drivers
  DRIVERS: {
    BASE: "/user/drivers",
    PROFILE: "/user/drivers/profile",
    EARNINGS: "/user/drivers/earnings",
    RIDES: "/user/drivers/rides",
    BANK_DETAILS: "/user/drivers/bank-details",
    SETTINGS: "/user/drivers/settings",
  },

  // Vehicles
  VEHICLES: {
    BASE: "/vehicle",
    BY_TRANSPORT: "/vehicle/transport",
    AVAILABLE: "/vehicle/available",
    STATS: "/vehicle/stats",
  },

  // Transports
  TRANSPORTS: {
    BASE: "/transport",
    WITH_VEHICLES: "/transport/vehicles",
    STATS: "/transport/stats",
  },

  // Fare Rules
  FARE_RULES: {
    BASE: "/fare-rule",
  },

  // Zones
  ZONES: {
    BASE: "/zone",
  },

  // Bookings
  BOOKINGS: {
    BASE: "/booking",
    BY_USER: "/booking/user",
    BY_VEHICLE: "/booking/vehicle",
    STATS: "/booking/stats",
    CONFIRM: "/booking/confirm",
    ASSIGN_DRIVER: "/booking/assign-driver",
    CANCEL: "/booking/cancel",
    UPDATE_STATUS: "/booking/status",
  },

  // Admin
  ADMIN: {
    USERS: "/user",
    DRIVERS: "/user/drivers",
    BOOKINGS: "/booking",
    VEHICLES: "/vehicle",
    TRANSPORTS: "/transport",
    STATS: "/stats",
    SETTINGS: "/settings",
  },

  // Payment
  PAYMENT: {
    INITIATE: "/payment/initiate",
    PROCESS: "/payment/process",
    STATUS: "/payment/status",
    HISTORY: "/payment/history",
    CASH: "/payment/pay-with-cash",
  },
} as const;

export default apiClient;
