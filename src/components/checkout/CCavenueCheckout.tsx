import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { paymentService } from "@/services/paymentService";
import { initiateCCavenuePayment } from "@/services/ccavenueService";
import { useAuth } from "@/contexts/AuthContext";
import { bookingWithCash } from "@/services/bookingService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import config from "@/config";

interface CCavenueCheckoutProps {
  orderId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

const CCavenueCheckout: React.FC<CCavenueCheckoutProps> = ({
  orderId,
  amount,
  customerName,
  customerEmail,
  customerPhone,
}) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"ccavenue" | "cash">(
    "ccavenue",
  );
  const paymentData = {
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
  };

  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      if (!currentUser) {
        toast.error("Please log in to proceed with payment");
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
  }, [currentUser]);

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      toast.error("Please log in to proceed with payment");
      return;
    }

    // Handle cash payment
    if (paymentMethod === "cash") {
      try {
        setLoading(true);
        // Update booking with cash payment details
        const response = await bookingWithCash(paymentData.orderId, amount);

        if (response.success) {
          toast.success("Cash payment option selected successfully!");
          // Redirect to book chauffeur page with orderId
          navigate(`/user/book-chauffeur?orderId=${paymentData.orderId}`);
          return;
        } else {
          throw new Error("Failed to update booking for cash payment");
        }
      } catch (error) {
        console.error("Cash payment error:", error);
        toast.error("Failed to process cash payment option");
      } finally {
        setLoading(false);
      }
      return;
    }

    // Validate payment data for CCAvenue
    const validation = paymentService.validatePaymentData(paymentData);
    if (!validation.isValid) {
      toast.error(
        `Please fix the following errors: ${validation.errors.join(", ")}`,
      );
      return;
    }

    setLoading(true);

    try {
      const token = await currentUser.getIdToken();

      const result = await initiateCCavenuePayment({
        orderId: paymentData.orderId,
        amount: paymentData.amount,
        currency: config.currency,
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
          result.paymentUrl,
        );
      } else {
        throw new Error(result.error || "Payment initialization failed");
      }
    } catch (error) {
      console.error("Payment error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Payment failed";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Function to submit form to CCAvenue (like the JSP example)
  const submitToCCavenue = (
    encRequest: string,
    access_code: string,
    paymentUrl: string,
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
                    {amount.toFixed(2)} {config.currencySymbol}
                  </span>
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

            {/* Payment Method Selection */}
            <div className="space-y-4">
              <h3 className="font-medium">Payment Method</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="ccavenue"
                    name="paymentMethod"
                    value="ccavenue"
                    checked={paymentMethod === "ccavenue"}
                    onChange={(e) =>
                      setPaymentMethod(e.target.value as "ccavenue" | "cash")
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <Label
                    htmlFor="ccavenue"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <svg
                      className="w-5 h-5 text-blue-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
                    </svg>
                    Pay Online
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="cash"
                    name="paymentMethod"
                    value="cash"
                    checked={paymentMethod === "cash"}
                    onChange={(e) =>
                      setPaymentMethod(e.target.value as "ccavenue" | "cash")
                    }
                    className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                  />
                  <Label
                    htmlFor="cash"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <svg
                      className="w-5 h-5 text-green-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                    </svg>
                    Pay with Cash
                  </Label>
                </div>
              </div>
            </div>

            {/* Payment Buttons */}
            <div className="space-y-3">
              <Button
                type="submit"
                className={`w-full ${
                  paymentMethod === "cash"
                    ? "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                    : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                }`}
                disabled={loading || !currentUser}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </div>
                ) : paymentMethod === "cash" ? (
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                    </svg>
                    Select Cash Payment
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
                    Pay {config.currencySymbol} {amount.toFixed(2)} via CCAvenue
                  </div>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CCavenueCheckout;
