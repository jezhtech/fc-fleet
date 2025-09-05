import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  CreditCard,
  MapPin,
  Calendar,
  Car,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { bookingService, BookingWithRelations } from "@/services";

const BookChauffeur = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [bookingData, setBookingData] = useState<BookingWithRelations | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  // Check if we have booking parameters in URL
  const orderId = searchParams.get("orderId");

  useEffect(() => {
    if (orderId) {
      fetchBookingByOrderId(orderId);
    } else {
      // If no booking ID or order ID, redirect to home or show error
      toast.error("No booking found");
      navigate("/");
    }
  }, [orderId, navigate]);

  const fetchBookingByOrderId = async (orderId: string) => {
    try {
      setLoading(true);
      const repsonse = await bookingService.getBookingByOrderId(orderId);
      const data = repsonse.data;
      if (data) {
        // Update payment status if paymentStatus is provided in URL
        if (data.status) {
          // Update the local state to reflect the payment status
          setBookingData(data);
        }
      } else {
        toast.error("Booking not found with this order ID");
        // navigate("/");
      }
    } catch (error) {
      console.error("Error fetching booking by order ID:", error);
      toast.error("Failed to load booking details");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "driver_assigned":
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case "pickup":
        return <CheckCircle className="h-5 w-5 text-orange-500" />;
      case "dropped":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "initiated":
        return "Booking Initiated";
      case "confirmed":
        return "Booking Confirmed";
      case "driver_assigned":
        return "Driver Assigned";
      case "pickup":
        return "Pickup in Progress";
      case "dropped":
        return "Journey Completed";
      default:
        return "Processing";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "PAID":
        return "text-green-600 bg-green-50";
      case "FAILED":
        return "text-red-600 bg-red-50";
      case "PENDING":
        return "text-yellow-600 bg-yellow-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getPaymentMethodText = (
    paymentMethod?: string,
    paymentStatus?: string,
  ) => {
    if (paymentMethod === "cash") {
      return "Cash Payment";
    }
    if (paymentStatus === "paid") {
      return "Online Payment";
    }
    return "Payment Method";
  };

  const getPaymentStatusText = (
    paymentStatus: string,
    paymentMethod?: string,
  ) => {
    if (paymentMethod === "cash") {
      return "Cash Payment Pending";
    }

    switch (paymentStatus.toUpperCase()) {
      case "PAID":
        return "Payment Successful";
      case "FAILED":
        return "Payment Failed";
      case "PENDING":
        return "Payment Pending";
      default:
        return "Payment Status Unknown";
    }
  };

  const formatDate = (date: any) => {
    if (!date) return "N/A";
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString();
  };

  const formatTime = (time: string) => {
    if (!time) return "N/A";
    const dateTime = new Date(time);
    const hour = dateTime.getHours();
    const minutes = dateTime.getMinutes();
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Loading booking details...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!bookingData) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Loading booking details...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-gradient-to-r from-primary to-fleet-accent py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {bookingData.paymentInfo.method === "cash"
              ? "Cash Payment Confirmed"
              : "Booking Confirmation"}
          </h1>
          <p className="text-white/90 text-lg max-w-2xl mx-auto">
            {bookingData.paymentInfo.method === "cash"
              ? "Your booking is confirmed with cash payment. Here are the details."
              : "Your booking has been successfully created. Here are the details."}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Booking Status */}
          <Card className="p-6 shadow-lg mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-fleet-dark">
                Booking Status
              </h2>
              <div className="flex items-center gap-2">
                {getStatusIcon(bookingData.status)}
                <span className="font-medium">
                  {getStatusText(bookingData.status)}
                </span>
              </div>
            </div>

            {/* Payment Status */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="h-5 w-5 text-gray-600" />
                <span className="font-medium">
                  {getPaymentMethodText(
                    bookingData.paymentInfo.method,
                    bookingData.paymentInfo.status,
                  )}
                </span>
              </div>
              <div
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(
                  bookingData.paymentInfo.status,
                )}`}
              >
                {getPaymentStatusText(
                  bookingData.paymentInfo.status,
                  bookingData.paymentInfo.method,
                )}
              </div>
            </div>

            {/* Booking Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Pickup Location</p>
                    <p className="font-medium">
                      {bookingData.pickupLocation?.name || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">
                      {bookingData.dropoffLocation
                        ? "Dropoff Location"
                        : "Hourly Tour"}
                    </p>
                    <p className="font-medium">
                      {bookingData.dropoffLocation?.name ||
                        bookingData.hourlyTour?.name ||
                        "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-gray-600">Date & Time</p>
                    <p className="font-medium">
                      {formatDate(bookingData.pickupDate)} at{" "}
                      {formatTime(bookingData.pickupDate)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Car className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-gray-600">Vehicle</p>
                    <p className="font-medium">
                      {bookingData.vehicle?.name || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cash Payment Notice */}
            {bookingData.paymentInfo.method === "cash" && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold text-lg">$</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-green-800">
                      Cash Payment Details
                    </h4>
                    <p className="text-green-700 text-sm">
                      Amount due:{" "}
                      <strong>
                        AED{" "}
                        {parseFloat(bookingData.amount.toString()).toFixed(2) ||
                          "0.00"}
                      </strong>{" "}
                      - Please have exact change ready when your driver arrives.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Booking ID and Amount */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Order ID</p>
                  <p className="font-mono font-medium">{bookingData.orderId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    {bookingData.paymentInfo.method === "cash"
                      ? "Payment Method"
                      : "Tracking ID"}
                  </p>
                  <p className="font-mono font-medium">
                    {bookingData.paymentInfo.method === "cash"
                      ? "Cash Payment"
                      : bookingData.paymentInfo?.trackingId || "N/A"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="text-2xl font-bold text-primary">
                    AED{" "}
                    {parseFloat(bookingData.amount.toString())?.toFixed(2) ||
                      "0.00"}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Next Steps */}
          <Card className="p-6 shadow-lg mb-8">
            <h3 className="text-xl font-bold text-fleet-dark mb-4">
              Next Steps
            </h3>
            <div className="space-y-4">
              {/* Cash Payment Notice */}
              {bookingData.paymentInfo.method === "cash" && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-800">
                        Cash Payment Selected
                      </h4>
                      <p className="text-green-700 text-sm mt-1">
                        Your booking is confirmed with cash payment. Please have
                        the exact amount ready when your driver arrives.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Online Payment Pending */}
              {!bookingData.paymentInfo.method &&
                bookingData.paymentInfo.status === "PENDING" && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-800">
                          Payment Required
                        </h4>
                        <p className="text-yellow-700 text-sm mt-1">
                          Your booking is pending payment. Please complete the
                          payment to confirm your booking.
                        </p>
                        <Button className="mt-3 bg-primary hover:bg-primary/90">
                          Proceed to Payment
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

              {/* Online Payment Success */}
              {!bookingData.paymentInfo.method &&
                bookingData.paymentInfo.status === "PAID" && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-green-800">
                          Payment Successful
                        </h4>
                        <p className="text-green-700 text-sm mt-1">
                          Your payment has been processed successfully. We'll
                          send you updates about your booking.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              {/* Payment Failed */}
              {bookingData.paymentInfo.status === "FAILED" && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-red-800">
                        Payment Failed
                      </h4>
                      <p className="text-red-700 text-sm mt-1">
                        Your payment could not be processed. Please try again or
                        contact support.
                      </p>
                      <Button className="mt-3 bg-primary hover:bg-primary/90">
                        Retry Payment
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">
                  What happens next?
                </h4>
                <ul className="text-blue-700 text-sm space-y-1">
                  <li>• A driver will be assigned prior to 2 hours</li>
                  <li>
                    • You'll receive driver details and vehicle information
                  </li>
                  <li>• Driver will arrive at your pickup location on time</li>
                  {bookingData.paymentInfo.method === "cash" && (
                    <li>
                      • Please have the exact amount ready in cash for payment
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              onClick={() => navigate("/user/my-bookings")}
              className="bg-primary hover:bg-primary/90"
            >
              View All Bookings
            </Button>
            <Button variant="outline" onClick={() => navigate("/")}>
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BookChauffeur;
