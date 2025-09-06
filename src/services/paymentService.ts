import { apiClient, API_ENDPOINTS } from "@/lib/api";
import type {
  PaymentRequest,
  PaymentResponse,
  PaymentStatusResponse,
  PaymentHistoryResponse,
} from "@/types";

// Payment Service Class
class PaymentService {
  private baseUrl: string;

  constructor() {
    this.baseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
  }

  /**
   * Initialize payment
   */
  async initializePayment(
    paymentData: PaymentRequest,
  ): Promise<PaymentResponse> {
    try {
      const response = await apiClient.post<PaymentResponse["data"]>(
        API_ENDPOINTS.PAYMENT.INITIATE,
        paymentData,
      );

      if (response.success && response.data) {
        return {
          success: true,
          message: response.message,
          data: response.data,
        };
      } else {
        return {
          success: false,
          message: response.message || "Payment initialization failed",
          error: response.error || "Unknown error",
        };
      }
    } catch (error) {
      console.error("Payment initialization error:", error);
      return {
        success: false,
        message: "Payment initialization failed",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Handle payment response
   */
  async handlePaymentResponse(
    encResp: string,
    orderId: string,
  ): Promise<PaymentStatusResponse> {
    try {
      const response = await apiClient.post<PaymentStatusResponse["data"]>(
        API_ENDPOINTS.PAYMENT.PROCESS,
        { encResp, orderId },
      );

      if (response.success && response.data) {
        return {
          success: true,
          message: response.message,
          data: response.data,
        };
      } else {
        return {
          success: false,
          message: response.message || "Payment processing failed",
          error: response.error || "Unknown error",
        };
      }
    } catch (error) {
      console.error("Payment response handling error:", error);
      return {
        success: false,
        message: "Payment processing failed",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Handle successful payment
   */
  async handlePaymentSuccess(
    encResp: string,
    orderId: string,
  ): Promise<PaymentStatusResponse> {
    try {
      const response = await apiClient.post<PaymentStatusResponse["data"]>(
        `${API_ENDPOINTS.PAYMENT.PROCESS}/success`,
        { encResp, orderId },
      );

      if (response.success && response.data) {
        return {
          success: true,
          message: response.message,
          data: response.data,
        };
      } else {
        return {
          success: false,
          message: response.message || "Payment success handling failed",
          error: response.error || "Unknown error",
        };
      }
    } catch (error) {
      console.error("Payment success handling error:", error);
      return {
        success: false,
        message: "Payment success handling failed",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Handle cancelled payment
   */
  async handlePaymentCancel(
    encResp: string,
    orderId: string,
  ): Promise<PaymentStatusResponse> {
    try {
      const response = await apiClient.post<PaymentStatusResponse["data"]>(
        `${API_ENDPOINTS.PAYMENT.PROCESS}/cancel`,
        { encResp, orderId },
      );

      if (response.success && response.data) {
        return {
          success: true,
          message: response.message,
          data: response.data,
        };
      } else {
        return {
          success: false,
          message: response.message || "Payment cancellation handling failed",
          error: response.error || "Unknown error",
        };
      }
    } catch (error) {
      console.error("Payment cancellation handling error:", error);
      return {
        success: false,
        message: "Payment cancellation handling failed",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get payment history
   */
  async getPaymentHistory(): Promise<PaymentHistoryResponse> {
    try {
      const response = await apiClient.get<PaymentHistoryResponse["data"]>(
        API_ENDPOINTS.PAYMENT.HISTORY,
      );

      if (response.success && response.data) {
        return {
          success: true,
          message: response.message,
          data: response.data,
        };
      } else {
        return {
          success: false,
          message: response.message || "Failed to fetch payment history",
          error: response.error || "Unknown error",
        };
      }
    } catch (error) {
      console.error("Payment history fetch error:", error);
      return {
        success: false,
        message: "Failed to fetch payment history",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Process CCAvenue payment
   */
  async processCCAvenuePayment(
    paymentData: PaymentRequest,
  ): Promise<{ success: boolean; paymentUrl?: string; error?: string }> {
    try {
      const response = await apiClient.post<{ paymentUrl: string }>(
        `${API_ENDPOINTS.PAYMENT.INITIATE}/ccavenue`,
        paymentData,
      );

      if (response.success && response.data?.paymentUrl) {
        return {
          success: true,
          paymentUrl: response.data.paymentUrl,
        };
      } else {
        return {
          success: false,
          error: response.message || "CCAvenue payment processing failed",
        };
      }
    } catch (error) {
      console.error("CCAvenue payment error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Process CCAvenue response
   */
  async processCCAvenueResponse(
    encResp: string,
    orderId: string,
    isSuccess: boolean = true,
  ): Promise<PaymentStatusResponse> {
    try {
      const response = await apiClient.post<PaymentStatusResponse["data"]>(
        `${API_ENDPOINTS.PAYMENT.PROCESS}/ccavenue`,
        { encResp, orderId, isSuccess },
      );

      if (response.success && response.data) {
        return {
          success: true,
          message: response.message,
          data: response.data,
        };
      } else {
        return {
          success: false,
          message: response.message || "CCAvenue response processing failed",
          error: response.error || "Unknown error",
        };
      }
    } catch (error) {
      console.error("CCAvenue response processing error:", error);
      return {
        success: false,
        message: "CCAvenue response processing failed",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get authentication token
   */
  private getAuthToken(): string {
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
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const token = this.getAuthToken();
      return !!token;
    } catch (error) {
      console.error("Error checking authentication:", error);
      return false;
    }
  }

  /**
   * Validate payment data before submission
   */
  validatePaymentData(data: PaymentRequest): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!data.orderId) errors.push("Order ID is required");
    if (!data.amount || data.amount <= 0)
      errors.push("Valid amount is required");
    if (!data.customerName) errors.push("Customer name is required");
    if (!data.customerEmail) errors.push("Customer email is required");
    if (!data.customerPhone) errors.push("Customer phone is required");

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (data.customerEmail && !emailRegex.test(data.customerEmail)) {
      errors.push("Invalid email format");
    }

    // Validate phone format (basic validation)
    const phoneRegex = /^\+?[1-9]\d{0,15}$/;
    if (data.customerPhone && !phoneRegex.test(data.customerPhone)) {
      errors.push("Invalid phone number format");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  async paymentWithCash(data: { orderId: string; amount: number }) {
    try {
      await apiClient.post<void>(API_ENDPOINTS.PAYMENT.CASH, data);
    } catch (error) {
      console.error("Payment response handling error:", error);
      return {
        success: false,
        message: "Payment processing failed",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

// Export singleton instance
export const paymentService = new PaymentService();
