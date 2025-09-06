import { config } from "@/constants/config";
import { logDebug, logError } from "@/utils/logger";
/**
 * Fetches CCAvenue payment settings from backend
 * @returns Promise with CCAvenue settings
 */
export const getCCavenueSettings = async (): Promise<{
  success: boolean;
  merchantId?: string;
  accessCode?: string;
  workingKey?: string;
  mode?: string;
  error?: string;
}> => {
  try {
    const response = await fetch(`${config.apiUrl}/payment/ccavenue/settings`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }

    const data = await response.json();

    if (data.success) {
      logDebug("Retrieved CCAvenue settings from backend", {
        mode: data.data?.mode,
      });
      return {
        success: true,
        merchantId: data.data?.merchantId,
        accessCode: data.data?.accessCode,
        workingKey: data.data?.workingKey,
        mode: data.data?.mode,
      };
    } else {
      throw new Error(data.error || "Failed to fetch settings");
    }
  } catch (error) {
    console.error("Error fetching CCAvenue settings:", error);
    return {
      success: false,
      error: "Failed to fetch CCAvenue settings from backend",
    };
  }
};

/**
 * Saves CCAvenue payment settings to backend
 * @param settings CCAvenue settings to save
 * @returns Promise with success status
 */
export const saveCCavenueSettings = async (settings: {
  merchantId: string;
  accessCode: string;
  workingKey: string;
  mode: string;
}): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await fetch(`${config.apiUrl}/payment/ccavenue/settings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }

    const data = await response.json();

    if (data.success) {
      logDebug("Saved CCAvenue settings to backend", { mode: settings.mode });
      return { success: true };
    } else {
      throw new Error(data.error || "Failed to save settings");
    }
  } catch (error) {
    console.error("Error saving CCAvenue settings:", error);
    return {
      success: false,
      error: "Failed to save CCAvenue settings to backend",
    };
  }
};

/**
 * Tests CCAvenue connection with provided credentials via backend
 * @param settings CCAvenue settings to test
 * @returns Promise with test results
 */
export const testCCavenueConnection = async (settings: {
  merchantId: string;
  accessCode: string;
  workingKey: string;
  mode: string;
}): Promise<{ success: boolean; error?: string }> => {
  try {
    logDebug("Testing CCAvenue connection via backend", {
      merchantId: settings.merchantId.substring(0, 4) + "***",
      mode: settings.mode,
    });

    const response = await fetch(`${config.apiUrl}/payment/ccavenue/test`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }

    const data = await response.json();

    if (data.success) {
      logDebug("CCAvenue test connection successful");
      return { success: true };
    } else {
      throw new Error(data.error || "Connection test failed");
    }
  } catch (error) {
    console.error("Error testing CCAvenue connection:", error);
    return {
      success: false,
      error: "Failed to test CCAvenue connection",
    };
  }
};

/**
 * Initiates a CCAvenue payment via backend
 * @param paymentData Payment data including amount, order info, etc.
 * @returns URL to redirect user for payment completion
 */
export const initiateCCavenuePayment = async (paymentData: {
  orderId: string;
  amount: number;
  currency: string;
  customerData: {
    name: string;
    email: string;
    phone: string;
  };
  token: string;
}): Promise<{
  success: boolean;
  encRequest?: string;
  access_code?: string;
  paymentUrl?: string;
  error?: string;
}> => {
  try {
    logDebug("Initiating CCAvenue payment via backend", {
      orderId: paymentData.orderId,
      amount: paymentData.amount,
      currency: paymentData.currency,
    });

    const response = await fetch(`${config.apiUrl}/payment/initialize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${paymentData.token}`,
      },
      body: JSON.stringify({
        orderId: paymentData.orderId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        customerName: paymentData.customerData.name,
        customerEmail: paymentData.customerData.email,
        customerPhone: paymentData.customerData.phone,
      }),
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }

    const responseData = await response.json();

    if (!responseData.success) {
      throw new Error(responseData.error || "Failed to initiate payment");
    }

    return {
      success: true,
      encRequest: responseData.data?.encRequest,
      access_code: responseData.data?.access_code,
      paymentUrl: responseData.data?.paymentUrl,
    };
  } catch (error) {
    logError("Error initiating CCAvenue payment", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

/**
 * Process CCAvenue payment response via backend
 * @param encryptedResponse Encrypted response from CCAvenue
 * @param orderId Order ID for the payment
 * @param isSuccess Whether this is a success or failure response
 * @returns Processed payment result
 */
export const processCCavenueResponse = async (
  encryptedResponse: string,
  orderId: string,
): Promise<{
  success: boolean;
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
}> => {
  try {
    logDebug("Processing CCAvenue payment response via backend");

    // In development mode, handle test responses
    const isDev =
      process.env.NODE_ENV === "development" ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    if (isDev) {
      // Handle test responses for development
      if (encryptedResponse === "TEST_FORCE_SUCCESS") {
        return {
          success: true,
          data: {
            orderId: orderId,
            trackingId: "TEST_TXN_" + Date.now(),
            orderStatus: "Success",
            statusMessage: "Payment successful",
            bankRefNo: "TEST_BANK_" + Date.now(),
            transactionDate: new Date().toISOString(),
            isSuccessful: true,
          },
        };
      } else if (encryptedResponse === "TEST_FORCE_FAILURE") {
        return {
          success: false,
          error: "Payment was declined (test mode)",
        };
      }
    }

    // Use backend API to process the response
    const response = await fetch(`${config.apiUrl}/payment/response`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        encResp: encryptedResponse,
        orderId: orderId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }

    const responseData = await response.json();

    if (!responseData.success) {
      throw new Error(
        responseData.error || "Failed to process payment response",
      );
    }

    return {
      success: true,
      data: {
        orderId: responseData.data?.orderId || orderId,
        trackingId: responseData.data?.trackingId || "",
        orderStatus: responseData.data?.orderStatus || "Success",
        statusMessage: responseData.data?.statusMessage || "Payment processed",
        bankRefNo: responseData.data?.bankRefNo || "",
        transactionDate:
          responseData.data?.transactionDate || new Date().toISOString(),
        isSuccessful: responseData.data?.isSuccessful || true,
      },
    };
  } catch (error) {
    console.error("Error processing CCAvenue response:", error);
    return {
      success: false,
      error: "Failed to process CCAvenue payment response",
    };
  }
};
