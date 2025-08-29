import React, { useState, useEffect } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Image as ImageIcon, Users, Briefcase } from "lucide-react";
import { Vehicle, Location } from "@/types";

interface VehicleSelectorProps {
  vehicles: Vehicle[];
  selectedCarModel: string;
  onSelect: (vehicleId: string) => void;
  loading: boolean;
  pickupLocation?: Location;
  dropoffLocation?: Location;
}

const VehicleSelector: React.FC<VehicleSelectorProps> = ({
  vehicles,
  selectedCarModel,
  onSelect,
  loading,
  pickupLocation,
  dropoffLocation,
}) => {
  // Track active image index for each vehicle
  const [activeImageIndex, setActiveImageIndex] = useState<
    Record<string, number>
  >({});

  // Initialize active image indices when vehicles change
  useEffect(() => {
    const initialIndices: Record<string, number> = {};
    vehicles.forEach((vehicle) => {
      initialIndices[vehicle.id] = 0;
    });
    setActiveImageIndex(initialIndices);
  }, [vehicles]);

  // Helper function to calculate estimated price
  const getEstimatedPrice = (vehicle: Vehicle) => {
    if (!vehicle) return 0;

    // Calculate distance if pickup and dropoff locations are available
    let distanceKm = 10; // Default distance
    let estimatedMinutes = 30; // Default time

    if (
      pickupLocation &&
      dropoffLocation &&
      pickupLocation.coordinates &&
      dropoffLocation.coordinates
    ) {
      // Calculate actual distance using the Haversine formula
      distanceKm = calculateDistance(
        pickupLocation.coordinates.latitude,
        pickupLocation.coordinates.longitude,
        dropoffLocation.coordinates.latitude,
        dropoffLocation.coordinates.longitude,
      );

      // Estimate travel time based on distance (assuming average speed of 30 km/h in city traffic)
      const averageSpeedKmh = 30;
      const estimatedTravelTimeHours = distanceKm / averageSpeedKmh;
      estimatedMinutes = Math.ceil(estimatedTravelTimeHours * 60);
    }
    // Calculate base fare
    let totalPrice =
      vehicle.basePrice +
      vehicle.perKmPrice * distanceKm +
      vehicle.perKmPrice * estimatedMinutes;

    // Ensure minimum fare
    const minFare = 5; // Minimum fare in AED
    if (totalPrice < minFare) {
      totalPrice = minFare;
    }

    // Round to 2 decimal places
    return Math.round(totalPrice * 100) / 100;
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

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-fleet-red" />
        <span className="ml-2">Loading vehicles...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold text-gray-900">
          Select a vehicle class
        </h2>
        <p className="text-sm text-gray-600">
          All prices include estimated VAT, fees, and tolls
        </p>
      </div>

      {vehicles.map((car) => (
        <div
          key={car.id}
          className={`border rounded-lg p-4 hover:border-fleet-red cursor-pointer transition-all ${
            selectedCarModel === car.id
              ? "border-fleet-red bg-fleet-red/5 shadow-sm"
              : "border-gray-200 bg-white hover:shadow-sm"
          }`}
          onClick={() => onSelect(car.id)}
        >
          <div className="flex items-center gap-4">
            {/* Vehicle Image */}
            <div className="flex-shrink-0">
              <div className="w-28 h-20 rounded-lg overflow-hidden bg-gray-100">
                {car.imageUrl ? (
                  <img
                    src={car.imageUrl}
                    alt={car.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon size={24} className="text-gray-400" />
                  </div>
                )}
              </div>
            </div>

            {/* Vehicle Details */}
            <div className="flex-1 space-y-2">
              {/* Vehicle Class Name */}
              <h3 className="text-lg font-semibold text-gray-900">
                {car.name}
              </h3>

              {/* Capacity Icons */}
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{car.capacity}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Briefcase className="h-4 w-4" />
                  <span>{Math.min(car.capacity - 1, 5)}</span>
                </div>
              </div>

              {/* Description/Model */}
              <p className="text-sm text-gray-500">{car.description}</p>
            </div>

            {/* Price and Chevron */}
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-xl font-bold text-gray-900">
                  {getEstimatedPrice(car)}
                </p>
                <p className="text-xs text-gray-500">AED</p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default VehicleSelector;
