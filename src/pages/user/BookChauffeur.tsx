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
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { toast } from "sonner";

interface BookingData {
  id: string;
  orderId: string;
  status: string;
  paymentStatus: string;
  vehicle: any;
  pickupLocation: any;
  dropoffLocation: any;
  date: any;
  time: string;
  amount: number;
  customerInfo: any;
  createdAt: any;
  paymentInfo?: {
    trackingId: string;
    bankRefNo: string;
    orderStatus: string;
    paymentMode: string;
    cardName: string;
    transactionDate: string;
  };
}

const BookChauffeur = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
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
      const bookingsRef = collection(firestore, "bookings");
      const q = query(bookingsRef, where("orderId", "==", orderId));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const bookingDoc = snapshot.docs[0];
        const data = bookingDoc.data() as BookingData;
        setBookingData({
          id: bookingDoc.id,
          ...data,
        });

        // Update payment status if paymentStatus is provided in URL
        if (bookingData.paymentStatus) {
          // Update the local state to reflect the payment status
          setBookingData((prev) =>
            prev
              ? {
                  ...prev,
                  paymentStatus: bookingData.paymentStatus,
                }
              : null
          );
        }
      } else {
        toast.error("Booking not found with this order ID");
        navigate("/");
      }
    } catch (error) {
      console.error("Error fetching booking by order ID:", error);
      toast.error("Failed to load booking details");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const fetchBookingDetails = async (id: string) => {
    try {
      setLoading(true);
      const bookingRef = doc(firestore, "bookings", id);
      const bookingSnap = await getDoc(bookingRef);

      if (bookingSnap.exists()) {
        const data = bookingSnap.data() as BookingData;
        setBookingData({
          id: bookingSnap.id,
          ...data,
        });
      } else {
        toast.error("Booking not found");
        navigate("/");
      }
    } catch (error) {
      console.error("Error fetching booking:", error);
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
    switch (status) {
      case "SUCCESS":
        return "text-green-600 bg-green-50";
      case "FAILED":
        return "text-red-600 bg-red-50";
      default:
        return "text-yellow-600 bg-yellow-50";
    }
  };

  const formatDate = (date: any) => {
    if (!date) return "N/A";
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString();
  };

  const formatTime = (time: string) => {
    if (!time) return "N/A";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fleet-red mx-auto mb-4"></div>
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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fleet-red mx-auto mb-4"></div>
              <p className="text-gray-600">Loading booking details...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-gradient-to-r from-fleet-red to-fleet-accent py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Booking Confirmation
          </h1>
          <p className="text-white/90 text-lg max-w-2xl mx-auto">
            Your booking has been successfully created. Here are the details.
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
                <span className="font-medium">Payment Status</span>
              </div>
              <div
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(
                  bookingData.paymentStatus
                )}`}
              >
                {bookingData.paymentStatus === "SUCCESS"
                  ? "Payment Successful"
                  : bookingData.paymentStatus === "FAILED"
                  ? "Payment Failed"
                  : "Payment Pending"}
              </div>
            </div>

            {/* Booking Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-fleet-red mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Pickup Location</p>
                    <p className="font-medium">
                      {bookingData.pickupLocation?.name || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-fleet-red mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Dropoff Location</p>
                    <p className="font-medium">
                      {bookingData.dropoffLocation?.name || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-fleet-red" />
                  <div>
                    <p className="text-sm text-gray-600">Date & Time</p>
                    <p className="font-medium">
                      {formatDate(bookingData.date)} at{" "}
                      {formatTime(bookingData.time)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Car className="h-5 w-5 text-fleet-red" />
                  <div>
                    <p className="text-sm text-gray-600">Vehicle</p>
                    <p className="font-medium">
                      {bookingData.vehicle?.name || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Booking ID and Amount */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">Order ID</p>
                  <p className="font-mono font-medium">
                    {bookingData.orderId}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tracking ID</p>
                  <p className="font-mono font-medium">
                    {bookingData.paymentInfo?.trackingId}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="text-2xl font-bold text-fleet-red">
                    AED {bookingData.amount?.toFixed(2) || "0.00"}
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
              {bookingData.paymentStatus === "PENDING" && (
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
                      <Button className="mt-3 bg-fleet-red hover:bg-fleet-red/90">
                        Proceed to Payment
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {bookingData.paymentStatus === "SUCCESS" && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-800">
                        Payment Successful
                      </h4>
                      <p className="text-green-700 text-sm mt-1">
                        Your payment has been processed successfully. We'll send
                        you updates about your booking.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">
                  What happens next?
                </h4>
                <ul className="text-blue-700 text-sm space-y-1">
                  <li>• We'll confirm your booking within 30 minutes</li>
                  <li>• A driver will be assigned to your trip</li>
                  <li>
                    • You'll receive driver details and vehicle information
                  </li>
                  <li>• Driver will arrive at your pickup location on time</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              onClick={() => navigate("/my-bookings")}
              className="bg-fleet-red hover:bg-fleet-red/90"
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
