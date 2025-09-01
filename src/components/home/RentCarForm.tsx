import { toast } from "sonner";
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Info, AlertTriangle } from "lucide-react";

import {
  Select,
  SelectItem,
  SelectValue,
  SelectContent,
  SelectTrigger,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  DateTimePicker,
  LocationSelector,
  RouteMap,
  TransportTypeSelector,
} from "./booking-form";
import { useAuth } from "@/contexts/AuthContext";
import CCavenueCheckout from "@/components/checkout/CCavenueCheckout";
import { generateBookingId, getNextBookingCount } from "@/utils/booking";
import { Location, Transport, Vehicle } from "@/types";
import { bookingService, transportService, vehicleService } from "@/services";
import { generateOrderId } from "@/lib/utils";

// Emirates and their tour options
const emiratesData = {
  dubai: {
    name: "Dubai",
    hourlyTours: [
      {
        id: "dubai-half-day",
        name: "Dubai Half Day, 5hrs City Tour",
        duration: 5,
      },
      {
        id: "dubai-full-day",
        name: "Dubai Full Day, 10hrs City Tour",
        duration: 10,
      },
    ],
  },
  otherEmirates: {
    name: "Other Emirates",
    hourlyTours: [
      {
        id: "abu-dhabi-half-day",
        name: "Abu Dhabi Half Day, 5hrs City Tour",
        duration: 5,
      },
      {
        id: "sharjah-half-day",
        name: "Sharjah Half Day, 5hrs City Tour",
        duration: 5,
      },
      {
        id: "fujairah-half-day",
        name: "Fujairah Half Day, 5hrs City Tour",
        duration: 5,
      },
      {
        id: "al-ain-half-day",
        name: "Al Ain Half Day, 5hrs City Tour",
        duration: 5,
      },
    ],
  },
};

const rentalStatuses = [
  { id: "initiated", label: "Booking Initiated", completed: true },
  { id: "processing", label: "Processing", completed: false },
  { id: "ready", label: "Car Ready for Pickup", completed: false },
  { id: "picked", label: "Car Picked Up", completed: false },
  { id: "returned", label: "Car Returned", completed: false },
];

const getInitialTime = () => {
  const now = new Date();
  const fourHoursFromNow = new Date(now.getTime() + 4 * 70 * 60 * 1000);
  const hours = fourHoursFromNow.getHours().toString().padStart(2, "0");
  const minutes = fourHoursFromNow.getMinutes().toString().padStart(2, "0");
  const timeString = `${hours}:${minutes}`;
  return timeString;
};

const RentCarForm = () => {
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();

  const [selectedEmirate, setSelectedEmirate] = useState<
    "dubai" | "otherEmirates"
  >("dubai");
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
  const [pickupTime, setPickupTime] = useState<string>(getInitialTime());
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedCarModel, setSelectedCarModel] = useState("");
  const [selectedHourlyTour, setSelectedHourlyTour] = useState("");
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    pickupLocation: "",
  });

  // Firebase data states - matching BookTaxiForm pattern
  const [transportTypes, setTransportTypes] = useState<Transport[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Available transport types that have vehicles
  const [availableTransportTypes, setAvailableTransportTypes] = useState<
    string[]
  >([]);

  // Location states for map integration
  const [selectedPickupLocation, setSelectedPickupLocation] =
    useState<Location>(undefined);
  const [selectedDropoffLocation, setSelectedDropoffLocation] =
    useState<Location>(undefined);

  // Payment integration states
  const [orderId, setOrderId] = useState<string>("");
  const [savingBooking, setSavingBooking] = useState(false);

  // Reset selected car model when category changes
  useEffect(() => {
    setSelectedCarModel("");
  }, [selectedCategory]);

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

  // Calculate total amount for rental
  const getVehicleHourPrice = (vehicle: Vehicle) => {
    if (!vehicle) return 0;

    // Get the selected tour duration
    const selectedTour = emiratesData[selectedEmirate].hourlyTours.find(
      (t) => t.id === selectedHourlyTour,
    );

    if (!selectedTour) return 0;

    // Parse duration to get hours (e.g., "5 hours" -> 5)
    const duration = selectedTour.duration;
    const hours = duration || 5; // Default to 5 hours

    // Calculate total: base price per hour × number of hours
    return vehicle.perMinPrice * hours;
  };

  useEffect(() => {
    if (step === 2) {
      fetchTransportTypes();
    }
  }, [step]);

  useEffect(() => {
    if (step === 3) {
      fetchVehicles(selectedCategory);
    }
  }, [step, selectedCategory]);

  const fetchTransportTypes = async () => {
    setLoading(true);
    try {
      const transportResponse = await transportService.getAllTransports();
      const transportTypesData = transportResponse.data;

      if (transportTypesData.length > 0 && !selectedCategory) {
        setSelectedCategory(transportTypesData[0].id);
      }
      setTransportTypes(transportTypesData);

      // Check which transport types have available vehicles
      await checkTransportTypeAvailability(transportTypesData);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch vehicles based on selected transport type
  const fetchVehicles = async (taxiTypeId: string) => {
    setLoading(true);
    try {
      const vehicleResponse =
        await vehicleService.getVehiclesByTransport(taxiTypeId);
      const vehiclesData = vehicleResponse.data.map((v) => ({
        ...v,
        basePrice: parseFloat(v.basePrice.toString()),
        perMinPrice: parseFloat(v.perMinPrice.toString()),
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
      setLoading(false);
    }
  };

  // Get filtered vehicle types for selected transport type
  const getFilteredVehicleTypes = () => {
    return vehicles.filter((v) => v.transportId === selectedCategory);
  };

  // Check which transport types have available vehicles
  const checkTransportTypeAvailability = async (types: Transport[]) => {
    try {
      const availableTypeIds: string[] = [];

      // Check each transport type for available vehicles
      for (const type of types) {
        const vehicles = await vehicleService.getVehiclesByTransport(type.id);
        if (vehicles.data.length > 0) {
          availableTypeIds.push(type.id);
        }
      }

      setAvailableTransportTypes(
        availableTypeIds.length > 0 ? availableTypeIds : ["economy"],
      );

      // If there are no available types, show a message
      if (availableTypeIds.length === 0) {
        toast.error("No vehicles available for any transport type");
      }

      // If selectedCategory is no longer available, reset it
      if (selectedCategory && !availableTypeIds.includes(selectedCategory)) {
        setSelectedCategory(availableTypeIds[0] || "");
      }

      return availableTypeIds;
    } catch (error) {
      console.error("Error checking transport type availability:", error);
      // Default to economy in case of error
      return ["economy"];
    }
  };

  // Handler for pickup location selection
  const handlePickupLocationSelect = (location: Location) => {
    setSelectedPickupLocation(location);
    setFormData((prev) => ({ ...prev, pickupLocation: location.name }));
  };

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
      if (!formData.pickupLocation) {
        toast.error("Please enter pickup location");
        return;
      }
      if (!selectedHourlyTour) {
        toast.error("Please select an hourly tour");
        return;
      }
      if (!pickupDate) {
        toast.error("Please select pickup date");
        return;
      }
      if (!pickupTime) {
        toast.error("Please select pickup time");
        return;
      }

      // Check if booking is at least 4 hours in advance
      const now = new Date();
      const selectedDateTime = new Date(pickupDate);
      const [hours, minutes] = pickupTime.split(":").map(Number);
      selectedDateTime.setHours(hours, minutes, 0, 0);

      const timeDifference = selectedDateTime.getTime() - now.getTime();
      const hoursDifference = timeDifference / (1000 * 60 * 60);
      console.log(hoursDifference);
      if (hoursDifference < 4) {
        toast.error("Bookings must be made at least 4 hours in advance");
        return;
      }

      setStep(2);
    } else if (step === 2) {
      if (!selectedCategory) {
        toast.error("Please select a car category");
        return;
      }

      await fetchVehicles(selectedCategory);
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

      // Calculate total amount
      const totalAmount = getVehicleHourPrice(selectedVehicle);

      const uniqueOrderId = generateOrderId();

      setOrderId(uniqueOrderId);

      const bookingData = {
        orderId: uniqueOrderId,
        bookingType: "rent" as const,
        userId: currentUser?.uid,
        vehicleId: selectedVehicle.id,
        status: "initiated" as const,
        pickupLocation: selectedPickupLocation,
        dropoffLocation: selectedDropoffLocation,
        amount: totalAmount,
      };

      try {
        setSavingBooking(true);
        const response = await bookingService.createBooking(bookingData);
        if (response.success) {
          setStep(4); // Move to payment step
        } else {
          toast.error("Failed to create booking. Please try again.");
        }
      } catch (error) {
        console.error("Failed to create booking", error);
        toast.error("Failed to save booking details");
      } finally {
        setSavingBooking(false);
      }
    }
  };

  // Function to handle receipt download
  const handleDownloadReceipt = () => {
    toast.success("Receipt downloaded successfully");
    // In a real app, this would generate and download a PDF receipt
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fleet-red mx-auto mb-4"></div>
          <p className="text-gray-600">Loading vehicle options...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">
          <p className="font-medium">Failed to load vehicle data</p>
          <p className="text-sm">{error}</p>
        </div>
        <Button
          onClick={() => window.location.reload()}
          className="bg-fleet-red hover:bg-fleet-red/90"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Login notice for unauthenticated users */}
        {!currentUser && step === 1 && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800">Login Required</p>
                <p className="text-amber-700 mt-1">
                  Please login to book a chauffeur. You'll be redirected to the
                  login page when you click "Find My Chauffeur".
                </p>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <>
            {/* Emirates Selection Tabs */}
            <div className="flex bg-gray-100 rounded-lg p-1 gap-x-2">
              <button
                type="button"
                onClick={() => setSelectedEmirate("dubai")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  selectedEmirate === "dubai"
                    ? "bg-gradient-to-r from-fleet-red to-fleet-accent text-white"
                    : "text-black hover:bg-gray-200"
                }`}
              >
                Dubai
              </button>
              <button
                type="button"
                onClick={() => setSelectedEmirate("otherEmirates")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  selectedEmirate === "otherEmirates"
                    ? "bg-gradient-to-r from-fleet-red to-fleet-accent text-white"
                    : "text-black hover:bg-gray-200"
                }`}
              >
                Other Emirates
              </button>
            </div>

            {/* Pickup Location with Map Integration */}
            <div className="space-y-3">
              <LocationSelector
                id="pickup"
                label="Pickup Location"
                value={formData.pickupLocation}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, pickupLocation: value }))
                }
                onLocationSelect={handlePickupLocationSelect}
                placeholder="Enter Location"
              />

              {/* Route Map */}
              <div className="mt-2">
                <RouteMap
                  pickupLocation={selectedPickupLocation}
                  dropoffLocation={selectedDropoffLocation}
                />
              </div>
            </div>

            {/* Hourly Tour Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Hourly</label>
              <Select
                value={selectedHourlyTour}
                onValueChange={setSelectedHourlyTour}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Hourly Tour" />
                </SelectTrigger>
                <SelectContent>
                  {emiratesData[selectedEmirate].hourlyTours.map((tour) => (
                    <SelectItem key={tour.id} value={tour.id}>
                      {tour.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DateTimePicker
              label="Pickup Date & Time"
              date={pickupDate}
              time={pickupTime}
              onDateChange={setPickupDate}
              onTimeChange={setPickupTime}
            />

            {/* Information Icon */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Info className="h-4 w-4" />
              <span>
                Please ensure all details are correct before proceeding
              </span>
            </div>

            {/* 4-hour advance booking notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-800">
                    Advance Booking Required
                  </p>
                  <p className="text-blue-700 mt-1">
                    Bookings must be made at least 4 hours in advance. This
                    ensures we can provide the best service for your tour.
                  </p>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-9 text-white text-sm font-medium bg-gradient-to-r from-fleet-red to-fleet-accent hover:opacity-90 hover:shadow-md transition-all rounded-md"
              disabled={loading || savingBooking}
            >
              {loading || savingBooking
                ? "Loading..."
                : !currentUser
                  ? "Login to Book Chauffeur"
                  : "Find My Chauffeur"}
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            <div className="mb-3">
              <h4 className="text-sm font-medium">Select Transport Type</h4>
              <p className="text-xs text-gray-500 mt-1">
                Only transport types with available vehicles are enabled for
                booking.
                {transportTypes.length === 0 &&
                  " No vehicles are currently available."}
              </p>
            </div>
            <TransportTypeSelector
              transportTypes={transportTypes}
              selectedTaxiType={selectedCategory}
              onSelect={(typeId: string) => {
                setSelectedCategory(typeId);
              }}
              loading={loading}
              availableTypes={availableTransportTypes}
            />
            <div className="flex justify-between mt-3">
              <Button
                type="button"
                variant="outline"
                className="h-8 text-xs border-gray-300 hover:bg-gray-50 transition-all"
                onClick={() => setStep(1)}
              >
                Back
              </Button>
              <Button
                type="button"
                className="h-8 text-xs text-white font-medium bg-gradient-to-r from-fleet-red to-fleet-accent hover:opacity-90 hover:shadow-md transition-all"
                disabled={
                  loading ||
                  !selectedCategory ||
                  !availableTransportTypes.includes(selectedCategory)
                }
                onClick={() => handleSubmit(new Event("submit") as any)}
              >
                Next
              </Button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold text-gray-900">
                  Select a vehicle class
                </h2>
                <p className="text-sm text-gray-600">
                  All prices include estimated VAT, fees, and tolls
                </p>
              </div>

              {getFilteredVehicleTypes().map((vehicle) => (
                <div
                  key={vehicle.id}
                  className={`border rounded-lg p-4 hover:border-fleet-red cursor-pointer transition-all ${
                    selectedCarModel === vehicle.id
                      ? "border-fleet-red bg-fleet-red/5 shadow-sm"
                      : "border-gray-200 bg-white hover:shadow-sm"
                  }`}
                  onClick={() => setSelectedCarModel(vehicle.id)}
                >
                  <div className="flex items-center gap-4">
                    {/* Vehicle Image */}
                    <div className="flex-shrink-0">
                      <div className="w-28 h-20 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                        {vehicle.imageUrl ? (
                          <img
                            src={vehicle.imageUrl}
                            alt={vehicle.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-4xl">🚗</span>
                        )}
                      </div>
                    </div>

                    {/* Vehicle Details */}
                    <div className="flex-1 space-y-2">
                      {/* Vehicle Class Name */}
                      <h3 className="text-lg font-semibold text-gray-900">
                        {vehicle.name}
                      </h3>

                      {/* Capacity Icons */}
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <span className="text-lg">👥</span>
                          <span>{vehicle.capacity}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-lg">💼</span>
                          <span>{Math.min(vehicle.capacity - 1, 5)}</span>
                        </div>
                      </div>

                      {/* Description/Model */}
                      <p className="text-sm text-gray-500">
                        {vehicle.description}
                      </p>
                    </div>

                    {/* Price and Action */}
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-xl font-bold text-gray-900">
                          {getVehicleHourPrice(vehicle)}
                        </p>
                        <p className="text-xs text-gray-500">per hour</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-8 text-xs border-gray-300 hover:bg-gray-50 transition-all"
                onClick={() => setStep(2)}
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={savingBooking}
                className="flex-1 h-8 text-xs text-white font-medium bg-gradient-to-r from-fleet-red to-fleet-accent hover:opacity-90 hover:shadow-md transition-all"
              >
                Next: Payment
              </Button>
            </div>
          </>
        )}
      </form>
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
              amount={getVehicleHourPrice(
                vehicles.find((vehicle) => vehicle.id === selectedCarModel),
              )}
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
    </>
  );
};

export default RentCarForm;
