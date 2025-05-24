import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard, RefreshCw, ExternalLink } from 'lucide-react';
import { initiateCCavenuePayment } from '@/services/paymentService';
import { CURRENCY } from '@/utils/currency';
import { toast } from 'sonner';

interface CCavenueCheckoutProps {
  orderId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  onPaymentSuccess: (transactionId: string) => void;
  onPaymentFailure: (error: string) => void;
}

const CCavenueCheckout: React.FC<CCavenueCheckoutProps> = ({
  orderId,
  amount,
  customerName,
  customerEmail,
  customerPhone,
  onPaymentSuccess,
  onPaymentFailure
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [isTestMode, setIsTestMode] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  // Check if we're in development mode
  useEffect(() => {
    setIsTestMode(
      window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1' || 
      window.location.hostname.includes('192.168.') ||
      process.env.NODE_ENV === 'development'
    );
  }, []);

  // Handle payment initialization
  const handlePaymentClick = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      setDebugInfo(null);
      
      // Current URL for response and cancel URLs
      const baseUrl = window.location.origin;
      
      // Add some debug info in test mode
      if (isTestMode) {
        setDebugInfo(`Initiating payment for order ${orderId} with amount ${amount}`);
      }
      
      // Check if we're in test mode with a forced result
      const testMode = localStorage.getItem('ccavenue_test_mode');
      if (isTestMode && testMode) {
        setDebugInfo(prevInfo => `${prevInfo}\nTest mode detected: ${testMode}`);
        
        if (testMode === 'fail') {
          // Simulate a payment failure
          setTimeout(() => {
            setError('Payment failed (test mode)');
            onPaymentFailure('Payment failed (test mode)');
            setIsProcessing(false);
          }, 1000);
          return;
        } else if (testMode === 'success') {
          // Simulate a payment success
          setTimeout(() => {
            // For test success, simulate a successful payment
            const transactionId = `TEST-TXN-${Date.now()}`;
            setIsProcessing(false);
            setDebugInfo(prevInfo => `${prevInfo}\nTest payment successful with transaction ID: ${transactionId}`);
            
            // Call success callback
            onPaymentSuccess(transactionId);
          }, 1000);
          return;
        }
      }
      
      // Normal payment flow - get payment URL
      try {
        const paymentResult = await initiateCCavenuePayment({
          orderId,
          amount,
          currency: CURRENCY.code,
          customerData: {
            name: customerName,
            email: customerEmail,
            phone: customerPhone
          },
          redirectUrl: `${baseUrl}/payment/success`,
          cancelUrl: `${baseUrl}/payment/cancel`
        });

        if (paymentResult.success && paymentResult.redirectUrl) {
          // Store the payment URL
          setPaymentUrl(paymentResult.redirectUrl);
          
          // Add debug info in test mode
          if (isTestMode) {
            setDebugInfo(prevInfo => 
              `${prevInfo}\nPayment URL generated: ${paymentResult.redirectUrl}`
            );
          }
        } else {
          const errorMessage = paymentResult.error || 'Failed to initiate payment. Please try again.';
          setError(errorMessage);
          onPaymentFailure(errorMessage);
        }
      } catch (apiError) {
        console.error('API error when initiating payment:', apiError);
        
        // In test mode, provide a mock payment URL
        if (isTestMode) {
          setDebugInfo(prevInfo => 
            `${prevInfo}\nAPI call failed. Using mock payment URL in test mode.`
          );
          setPaymentUrl(`${baseUrl}/mock-payment?orderId=${orderId}&amount=${amount}`);
        } else {
          throw apiError; // Re-throw for non-test mode to be caught by outer catch
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Error initiating CCAvenue payment:', error);
      setError(errorMessage);
      onPaymentFailure('An error occurred while processing your payment.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle simulated payment completion (for test mode)
  const handleTestPaymentSuccess = () => {
    const transactionId = `TEST-TXN-${Date.now()}`;
    onPaymentSuccess(transactionId);
  };

  const handleTestPaymentFailure = () => {
    onPaymentFailure('Payment was cancelled or failed');
  };

  const handleRetry = () => {
    setError(null);
    setDebugInfo(null);
    setPaymentUrl(null);
    // Small delay before retrying
    setTimeout(handlePaymentClick, 500);
  };

  // Handle opening payment URL in new window
  const handleOpenPaymentUrl = () => {
    if (paymentUrl) {
      // In a real environment, this would open the payment gateway
      window.open(paymentUrl, '_blank');
      
      // In test mode, simulate payment completion after delay
      if (isTestMode) {
        const testMode = localStorage.getItem('ccavenue_test_mode');
        
        setTimeout(() => {
          if (testMode === 'fail') {
            handleTestPaymentFailure();
          } else {
            handleTestPaymentSuccess();
          }
        }, 3000);
      }
    }
  };

  return (
    <div className="w-full p-4 border rounded-lg bg-white">
      <div className="flex items-center space-x-4 mb-4">
        <div className="p-2 bg-gradient-to-r from-green-500 to-green-600 rounded-full">
          <CreditCard className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="font-medium">CCAvenue Secure Payment</h3>
          <p className="text-sm text-gray-500">Pay securely with CCAvenue payment gateway</p>
        </div>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          <p className="mb-2 font-medium">Payment Error</p>
          <p className="text-sm mb-3">{error}</p>
          <Button 
            size="sm" 
            variant="outline" 
            className="text-xs flex items-center border-red-300 hover:bg-red-100"
            onClick={handleRetry}
          >
            <RefreshCw className="h-3 w-3 mr-1" /> Retry Payment
          </Button>
        </div>
      )}
      
      {isTestMode && debugInfo && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-xs font-medium text-blue-700 mb-1">Debug Info (Test Mode)</p>
          <pre className="text-xs text-blue-600 whitespace-pre-wrap">
            {debugInfo}
          </pre>
        </div>
      )}
      
      {paymentUrl ? (
        <div className="border rounded-lg p-4 mb-4">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-medium">Payment URL Generated</h3>
            <p className="text-sm text-gray-600">
              Click the button below to open the payment gateway in a new window.
            </p>
            <Button
              onClick={handleOpenPaymentUrl}
              className="bg-fleet-red hover:bg-fleet-red/90 text-white flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Open Payment Gateway
            </Button>
            {isTestMode && (
              <div className="mt-4 text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                <p>Test Mode: This will simulate a payment {localStorage.getItem('ccavenue_test_mode') === 'fail' ? 'failure' : 'success'}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex justify-between items-center border-t border-gray-200 pt-4 mt-4">
          <div>
            <p className="text-sm text-gray-500">Amount to pay</p>
            <p className="text-xl font-semibold">{CURRENCY.symbol} {amount.toFixed(2)}</p>
          </div>
          
          <Button
            onClick={handlePaymentClick}
            disabled={isProcessing}
            className="bg-fleet-red hover:bg-fleet-red/90 text-white"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Pay Now'
            )}
          </Button>
        </div>
      )}
      
      {isTestMode && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <p className="text-xs text-amber-600">
            ⚠️ Test Mode Active - No actual payment will be processed
          </p>
        </div>
      )}
    </div>
  );
};

export default CCavenueCheckout; 