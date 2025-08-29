import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { BookingForm, Location, Transport, Vehicle } from "@/types";
import { transportService, vehicleService, bookingService } from "@/services";
import { generateBookingId, getNextBookingCount } from "@/utils/booking";
import { Clock, AlertTriangle } from "lucide-react";
import CCavenueCheckout from "@/components/checkout/CCavenueCheckout";
import LocationSelector from "./LocationSelector";
import RouteMap from "./RouteMap";
import DateTimePicker from "./DateTimePicker";
import TransportTypeSelector from "./TransportTypeSelector";
import VehicleSelector from "./VehicleSelector";

const BookTaxiForm = () => {
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();

  // Form steps state
  const [step, setStep] = useState(1);

  // Form data states
  const [pickupDate, setPickupDate] = useState<Date | undefined>(() => {
    const now = new Date();
    const fourHoursFromNow = new Date(now.getTime() + 4 * 60 * 60 * 1000);
    // Use the date of 4 hours from now, not just today
    const initialDate = new Date(
      fourHoursFromNow.getFullYear(),
      fourHoursFromNow.getMonth(),
      fourHoursFromNow.getDate(),
    );
    return initialDate;
  });

  // Calculate initial time (4 hours from now)
  const getInitialTime = () => {
    const now = new Date();
    const fourHoursFromNow = new Date(now.getTime() + 4 * 70 * 60 * 1000);
    const hours = fourHoursFromNow.getHours().toString().padStart(2, "0");
    const minutes = fourHoursFromNow.getMinutes().toString().padStart(2, "0");
    const timeString = `${hours}:${minutes}`;
    return timeString;
  };

  const [bookingDetails, setBookingDetails] = useState<{
    pickup: string;
    dropoff: string;
    time: string;
  }>({
    pickup: "",
    dropoff: "",
    time: getInitialTime(),
  });

  // Transport selections
  const [selectedTaxiType, setSelectedTaxiType] = useState("");
  const [selectedCarModel, setSelectedCarModel] = useState("");

  // Location data
  const [selectedPickupLocation, setSelectedPickupLocation] = useState<
    Location | undefined
  >(undefined);
  const [selectedDropoffLocation, setSelectedDropoffLocation] = useState<
    Location | undefined
  >(undefined);

  // Lists for selection components
  const [transportTypes, setTransportTypes] = useState<Transport[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  // Available transport types that have vehicles
  const [availableTransportTypes, setAvailableTransportTypes] = useState<
    string[]
  >([]);

  // Loading states
  const [loading, setLoading] = useState({
    transportTypes: false,
    vehicles: false,
    checkingAvailability: false,
    savingBooking: false,
  });

  const [orderId, setOrderId] = useState<string>("");

  useEffect(() => {
    if (step === 2) {
      fetchTransportTypes();
    }
  }, [step]);

  useEffect(() => {
    if (step === 3) {
      fetchVehicles(selectedTaxiType);
    }
  }, [step, selectedTaxiType]);

  const fetchTransportTypes = async () => {
    setLoading((prev) => ({ ...prev, transportTypes: true }));
    try {
      const transportResponse = await transportService.getAllTransports();
      const transportTypesData = transportResponse.data;

      if (transportTypesData.length > 0 && !selectedTaxiType) {
        setSelectedTaxiType(transportTypesData[0].id);
      }
      setTransportTypes(transportTypesData);

      // Check which transport types have available vehicles
      await checkTransportTypeAvailability(transportTypesData);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading((prev) => ({ ...prev, transportTypes: false }));
    }
  };

  // Fetch vehicles based on selected transport type
  const fetchVehicles = async (taxiTypeId: string) => {
    setLoading((prev) => ({ ...prev, vehicles: true }));
    try {
      const vehicleResponse =
        await vehicleService.getVehiclesByTransport(taxiTypeId);
      const vehiclesData = vehicleResponse.data.map((v) => ({
        ...v,
        basePrice: parseFloat(v.basePrice.toString()),
        perKmPrice: parseFloat(v.perKmPrice.toString()),
      }));
      if (vehiclesData.length > 0) {
        setVehicles(vehiclesData);
      } else {
        setVehicles([]);
      }
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      setVehicles([]);
    } finally {
      setLoading((prev) => ({ ...prev, vehicles: false }));
    }
  };

  // Handler for pickup location selection
  const handlePickupLocationSelect = (location: Location) => {
    setSelectedPickupLocation(location);
    setBookingDetails((prev) => ({ ...prev, pickup: location.name }));
  };

  // Handler for dropoff location selection
  const handleDropoffLocationSelect = (location: Location) => {
    setSelectedDropoffLocation(location);
    setBookingDetails((prev) => ({ ...prev, dropoff: location.name }));
  };

  // Check which transport types have available vehicles
  const checkTransportTypeAvailability = async (types: Transport[]) => {
    try {
      setLoading((prev) => ({ ...prev, checkingAvailability: true }));
      const availableTypeIds: string[] = [];

      // Check each transport type for available vehicles
      for (const type of types) {
        const response = await vehicleService.getVehiclesByTransport(type.id);

        if (response.success && response.data && response.data.length > 0) {
          availableTypeIds.push(type.id);
        }
      }

      setAvailableTransportTypes(availableTypeIds);

      // If there are no available types, show a message
      if (availableTypeIds.length === 0) {
        toast.error("No vehicles available for any transport type");
      }

      // If selectedTaxiType is no longer available, reset it
      if (selectedTaxiType && !availableTypeIds.includes(selectedTaxiType)) {
        setSelectedTaxiType(availableTypeIds[0] || "");
      }

      return availableTypeIds;
    } catch (error) {
      console.error("Error checking transport type availability:", error);
      toast.error("Failed to check vehicle availability");
      return [];
    } finally {
      setLoading((prev) => ({ ...prev, checkingAvailability: false }));
    }
  };

  // Handler for transport type selection
  const handleTransportTypeSelect = (typeId: string) => {
    // Only allow selection if the type is available
    if (availableTransportTypes.includes(typeId)) {
      setSelectedTaxiType(typeId);
    }
  };

  // Calculate estimated fare based on vehicle and distance
  const calculateEstimatedFare = () => {
    const selectedVehicle = vehicles.find((v) => v.id === selectedCarModel);
    if (!selectedVehicle) return 0;

    if (!selectedPickupLocation || !selectedDropoffLocation) return 0;

    // Get coordinates for pickup and dropoff
    const pickupCoords = selectedPickupLocation.coordinates;
    const dropoffCoords = selectedDropoffLocation.coordinates;

    if (!pickupCoords || !dropoffCoords) {
      console.warn("Missing coordinates for pickup or dropoff location");
      // Fallback to base price only
      return selectedVehicle.basePrice || 0;
    }

    // Calculate actual distance using the Haversine formula
    const distanceKm = calculateDistance(
      pickupCoords.latitude,
      pickupCoords.longitude,
      dropoffCoords.latitude,
      dropoffCoords.longitude,
    );

    // Calculate total fare
    let totalFare =
      selectedVehicle.basePrice + distanceKm * selectedVehicle.perKmPrice;

    // Ensure minimum fare
    const minFare = 5; // Minimum fare in AED
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

  // Helper function to get customer information
  const getCustomerInfo = () => {
    const customerName = userData
      ? `${userData.firstName} ${userData.lastName}`.trim()
      : currentUser?.displayName || "Customer";

    const customerEmail =
      userData?.email || currentUser?.email || "customer@example.com";

    const customerPhone =
      userData?.phone || currentUser?.phoneNumber || "123456789";

    return { customerName, customerEmail, customerPhone };
  };

  // Validate booking time is at least 4 hours in advance
  const validateBookingTime = () => {
    if (!pickupDate) {
      return false;
    }

    const now = new Date();
    // Create a new date object from the pickup date to avoid mutating the original
    const selectedDateTime = new Date(pickupDate.getTime());
    const timeParts = bookingDetails.time.split(":");
    if (timeParts.length !== 2) {
      console.error("Invalid time format:", bookingDetails.time);
      toast.error("Invalid time format");
      return false;
    }

    const hours = parseInt(timeParts[0], 10);
    const minutes = parseInt(timeParts[1], 10);

    if (
      isNaN(hours) ||
      isNaN(minutes) ||
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59
    ) {
      console.error("Invalid time values:", { hours, minutes });
      toast.error("Invalid time values");
      return false;
    }

    selectedDateTime.setHours(hours, minutes, 0, 0);

    const timeDifference = selectedDateTime.getTime() - now.getTime();
    const hoursDifference = timeDifference / (1000 * 60 * 60);

    if (hoursDifference < 4) {
      toast.error(
        `Bookings must be made at least 4 hours in advance. Current time: ${now.toLocaleTimeString()}, Selected time: ${selectedDateTime.toLocaleTimeString()}, Difference: ${hoursDifference.toFixed(
          2,
        )} hours`,
      );
      return false;
    }

    return true;
  };

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Check if user is authenticated
    if (!currentUser) {
      toast.error("Please login to book a chauffeur");
      navigate("/login", {
        state: {
          from: {
            pathname: window.location.pathname,
            search: window.location.search,
          },
        },
      });
      return;
    }

    if (step === 1) {
      if (!bookingDetails.pickup || !bookingDetails.dropoff) {
        toast.error("Please enter both pickup and drop-off locations");
        return;
      }

      if (!selectedPickupLocation || !selectedDropoffLocation) {
        toast.error("Please select valid locations from the suggestions");
        return;
      }

      if (!validateBookingTime()) {
        return;
      }

      setStep(2);
    } else if (step === 2) {
      if (!selectedTaxiType) {
        toast.error("Please select a transport type");
        return;
      }

      if (!availableTransportTypes.includes(selectedTaxiType)) {
        toast.error("The selected transport type is not available");
        return;
      }

      setStep(3);
    } else if (step === 3) {
      if (!selectedCarModel) {
        toast.error("Please select a car model");
        return;
      }

      // Find the selected vehicle
      const selectedVehicle = vehicles.find((v) => v.id === selectedCarModel);
      if (!selectedVehicle) {
        toast.error("Vehicle information is missing");
        return;
      }

      // Calculate fare
      const estimatedFare = calculateEstimatedFare();

      const [hours, minutes] = bookingDetails.time.split(":").map(Number);

      const pickupDateTime = pickupDate.setHours(hours, minutes, 0, 0);

      const bookingData = {
        bookingType: "ride" as const,
        userId: currentUser?.uid,
        vehicleId: selectedVehicle.id,
        status: "initiated" as const,
        pickupLocation: selectedPickupLocation,
        dropoffLocation: selectedDropoffLocation,
        pickupDate: pickupDateTime,
        amount: estimatedFare,
      };

      try {
        setLoading({ ...loading, savingBooking: true });
        const response = await bookingService.createBooking(bookingData);
        if (response.success) {
          setOrderId(response.data.id);
          setStep(4); // Move to payment step
        } else {
          toast.error("Failed to create booking. Please try again.");
        }
      } catch (error) {
        console.error("Failed to create booking", error);
        toast.error("Failed to save booking details");
      } finally {
        setLoading({ ...loading, savingBooking: false });
      }
    }
  };

  return (
    <div className="space-y-3">
      {/* Login notice for unauthenticated users */}
      {!currentUser && step === 1 && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-800">Login Required</p>
              <p className="text-amber-700 mt-1">
                Please login to book a chauffeur. You'll be redirected to the
                login page when you click "Book Chauffeur".
              </p>
            </div>
          </div>
        </div>
      )}

      {step === 1 && (
        <form onSubmit={handleSubmit}>
          <div className="space-y-3">
            <LocationSelector
              id="pickup"
              label="Pickup Location"
              value={bookingDetails.pickup}
              onChange={(value) =>
                setBookingDetails((prev) => ({ ...prev, pickup: value }))
              }
              onLocationSelect={handlePickupLocationSelect}
              placeholder="Enter pickup address"
            />

            <LocationSelector
              id="dropoff"
              label="Dropoff Location"
              value={bookingDetails.dropoff}
              onChange={(value) =>
                setBookingDetails((prev) => ({ ...prev, dropoff: value }))
              }
              onLocationSelect={handleDropoffLocationSelect}
              placeholder="Enter destination address"
            />
          </div>

          <div className="mt-2">
            <RouteMap
              pickupLocation={selectedPickupLocation}
              dropoffLocation={selectedDropoffLocation}
            />
          </div>

          <DateTimePicker
            label="Date & Time"
            date={pickupDate}
            time={bookingDetails.time}
            onDateChange={setPickupDate}
            onTimeChange={(time) =>
              setBookingDetails((prev) => ({ ...prev, time }))
            }
          />

          {/* 4-hour advance booking notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-2">
            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-800">
                  Advance Booking Required
                </p>
                <p className="text-blue-700 mt-1">
                  Bookings must be made at least 4 hours in advance. This
                  ensures we can provide the best service for your journey.
                </p>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-9 text-white text-sm font-medium bg-gradient-to-r from-fleet-red to-fleet-accent hover:opacity-90 hover:shadow-md transition-all rounded-md mt-2"
          >
            {loading.transportTypes || loading.checkingAvailability
              ? "Loading..."
              : !currentUser
                ? "Login to Book Chauffeur"
                : "Book Chauffeur"}
          </Button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <h4 className="text-sm font-medium">Select Transport Type</h4>
            <p className="text-xs text-gray-500 mt-1">
              Only transport types with available vehicles are enabled for
              booking.
              {availableTransportTypes.length === 0 &&
                " No vehicles are currently available."}
            </p>
          </div>
          <TransportTypeSelector
            transportTypes={transportTypes}
            selectedTaxiType={selectedTaxiType}
            onSelect={handleTransportTypeSelect}
            loading={loading.transportTypes || loading.checkingAvailability}
            availableTypes={availableTransportTypes}
          />
          <div className="flex justify-between mt-3">
            <Button
              type="submit"
              variant="outline"
              className="h-8 text-xs border-gray-300 hover:bg-gray-50 transition-all"
              onClick={() => setStep(1)}
            >
              Back
            </Button>
            <Button
              type="submit"
              className="h-8 text-xs text-white font-medium bg-gradient-to-r from-fleet-red to-fleet-accent hover:opacity-90 hover:shadow-md transition-all"
              disabled={
                loading.transportTypes ||
                loading.checkingAvailability ||
                !selectedTaxiType ||
                !availableTransportTypes.includes(selectedTaxiType)
              }
            >
              Next
            </Button>
          </div>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleSubmit}>
          <VehicleSelector
            vehicles={vehicles}
            selectedCarModel={selectedCarModel}
            onSelect={setSelectedCarModel}
            loading={loading.vehicles}
            pickupLocation={selectedPickupLocation}
            dropoffLocation={selectedDropoffLocation}
          />
          <div className="flex justify-between mt-3">
            <Button
              type="button"
              variant="outline"
              className="h-8 text-xs border-gray-300 hover:bg-gray-50 transition-all"
              onClick={() => setStep(2)}
            >
              Back
            </Button>
            <Button
              type="submit"
              className="h-8 text-xs text-white font-medium bg-gradient-to-r from-fleet-red to-fleet-accent hover:opacity-90 hover:shadow-md transition-all"
              disabled={!selectedCarModel || loading.savingBooking}
              onClick={() =>
                handleSubmit({} as React.FormEvent<HTMLFormElement>)
              }
            >
              Proceed to Payment
            </Button>
          </div>
        </form>
      )}

      {step === 4 && (
        <>
          <div className="mb-3">
            <h4 className="text-sm font-medium">Complete Payment</h4>
            <p className="text-xs text-gray-500 mt-1">
              Secure payment via CCAvenue. Your booking will be confirmed after
              successful payment.
            </p>
          </div>

          {orderId && (
            <CCavenueCheckout
              orderId={orderId}
              amount={calculateEstimatedFare()}
              customerName={getCustomerInfo().customerName}
              customerEmail={getCustomerInfo().customerEmail}
              customerPhone={getCustomerInfo().customerPhone}
            />
          )}

          <div className="flex justify-between mt-3">
            <Button
              type="button"
              variant="outline"
              className="h-8 text-xs border-gray-300 hover:bg-gray-50 transition-all"
              onClick={() => setStep(3)}
            >
              Back
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default BookTaxiForm;
