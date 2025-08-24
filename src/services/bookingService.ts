import { apiClient, API_ENDPOINTS } from "@/lib/api";
import type {
  ApiResponse,
  PaymentInfo,
  Booking,
  BookingWithRelations,
  CreateBookingRequest,
  UpdateBookingRequest,
  BookingFilters,
} from "@/types";
import { paymentService } from "./paymentService";

// Booking Service Class
class BookingService {
  /**
   * Get all bookings with optional filtering
   */
  async getAllBookings(
    filters?: BookingFilters
  ): Promise<ApiResponse<BookingWithRelations[]>> {
    return apiClient.get<BookingWithRelations[]>(
      `${API_ENDPOINTS.BOOKINGS.BASE}/all`,
      filters
    );
  }

  /**
   * Get booking by ID
   */
  async getBookingById(id: string): Promise<ApiResponse<BookingWithRelations>> {
    return apiClient.get<BookingWithRelations>(
      `${API_ENDPOINTS.BOOKINGS.BASE}/${id}`
    );
  }

  /**
   * Create a new booking
   */
  async createBooking(
    data: CreateBookingRequest
  ): Promise<ApiResponse<Booking>> {
    return apiClient.post<Booking>(API_ENDPOINTS.BOOKINGS.BASE, data);
  }

  /**
   * Update booking
   */
  async updateBooking(
    id: string,
    data: UpdateBookingRequest
  ): Promise<ApiResponse<Booking>> {
    return apiClient.put<Booking>(`${API_ENDPOINTS.BOOKINGS.BASE}/${id}`, data);
  }

  /**
   * Delete booking
   */
  async deleteBooking(id: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<{ message: string }>(
      `${API_ENDPOINTS.BOOKINGS.BASE}/${id}`
    );
  }

  /**
   * Update booking status
   */
  async updateBookingStatus(
    id: string,
    status: string
  ): Promise<ApiResponse<Booking>> {
    return apiClient.patch<Booking>(
      `${API_ENDPOINTS.BOOKINGS.BASE}/${id}/status`,
      { status }
    );
  }

  /**
   * Get bookings by user ID
   */
  async getBookingsByUserId(
    userId: string
  ): Promise<ApiResponse<BookingWithRelations[]>> {
    return apiClient.get<BookingWithRelations[]>(
      `${API_ENDPOINTS.BOOKINGS.BY_USER}/${userId}`
    );
  }

  /**
   * Get bookings by vehicle ID
   */
  async getBookingsByVehicleId(
    vehicleId: string
  ): Promise<ApiResponse<BookingWithRelations[]>> {
    return apiClient.get<BookingWithRelations[]>(
      `${API_ENDPOINTS.BOOKINGS.BY_VEHICLE}/${vehicleId}`
    );
  }

  /**
   * Get booking statistics
   */
  async getBookingStats(): Promise<
    ApiResponse<{
      total: number;
      byStatus: Record<string, number>;
      byType: Record<string, number>;
      recentBookings: number;
    }>
  > {
    return apiClient.get(API_ENDPOINTS.BOOKINGS.STATS);
  }

  /**
   * Confirm a booking
   */
  async confirmBooking(bookingId: string): Promise<ApiResponse<Booking>> {
    return apiClient.post<Booking>(API_ENDPOINTS.BOOKINGS.CONFIRM, {
      bookingId,
    });
  }

  /**
   * Assign driver to booking
   */
  async assignDriver(
    bookingId: string,
    driverId: string
  ): Promise<ApiResponse<Booking>> {
    return apiClient.post<Booking>(API_ENDPOINTS.BOOKINGS.ASSIGN_DRIVER, {
      bookingId,
      driverId,
    });
  }

  /**
   * Cancel booking
   */
  async cancelBooking(
    bookingId: string,
    reason: string
  ): Promise<ApiResponse<Booking>> {
    return apiClient.post<Booking>(API_ENDPOINTS.BOOKINGS.CANCEL, {
      bookingId,
      reason,
    });
  }

  /**
   * Update payment information
   */
  async updatePaymentInfo(
    id: string,
    paymentInfo: Partial<PaymentInfo>
  ): Promise<ApiResponse<Booking>> {
    return apiClient.patch<Booking>(`${API_ENDPOINTS.BOOKINGS.BASE}/${id}`, {
      paymentInfo,
    });
  }
}

// Export singleton instance
export const bookingService = new BookingService();

// Legacy function exports for backward compatibility
export const confirmBooking = async (bookingId: string) => {
  return bookingService.confirmBooking(bookingId);
};

export const assignDriver = async (bookingId: string, driverId: string) => {
  return bookingService.assignDriver(bookingId, driverId);
};

export const cancelBooking = async (bookingId: string, reason: string) => {
  return bookingService.cancelBooking(bookingId, reason);
};

export const getAvailableDrivers = async () => {
  // This would need to be implemented in the backend
  return {
    success: true,
    data: [],
    message: "Available drivers endpoint not yet implemented",
  };
};

export const getBookingDetails = async (bookingId: string) => {
  return bookingService.getBookingById(bookingId);
};

export const bookingWithCash = async (orderId: string, amount: number) => {
  await paymentService.paymentWithCash({ orderId, amount });
  return {
    success: true,
    message: "Cash payment processed successfully",
    data: { bookingId: orderId },
  };
};
