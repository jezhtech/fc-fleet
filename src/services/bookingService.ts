import { getAuthToken } from "./userService";
import { config } from "@/constants/config";

// Helper function to make authenticated API calls
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const token = await getAuthToken();

  const response = await fetch(`${config.apiUrl}/booking${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "API request failed");
  }

  return data;
};

/**
 * Confirm a booking
 */
export const confirmBooking = async (
  bookingId: string
): Promise<{
  success: boolean;
  message: string;
  emailSent: boolean;
  data: {
    bookingId: string;
    status: string;
  };
}> => {
  return apiCall("/confirm", {
    method: "POST",
    body: JSON.stringify({ bookingId }),
  });
};

/**
 * Assign driver to booking
 */
export const assignDriver = async (
  bookingId: string,
  driverId: string
): Promise<{
  success: boolean;
  message: string;
  notifications: {
    customer: boolean;
    driver: boolean;
  };
  data: {
    bookingId: string;
    driverId: string;
    status: string;
  };
}> => {
  return apiCall("/assign-driver", {
    method: "POST",
    body: JSON.stringify({ bookingId, driverId }),
  });
};

export const bookingWithCash = async (
  orderId: string,
  customerName: string,
  customerEmail: string,
  customerPhone: string
): Promise<{
  success: boolean;
  message: string;
  data: {
    bookingId: string;
  };
}> => {
  return apiCall("/update-cash-payment", {
    method: "POST",
    body: JSON.stringify({
      orderId,
      customerName,
      customerEmail,
      customerPhone,
    }),
  });
};

/**
 * Cancel a booking
 */
export const cancelBooking = async (
  bookingId: string,
  reason: string
): Promise<{
  success: boolean;
  message: string;
  emailSent: boolean;
  data: {
    bookingId: string;
    status: string;
    reason: string;
  };
}> => {
  return apiCall("/cancel", {
    method: "POST",
    body: JSON.stringify({ bookingId, reason }),
  });
};

/**
 * Get available drivers for assignment
 */
export const getAvailableDrivers = async (): Promise<{
  success: boolean;
  data: Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    status: string;
    vehicleNumber?: string;
    rating?: number;
  }>;
}> => {
  return apiCall("/available-drivers");
};

/**
 * Get booking details
 */
export const getBookingDetails = async (
  bookingId: string
): Promise<{
  success: boolean;
  data: any;
}> => {
  return apiCall(`/${bookingId}`);
};

export default {
  confirmBooking,
  assignDriver,
  cancelBooking,
  getAvailableDrivers,
  getBookingDetails,
};
