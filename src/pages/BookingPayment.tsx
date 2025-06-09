import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import CCavenueCheckout from '@/components/checkout/CCavenueCheckout';
import PaymentTestControls from '@/components/checkout/PaymentTestControls';
import { toast } from 'sonner';

const BookingPayment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { bookingDetails } = location.state || {};
  const [isTestMode, setIsTestMode] = React.useState(false);
  
  // Check if we're in development/test environment
  React.useEffect(() => {
    // Check for common development indicators
    const inDevMode = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1' ||
                      window.location.hostname.includes('192.168.') ||
                      process.env.NODE_ENV === 'development';
    setIsTestMode(inDevMode);
  }, []);
  
  if (!bookingDetails) {
    // Redirect back to vehicle selection if no booking details are available
    React.useEffect(() => {
      toast.error("Booking details not found. Please try again.");
      navigate("/book-chauffeur");
    }, [navigate]);
    
    return null;
  }
  
  const {
    vehicle,
    pickupLocation,
    dropoffLocation,
    date,
    time,
    duration,
    amount,
    customerInfo
  } = bookingDetails;
  
  const handlePaymentSuccess = (transactionId: string) => {
    // Navigate to success page with booking and payment details
    navigate("/booking-status", {
      state: {
        status: 'success',
        bookingDetails,
        paymentDetails: {
          transactionId,
          paymentMethod: 'CCAvenue',
          amount,
          timestamp: new Date().toISOString()
        }
      }
    });
  };
  
  const handlePaymentFailure = (errorMessage: string) => {
    // Navigate to failure page with booking details and error
    navigate("/booking-status", {
      state: {
        status: 'failed',
        bookingDetails,
        error: errorMessage
      }
    });
  };

  // Generate an order ID using timestamp and random string
  const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Complete Your Payment</h1>
        <p className="text-gray-600">Secure payment for your chauffeur booking</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg border p-5 mb-4">
            <h2 className="text-lg font-medium mb-4">Payment Method</h2>
            
            <CCavenueCheckout 
              orderId={orderId}
              amount={amount || 0}
              customerName={customerInfo?.name || ""}
              customerEmail={customerInfo?.email || ""}
              customerPhone={customerInfo?.phone || ""}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentFailure={handlePaymentFailure}
            />
          </div>
          
          {/* Test controls only shown in development/test mode */}
          {isTestMode && (
            <div className="mb-4">
              <PaymentTestControls />
            </div>
          )}
        </div>
        
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg border p-5 sticky top-5">
            <h2 className="text-lg font-medium mb-3">Booking Summary</h2>
            
            <div className="space-y-3 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Vehicle</span>
                <span className="font-medium">{vehicle?.name || "Selected Vehicle"}</span>
              </div>
              
              <div className="flex justify-between items-start">
                <span className="text-gray-600">Pickup</span>
                <span className="font-medium text-right max-w-[60%]">{pickupLocation?.name || "Pickup Location"}</span>
              </div>
              
              <div className="flex justify-between items-start">
                <span className="text-gray-600">Dropoff</span>
                <span className="font-medium text-right max-w-[60%]">{dropoffLocation?.name || "Dropoff Location"}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Date & Time</span>
                <span className="font-medium">{date} at {time}</span>
              </div>
              
              {duration && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-medium">{duration} hrs</span>
                </div>
              )}
            </div>
            
            <div className="border-t pt-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-600">Total Amount</span>
                <span className="text-xl font-semibold text-fleet-red">AED {amount?.toFixed(2) || "0.00"}</span>
              </div>
              <p className="text-xs text-gray-500">Includes all taxes and fees</p>
            </div>
          </div>
          
          <button 
            className="flex items-center text-gray-600 hover:text-fleet-red mt-4"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to vehicle selection
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingPayment; 
 
 
 
 
 
 
 
 