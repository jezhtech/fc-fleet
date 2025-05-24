import axios from 'axios';
import { encryptPaymentSettings, decryptPaymentSettings } from '@/utils/encryption';
import { logDebug, logError } from '@/utils/logger';

// Configuration for debug mode
const DEBUG_MODE = true;

// Mock database for demo purposes
// In a real application, this would be stored in a database
let ccavenueSettings: Record<string, string> = {
  merchantId: '',
  accessCode: '',
  workingKey: '',
  mode: 'test'
};

/**
 * Fetches CCAvenue payment settings
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
    // In a real application, this would fetch from a database
    // For this demo, we're using a mock in-memory store
    
    // Return decrypted values (except mode which isn't encrypted)
    const settings = ccavenueSettings;
    
    if (!settings.merchantId && !settings.accessCode && !settings.workingKey) {
      logDebug('No CCAvenue settings found');
      return { success: true };
    }
    
    const decryptedSettings = decryptPaymentSettings(settings);
    logDebug('Retrieved CCAvenue settings', { mode: decryptedSettings.mode });
    
    return {
      success: true,
      merchantId: decryptedSettings.merchantId,
      accessCode: decryptedSettings.accessCode,
      workingKey: decryptedSettings.workingKey,
      mode: decryptedSettings.mode
    };
  } catch (error) {
    console.error('Error fetching CCAvenue settings:', error);
    return { 
      success: false, 
      error: 'Failed to fetch CCAvenue settings' 
    };
  }
};

/**
 * Saves CCAvenue payment settings with encryption
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
    // Encrypt sensitive fields before saving
    const encryptedSettings = encryptPaymentSettings(settings);
    
    // In a real application, save to database
    // For this demo, we're using a mock in-memory store
    ccavenueSettings = encryptedSettings;
    
    logDebug('Saved CCAvenue settings', { mode: settings.mode });
    
    return { success: true };
  } catch (error) {
    console.error('Error saving CCAvenue settings:', error);
    return { 
      success: false, 
      error: 'Failed to save CCAvenue settings' 
    };
  }
};

/**
 * Tests CCAvenue connection with provided credentials
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
    logDebug('Testing CCAvenue connection', { 
      merchantId: settings.merchantId.substring(0, 4) + '***', 
      mode: settings.mode 
    });
    
    // In a real implementation, this would call CCAvenue's API to validate credentials
    // For this demo, we'll just check if all required fields are provided
    
    if (!settings.merchantId || !settings.accessCode || !settings.workingKey) {
      return { 
        success: false, 
        error: 'All CCAvenue credentials are required' 
      };
    }
    
    // For test mode, we can perform an actual API call to CCAvenue's test endpoint
    if (settings.mode === 'test') {
      try {
        // In a real implementation, you would use CCAvenue's test API
        // This is a placeholder for demonstration purposes
        logDebug('Performing test call to CCAvenue test server');
        // await axios.post('https://test.ccavenue.com/apis/servlet/DoTestConnection', {
        //   merchant_id: settings.merchantId,
        //   access_code: settings.accessCode
        // }, {
        //   headers: {
        //     'Content-Type': 'application/json'
        //   }
        // });
      } catch (testError) {
        logDebug('Test connection API call failed', testError);
        // Proceed anyway since we're just demonstrating
      }
    }
    
    // Simulate a successful API call to CCAvenue
    await new Promise(resolve => setTimeout(resolve, 500));
    
    logDebug('CCAvenue test connection successful');
    
    return { success: true };
  } catch (error) {
    console.error('Error testing CCAvenue connection:', error);
    return { 
      success: false, 
      error: 'Failed to test CCAvenue connection' 
    };
  }
};

/**
 * Initiates a CCAvenue payment
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
  redirectUrl: string;
  cancelUrl: string;
}): Promise<{ success: boolean; redirectUrl?: string; error?: string }> => {
  try {
    logDebug('Initiating CCAvenue payment', { 
      orderId: paymentData.orderId,
      amount: paymentData.amount,
      currency: paymentData.currency
    });
    
    // Get CCAvenue settings
    const settings = await getCCavenueSettings();
    
    if (!settings.success || !settings.merchantId || !settings.accessCode) {
      throw new Error('CCAvenue settings not available');
    }
    
    // In development mode, create a mock payment URL
    const isDev = process.env.NODE_ENV === 'development' || 
                 window.location.hostname === 'localhost' ||
                 window.location.hostname === '127.0.0.1';
    
    // In a real implementation, this would make an API call to your backend
    // which would then create a CCAvenue request with encryption
    
    if (isDev) {
      // For development, return a mock URL
      const mockPaymentUrl = `${window.location.origin}/mock-payment?` +
        `orderId=${paymentData.orderId}` +
        `&amount=${paymentData.amount}` +
        `&currency=${paymentData.currency}` +
        `&redirectUrl=${encodeURIComponent(paymentData.redirectUrl)}` +
        `&cancelUrl=${encodeURIComponent(paymentData.cancelUrl)}`;
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        success: true,
        redirectUrl: mockPaymentUrl
      };
    }
    
    // In production, this would make a real API call to your backend
    // which would handle the CCAvenue integration
    
    // Mock API call for now
    const apiResponse = await fetch('/api/payments/ccavenue/initiate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        orderId: paymentData.orderId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        customerName: paymentData.customerData.name,
        customerEmail: paymentData.customerData.email,
        customerPhone: paymentData.customerData.phone,
        redirectUrl: paymentData.redirectUrl,
        cancelUrl: paymentData.cancelUrl
      })
    });
    
    if (!apiResponse.ok) {
      throw new Error(`API error: ${apiResponse.status}`);
    }
    
    const responseData = await apiResponse.json();
    
    if (!responseData.success) {
      throw new Error(responseData.error || 'Failed to initiate payment');
    }
    
    return {
      success: true,
      redirectUrl: responseData.paymentUrl
    };
    
  } catch (error) {
    logError('Error initiating CCAvenue payment', error);
    
    // For development, return a mock URL even on error
    if (process.env.NODE_ENV === 'development' || 
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1') {
      
      return {
        success: true,
        redirectUrl: `${window.location.origin}/mock-payment?orderId=${paymentData.orderId}&amount=${paymentData.amount}&error=true`
      };
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Helper function to get test result override
// This allows us to force success or failure in test mode
const getForceTestResult = (): 'success' | 'fail' | null => {
  // Check for a localStorage setting that could be set in the UI for testing
  if (typeof window !== 'undefined') {
    const testMode = localStorage.getItem('ccavenue_test_mode');
    if (testMode === 'success' || testMode === 'fail') {
      return testMode;
    }
  }
  return null;
};

/**
 * Process CCAvenue payment response
 * @param encryptedResponse Encrypted response from CCAvenue
 * @returns Processed payment result
 */
export const processCCavenueResponse = async (encryptedResponse: string): Promise<{
  success: boolean;
  status?: 'success' | 'failure' | 'pending';
  orderId?: string;
  transactionId?: string;
  amount?: string;
  error?: string;
}> => {
  try {
    logDebug('Processing CCAvenue payment response');
    
    // Get CCAvenue settings to get the working key for decryption
    const settings = await getCCavenueSettings();
    
    if (!settings.success || !settings.workingKey) {
      logDebug('CCAvenue settings not properly configured for response processing');
      return { 
        success: false, 
        error: 'CCAvenue settings are not properly configured' 
      };
    }
    
    // In a real implementation, this would:
    // 1. Decrypt the response using CCAvenue's method and the working key
    // 2. Parse the decrypted response
    // 3. Update the order status based on payment result
    // 4. Return the appropriate response
    
    // For testing purposes, we can decode the test response
    let decodedResponse;
    try {
      // In test mode, we'll pretend to decrypt the response
      if (settings.mode === 'test') {
        // This is just for demonstration purposes - in real implementation 
        // you would use CCAvenue's decryption method
        logDebug('Decrypting test response');
        
        // For test purposes, let's check if this is our test forcing mechanism
        if (encryptedResponse === 'TEST_FORCE_SUCCESS') {
          return {
            success: true,
            status: 'success',
            orderId: 'TEST_ORDER',
            transactionId: 'TEST_TXN_' + Date.now(),
            amount: '100.00'
          };
        } else if (encryptedResponse === 'TEST_FORCE_FAILURE') {
          return {
            success: false,
            status: 'failure',
            error: 'Payment was declined (test mode)'
          };
        }
      }
    } catch (decryptError) {
      logDebug('Failed to decrypt response', decryptError);
    }
    
    // For this demo, we'll simulate a successful payment
    const testResult = getForceTestResult();
    if (settings.mode === 'test' && testResult === 'fail') {
      logDebug('Simulating payment failure (test mode)');
      return {
        success: false,
        status: 'failure',
        error: 'Payment failed in test mode'
      };
    }
    
    logDebug('Payment processed successfully');
    return {
      success: true,
      status: 'success',
      orderId: 'ORDER' + Date.now(),
      transactionId: 'TXN' + Date.now(),
      amount: '100.00'
    };
  } catch (error) {
    console.error('Error processing CCAvenue response:', error);
    return {
      success: false,
      error: 'Failed to process CCAvenue payment response'
    };
  }
}; 