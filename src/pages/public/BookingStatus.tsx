import React, { useState, useEffect } from "react";
import {
  useLocation,
  useNavigate,
  Link,
  useSearchParams,
} from "react-router-dom";
import {
  CheckCircle,
  XCircle,
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Car,
  Banknote,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatExistingBookingId } from "@/utils/booking";

const BookingStatus = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Get status from either URL params or location state
  const statusFromUrl = searchParams.get("status");
  const {
    status: statusFromState,
    bookingDetails,
    paymentDetails,
    error,
  } = location.state || {};

  // Determine the actual status - URL params take precedence
  const status = statusFromUrl || statusFromState;

  // Mock data for when we only have status from URL
  const [mockBookingDetails, setMockBookingDetails] = useState<any>(null);

  useEffect(() => {
    // If we have status from URL but no booking details, create mock data
    if (statusFromUrl && !bookingDetails) {
      setMockBookingDetails({
        vehicle: { name: "Honda City" },
        pickupLocation: { name: "Dubai Mall" },
        dropoffLocation: { name: "Dubai Marina" },
        date: "22/05/2025",
        time: "12:00",
        amount: 68.0,
      });
    }
  }, [statusFromUrl, bookingDetails]);

  // Use the actual booking details or mock ones
  const displayBookingDetails = bookingDetails || mockBookingDetails;

  // Create mock payment details if needed
  const displayPaymentDetails =
    paymentDetails ||
    (status === "success"
      ? {
          transactionId: `TEST-TXN-${Date.now()}`,
          paymentMethod: "CCAvenue",
          timestamp: new Date().toISOString(),
        }
      : null);

  // If no status is available, redirect to home
  if (!status) {
    useEffect(() => {
      navigate("/");
    }, [navigate]);

    return null;
  }

  const isSuccess = status === "success";
  const displayError = error || "CCAvenue settings are not properly configured";

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <div className="text-center mb-8">
        <div className="inline-flex justify-center items-center mb-4">
          {isSuccess ? (
            <CheckCircle className="h-16 w-16 text-green-500" />
          ) : (
            <XCircle className="h-16 w-16 text-red-500" />
          )}
        </div>

        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          {isSuccess ? "Booking Successful!" : "Booking Failed"}
        </h1>

        <p className="text-gray-600 max-w-md mx-auto">
          {isSuccess
            ? "Your ride has been booked successfully. You'll receive a confirmation email shortly."
            : `There was an issue with your booking: ${displayError}`}
        </p>

        {/* Display booking ID if available */}
        {isSuccess && bookingDetails?.id && (
          <div className="mt-4 flex items-center justify-center">
            <FileText className="h-5 w-5 mr-2 text-primary" />
            <p className="font-medium">
              Booking ID:{" "}
              {bookingDetails.formattedId ||
                formatExistingBookingId(bookingDetails.id, new Date())}
            </p>
          </div>
        )}
      </div>

      {isSuccess && displayBookingDetails && (
        <div className="bg-white rounded-lg border p-5 md:p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-primary" />
            Booking Details
          </h2>

          <div className="space-y-4">
            {/* Add Booking ID row */}
            {bookingDetails?.id && (
              <div className="flex items-start">
                <FileText className="h-5 w-5 text-gray-500 mr-3 mt-0.5" />
                <div>
                  <h3 className="font-medium">Booking ID</h3>
                  <p className="text-gray-700">
                    {bookingDetails.formattedId ||
                      formatExistingBookingId(bookingDetails.id, new Date())}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start">
              <Car className="h-5 w-5 text-gray-500 mr-3 mt-0.5" />
              <div>
                <h3 className="font-medium">Vehicle</h3>
                <p className="text-gray-700">
                  {displayBookingDetails.vehicle?.name || "Selected Vehicle"}
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <MapPin className="h-5 w-5 text-gray-500 mr-3 mt-0.5" />
              <div>
                <h3 className="font-medium">Pickup Location</h3>
                <p className="text-gray-700">
                  {displayBookingDetails.pickupLocation?.name ||
                    "Pickup Location"}
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <MapPin className="h-5 w-5 text-gray-500 mr-3 mt-0.5" />
              <div>
                <h3 className="font-medium">Dropoff Location</h3>
                <p className="text-gray-700">
                  {displayBookingDetails.dropoffLocation?.name ||
                    "Dropoff Location"}
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <Clock className="h-5 w-5 text-gray-500 mr-3 mt-0.5" />
              <div>
                <h3 className="font-medium">Date & Time</h3>
                <p className="text-gray-700">
                  {displayBookingDetails.date} at {displayBookingDetails.time}
                </p>
              </div>
            </div>

            {displayBookingDetails.duration && (
              <div className="flex items-start">
                <Clock className="h-5 w-5 text-gray-500 mr-3 mt-0.5" />
                <div>
                  <h3 className="font-medium">Duration</h3>
                  <p className="text-gray-700">
                    {displayBookingDetails.duration} hours
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {isSuccess && displayPaymentDetails && (
        <div className="bg-white rounded-lg border p-5 md:p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Banknote className="h-5 w-5 mr-2 text-primary" />
            Payment Details
          </h2>

          <div className="space-y-4">
            <div className="flex justify-between border-b pb-3">
              <span className="text-gray-600">Transaction ID</span>
              <span className="font-medium">
                {displayPaymentDetails.transactionId}
              </span>
            </div>

            <div className="flex justify-between border-b pb-3">
              <span className="text-gray-600">Payment Method</span>
              <span className="font-medium">
                {displayPaymentDetails.paymentMethod}
              </span>
            </div>

            <div className="flex justify-between border-b pb-3">
              <span className="text-gray-600">Amount Paid</span>
              <span className="font-medium">
                AED {displayBookingDetails?.amount?.toFixed(2) || "68.00"}
              </span>
            </div>

            <div className="flex justify-between border-b pb-3">
              <span className="text-gray-600">Date & Time</span>
              <span className="font-medium">
                {new Date(displayPaymentDetails.timestamp).toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Status</span>
              <span className="font-medium text-green-600">Completed</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-center gap-4">
        {isSuccess ? (
          <>
            <Button
              asChild
              className="bg-booba-yellow text-booba-dark hover:bg-booba-yellow/90"
            >
              <Link to="/my-bookings">View My Bookings</Link>
            </Button>

            <Button asChild variant="outline">
              <Link to="/">Back to Home</Link>
            </Button>
          </>
        ) : (
          <>
            <Button
              asChild
              className="bg-primary text-white hover:bg-primary/90"
            >
              <Link to="/book-chauffeur">Try Again</Link>
            </Button>

            <Button asChild variant="outline">
              <Link to="/">Back to Home</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default BookingStatus;
