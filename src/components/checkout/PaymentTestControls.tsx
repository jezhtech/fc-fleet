import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

const TEST_MODE_KEY = 'ccavenue_test_mode';

interface PaymentTestControlsProps {
  onRefresh?: () => void;
}

const PaymentTestControls: React.FC<PaymentTestControlsProps> = ({ onRefresh }) => {
  const [testMode, setTestMode] = useState<'success' | 'fail' | 'normal'>('normal');
  const [isLoading, setIsLoading] = useState(false);

  // Load test mode from localStorage when component mounts
  useEffect(() => {
    const savedMode = localStorage.getItem(TEST_MODE_KEY);
    if (savedMode === 'success' || savedMode === 'fail') {
      setTestMode(savedMode);
    } else {
      // Ensure we default to 'normal' if no mode is saved or if it's not a valid value
      setTestMode('normal');
      localStorage.removeItem(TEST_MODE_KEY);
    }
  }, []);

  // Update localStorage and state when test mode changes
  const handleTestModeChange = (mode: 'success' | 'fail' | 'normal') => {
    setTestMode(mode);
    if (mode === 'normal') {
      localStorage.removeItem(TEST_MODE_KEY);
      toast.info('Payment test mode: Normal');
    } else {
      localStorage.setItem(TEST_MODE_KEY, mode);
      toast.info(`Payment test mode: Force ${mode === 'success' ? 'Success' : 'Failure'}`);
    }
  };

  // Handle simulating a test payment
  const handleTestPayment = async (forceResult: 'success' | 'fail' | 'normal') => {
    setIsLoading(true);
    
    try {
      if (forceResult === 'normal') {
        // In normal mode, remove any test mode from localStorage
        localStorage.removeItem(TEST_MODE_KEY);
        
        // Simply show a notification and let the normal payment flow handle it
        toast.info('Using normal payment flow - click "Pay Now" to proceed');
        setIsLoading(false);
        
        // Notify parent to refresh if needed
        if (onRefresh) {
          onRefresh();
        }
        return;
      }
      
      // For success/fail modes, set the test mode in localStorage
      localStorage.setItem(TEST_MODE_KEY, forceResult);
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show result
      if (forceResult === 'success') {
        toast.success('Test payment successful (simulated)');
        
        // For success, redirect to success page
        setTimeout(() => {
          window.location.href = '/booking-status?status=success&transactionId=TEST-TXN-' + Date.now();
        }, 1000);
      } else {
        toast.error('Test payment failed (simulated)');
        
        // For failure, show error page
        setTimeout(() => {
          window.location.href = '/booking-status?status=failed&error=Payment%20declined';
        }, 1000);
      }
      
      // Refresh parent component if needed
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error during test payment:', error);
      toast.error('Error simulating payment');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <div className="mb-3">
        <h3 className="text-sm font-medium mb-1">CCAvenue Payment Test Controls</h3>
        <p className="text-xs text-gray-500">
          Configure payment behavior for testing before production deployment
        </p>
      </div>
      
      <div className="space-y-4">
        <div>
          <p className="text-xs font-medium mb-2">Payment Test Mode:</p>
          <Tabs 
            value={testMode} 
            onValueChange={(v) => handleTestModeChange(v as 'success' | 'fail' | 'normal')}
            className="w-full"
          >
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="normal">Normal</TabsTrigger>
              <TabsTrigger value="success">Force Success</TabsTrigger>
              <TabsTrigger value="fail">Force Failure</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          <Button
            size="sm"
            variant="outline"
            className="bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
            onClick={() => handleTestPayment('normal')}
            disabled={isLoading}
          >
            {isLoading ? (
              <><Loader2 className="h-3 w-3 mr-2 animate-spin" /> Testing...</>
            ) : 'Test Normal Flow'}
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            className="border-green-500 hover:bg-green-50 text-green-600"
            onClick={() => handleTestPayment('success')}
            disabled={isLoading}
          >
            {isLoading ? (
              <><Loader2 className="h-3 w-3 mr-2 animate-spin" /> Testing...</>
            ) : 'Test Success'}
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            className="border-red-500 hover:bg-red-50 text-red-600"
            onClick={() => handleTestPayment('fail')}
            disabled={isLoading}
          >
            {isLoading ? (
              <><Loader2 className="h-3 w-3 mr-2 animate-spin" /> Testing...</>
            ) : 'Test Failure'}
          </Button>
        </div>
        
        {testMode === 'normal' && (
          <div className="border-t pt-3 mt-2">
            <p className="text-xs text-gray-600 mb-2">In normal mode, click the Pay Now button to see the payment form:</p>
            <Button
              size="sm"
              className="w-full bg-fleet-red hover:bg-fleet-red/90 text-white"
              onClick={() => {
                // Find the Pay Now button more reliably
                const payNowButtons = Array.from(document.querySelectorAll('button')).filter(
                  button => button.textContent?.includes('Pay Now')
                );
                
                if (payNowButtons.length > 0) {
                  (payNowButtons[0] as HTMLButtonElement).click();
                } else {
                  toast.info('Could not find the Pay Now button. Please click it manually.');
                }
              }}
            >
              <CreditCard className="h-3 w-3 mr-2" /> Trigger Pay Now
            </Button>
          </div>
        )}
        
        <div className="text-xs text-gray-500 border-t pt-3 mt-3">
          <p>Note: These test controls only work when CCAvenue is in test mode.</p>
          <p>In the test environment, no real transactions will be processed.</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentTestControls; 