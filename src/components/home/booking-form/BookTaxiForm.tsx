import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  FareRule,
  FareRuleWithRelations,
  Location,
  Transport,
  TransportWithVehicles,
  Vehicle,
} from "@/types";
import {
  transportService,
  vehicleService,
  bookingService,
  userService,
} from "@/services";
import { Clock, AlertTriangle } from "lucide-react";
import CCavenueCheckout from "@/components/checkout/CCavenueCheckout";
import LocationSelector from "./LocationSelector";
import RouteMap from "./RouteMap";
import DateTimePicker from "./DateTimePicker";
import TransportTypeSelector from "./TransportTypeSelector";
import VehicleSelector from "./VehicleSelector";
import { generateOrderId } from "@/lib/utils";
import { fareRulesService } from "@/services/fareRulesService";
import { isPointInPolygon } from "@/lib/mapUtils";
import { sendOTP, verifyOTP } from "@/lib/authUtils";
import { RecaptchaVerifier } from "firebase/auth";
import { auth } from "@/lib/firebase";
import CountryCodeSelect, { detectCountryCode } from "@/components/CountryCodeSelect";

const BookTaxiForm = () => {
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();

  // Form steps state
  const [step, setStep] = useState(1);

  // Authentication states
  const [authStep, setAuthStep] = useState<
    "phone" | "otp" | "register" | "complete"
  >("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+971");
  const [otp, setOtp] = useState("");
  const [userExists, setUserExists] = useState(false);
  const [registrationData, setRegistrationData] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });
  const [authLoading, setAuthLoading] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Form data states
  const [pickupDate, setPickupDate] = useState<Date | undefined>(() => {
    const now = new Date();
    const fourHoursFromNow = new Date(now.getTime() + 4 * 60 * 60 * 1000);
    // Use the date of 4 hours from now, not just today
    const initialDate = new Date(
      fourHoursFromNow.getFullYear(),
      fourHoursFromNow.getMonth(),
      fourHoursFromNow.getDate()
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
  const [fareRules, setFareRules] = useState<FareRuleWithRelations[]>([]);

  // Location data
  const [selectedPickupLocation, setSelectedPickupLocation] = useState<
    Location | undefined
  >(undefined);
  const [selectedDropoffLocation, setSelectedDropoffLocation] = useState<
    Location | undefined
  >(undefined);

  // Lists for selection components
  const [transportTypes, setTransportTypes] = useState<TransportWithVehicles[]>(
    []
  );
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
    fetchTransportTypes();
    fetchFareRules();
  }, []);

  useEffect(() => {
    window.recaptchaVerifier = null;
  }, []);

  // Format phone number for display and validation
  const formatPhoneNumber = (
    phoneNumber: string,
    countryCode: string,
  ): string => {
    // Remove any non-digit characters
    const cleanNumber = phoneNumber.replace(/\D/g, "");

    // Remove leading zeros
    const numberWithoutLeadingZeros = cleanNumber.replace(/^0+/, "");

    // Combine with country code
    return `${countryCode}${numberWithoutLeadingZeros}`;
  };

  // Handle phone number change - clean the input
  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    // Remove all non-digit characters except for the first character
    value = value.replace(/[^\d]/g, "");

    setPhoneNumber(value);
    setAuthError(null);
  };

  // Authentication handlers
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim() || phoneNumber.length < 7) {
      setAuthError("Please enter a valid phone number");
      return;
    }

    // Format full phone number with country code
    const fullPhoneNumber = formatPhoneNumber(phoneNumber, countryCode);

    setAuthLoading(true);
    setAuthError(null);

    try {
      // Check if user exists using userService
      await userService.checkUserExists(fullPhoneNumber);
      setUserExists(true);

      // Initialize reCAPTCHA only when needed
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(
          auth,
          "recaptcha-container-auth",
          {
            size: "invisible",
          },
        );
      }

      // Send OTP
      await sendOTP(fullPhoneNumber);
      setAuthStep("otp");
      toast.success("OTP sent to your phone number");
    } catch (error: any) {
      console.error("Error sending verification code:", error);

      // Provide more specific error messages
      let errorMessage = "Error sending verification code. Please try again.";

      if (error.code === "auth/invalid-phone-number") {
        errorMessage =
          "Invalid phone number format. Please check your phone number.";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many attempts. Please try again later.";
      } else if (error.code === "auth/quota-exceeded") {
        errorMessage = "SMS quota exceeded. Please try again later.";
      } else if (error.code === "auth/invalid-app-credential") {
        errorMessage =
          "reCAPTCHA configuration error. Please refresh the page and try again.";
      } else if (error.code === "auth/captcha-check-failed") {
        errorMessage =
          "reCAPTCHA verification failed. Please refresh the page and try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      setAuthError(errorMessage);
      
      // If user doesn't exist, go to registration
      if (!userExists) {
        setAuthStep("register");
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || otp.length < 6) {
      setAuthError("Please enter a valid 6-digit verification code");
      return;
    }

    setAuthLoading(true);
    setAuthError(null);

    try {
      // Verify OTP
      const userCredential = await verifyOTP(otp);

      // Get Firebase ID token for API authentication
      const idToken = await userCredential.getIdToken();

      // Store token in localStorage for API calls
      localStorage.setItem("firebaseToken", idToken);
      localStorage.setItem("authToken", idToken);

      if (userExists) {
        // Login existing user
        toast.success("Login successful!");
      } else {
        // Register new user
        const fullPhoneNumber = formatPhoneNumber(phoneNumber, countryCode);
        
        try {
          const response = await userService.createUser({
            firstName: registrationData.firstName,
            lastName: registrationData.lastName,
            email: registrationData.email,
            phone: fullPhoneNumber,
          });

          if (!response.success) {
            throw new Error(response.error || "Failed to create user account");
          }

          toast.success("Registration successful!");
        } catch (apiError: any) {
          console.error("Error creating user in backend:", apiError);
          toast.success("Registration successful!");
        }
      }

      setAuthStep("complete");
      setShowAuthDialog(false);
      // Refresh auth context
      // window.location.reload();
    } catch (error: any) {
      console.error("Error verifying OTP:", error);

      // Provide more specific error messages
      let errorMessage = "Error verifying code. Please try again.";

      if (error.code === "auth/invalid-verification-code") {
        errorMessage = "Invalid verification code. Please check and try again.";
      } else if (error.code === "auth/code-expired") {
        errorMessage =
          "Verification code has expired. Please request a new one.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      setAuthError(errorMessage);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !registrationData.firstName.trim() ||
      !registrationData.lastName.trim() ||
      !registrationData.email.trim()
    ) {
      setAuthError("All fields are required");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registrationData.email)) {
      setAuthError("Please enter a valid email address");
      return;
    }

    // Format full phone number with country code
    const fullPhoneNumber = formatPhoneNumber(phoneNumber, countryCode);

    setAuthLoading(true);
    setAuthError(null);

    try {
      // Initialize reCAPTCHA only when needed
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(
          auth,
          "recaptcha-container-auth",
          {
            size: "invisible",
          },
        );
      }

      // Send OTP for new user registration
      await sendOTP(fullPhoneNumber);
      setAuthStep("otp");
      toast.success("OTP sent to your phone number");
    } catch (error: any) {
      console.error("Error sending verification code:", error);

      // Provide more specific error messages
      let errorMessage = "Error sending verification code. Please try again.";

      if (error.code === "auth/invalid-phone-number") {
        errorMessage =
          "Invalid phone number format. Please check your phone number.";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many attempts. Please try again later.";
      } else if (error.code === "auth/quota-exceeded") {
        errorMessage = "SMS quota exceeded. Please try again later.";
      } else if (error.code === "auth/invalid-app-credential") {
        errorMessage =
          "reCAPTCHA configuration error. Please refresh the page and try again.";
      } else if (error.code === "auth/captcha-check-failed") {
        errorMessage =
          "reCAPTCHA verification failed. Please refresh the page and try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      setAuthError(errorMessage);
    } finally {
      setAuthLoading(false);
    }
  };

  const fetchFareRules = async () => {
    try {
      const fareRulesResponse = await fareRulesService.list();
      const fareRulesData = fareRulesResponse.data;
      setFareRules(fareRulesData);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  const fetchTransportTypes = async () => {
    setLoading((prev) => ({ ...prev, transportTypes: true }));

    try {
      const transportResponse = await transportService.getAllTransports();
      const transportTypesData = transportResponse.data;

      if (transportTypesData.length > 0 && !selectedTaxiType) {
        setSelectedTaxiType(transportTypesData[0].id);
        setVehicles(transportTypesData[0].vehicles);
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

      let extraFare: FareRule | undefined;

      for (const rule of fareRules) {
        const applicableZones = rule.zones;
        for (const zone of applicableZones) {
          const isInside = isPointInPolygon(zone.coordinates, {
            lat: selectedPickupLocation.coordinates.latitude,
            lng: selectedPickupLocation.coordinates.longitude,
          });

          if (
            isInside &&
            rule.taxiTypes.some((type) => type.id === selectedTaxiType)
          ) {
            extraFare = rule;
            break;
          }
        }
      }

      setVehicles(
        transportTypes
          .find((t) => t.id === typeId)
          .vehicles.map((v) => ({
            ...v,
            basePrice: extraFare
              ? parseFloat(v.basePrice.toString()) + extraFare.basePrice
              : parseFloat(v.basePrice.toString()),
            perKmPrice: extraFare
              ? parseFloat(v.perKmPrice.toString()) + extraFare.perKmPrice
              : parseFloat(v.perKmPrice.toString()),
          })) || []
      );
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
      dropoffCoords.longitude
    );

    // Calculate total fare
    let totalFare =
      selectedVehicle.basePrice + distanceKm * selectedVehicle.perKmPrice;

    // Ensure minimum fare
    const minFare = 5; // Minimum fare
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
          2
        )} hours`
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
      setShowAuthDialog(true);
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

      const uniqueOrderId = generateOrderId();

      setOrderId(uniqueOrderId);

      const bookingData = {
        orderId: uniqueOrderId,
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
            className="w-full h-9 text-white text-sm font-medium bg-gradient-to-r from-primary to-fleet-accent hover:opacity-90 hover:shadow-md transition-all rounded-md mt-2"
          >
            {loading.transportTypes || loading.checkingAvailability
              ? "Loading..."
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
              className="h-8 text-xs text-white font-medium bg-gradient-to-r from-primary to-fleet-accent hover:opacity-90 hover:shadow-md transition-all"
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
              className="h-8 text-xs text-white font-medium bg-gradient-to-r from-primary to-fleet-accent hover:opacity-90 hover:shadow-md transition-all"
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

      {/* Authentication Dialog */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Quick Authentication</DialogTitle>
          </DialogHeader>

          {authError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              <p className="text-sm text-red-700">{authError}</p>
            </div>
          )}

          {authStep === "phone" && (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <div className="flex space-x-2">
                  <CountryCodeSelect
                    value={countryCode}
                    onChange={setCountryCode}
                  />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="50 123 4567"
                    value={phoneNumber}
                    onChange={handlePhoneNumberChange}
                    disabled={authLoading}
                    className="flex-1"
                    maxLength={10}
                    required
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  We'll send a verification code to this number
                </p>
                {phoneNumber && (
                  <p className="text-xs text-gray-400">
                    Full number: {formatPhoneNumber(phoneNumber, countryCode)}
                  </p>
                )}
              </div>
              
              <div id="recaptcha-container-auth"></div>
              
              <Button type="submit" className="w-full" disabled={authLoading}>
                {authLoading ? "Sending..." : "Send verification code"}
              </Button>
            </form>
          )}

          {authStep === "register" && (
            <form onSubmit={handleRegistrationSubmit} className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-sm text-gray-600">
                  We need a few details to create your account
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="First name"
                    value={registrationData.firstName}
                    onChange={(e) =>
                      setRegistrationData((prev) => ({
                        ...prev,
                        firstName: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Last name"
                    value={registrationData.lastName}
                    onChange={(e) =>
                      setRegistrationData((prev) => ({
                        ...prev,
                        lastName: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={registrationData.email}
                  onChange={(e) =>
                    setRegistrationData((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setAuthStep("phone")}
                >
                  Back
                </Button>
                <Button type="submit" className="flex-1" disabled={authLoading}>
                  {authLoading ? "Sending OTP..." : "Send OTP"}
                </Button>
              </div>
            </form>
          )}

          {authStep === "otp" && (
            <form onSubmit={handleOTPSubmit} className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-sm text-gray-600">
                  Enter the verification code sent to{" "}
                  {formatPhoneNumber(phoneNumber, countryCode)}
                </p>
              </div>
              <div>
                <Label htmlFor="otp">Verification Code</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  disabled={authLoading}
                  className="text-center text-lg tracking-widest"
                  maxLength={6}
                  inputMode="numeric"
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setAuthStep(userExists ? "phone" : "register")}
                  disabled={authLoading}
                >
                  Back
                </Button>
                <Button type="submit" className="flex-1" disabled={authLoading}>
                  {authLoading ? "Verifying..." : "Verify Code"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookTaxiForm;
