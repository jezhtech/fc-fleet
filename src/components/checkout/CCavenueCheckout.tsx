import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { paymentService, PaymentRequest } from "@/services/paymentService";
import { initiateCCavenuePayment } from "@/services/ccavenueService";
import { useAuth } from "@/contexts/AuthContext";

interface CCavenueCheckoutProps {
  orderId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  onPaymentSuccess: (transactionId: string, orderId?: string) => void;
  onPaymentFailure: (errorMessage: string, orderId?: string) => void;
}

const CCavenueCheckout: React.FC<CCavenueCheckoutProps> = ({
  orderId,
  amount,
  customerName,
  customerEmail,
  customerPhone,
  onPaymentSuccess,
  onPaymentFailure,
}) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentRequest>({
    orderId,
    amount,
    customerName,
    customerEmail,
    customerPhone,
    billingAddress: "",
    billingCity: "",
    billingState: "",
    billingZip: "",
    billingCountry: "AE", // UAE
    billingTel: customerPhone,
    deliveryName: customerName,
    deliveryAddress: "",
    deliveryCity: "",
    deliveryState: "",
    deliveryZip: "",
    deliveryCountry: "AE", // UAE
    deliveryTel: customerPhone,
  });

  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      if (!currentUser) {
        toast.error("Please log in to proceed with payment");
        onPaymentFailure("Authentication required", paymentData.orderId);
        return;
      }

      try {
        const isAuth = await paymentService.isAuthenticated();
        if (!isAuth) {
          // Don't fail immediately, let the user try to proceed
          // The backend will handle authentication validation
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
      }
    };

    checkAuth();
  }, [currentUser, onPaymentFailure]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPaymentData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      toast.error("Please log in to proceed with payment");
      onPaymentFailure("Authentication required", paymentData.orderId);
      return;
    }

    // Validate payment data
    const validation = paymentService.validatePaymentData(paymentData);
    if (!validation.isValid) {
      toast.error(
        `Please fix the following errors: ${validation.errors.join(", ")}`
      );
      return;
    }

    setLoading(true);

    try {
      const token = await currentUser.getIdToken();

      const result = await initiateCCavenuePayment({
        orderId: paymentData.orderId,
        amount: paymentData.amount,
        currency: "AED", // Default to AED for UAE
        customerData: {
          name: paymentData.customerName,
          email: paymentData.customerEmail,
          phone: paymentData.customerPhone,
        },
        token,
      });

      if (result.success && result.encRequest && result.access_code) {
        // Create and submit form to CCAvenue
        submitToCCavenue(
          result.encRequest,
          result.access_code,
          result.paymentUrl
        );
      } else {
        throw new Error(result.error || "Payment initialization failed");
      }
    } catch (error) {
      console.error("Payment error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Payment failed";
      toast.error(errorMessage);
      onPaymentFailure(errorMessage, paymentData.orderId);
    } finally {
      setLoading(false);
    }
  };

  // Function to submit form to CCAvenue (like the JSP example)
  const submitToCCavenue = (
    encRequest: string,
    access_code: string,
    paymentUrl: string
  ) => {
    // Create a form element
    const form = document.createElement("form");
    form.method = "POST";
    form.id = "nonseamless";
    form.name = "redirect";
    form.action = paymentUrl;
    form.style.display = "none";

    // Add encRequest field
    const encRequestInput = document.createElement("input");
    encRequestInput.type = "hidden";
    encRequestInput.id = "encRequest";
    encRequestInput.name = "encRequest";
    encRequestInput.value = encRequest;
    form.appendChild(encRequestInput);

    // Add access_code field
    const accessCodeInput = document.createElement("input");
    accessCodeInput.type = "hidden";
    accessCodeInput.id = "access_code";
    accessCodeInput.name = "access_code";
    accessCodeInput.value = access_code;
    form.appendChild(accessCodeInput);

    // Add form to document and submit
    document.body.appendChild(form);
    form.submit();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
            </svg>
            Secure Payment via CCAvenue
          </CardTitle>
          <CardDescription>
            Complete your booking with secure payment processing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            {/* Order Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Order Summary</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Order ID:</span>
                  <span className="font-mono">{orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount:</span>
                  <span className="font-bold text-green-600">
                    AED {amount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="space-y-4">
              <h3 className="font-medium">Customer Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerName">Full Name</Label>
                  <Input
                    id="customerName"
                    name="customerName"
                    value={paymentData.customerName}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="customerEmail">Email</Label>
                  <Input
                    id="customerEmail"
                    name="customerEmail"
                    type="email"
                    value={paymentData.customerEmail}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="customerPhone">Phone</Label>
                  <Input
                    id="customerPhone"
                    name="customerPhone"
                    value={paymentData.customerPhone}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Billing Address */}
            <div className="space-y-4">
              <h3 className="font-medium">Billing Address</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="billingAddress">Address</Label>
                  <Input
                    id="billingAddress"
                    name="billingAddress"
                    value={paymentData.billingAddress}
                    onChange={handleInputChange}
                    placeholder="Enter your billing address"
                  />
                </div>

                <div>
                  <Label htmlFor="billingCity">City</Label>
                  <Input
                    id="billingCity"
                    name="billingCity"
                    value={paymentData.billingCity}
                    onChange={handleInputChange}
                    placeholder="Dubai"
                  />
                </div>

                <div>
                  <Label htmlFor="billingState">State/Emirate</Label>
                  <Input
                    id="billingState"
                    name="billingState"
                    value={paymentData.billingState}
                    onChange={handleInputChange}
                    placeholder="Dubai"
                  />
                </div>

                <div>
                  <Label htmlFor="billingZip">ZIP Code</Label>
                  <Input
                    id="billingZip"
                    name="billingZip"
                    value={paymentData.billingZip}
                    onChange={handleInputChange}
                    placeholder="00000"
                  />
                </div>

                <div>
                  <Label htmlFor="billingTel">Phone</Label>
                  <Input
                    id="billingTel"
                    name="billingTel"
                    value={paymentData.billingTel}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-blue-600 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <h4 className="font-medium text-blue-900">Secure Payment</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Your payment information is encrypted and secure. We use
                    industry-standard SSL encryption to protect your data.
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Buttons */}
            <div className="space-y-3">
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                disabled={loading || !currentUser}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
                    </svg>
                    Pay AED {amount.toFixed(2)} via CCAvenue
                  </div>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Payment Methods Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Accepted Payment Methods</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>Credit Cards</span>
            <span>Debit Cards</span>
            <span>Net Banking</span>
            <span>UPI</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CCavenueCheckout;
