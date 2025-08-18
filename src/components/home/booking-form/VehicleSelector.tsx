import React, { useState, useEffect } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import { Vehicle, Location } from "./types";
import { formatCurrency } from "@/utils/currency";

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
        pickupLocation.coordinates.lat,
        pickupLocation.coordinates.lng,
        dropoffLocation.coordinates.lat,
        dropoffLocation.coordinates.lng
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
      vehicle.perMinutePrice * estimatedMinutes;

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
    lon2: number
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
    <div className="space-y-2">
      <label className="text-sm font-medium">Available Cars</label>
      <RadioGroup
        value={selectedCarModel}
        onValueChange={onSelect}
        className="space-y-3"
      >
        {vehicles.map((car) => (
          <div
            key={car.id}
            className={`border bg-background rounded-md overflow-hidden hover:border-fleet-red cursor-pointer transition-colors ${
              selectedCarModel === car.id
                ? "border-fleet-red bg-fleet-red/10"
                : ""
            }`}
            onClick={() => onSelect(car.id)}
          >
            <RadioGroupItem value={car.id} id={car.id} className="sr-only" />

            {/* Vehicle Image Section */}
            <div className="flex h-60 w-full border-b">
              {/* Main Image */}
              <div className="flex-1 relative flex items-center justify-center">
                {car.images && car.images.length > 0 ? (
                  <img
                    src={car.images[activeImageIndex[car.id] || 0]}
                    alt={car.name}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon size={48} className="text-gray-300" />
                  </div>
                )}
              </div>

              {/* Side Image Panel - Always Show */}
              <div className="w-20 border-l border-gray-200 p-2 space-y-2 overflow-y-auto">
                {car.images && car.images.length > 0 ? (
                  car.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setActiveImageIndex((prev) => ({
                          ...prev,
                          [car.id]: index,
                        }));
                      }}
                      className={`w-full aspect-square rounded-md overflow-hidden border-2 transition-all ${
                        index === (activeImageIndex[car.id] || 0)
                          ? "border-fleet-red shadow-md"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${car.name} view ${index + 1}`}
                        className="w-full h-full object-contain"
                      />
                    </button>
                  ))
                ) : (
                  // Placeholder for when no images exist
                  <div className="w-full aspect-square rounded-md bg-gray-200 flex items-center justify-center">
                    <ImageIcon size={16} className="text-gray-400" />
                  </div>
                )}
              </div>
            </div>

            {/* Vehicle Details Section */}
            <div className="p-3">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium">{car.name}</h4>
                  <p className="text-xs text-gray-500">{car.description}</p>
                  <div className="flex items-center text-xs mt-1">
                    <span className="mr-2">👥 {car.capacity} seats</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-fleet-red">
                    {formatCurrency(getEstimatedPrice(car))}
                  </p>
                  <p className="text-xs text-gray-500">Estimated fare</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
};

export default VehicleSelector;
