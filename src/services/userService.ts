import { auth } from "@/lib/firebase";
import { config } from "@/constants/config";
interface Driver {
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

// Backend response structure
interface BackendDriverResponse {
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

interface CreateDriverRequest {
  name: string;
  email?: string;
  phone: string;
  taxiTypeId: string;
  vehicleTypeId: string;
  vehicleNumber: string;
  status: "active" | "inactive" | "suspended";
}

interface UpdateDriverRequest {
  name?: string;
  email?: string;
  phone?: string;
  taxiTypeId?: string;
  vehicleTypeId?: string;
  vehicleNumber?: string;
  status?: "active" | "inactive" | "suspended";
}

// Helper function to get auth token
export const getAuthToken = async (): Promise<string> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("User not authenticated");
  }
  return await user.getIdToken();
};

// Helper function to make authenticated API calls
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const token = await getAuthToken();

  const response = await fetch(`${config.apiUrl}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `HTTP error! status: ${response.status}`
    );
  }

  return response.json();
};

/**
 * Create a new driver account
 */
export const createDriver = async (
  driverData: CreateDriverRequest
): Promise<{ success: boolean; data: BackendDriverResponse; message: string }> => {
  return apiCall("/user/drivers", {
    method: "POST",
    body: JSON.stringify(driverData),
  });
};

/**
 * Get all drivers
 */
export const getDrivers = async (): Promise<{
  success: boolean;
  data: BackendDriverResponse[];
}> => {
  return apiCall("/user/drivers");
};

/**
 * Get driver by ID
 */
export const getDriver = async (
  id: string
): Promise<{ success: boolean; data: BackendDriverResponse }> => {
  return apiCall(`/user/drivers/${id}`);
};

/**
 * Update driver
 */
export const updateDriver = async (
  id: string,
  updateData: UpdateDriverRequest
): Promise<{ success: boolean; message: string }> => {
  return apiCall(`/user/drivers/${id}`, {
    method: "PUT",
    body: JSON.stringify(updateData),
  });
};

/**
 * Delete driver
 */
export const deleteDriver = async (
  id: string
): Promise<{ success: boolean; message: string }> => {
  return apiCall(`/user/drivers/${id}`, {
    method: "DELETE",
  });
};

/**
 * Update driver status
 */
export const updateDriverStatus = async (
  id: string,
  status: "active" | "inactive" | "suspended"
): Promise<{ success: boolean; message: string }> => {
  return apiCall(`/user/drivers/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
};

export type { Driver, BackendDriverResponse, CreateDriverRequest, UpdateDriverRequest };
