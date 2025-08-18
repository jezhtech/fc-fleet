import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Download,
  Calendar,
  Map,
  Clock,
  Car,
  AlertTriangle,
  CheckCircle2,
  Circle,
  User,
  Phone,
  Car as CarIcon,
  CreditCard,
  Star,
  Navigation,
} from "lucide-react";
import { format } from "date-fns";
import { Link, useNavigate } from "react-router-dom";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import InvoiceGenerator from "@/components/invoice/InvoiceGenerator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { formatExistingBookingId } from "@/utils/booking";

// Booking type definition
interface Booking {
  id: string;
  orderId: string;
  type: string;
  status: string;
  date: Date;
  pickup: string;
  dropoff: string;
  vehicle: string;
  amount: string;
  paymentMethod?: string;
  paymentInfo?: {
    trackingId?: string;
    paymentMode?: string;
    timestamp?: string;
    method?: string;
  };
  customerInfo?: {
    name: string;
    email: string;
    phone: string;
  };
  driverInfo?: {
    name?: string;
    phone?: string;
    vehicleNumber?: string;
  };
  createdAt?: string;
}

// Tracking step interface
interface TrackingStep {
  label: string;
  status: "completed" | "current" | "upcoming";
  details?: React.ReactNode;
  icon: React.ReactNode;
  description: string;
  estimatedTime?: string;
}

// TrackingDialog component
const TrackingDialog = ({ booking }: { booking: Booking }) => {
  // Determine the current step based on booking status
  const getCurrentStep = (status: string): number => {
    switch (status.toLowerCase()) {
      case "completed":
        return 7; // All steps completed
      case "started":
        return 6; // Ride started
      case "driver_assigned":
        return 4; // Driver assigned
      case "confirmed":
        return 3; // Booking confirmed
      case "initiated":
        return 2; // Booking initiated
      case "awaiting":
        return 1; // Payment confirmed
      default:
        return 0; // Default to first step
    }
  };

  const currentStepIndex = getCurrentStep(booking.status);

  // Define all steps in the booking flow
  const steps: TrackingStep[] = [
    {
      label: "Payment Confirmed",
      status: currentStepIndex >= 1 ? "completed" : "upcoming",
      icon: <CreditCard className="h-5 w-5" />,
      description:
        booking.paymentMethod === "cash"
          ? "Cash payment selected - Amount due at pickup"
          : "Your payment has been successfully processed",
      estimatedTime: "Immediate",
      details: currentStepIndex >= 1 && (
        <div className="text-sm text-gray-600 bg-green-50 p-3 rounded-md">
          {booking.paymentMethod === "cash" ? (
            <div className="space-y-2">
              <div>
                <p className="font-medium text-green-800">Payment Method</p>
                <p className="text-green-700">Cash Payment</p>
              </div>
              <div>
                <p className="font-medium text-green-800">Amount Due</p>
                <p className="text-green-700">{booking.amount}</p>
              </div>
              <div className="pt-2 border-t border-green-200">
                <p className="text-green-700 text-xs">
                  Please have exact amount ready when driver arrives
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="font-medium text-green-800">Tracking ID</p>
                <p className="text-green-700">
                  {booking.paymentInfo?.trackingId || "N/A"}
                </p>
              </div>
              <div>
                <p className="font-medium text-green-800">Payment Method</p>
                <p className="text-green-700">
                  {booking.paymentInfo?.paymentMode || "N/A"}
                </p>
              </div>
              {booking.paymentInfo?.timestamp && (
                <div className="mt-2 pt-2 border-t border-green-200">
                  <p className="font-medium text-green-800">Payment Time</p>
                  <p className="text-green-700">
                    {new Date(booking.paymentInfo.timestamp).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      label: "Booking Initiated",
      status:
        currentStepIndex >= 2
          ? "completed"
          : currentStepIndex === 1
          ? "current"
          : "upcoming",
      icon: <FileText className="h-5 w-5" />,
      description: "Your booking request is being processed",
      estimatedTime: "2-5 minutes",
      details: currentStepIndex >= 2 && (
        <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
          <div className="space-y-2">
            <div>
              <p className="font-medium text-blue-800">Order ID</p>
              <p className="text-blue-700 font-mono">{booking.orderId}</p>
            </div>
            <div>
              <p className="font-medium text-blue-800">Service Type</p>
              <p className="text-blue-700">{booking.type}</p>
            </div>
            <div>
              <p className="font-medium text-blue-800">Status</p>
              <p className="text-blue-700">Processing</p>
            </div>
            {booking.paymentMethod === "cash" && (
              <div>
                <p className="font-medium text-blue-800">Payment Method</p>
                <p className="text-blue-700">
                  Cash Payment - Amount: {booking.amount}
                </p>
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      label: "Booking Confirmed",
      status:
        currentStepIndex >= 3
          ? "completed"
          : currentStepIndex === 2
          ? "current"
          : "upcoming",
      icon: <CheckCircle2 className="h-5 w-5" />,
      description: "Your booking has been confirmed and verified",
      estimatedTime: "5-10 minutes",
      details: currentStepIndex >= 3 && (
        <div className="text-sm text-gray-600 bg-green-50 p-3 rounded-md">
          <div className="space-y-2">
            <div>
              <p className="font-medium text-green-800">Confirmation Time</p>
              <p className="text-green-700">{new Date().toLocaleString()}</p>
            </div>
            <div>
              <p className="font-medium text-green-800">Next Step</p>
              <p className="text-green-700">Driver assignment in progress</p>
            </div>
            {booking.paymentMethod === "cash" && (
              <div>
                <p className="font-medium text-green-800">Payment Reminder</p>
                <p className="text-green-700">
                  Cash payment confirmed - Amount due: {booking.amount}
                </p>
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      label: "Driver Assigned",
      status:
        currentStepIndex >= 4
          ? "completed"
          : currentStepIndex === 3
          ? "current"
          : "upcoming",
      icon: <User className="h-5 w-5" />,
      description: "A professional driver has been assigned to your ride",
      estimatedTime: "10-15 minutes",
      details: currentStepIndex >= 4 && booking.driverInfo && (
        <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" />
              <div>
                <p className="font-medium text-blue-800">Driver Name</p>
                <p className="text-blue-700">
                  {booking.driverInfo.name || "Not assigned yet"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-blue-600" />
              <div>
                <p className="font-medium text-blue-800">Driver Phone</p>
                <p className="text-blue-700">
                  {booking.driverInfo.phone || "Not available"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CarIcon className="h-4 w-4 text-blue-600" />
              <div>
                <p className="font-medium text-blue-800">Vehicle Number</p>
                <p className="text-blue-700">
                  {booking.driverInfo.vehicleNumber || "Not available"}
                </p>
              </div>
            </div>
            <div className="pt-2 border-t border-blue-200">
              <p className="text-blue-700 text-xs">
                Your driver will contact you shortly to confirm pickup details.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      label: "Driver En Route",
      status:
        currentStepIndex >= 5
          ? "completed"
          : currentStepIndex === 4
          ? "current"
          : "upcoming",
      icon: <Navigation className="h-5 w-5" />,
      description: "Your driver is on the way to pickup location",
      estimatedTime: "15-30 minutes",
      details: currentStepIndex >= 5 && (
        <div className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-md">
          <div className="space-y-2">
            <div>
              <p className="font-medium text-yellow-800">Estimated Arrival</p>
              <p className="text-yellow-700">Calculating...</p>
            </div>
            <div>
              <p className="font-medium text-yellow-800">Current Location</p>
              <p className="text-yellow-700">Driver is en route</p>
            </div>
            <div className="pt-2 border-t border-yellow-200">
              <p className="text-yellow-700 text-xs">
                Please be ready at the pickup location 5 minutes before the
                scheduled time.
              </p>
              {booking.paymentMethod === "cash" && (
                <p className="text-yellow-700 text-xs mt-1">
                  💵 Remember to have the exact amount ready: {booking.amount}
                </p>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      label: "Ride Started",
      status:
        currentStepIndex >= 6
          ? "completed"
          : currentStepIndex === 5
          ? "current"
          : "upcoming",
      icon: <Map className="h-5 w-5" />,
      description: "Your journey has begun",
      estimatedTime: "Based on route",
      details: currentStepIndex >= 6 && (
        <div className="text-sm text-gray-600 bg-green-50 p-3 rounded-md">
          <div className="space-y-2">
            <div>
              <p className="font-medium text-green-800">Start Time</p>
              <p className="text-green-700">{new Date().toLocaleString()}</p>
            </div>
            <div>
              <p className="font-medium text-green-800">Route</p>
              <p className="text-green-700">
                {booking.pickup} → {booking.dropoff}
              </p>
            </div>
            <div className="pt-2 border-t border-green-200">
              <p className="text-green-700 text-xs">
                Enjoy your ride! Your driver will take the best route to your
                destination.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      label: "Ride Completed",
      status:
        currentStepIndex >= 7
          ? "completed"
          : currentStepIndex === 6
          ? "current"
          : "upcoming",
      icon: <CheckCircle2 className="h-5 w-5" />,
      description: "You have reached your destination",
      estimatedTime: "Journey complete",
      details: currentStepIndex >= 7 && (
        <div className="text-sm text-gray-600 bg-green-50 p-3 rounded-md">
          <div className="space-y-2">
            <div>
              <p className="font-medium text-green-800">Completion Time</p>
              <p className="text-green-700">{new Date().toLocaleString()}</p>
            </div>
            <div>
              <p className="font-medium text-green-800">Total Amount</p>
              <p className="text-green-700">{booking.amount}</p>
            </div>
            <div className="pt-2 border-t border-green-200">
              <p className="text-green-700 text-xs">
                Thank you for choosing First Class Fleet! Please rate your
                experience.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      label: "Rate & Review",
      status: currentStepIndex === 7 ? "current" : "upcoming",
      icon: <Star className="h-5 w-5" />,
      description: "Share your experience and rate your ride",
      estimatedTime: "2-3 minutes",
      details: currentStepIndex === 7 && (
        <div className="text-sm text-gray-600 bg-purple-50 p-3 rounded-md">
          <div className="space-y-2">
            <div>
              <p className="font-medium text-purple-800">Service Quality</p>
              <p className="text-purple-700">Rate your experience</p>
            </div>
            <div>
              <p className="font-medium text-purple-800">Driver Rating</p>
              <p className="text-purple-700">Rate your driver</p>
            </div>
            <div className="pt-2 border-t border-purple-200">
              <p className="text-purple-700 text-xs">
                Your feedback helps us improve our service for future customers.
              </p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="py-4">
      {/* Header with current status */}
      <div className="mb-6 p-4 bg-gradient-to-r from-fleet-red to-fleet-accent rounded-lg text-white">
        <h3 className="text-lg font-semibold mb-2">Current Status</h3>
        <p className="text-sm opacity-90">
          {steps[currentStepIndex]?.label} -{" "}
          {steps[currentStepIndex]?.description}
        </p>
        {steps[currentStepIndex]?.estimatedTime && (
          <p className="text-xs opacity-75 mt-1">
            Estimated time: {steps[currentStepIndex]?.estimatedTime}
          </p>
        )}

        {/* Cash Payment Notice */}
        {booking.paymentMethod === "cash" && (
          <div className="mt-3 p-2 bg-white/20 rounded border border-white/30">
            <p className="text-xs text-white/90">
              💵 Cash Payment: Please have exact amount ready when driver
              arrives
            </p>
          </div>
        )}
      </div>

      {/* Progress steps */}
      <div>
        {steps.map((step, index) => (
          <div key={index} className="flex">
            <div className="flex flex-col items-center mr-4">
              {step.status === "completed" ? (
                <div className="h-8 w-8 p-2 bg-green-500 rounded-full flex items-center justify-center text-white">
                  {step.icon}
                </div>
              ) : step.status === "current" ? (
                <div className="h-8 w-8 p-2 bg-yellow-500 rounded-full flex items-center justify-center text-white animate-pulse">
                  {step.icon}
                </div>
              ) : (
                <div className="h-8 w-8 p-2 bg-gray-300 rounded-full flex items-center justify-center text-gray-500">
                  {step.icon}
                </div>
              )}
              {index < steps.length - 1 && (
                <div
                  className={`h-full min-h-8 w-0.5 ${
                    step.status === "completed"
                      ? "bg-green-500"
                      : step.status === "current"
                      ? "bg-yellow-500"
                      : "bg-gray-200"
                  }`}
                />
              )}
            </div>
            <div className="flex-1 pb-4">
              <div>
                <h4
                  className={`font-semibold text-lg ${
                    step.status === "completed"
                      ? "text-green-700"
                      : step.status === "current"
                      ? "text-yellow-600"
                      : "text-gray-500"
                  }`}
                >
                  {step.label}
                </h4>
                <p
                  className={`text-sm ${
                    step.status === "completed"
                      ? "text-green-600"
                      : step.status === "current"
                      ? "text-yellow-600"
                      : "text-gray-400"
                  }`}
                >
                  {step.description}
                </p>
                {step.estimatedTime && (
                  <p
                    className={`text-xs mt-1 ${
                      step.status === "completed"
                        ? "text-green-500"
                        : step.status === "current"
                        ? "text-yellow-500"
                        : "text-gray-400"
                    }`}
                  >
                    ⏱️ {step.estimatedTime}
                  </p>
                )}
              </div>

              {/* Step details */}
              {step.details && <div className="mt-3">{step.details}</div>}

              {/* Additional info for current step */}
              {step.status === "current" && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800 font-medium">
                    🎯 This is your current step
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    We're working on this right now. You'll be notified when
                    it's complete.
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Summary at the bottom */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-800 mb-2">Booking Summary</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Order ID</p>
            <p className="font-medium text-gray-800">{booking.orderId}</p>
          </div>
          <div>
            <p className="text-gray-600">Service Type</p>
            <p className="font-medium text-gray-800">{booking.type}</p>
          </div>
          <div>
            <p className="text-gray-600">Pickup</p>
            <p className="font-medium text-gray-800">{booking.pickup}</p>
          </div>
          <div>
            <p className="text-gray-600">Dropoff</p>
            <p className="font-medium text-gray-800">{booking.dropoff}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Format booking ID as FC/YYYY/MM/0001
const formatBookingId = (id: string, date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  // Extract numeric part or use a random number
  let numericPart = "0001";
  if (id.includes("/")) {
    // Already formatted, return as is
    return id;
  } else if (/\d+/.test(id)) {
    const matches = id.match(/\d+/);
    if (matches && matches[0]) {
      numericPart = matches[0].padStart(4, "0");
    }
  }

  return `FC/${year}/${month}/${numericPart}`;
};

const BookingCard = ({ booking }: { booking: Booking }) => {
  const [showInvoice, setShowInvoice] = useState(false);
  const [showTracking, setShowTracking] = useState(false);

  // Use the formattedId if available, otherwise generate one
  const bookingId = booking.orderId;

  const handleInvoiceSuccess = () => {
    toast.success("Invoice downloaded successfully");
    setShowInvoice(false);
  };

  const handleInvoiceError = (error: string) => {
    toast.error(error || "Failed to generate invoice");
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">{booking.type} Service</CardTitle>
          <p className="text-sm text-gray-500">Booking ID: {bookingId}</p>
        </div>
        <Badge
          className={`
          ${
            booking.status === "completed"
              ? "bg-green-100 text-green-800"
              : booking.status === "initiated"
              ? "bg-blue-100 text-blue-800"
              : booking.status === "awaiting"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-red-100 text-red-800"
          }
        `}
        >
          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Date</p>
                <p className="text-sm text-gray-500">
                  {format(booking.date, "MMMM d, yyyy")}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Car className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Vehicle</p>
                <p className="text-sm text-gray-500">{booking.vehicle}</p>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Map className="h-5 w-5 text-gray-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Pickup Location</p>
              <p className="text-sm text-gray-500">{booking.pickup}</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Map className="h-5 w-5 text-gray-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Dropoff Location</p>
              <p className="text-sm text-gray-500">{booking.dropoff}</p>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-500">Amount</p>
              <p className="text-lg font-semibold">{booking.amount}</p>
            </div>

            <div className="flex gap-2">
              <Dialog open={showInvoice} onOpenChange={setShowInvoice}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    disabled={
                      booking.status === "cancelled" ||
                      booking.status === "failed"
                    }
                  >
                    <FileText className="h-4 w-4" />
                    <span className="hidden sm:inline">Invoice</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Invoice for Booking {bookingId}</DialogTitle>
                  </DialogHeader>
                  <InvoiceGenerator
                    booking={booking}
                    onSuccess={handleInvoiceSuccess}
                    onError={handleInvoiceError}
                  />
                </DialogContent>
              </Dialog>

              <Dialog open={showTracking} onOpenChange={setShowTracking}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    className="bg-fleet-red hover:bg-fleet-red/90 flex items-center gap-1"
                  >
                    <Clock className="h-4 w-4" />
                    <span className="hidden sm:inline">Track</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-fleet-red" />
                      Track Booking: {bookingId}
                    </DialogTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Real-time updates on your {booking.type.toLowerCase()}{" "}
                      service
                    </p>
                  </DialogHeader>
                  <TrackingDialog booking={booking} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const MyBookings = () => {
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [pastBookings, setPastBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [useDemoData, setUseDemoData] = useState(false);
  const [showDebugTools, setShowDebugTools] = useState(false);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!currentUser) {
        navigate("/login");
      }

      try {
        setLoading(true);
        setError(null);

        // Reference to the bookings collection
        const bookingsRef = collection(firestore, "bookings");

        // Try multiple query approaches to find bookings
        let querySnapshot;
        let userBookingsQuery;

        // Approach 1: Try with customer email in customerInfo
        if (currentUser.email) {
          userBookingsQuery = query(
            bookingsRef,
            where("customerInfo.email", "==", currentUser.email)
          );

          try {
            querySnapshot = await getDocs(userBookingsQuery);
          } catch (err) {
            console.error("Error querying by customerInfo.email:", err);
          }
        }

        // Approach 2: Try with user ID if first approach returned no results
        if (!querySnapshot || querySnapshot.empty) {
          userBookingsQuery = query(
            bookingsRef,
            where("userId", "==", currentUser.uid)
          );

          try {
            querySnapshot = await getDocs(userBookingsQuery);
          } catch (err) {
            console.error("Error querying by userId:", err);
          }
        }

        // Approach 3: Try with user email field directly
        if (!querySnapshot || querySnapshot.empty) {
          userBookingsQuery = query(
            bookingsRef,
            where("email", "==", currentUser.email)
          );

          try {
            querySnapshot = await getDocs(userBookingsQuery);
          } catch (err) {
            console.error("Error querying by email field:", err);
          }
        }

        // Approach 4: Try with user phone number if available
        if ((!querySnapshot || querySnapshot.empty) && userData?.phoneNumber) {
          userBookingsQuery = query(
            bookingsRef,
            where("phoneNumber", "==", userData.phoneNumber)
          );

          try {
            querySnapshot = await getDocs(userBookingsQuery);
          } catch (err) {
            console.error("Error querying by phone number:", err);
          }
        }

        // NEW APPROACH 5: Try with customerInfo.email field (exact match from screenshot)
        if (!querySnapshot || querySnapshot.empty) {
          userBookingsQuery = query(
            bookingsRef,
            where("customerInfo.email", "==", "customer@example.com")
          );

          try {
            querySnapshot = await getDocs(userBookingsQuery);
          } catch (err) {
            console.error("Error querying by exact customerInfo email:", err);
          }
        }

        // NEW APPROACH 6: Get all bookings and filter client-side (last resort)
        if (!querySnapshot || querySnapshot.empty) {
          try {
            querySnapshot = await getDocs(collection(firestore, "bookings"));
          } catch (err) {
            console.error("Error fetching all bookings:", err);
          }
        }

        // If we still have no results, show demo data
        if (!querySnapshot || querySnapshot.empty) {
          navigate("/");
          return;
        }

        const now = new Date();
        const upcoming: Booking[] = [];
        const past: Booking[] = [];

        querySnapshot.forEach((doc) => {
          try {
            const data = doc.data();

            // Process booking creation date
            let createdAt: Date | null = null;
            try {
              if (
                data.createdAt?.toDate &&
                typeof data.createdAt.toDate === "function"
              ) {
                createdAt = data.createdAt.toDate();
              } else if (data.createdAt) {
                // Handle other date formats
                createdAt = new Date(data.createdAt);
              } else {
                console.warn("No createdAt value found");
              }
            } catch (error) {
              console.error("Error parsing createdAt:", error);
            }

            // Process service date (pickup date/time)
            let bookingDate: Date;
            try {
              // First try to use pickupDateTime (new format)
              if (data.pickupDateTime) {
                if (typeof data.pickupDateTime.toDate === "function") {
                  bookingDate = data.pickupDateTime.toDate();
                } else if (typeof data.pickupDateTime === "string") {
                  bookingDate = new Date(data.pickupDateTime);
                } else {
                  bookingDate = new Date();
                  console.warn("Invalid pickupDateTime format");
                }
              }
              // Fall back to date field (old format)
              else if (data.date) {
                if (typeof data.date.toDate === "function") {
                  bookingDate = data.date.toDate();
                } else if (typeof data.date === "string") {
                  bookingDate = new Date(data.date);
                } else {
                  bookingDate = new Date();
                  console.warn("Invalid date format");
                }
              } else {
                bookingDate = new Date();
                console.warn("No date value found");
              }

              // Validate the date
              if (isNaN(bookingDate.getTime())) {
                console.warn(`Invalid date, using current date`);
                bookingDate = new Date();
              }
            } catch (error) {
              console.error("Error parsing date:", error);
              bookingDate = new Date();
            }

            // Extract amount with fallbacks
            let amount = "AED 0.00";
            if (typeof data.amount === "number") {
              amount = `AED ${data.amount.toFixed(2)}`;
            } else if (typeof data.totalAmount === "number") {
              amount = `AED ${data.totalAmount.toFixed(2)}`;
            } else if (typeof data.price === "number") {
              amount = `AED ${data.price.toFixed(2)}`;
            }

            const booking: Booking = {
              id: doc.id,
              orderId: data.orderId,
              type: data.type || data.bookingType || "Chauffeur",
              status: data.status || "initiated",
              date: bookingDate,
              pickup:
                data.pickupLocation?.name ||
                data.pickup ||
                data.origin ||
                "N/A",
              dropoff:
                data.dropoffLocation?.name ||
                data.dropoff ||
                data.destination ||
                "N/A",
              vehicle:
                data.vehicle?.name ||
                data.vehicleType ||
                data.car ||
                "Standard Vehicle",
              amount: amount,
              paymentMethod: data.paymentMethod || data.paymentInfo?.method,
              paymentInfo: data.paymentInfo || {},
              customerInfo: data.customerInfo || {
                name: userData?.firstName
                  ? `${userData.firstName} ${userData.lastName || ""}`
                  : currentUser.displayName || "User",
                email: currentUser.email || "N/A",
                phone: userData?.phoneNumber || data.phoneNumber || "N/A",
              },
              driverInfo: data.driverInfo || {
                name: data.driverName || data.driver?.name,
                phone: data.driverPhone || data.driver?.phone,
                vehicleNumber: data.vehicleNumber || data.driver?.vehicleNumber,
              },
              createdAt: createdAt
                ? createdAt.toISOString()
                : new Date().toISOString(),
            };

            // Categorize bookings based on status rather than just date
            if (
              booking.status === "completed" ||
              booking.status === "cancelled"
            ) {
              past.push(booking);
            } else {
              upcoming.push(booking);
            }
          } catch (err) {
            console.error(`Error processing booking ${doc.id}:`, err);
            // Continue with other bookings even if one fails
          }
        });

        // Sort both arrays by date (newest first)
        const sortByDateDesc = (a: Booking, b: Booking) => {
          try {
            // Make sure both dates are valid before comparing
            const aTime = isNaN(a.date.getTime()) ? 0 : a.date.getTime();
            const bTime = isNaN(b.date.getTime()) ? 0 : b.date.getTime();
            return bTime - aTime;
          } catch (err) {
            console.error("Error comparing dates:", err);
            return 0; // Return 0 to keep original order if there's an error
          }
        };

        // Safely sort the arrays
        try {
          upcoming.sort(sortByDateDesc);
          past.sort(sortByDateDesc);
        } catch (err) {
          console.error("Error sorting bookings:", err);
          // Continue without sorting if there's an error
        }

        setUpcomingBookings(upcoming);
        setPastBookings(past);
        setUseDemoData(false);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching bookings:", err);
        setError("Failed to load bookings. Please try again.");

        // Use demo data after multiple failures
        if (retryCount >= 2) {
          navigate("/");
        }
        setLoading(false);
      }
    };

    fetchBookings();
  }, [currentUser, userData, retryCount]);

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
  };

  const toggleDebugTools = () => {
    setShowDebugTools((prev) => !prev);
  };

  return (
    <Layout>
      <div className="bg-gradient-to-r from-fleet-red to-fleet-accent py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            My Bookings
          </h1>
          <p className="text-white/90 mt-2">View and manage your bookings</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 text-fleet-red animate-spin mb-4" />
            <p className="text-gray-600">Loading your bookings...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4 max-w-lg mx-auto">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
            <Button onClick={handleRetry} variant="outline" className="ml-2">
              Try Again
            </Button>
          </div>
        ) : (
          <>
            <Tabs defaultValue="upcoming" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="upcoming" className="text-base">
                  Upcoming ({upcomingBookings.length})
                </TabsTrigger>
                <TabsTrigger value="past" className="text-base">
                  Past ({pastBookings.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upcoming" className="space-y-4">
                {upcomingBookings.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">
                      You don't have any upcoming bookings.
                    </p>
                    <Link to="/">
                      <Button>Book a Ride</Button>
                    </Link>
                  </div>
                ) : (
                  upcomingBookings.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))
                )}
              </TabsContent>

              <TabsContent value="past" className="space-y-4">
                {pastBookings.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">
                      You don't have any past bookings.
                    </p>
                  </div>
                ) : (
                  pastBookings.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))
                )}
              </TabsContent>
            </Tabs>

            {/* Debug section */}
            <div className="mt-12 border-t pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleDebugTools}
                className="mb-4"
              >
                {showDebugTools ? "Hide Debug Tools" : "Show Debug Tools"}
              </Button>

              {showDebugTools && (
                <div className="mt-4">
                  <h3 className="text-lg font-medium mb-3">
                    Debug Information
                  </h3>
                  <div className="bg-gray-50 p-3 rounded mb-4">
                    <p>
                      <strong>User ID:</strong>{" "}
                      {currentUser?.uid || "Not logged in"}
                    </p>
                    <p>
                      <strong>User Email:</strong> {currentUser?.email || "N/A"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default MyBookings;
