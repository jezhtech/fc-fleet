import { toast } from "sonner";
import { initiateCCavenuePayment, processCCavenueResponse } from './ccavenueService';

// Types for payment integration
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

class PaymentService {
  private baseUrl: string;

  constructor() {
    // Use environment variable or default to localhost for development
    this.baseUrl = import.meta.env.VITE_BACKEND_URL || "";
  }

  /**
   * Initialize payment with CCAvenue
   */
  async initializePayment(
    paymentData: PaymentRequest
  ): Promise<PaymentResponse> {
    try {
      const idToken = await this.getFirebaseIdToken();

      if (!idToken) {
        throw new Error("Authentication token not available");
      }
      console.log("Initializing payment with data:", this.baseUrl);
      const response = await fetch(`http://localhost:3000/api/payment/initialize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(paymentData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to initialize payment");
      }

      return result;
    } catch (error) {
      console.error("Payment initialization error:", error);
      throw new Error(
        error instanceof Error ? error.message : "Payment initialization failed"
      );
    }
  }

  /**
   * Handle payment response from CCAvenue
   */
  async handlePaymentResponse(
    encResp: string,
    orderId: string
  ): Promise<PaymentStatusResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/payment/response`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ encResp, orderId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to process payment response");
      }

      return result;
    } catch (error) {
      console.error("Payment response handling error:", error);
      throw new Error(
        error instanceof Error
          ? error.message
          : "Payment response processing failed"
      );
    }
  }

  /**
   * Handle payment success redirect
   */
  async handlePaymentSuccess(
    encResp: string,
    orderId: string
  ): Promise<PaymentStatusResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/payment/success?encResp=${encodeURIComponent(
          encResp
        )}&orderId=${encodeURIComponent(orderId)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to process payment success");
      }

      return result;
    } catch (error) {
      console.error("Payment success handling error:", error);
      throw new Error(
        error instanceof Error
          ? error.message
          : "Payment success processing failed"
      );
    }
  }

  /**
   * Handle payment cancel redirect
   */
  async handlePaymentCancel(
    encResp: string,
    orderId: string
  ): Promise<PaymentStatusResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/payment/cancel?encResp=${encodeURIComponent(
          encResp
        )}&orderId=${encodeURIComponent(orderId)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to process payment cancellation"
        );
      }

      return result;
    } catch (error) {
      console.error("Payment cancel handling error:", error);
      throw new Error(
        error instanceof Error
          ? error.message
          : "Payment cancellation processing failed"
      );
    }
  }



  /**
   * Get payment history for authenticated user
   */
  async getPaymentHistory(): Promise<PaymentHistoryResponse> {
    try {
      const idToken = await this.getFirebaseIdToken();

      if (!idToken) {
        throw new Error("Authentication token not available");
      }

      const response = await fetch(`${this.baseUrl}/api/payment/history`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to retrieve payment history");
      }

      return result;
    } catch (error) {
      console.error("Payment history error:", error);
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to retrieve payment history"
      );
    }
  }

  /**
   * Process CCAvenue payment form submission
   */
  async processCCAvenuePayment(
    paymentData: PaymentRequest
  ): Promise<{ success: boolean; paymentUrl?: string; error?: string }> {
    try {
      // Use the new CCAvenue service instead of backend calls
      const redirectUrl = `${window.location.origin}/book-chauffeur?orderId=${paymentData.orderId}&paymentStatus=success`;
      const cancelUrl = `${window.location.origin}/book-chauffeur?orderId=${paymentData.orderId}&paymentStatus=cancel`;
      
      // Get authentication token
      const token = await this.getFirebaseIdToken();
      
      const response = await initiateCCavenuePayment({
        orderId: paymentData.orderId,
        amount: paymentData.amount,
        currency: 'AED', // Default to AED for UAE
        customerData: {
          name: paymentData.customerName,
          email: paymentData.customerEmail,
          phone: paymentData.customerPhone
        },
        redirectUrl,
        cancelUrl,
        token
      });

      if (!response.success) {
        throw new Error(response.error || "Payment initialization failed");
      }

      // Return the payment URL for redirection
      return {
        success: true,
        paymentUrl: response.paymentUrl,
      };
    } catch (error) {
      console.error("CCAvenue payment processing error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Payment processing failed",
      };
    }
  }

  /**
   * Handle CCAvenue payment response (for webhook or redirect)
   */
  async processCCAvenueResponse(
    encResp: string,
    orderId: string,
    isSuccess: boolean = true
  ): Promise<PaymentStatusResponse> {
    try {
      // Use the new CCAvenue service instead of backend calls
      const response = await processCCavenueResponse(encResp, orderId, isSuccess);
      
      if (!response.success) {
        throw new Error(response.error || 'Payment response processing failed');
      }
      
      // Convert the response to match the expected PaymentStatusResponse format
      const paymentStatusResponse: PaymentStatusResponse = {
        success: true,
        message: response.data?.statusMessage || 'Payment processed successfully',
        data: {
          orderId: response.data?.orderId || orderId,
          trackingId: response.data?.trackingId || '',
          orderStatus: response.data?.orderStatus || 'Success',
          statusMessage: response.data?.statusMessage || 'Payment successful',
          bankRefNo: response.data?.bankRefNo || '',
          transactionDate: response.data?.transactionDate || new Date().toISOString(),
          isSuccessful: response.data?.isSuccessful || true
        }
      };
      
      return paymentStatusResponse;
    } catch (error) {
      console.error("CCAvenue response processing error:", error);
      throw new Error(
        error instanceof Error
          ? error.message
          : "Payment response processing failed"
      );
    }
  }

  /**
   * Get authentication token from localStorage or context
   */
  private getAuthToken(): string {
    try {
      // Try to get Firebase auth token from localStorage
      const firebaseKeys = Object.keys(localStorage).filter(
        (key) => key.includes("firebase:authUser:") && key.includes("[DEFAULT]")
      );

      if (firebaseKeys.length > 0) {
        const firebaseKey = firebaseKeys[0];
        const firebaseUser = localStorage.getItem(firebaseKey);

        if (firebaseUser) {
          try {
            const parsed = JSON.parse(firebaseUser);
            // Return the access token from Firebase auth
            const accessToken = parsed.stsTokenManager?.accessToken;
            console.log("Found Firebase access token:", !!accessToken);
            return accessToken || "";
          } catch (error) {
            console.error("Error parsing Firebase user data:", error);
          }
        }
      }

      // Fallback to other token sources
      const token =
        localStorage.getItem("authToken") ||
        sessionStorage.getItem("authToken") ||
        localStorage.getItem("firebase_token");

      if (token) {
        try {
          const parsed = JSON.parse(token);
          return (
            parsed.stsTokenManager?.accessToken || parsed.accessToken || token
          );
        } catch {
          return token;
        }
      }

      // Return empty string if no token found
      console.log("No auth token found in localStorage");
      return "";
    } catch (error) {
      console.error("Error getting auth token:", error);
      return "";
    }
  }

  /**
   * Get Firebase ID token for backend authentication
   */
  async getFirebaseIdToken(): Promise<string> {
    try {
      // Import Firebase auth dynamically to avoid circular dependencies
      const { getAuth } = await import("firebase/auth");
      const auth = getAuth();

      if (auth.currentUser) {
        const idToken = await auth.currentUser.getIdToken();
        console.log("Got Firebase ID token:", !!idToken);
        return idToken;
      }

      console.log("No current user in Firebase auth");
      return "";
    } catch (error) {
      console.error("Error getting Firebase ID token:", error);
      return "";
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const idToken = await this.getFirebaseIdToken();
      console.log("Payment service auth check - ID Token found:", !!idToken);
      return !!idToken;
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
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (
      data.customerPhone &&
      !phoneRegex.test(data.customerPhone.replace(/\s/g, ""))
    ) {
      errors.push("Invalid phone number format");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Create and export singleton instance
export const paymentService = new PaymentService();
