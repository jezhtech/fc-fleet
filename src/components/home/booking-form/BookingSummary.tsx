import React from "react";
import { format } from "date-fns";
import { Check, FileText, Book } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Vehicle, bookingStatuses, Location } from "@/types";
import { formatCurrency } from "@/utils/currency";

interface BookingSummaryProps {
  pickupDate: Date | undefined;
  pickupTime: string;
  vehicle: Vehicle | undefined;
  pickupLocation: Location | undefined;
  dropoffLocation: Location | undefined;
  onNewBooking: () => void;
}

const BookingSummary: React.FC<BookingSummaryProps> = ({
  pickupDate,
  pickupTime,
  vehicle,
  pickupLocation,
  dropoffLocation,
  onNewBooking,
}) => {
  // Function to handle receipt download
  const handleDownloadReceipt = () => {
    toast.success("Receipt downloaded successfully");
    // In a real app, this would generate and download a PDF receipt
  };

  // Calculate estimated price
  const calculateEstimatedPrice = () => {
    if (!vehicle) return 0;

    if (!pickupLocation || !dropoffLocation) return 0;

    // Get coordinates for pickup and dropoff
    const pickupCoords = pickupLocation.coordinates;
    const dropoffCoords = dropoffLocation.coordinates;

    if (!pickupCoords || !dropoffCoords) {
      console.warn("Missing coordinates for pickup or dropoff location");
      // Fallback to base price only
      return vehicle.basePrice || 0;
    }

    // Calculate actual distance using the Haversine formula
    const distanceKm = calculateDistance(
      pickupCoords.latitude,
      pickupCoords.longitude,
      dropoffCoords.latitude,
      dropoffCoords.longitude,
    );

    // Estimate travel time based on distance (assuming average speed of 30 km/h in city traffic)
    const averageSpeedKmh = 30;
    const estimatedTravelTimeHours = distanceKm / averageSpeedKmh;
    const estimatedMinutes = Math.ceil(estimatedTravelTimeHours * 60);

    // Apply pricing
    const basePrice = vehicle.basePrice || 0;
    const perKmPrice = vehicle.perKmPrice || 0;
    const perHourPrice = vehicle.perHourPrice || 0;

    // Check if we're in peak hours (7-9 AM or 5-7 PM on weekdays)
    const now = new Date();
    const hour = now.getHours();
    const isWeekday = now.getDay() >= 1 && now.getDay() <= 5; // Monday to Friday
    const isPeakHour =
      isWeekday && ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19));

    // Apply surge pricing during peak hours
    const surgeMultiplier = isPeakHour ? 1.2 : 1.0;

    // Calculate total fare
    let totalFare =
      basePrice + distanceKm * perKmPrice + estimatedMinutes * perHourPrice;

    // Apply surge multiplier if in peak hours
    if (isPeakHour) {
      totalFare *= surgeMultiplier;
    }

    // Ensure minimum fare
    const minFare = 20; // Minimum fare in AED
    if (totalFare < minFare) {
      totalFare = minFare;
    }

    // Round to 2 decimal places
    return Math.round(totalFare * 100) / 100;
  };

  // Haversine formula to calculate distance between two coordinates in kilometers
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number => {
    const R = 6371; // Radius of the Earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance;
  };

  const deg2rad = (deg: number): number => {
    return deg * (Math.PI / 180);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-md bg-green-50 p-4 border border-green-200">
        <div className="flex items-center">
          <Check className="h-5 w-5 text-green-500 mr-3" />
          <h3 className="text-green-800 font-medium">Booking Successful!</h3>
        </div>
        <p className="text-green-700 text-sm mt-2">
          Your booking has been initiated and is being processed. You will
          receive a confirmation shortly.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="font-medium">Booking Status</h3>
        <div className="space-y-2">
          {bookingStatuses.map((status, index) => (
            <div key={status.id} className="flex items-center">
              <div
                className={`h-5 w-5 rounded-full mr-3 flex items-center justify-center ${index === 0 ? "bg-green-500" : "bg-gray-200"}`}
              >
                {index === 0 && <Check className="h-3 w-3 text-white" />}
              </div>
              <span className={index === 0 ? "font-medium" : "text-gray-500"}>
                {status.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <Card className="p-4">
        <h3 className="font-medium mb-3">Booking Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Pickup</span>
            <span className="font-medium">
              {pickupLocation?.address ||
                pickupLocation?.name ||
                "Selected Location"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Dropoff</span>
            <span className="font-medium">
              {dropoffLocation?.address ||
                dropoffLocation?.name ||
                "Selected Location"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Date & Time</span>
            <span className="font-medium">
              {pickupDate ? format(pickupDate, "PPP") : ""} at {pickupTime}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Vehicle</span>
            <span className="font-medium">
              {vehicle?.name || "Selected Vehicle"}
            </span>
          </div>
          {vehicle && (
            <div className="flex justify-between">
              <span className="text-gray-500">Total Fare</span>
              <span className="font-bold text-fleet-red">
                {formatCurrency(calculateEstimatedPrice())}
              </span>
            </div>
          )}
        </div>
      </Card>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleDownloadReceipt}
          className="flex-1"
        >
          <FileText className="h-4 w-4 mr-2" />
          Download Receipt
        </Button>

        <Button
          type="button"
          className="flex-1 text-white font-medium bg-gradient-to-r from-fleet-red to-fleet-accent hover:opacity-90"
          asChild
        >
          <Link to="/my-bookings">
            <Book className="h-4 w-4 mr-2" />
            View My Bookings
          </Link>
        </Button>
      </div>

      <div className="text-center mt-8">
        <Button type="button" variant="ghost" onClick={onNewBooking}>
          Book Another Ride
        </Button>
      </div>
    </div>
  );
};

export default BookingSummary;
