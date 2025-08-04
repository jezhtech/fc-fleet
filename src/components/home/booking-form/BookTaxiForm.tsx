import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LocationSelector,
  RouteMap,
  DateTimePicker,
  TransportTypeSelector,
  VehicleSelector,
  BookingSummary,
  BookingDetails,
  Location,
  Vehicle,
  TransportType,
} from ".";
import { generateBookingId, getNextBookingCount } from "@/utils/booking";
import { Clock, AlertTriangle } from "lucide-react";
import CCavenueCheckout from "@/components/checkout/CCavenueCheckout";

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
      fourHoursFromNow.getDate()
    );
    console.log("Initial pickup date:", initialDate.toISOString());
    return initialDate;
  });

  // Calculate initial time (4 hours from now)
  const getInitialTime = () => {
    const now = new Date();
    const fourHoursFromNow = new Date(now.getTime() + 4 * 70 * 60 * 1000);
    const hours = fourHoursFromNow.getHours().toString().padStart(2, "0");
    const minutes = fourHoursFromNow.getMinutes().toString().padStart(2, "0");
    const timeString = `${hours}:${minutes}`;
    console.log("Initial time calculation:", {
      now: now.toISOString(),
      fourHoursFromNow: fourHoursFromNow.toISOString(),
      timeString,
    });
    return timeString;
  };

  const [bookingDetails, setBookingDetails] = useState<BookingDetails>({
    pickup: "",
    dropoff: "",
    time: getInitialTime(),
    cardNumber: "",
    cardName: "",
    cardExpiry: "",
    cardCVC: "",
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
  const [transportTypes, setTransportTypes] = useState<TransportType[]>([]);
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

  // Booking status states
  const [bookingId, setBookingId] = useState<string>("");
  const [formattedBookingId, setFormattedBookingId] = useState<string>("");
  const [orderId, setOrderId] = useState<string>("");

  // Payment states
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Debug logging for date and time changes
  useEffect(() => {
    console.log("Date/Time changed:", {
      pickupDate: pickupDate?.toISOString(),
      time: bookingDetails.time,
    });
  }, [pickupDate, bookingDetails.time]);

  // Debug function - can be called from console
  const debugValidation = () => {
    console.log("=== DEBUG VALIDATION ===");
    console.log("pickupDate:", pickupDate);
    console.log("bookingDetails.time:", bookingDetails.time);
    console.log("Validation result:", validateBookingTime());
  };

  // Expose debug function to window for console access
  useEffect(() => {
    (window as any).debugBookingValidation = debugValidation;
  }, [pickupDate, bookingDetails.time]);



  // Fetch transport types when component mounts
  useEffect(() => {
    fetchTransportTypes();
  }, []);

  // Handler for input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBookingDetails((prev) => ({ ...prev, [name]: value }));
  };

  // Handler for pickup location selection
  const handlePickupLocationSelect = (location: Location) => {
    console.log("Selected pickup location:", location);
    setSelectedPickupLocation(location);
    setBookingDetails((prev) => ({ ...prev, pickup: location.name }));
  };

  // Handler for dropoff location selection
  const handleDropoffLocationSelect = (location: Location) => {
    console.log("Selected dropoff location:", location);
    setSelectedDropoffLocation(location);
    setBookingDetails((prev) => ({ ...prev, dropoff: location.name }));
  };

  // Check which transport types have available vehicles
  const checkTransportTypeAvailability = async (types: TransportType[]) => {
    try {
      setLoading((prev) => ({ ...prev, checkingAvailability: true }));
      const vehiclesRef = collection(firestore, "vehicleTypes");
      const availableTypeIds: string[] = [];

      // Check each transport type for available vehicles
      for (const type of types) {
        const q = query(vehiclesRef, where("taxiTypeId", "==", type.id));
        const snapshot = await getDocs(q);

        if (snapshot.docs.length > 0) {
          availableTypeIds.push(type.id);
        }
      }

      setAvailableTransportTypes(
        availableTypeIds.length > 0 ? availableTypeIds : ["economy"]
      );

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
      // Default to economy in case of error
      return ["economy"];
    } finally {
      setLoading((prev) => ({ ...prev, checkingAvailability: false }));
    }
  };

  // Fetch transport types from Firestore
  const fetchTransportTypes = async () => {
    try {
      setLoading((prev) => ({ ...prev, transportTypes: true }));
      const transportTypesRef = collection(firestore, "taxiTypes");
      const snapshot = await getDocs(transportTypesRef);

      const types = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as TransportType[];

      const fetchedTypes =
        types.length > 0
          ? types
          : [
              {
                id: "economy",
                name: "Economy",
                description: "Affordable rides for everyday use",
                emoji: "🚗",
              },
              {
                id: "comfort",
                name: "Comfort",
                description: "More space and comfort",
                emoji: "🚕",
              },
              {
                id: "suv",
                name: "SUV",
                description: "Spacious vehicles for groups",
                emoji: "🚙",
              },
              {
                id: "premium",
                name: "Premium",
                description: "Luxury vehicles for special occasions",
                emoji: "🏎️",
              },
            ];

      setTransportTypes(fetchedTypes);

      // Check which transport types have available vehicles
      await checkTransportTypeAvailability(fetchedTypes);
    } catch (error) {
      console.error("Error fetching transport types:", error);
      toast.error("Failed to load transport types");
      // Use fallback data
      const fallbackTypes = [
        {
          id: "economy",
          name: "Economy",
          description: "Affordable rides for everyday use",
          emoji: "🚗",
        },
        {
          id: "comfort",
          name: "Comfort",
          description: "More space and comfort",
          emoji: "🚕",
        },
        {
          id: "suv",
          name: "SUV",
          description: "Spacious vehicles for groups",
          emoji: "🚙",
        },
        {
          id: "premium",
          name: "Premium",
          description: "Luxury vehicles for special occasions",
          emoji: "🏎️",
        },
      ];
      setTransportTypes(fallbackTypes);
      // Set economy as default available type for fallback
      setAvailableTransportTypes(["economy"]);
    } finally {
      setLoading((prev) => ({ ...prev, transportTypes: false }));
    }
  };

  // Handler for transport type selection
  const handleTransportTypeSelect = (typeId: string) => {
    // Only allow selection if the type is available
    if (availableTransportTypes.includes(typeId)) {
      setSelectedTaxiType(typeId);
    }
  };

  // Fetch vehicles based on selected transport type
  const fetchVehicles = async (taxiTypeId: string) => {
    try {
      setLoading((prev) => ({ ...prev, vehicles: true }));
      const vehiclesRef = collection(firestore, "vehicleTypes");
      const q = query(vehiclesRef, where("taxiTypeId", "==", taxiTypeId));
      const snapshot = await getDocs(q);

      const fetchedVehicles = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Vehicle[];

      if (fetchedVehicles.length > 0) {
        setVehicles(fetchedVehicles);
      } else {
        // Use fallback data if no vehicles found
        setVehicles([
          {
            id: `${taxiTypeId}-1`,
            taxiTypeId,
            name: `${
              taxiTypeId === "economy"
                ? "Toyota Corolla"
                : taxiTypeId === "comfort"
                ? "Toyota Camry"
                : taxiTypeId === "suv"
                ? "Toyota RAV4"
                : "Mercedes E-Class"
            }`,
            description: "Comfortable vehicle with AC",
            basePrice:
              taxiTypeId === "economy"
                ? 100
                : taxiTypeId === "comfort"
                ? 150
                : taxiTypeId === "suv"
                ? 200
                : 300,
            perKmPrice:
              taxiTypeId === "economy"
                ? 10
                : taxiTypeId === "comfort"
                ? 15
                : taxiTypeId === "suv"
                ? 20
                : 30,
            perMinutePrice:
              taxiTypeId === "economy"
                ? 1
                : taxiTypeId === "comfort"
                ? 1.5
                : taxiTypeId === "suv"
                ? 2
                : 3,
            capacity:
              taxiTypeId === "economy"
                ? 4
                : taxiTypeId === "comfort"
                ? 4
                : taxiTypeId === "suv"
                ? 6
                : 4,
            images: [
              taxiTypeId === "economy"
                ? "https://images.unsplash.com/photo-1590362891991-f776e747a588?q=80&w=800&auto=format&fit=crop"
                : taxiTypeId === "comfort"
                ? "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?q=80&w=800&auto=format&fit=crop"
                : taxiTypeId === "suv"
                ? "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=800&auto=format&fit=crop"
                : "https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?q=80&w=800&auto=format&fit=crop",

              taxiTypeId === "economy"
                ? "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=800&auto=format&fit=crop"
                : taxiTypeId === "comfort"
                ? "https://images.unsplash.com/photo-1580273916550-e323be2ae537?q=80&w=800&auto=format&fit=crop"
                : taxiTypeId === "suv"
                ? "https://images.unsplash.com/photo-1646955673748-c835b0d9e9c5?q=80&w=800&auto=format&fit=crop"
                : "https://images.unsplash.com/photo-1563720223177-599763ad1734?q=80&w=800&auto=format&fit=crop",
            ],
          },
          {
            id: `${taxiTypeId}-2`,
            taxiTypeId,
            name: `${
              taxiTypeId === "economy"
                ? "Honda Civic"
                : taxiTypeId === "comfort"
                ? "Honda Accord"
                : taxiTypeId === "suv"
                ? "Ford Explorer"
                : "BMW 5 Series"
            }`,
            description: "Spacious with premium features",
            basePrice:
              taxiTypeId === "economy"
                ? 120
                : taxiTypeId === "comfort"
                ? 170
                : taxiTypeId === "suv"
                ? 220
                : 350,
            perKmPrice:
              taxiTypeId === "economy"
                ? 12
                : taxiTypeId === "comfort"
                ? 17
                : taxiTypeId === "suv"
                ? 22
                : 35,
            perMinutePrice:
              taxiTypeId === "economy"
                ? 1.2
                : taxiTypeId === "comfort"
                ? 1.7
                : taxiTypeId === "suv"
                ? 2.2
                : 3.5,
            capacity:
              taxiTypeId === "economy"
                ? 4
                : taxiTypeId === "comfort"
                ? 5
                : taxiTypeId === "suv"
                ? 7
                : 4,
            images: [
              taxiTypeId === "economy"
                ? "https://images.unsplash.com/photo-1502877338535-766e1452684a?q=80&w=800&auto=format&fit=crop"
                : taxiTypeId === "comfort"
                ? "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=800&auto=format&fit=crop"
                : taxiTypeId === "suv"
                ? "https://images.unsplash.com/photo-1593055357429-1bff44adba32?q=80&w=800&auto=format&fit=crop"
                : "https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?q=80&w=800&auto=format&fit=crop",

              taxiTypeId === "economy"
                ? "https://images.unsplash.com/photo-1583121274602-3e2820c69888?q=80&w=800&auto=format&fit=crop"
                : taxiTypeId === "comfort"
                ? "https://images.unsplash.com/photo-1606152421802-db97b9c7a11b?q=80&w=800&auto=format&fit=crop"
                : taxiTypeId === "suv"
                ? "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=800&auto=format&fit=crop"
                : "https://images.unsplash.com/photo-1549275301-41e9d0fd49b3?q=80&w=800&auto=format&fit=crop",
            ],
          },
        ]);
      }
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      toast.error("Failed to load vehicles");
      // Use fallback data
    } finally {
      setLoading((prev) => ({ ...prev, vehicles: false }));
    }
  };

  // Payment handlers
  const handlePaymentSuccess = (transactionId: string, orderId?: string) => {
    console.log("Payment successful:", { transactionId, orderId });
    setPaymentSuccess(true);
    setPaymentError(null);
    
    // Redirect to booking confirmation page
    if (orderId) {
      const bookingParams = new URLSearchParams({
        orderId: orderId,
        paymentStatus: 'success'
      });
      navigate(`/user/book-chauffeur?${bookingParams.toString()}`);
    }
  };

  const handlePaymentFailure = (errorMessage: string, orderId?: string) => {
    console.error("Payment failed:", { errorMessage, orderId });
    setPaymentError(errorMessage);
    setPaymentSuccess(false);
    
    // Redirect to booking confirmation page with error
    if (orderId) {
      const bookingParams = new URLSearchParams({
        orderId: orderId,
        paymentStatus: 'failed'
      });
      navigate(`/user/book-chauffeur?${bookingParams.toString()}`);
    }
  };

  // Reset form to initial state
  const resetForm = () => {
    setStep(1);

    // Calculate the correct initial date and time
    const now = new Date();
    const fourHoursFromNow = new Date(now.getTime() + 4 * 60 * 60 * 1000);
    const initialDate = new Date(
      fourHoursFromNow.getFullYear(),
      fourHoursFromNow.getMonth(),
      fourHoursFromNow.getDate()
    );
    const initialTime = getInitialTime();

    setPickupDate(initialDate);
    setBookingDetails({
      pickup: "",
      dropoff: "",
      time: initialTime,
      cardNumber: "",
      cardName: "",
      cardExpiry: "",
      cardCVC: "",
    });
    setSelectedTaxiType("");
    setSelectedCarModel("");
    setSelectedPickupLocation(undefined);
    setSelectedDropoffLocation(undefined);
    setBookingId("");
    setFormattedBookingId("");
    setOrderId("");
    setPaymentSuccess(false);
    setPaymentError(null);
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
      pickupCoords.lat,
      pickupCoords.lng,
      dropoffCoords.lat,
      dropoffCoords.lng
    );

    // Estimate travel time based on distance (assuming average speed of 30 km/h in city traffic)
    const averageSpeedKmh = 30;
    const estimatedTravelTimeHours = distanceKm / averageSpeedKmh;
    const timeMins = Math.ceil(estimatedTravelTimeHours * 60);

    // Apply pricing
    const basePrice = selectedVehicle.basePrice || 0;
    const perKmPrice = selectedVehicle.perKmPrice || 0;
    const perMinutePrice = selectedVehicle.perMinutePrice || 0;

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
      basePrice + distanceKm * perKmPrice + timeMins * perMinutePrice;

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
      userData?.phoneNumber || currentUser?.phoneNumber || "123456789";

    return { customerName, customerEmail, customerPhone };
  };

  // Save booking to Firestore
  const saveBookingToDatabase = async (
    bookingData: any,
    paymentInfo: any,
    status: "initiated" | "awaiting" | "failed",
    paymentStatus: "PENDING" | "SUCCESS" | "FAILED" = "PENDING"
  ) => {
    try {
      setLoading((prev) => ({ ...prev, savingBooking: true }));

      // Get the current date for the booking
      const bookingDate = new Date();

      // Get the next booking count for this month
      const bookingCount = await getNextBookingCount(bookingDate);

      // Generate a formatted booking ID
      const formattedId = generateBookingId(bookingDate, bookingCount);

      // Parse the selected pickup date and time to create a proper Date object
      let pickupDateTime = new Date();
      try {
        // If we have date and time from the form
        if (bookingData.date && bookingData.time) {
          // Parse the time string (expected format: "HH:MM")
          const [hours, minutes] = bookingData.time.split(":").map(Number);

          // If date is already a Date object, use it, otherwise parse it
          const pickupDate =
            bookingData.date instanceof Date
              ? bookingData.date
              : new Date(bookingData.date);

          // Create a new date object with the combined date and time
          pickupDateTime = new Date(pickupDate);
          pickupDateTime.setHours(hours, minutes, 0, 0);
        }
      } catch (error) {
        console.error("Error parsing pickup date/time:", error);
        // Fall back to current date/time if parsing fails
        pickupDateTime = new Date();
      }

      // Create booking document
      const bookingRef = collection(firestore, "bookings");
      const newBooking = {
        ...bookingData,
        paymentInfo,
        status,
        paymentStatus, // Add payment status
        formattedId, // Store the formatted ID
        createdAt: serverTimestamp(), // When the booking was created
        pickupDateTime: pickupDateTime, // When the service is scheduled
        date: pickupDateTime, // Keep the original date field for backward compatibility
        updatedAt: serverTimestamp(),
      };

      // Add document to Firestore
      const docRef = await addDoc(bookingRef, newBooking);
      console.log("Booking saved with ID:", docRef.id);
      console.log("Formatted booking ID:", formattedId);

      return { id: docRef.id, formattedId };
    } catch (error) {
      console.error("Error saving booking:", error);
      toast.error("Failed to save booking details");
      return null;
    } finally {
      setLoading((prev) => ({ ...prev, savingBooking: false }));
    }
  };



  // Validate booking time is at least 4 hours in advance
  const validateBookingTime = () => {
    if (!pickupDate) {
      console.log("No pickup date selected");
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

    console.log("Validation debug:", {
      now: now.toISOString(),
      pickupDate: pickupDate.toISOString(),
      selectedDateTime: selectedDateTime.toISOString(),
      time: bookingDetails.time,
      hours,
      minutes,
      timeDifference,
      hoursDifference,
    });

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
      toast.error("Please login to book a chauffeur");
      navigate("/login", { 
        state: { 
          from: { 
            pathname: window.location.pathname,
            search: window.location.search 
          } 
        } 
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

      // Only fetch transport types if we don't already have them
      if (transportTypes.length === 0) {
        await fetchTransportTypes();
      } else {
        // Refresh availability check
        await checkTransportTypeAvailability(transportTypes);
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

      await fetchVehicles(selectedTaxiType);
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

      // Get customer information from auth context
      const { customerName, customerEmail, customerPhone } = getCustomerInfo();

      // Generate an order ID using timestamp and random string
      const newOrderId = `ORD-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 8)}`;

      const bookingData = {
        orderId: newOrderId,
        vehicle: selectedVehicle,
        pickupLocation: selectedPickupLocation,
        dropoffLocation: selectedDropoffLocation,
        date: pickupDate,
        time: bookingDetails.time,
        amount: estimatedFare,
        customerInfo: {
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
        },
        userId: currentUser?.uid,
        type: "Chauffeur",
        status: "pending_confirmation",
        paymentStatus: "PENDING",
      };

      // Save booking to database
      const result = await saveBookingToDatabase(
        bookingData,
        {
          paymentMethod: "CCAvenue",
          amount: estimatedFare,
          timestamp: new Date().toISOString(),
          status: "pending",
        },
        "initiated",
        "PENDING"
      );

      if (result) {
        setBookingId(result.id);
        setFormattedBookingId(result.formattedId);
        setOrderId(newOrderId);
        setStep(4); // Move to payment step
      } else {
        toast.error("Failed to create booking. Please try again.");
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
              <p className="font-medium text-amber-800">
                Login Required
              </p>
              <p className="text-amber-700 mt-1">
                Please login to book a chauffeur. You'll be redirected to the login page when you click "Book Chauffeur".
              </p>
            </div>
          </div>
        </div>
      )}

      {step === 1 && (
        <>
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
            date={pickupDate}
            time={bookingDetails.time}
            onDateChange={setPickupDate}
            onTimeChange={(time) =>
              setBookingDetails((prev) => ({ ...prev, time }))
            }
          />

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
                  ensures we can provide the best service for your journey.
                </p>
              </div>
            </div>
          </div>

          <Button
            type="button"
            className="w-full h-9 text-white text-sm font-medium bg-gradient-to-r from-fleet-red to-fleet-accent hover:opacity-90 hover:shadow-md transition-all rounded-md mt-2"
            onClick={() => handleSubmit(new Event("submit") as any)}
          >
            {loading.transportTypes || loading.checkingAvailability
              ? "Loading..."
              : !currentUser 
                ? "Login to Book Chauffeur"
                : "Book Chauffeur"}
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
                loading.transportTypes ||
                loading.checkingAvailability ||
                !selectedTaxiType ||
                !availableTransportTypes.includes(selectedTaxiType)
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
              type="button"
              className="h-8 text-xs text-white font-medium bg-gradient-to-r from-fleet-red to-fleet-accent hover:opacity-90 hover:shadow-md transition-all"
              disabled={!selectedCarModel}
              onClick={() => handleSubmit(new Event("submit") as any)}
            >
              Proceed to Payment
            </Button>
          </div>
        </>
      )}

      {step === 4 && (
        <>
          <div className="mb-3">
            <h4 className="text-sm font-medium">Complete Payment</h4>
            <p className="text-xs text-gray-500 mt-1">
              Secure payment via CCAvenue. Your booking will be confirmed after successful payment.
            </p>
          </div>
          
          {orderId && (
            <CCavenueCheckout
              orderId={orderId}
              amount={calculateEstimatedFare()}
              customerName={getCustomerInfo().customerName}
              customerEmail={getCustomerInfo().customerEmail}
              customerPhone={getCustomerInfo().customerPhone}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentFailure={handlePaymentFailure}
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
