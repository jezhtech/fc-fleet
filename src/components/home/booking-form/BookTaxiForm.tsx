import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { useNavigate } from "react-router-dom";
import CCavenueCheckout from "@/components/checkout/CCavenueCheckout";
import PaymentTestControls from "@/components/checkout/PaymentTestControls";
import { useAuth } from "@/contexts/AuthContext";
import { paymentService } from "@/services/paymentService";
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

const BookTaxiForm = () => {
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();

  // Form steps state
  const [step, setStep] = useState(1);

  // Form data states
  const [pickupDate, setPickupDate] = useState<Date | undefined>(new Date());
  const [bookingDetails, setBookingDetails] = useState<BookingDetails>({
    pickup: "",
    dropoff: "",
    time: "12:00",
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

  // Payment related states
  const [isTestMode, setIsTestMode] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [orderId, setOrderId] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<'PENDING' | 'SUCCESS' | 'FAILED'>('PENDING');

  // Booking status states
  const [bookingId, setBookingId] = useState<string>("");
  const [bookingStatus, setBookingStatus] = useState<
    "initiated" | "awaiting" | "assigned" | "pickup" | "dropped" | "failed"
  >("initiated");
  const [paymentSuccess, setPaymentSuccess] = useState<boolean | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [completedPaymentDetails, setCompletedPaymentDetails] =
    useState<any>(null);
  const [formattedBookingId, setFormattedBookingId] = useState<string>("");

  // Check if we're in development/test environment
  useEffect(() => {
    const inDevMode =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname.includes("192.168.") ||
      process.env.NODE_ENV === "development";
    setIsTestMode(inDevMode);
  }, []);

  // Handle payment response from CCAvenue (URL parameters)
  useEffect(() => {
    const handlePaymentResponse = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const encResp = urlParams.get("encResp");
      const orderId = urlParams.get("orderId");
      const paymentStatus = urlParams.get("paymentStatus");
      
      // Check if we're on the booking form page and have payment response parameters
      const isOnBookingForm = window.location.pathname.includes("/book-chauffeur");
      const hasPaymentResponse = orderId && paymentStatus;

      if (isOnBookingForm && hasPaymentResponse) {
        try {
          // If we have encResp, process it through the backend
          if (encResp) {
            const response = await paymentService.processCCAvenueResponse(
              encResp,
              orderId,
              paymentStatus === "success"
            );

            if (response.success && response.data?.isSuccessful) {
              // Payment was successful
              const transactionId =
                response.data.trackingId || `TXN_${Date.now()}`;
              await handlePaymentSuccess(transactionId, orderId);
            } else {
              // Payment failed or was cancelled
              const errorMessage =
                response.data?.statusMessage || "Payment was not successful";
              await handlePaymentFailure(errorMessage, orderId);
            }
          } else {
            // No encResp (might be a direct redirect), handle based on paymentStatus
            if (paymentStatus === "success") {
              const transactionId = `TXN_${Date.now()}`;
              await handlePaymentSuccess(transactionId, orderId);
            } else if (paymentStatus === "cancel") {
              await handlePaymentFailure("Payment was cancelled by user", orderId);
            }
          }
          
          // Clear URL parameters after processing
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        } catch (error) {
          console.error("Error processing payment response:", error);
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Error processing payment response";
          await handlePaymentFailure(errorMessage, orderId);
        }
      }
    };

    handlePaymentResponse();
  }, []);

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

  // Reset form to initial state
  const resetForm = () => {
    setStep(1);
    setBookingDetails({
      pickup: "",
      dropoff: "",
      time: "12:00",
      cardNumber: "",
      cardName: "",
      cardExpiry: "",
      cardCVC: "",
    });
    setSelectedTaxiType("");
    setSelectedCarModel("");
    setSelectedPickupLocation(undefined);
    setSelectedDropoffLocation(undefined);
    setPaymentDetails(null);
    setBookingId("");
    setBookingStatus("initiated");
    setPaymentSuccess(null);
    setPaymentError(null);
    setCompletedPaymentDetails(null);
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

  // Update booking payment status in Firestore
  const updateBookingPaymentStatus = async (
    orderId: string,
    paymentStatus: "PENDING" | "SUCCESS" | "FAILED",
    paymentInfo: any
  ) => {
    try {
      // Find the booking by orderId
      const bookingsRef = collection(firestore, "bookings");
      const q = query(bookingsRef, where("orderId", "==", orderId));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        console.error("No booking found with orderId:", orderId);
        return false;
      }

      // Update the first matching booking
      const bookingDoc = snapshot.docs[0];
      const bookingRef = doc(firestore, "bookings", bookingDoc.id);

      await updateDoc(bookingRef, {
        paymentStatus,
        paymentInfo,
        updatedAt: serverTimestamp(),
      });

      console.log("Booking payment status updated:", { orderId, paymentStatus });
      return true;
    } catch (error) {
      console.error("Error updating booking payment status:", error);
      return false;
    }
  };

  // Handle payment success
  const handlePaymentSuccess = async (transactionId: string, orderId?: string) => {
    try {
      // Create a complete payment details object
      const paymentInfo = {
        transactionId,
        paymentMethod: "CCAvenue",
        amount: paymentDetails.amount,
        timestamp: new Date().toISOString(),
        status: "success",
      };

      const completePaymentDetails = {
        ...paymentDetails,
        paymentInfo,
      };

      setCompletedPaymentDetails(completePaymentDetails);
      setPaymentSuccess(true);
      setPaymentStatus('SUCCESS');

      // If we have an orderId from the payment response, update the existing booking
      if (orderId) {
        const updateSuccess = await updateBookingPaymentStatus(orderId, 'SUCCESS', paymentInfo);
        if (updateSuccess) {
          console.log("Payment status updated to SUCCESS for orderId:", orderId);
        } else {
          console.warn("Failed to update payment status for orderId:", orderId);
        }
        // Move to booking status step
        setStep(5);
        return;
      }

      // If no orderId (new booking), save to database
      const { customerName, customerEmail, customerPhone } = getCustomerInfo();

      const bookingData = {
        orderId: orderId || `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        vehicle: paymentDetails.vehicle,
        pickupLocation: paymentDetails.pickupLocation,
        dropoffLocation: paymentDetails.dropoffLocation,
        date: pickupDate,
        time: paymentDetails.time,
        amount: paymentDetails.amount,
        customerInfo: {
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
        },
        userId: currentUser?.uid,
        type: "Chauffeur",
      };

      const result = await saveBookingToDatabase(
        bookingData,
        paymentInfo,
        "awaiting",
        "SUCCESS"
      );
      if (result) {
        setBookingId(result.id);
        setFormattedBookingId(result.formattedId);
        setBookingStatus("awaiting");
        setStep(5);
      } else {
        toast.warning("Payment successful but booking details could not be saved");
        setStep(5);
      }
    } catch (error) {
      console.error("Error handling payment success:", error);
      toast.error("Error processing payment success");
      handlePaymentFailure("Error processing payment success");
    }
  };

  // Handle payment failure
  const handlePaymentFailure = async (errorMessage: string, orderId?: string) => {
    try {
      setPaymentSuccess(false);
      setPaymentError(errorMessage);
      setPaymentStatus('FAILED');

      // Create payment info for failed payment
      const paymentInfo = {
        paymentMethod: "CCAvenue",
        amount: paymentDetails?.amount || 0,
        timestamp: new Date().toISOString(),
        status: "failed",
        error: errorMessage,
      };

      // If we have an orderId from the payment response, update the existing booking
      if (orderId) {
        const updateSuccess = await updateBookingPaymentStatus(orderId, 'FAILED', paymentInfo);
        if (updateSuccess) {
          console.log("Payment status updated to FAILED for orderId:", orderId);
        } else {
          console.warn("Failed to update payment status for orderId:", orderId);
        }
        // Move to booking status step
        setStep(5);
        return;
      }

      // If no orderId (new booking), save to database
      const { customerName, customerEmail, customerPhone } = getCustomerInfo();

      const bookingData = {
        orderId: orderId || `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        vehicle: paymentDetails?.vehicle,
        pickupLocation: paymentDetails?.pickupLocation,
        dropoffLocation: paymentDetails?.dropoffLocation,
        date: pickupDate,
        time: paymentDetails?.time,
        amount: paymentDetails?.amount || 0,
        customerInfo: {
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
        },
        userId: currentUser?.uid,
        type: "Chauffeur",
      };

      const result = await saveBookingToDatabase(
        bookingData,
        paymentInfo,
        "failed",
        "FAILED"
      );
      if (result) {
        setBookingId(result.id);
        setFormattedBookingId(result.formattedId);
      }

      // Move to booking status step
      setStep(5);
    } catch (error) {
      console.error("Error handling payment failure:", error);
      toast.error("Error processing payment failure");
      setStep(5);
    }
  };

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (step === 1) {
      if (!bookingDetails.pickup || !bookingDetails.dropoff) {
        toast.error("Please enter both pickup and drop-off locations");
        return;
      }

      if (!selectedPickupLocation || !selectedDropoffLocation) {
        toast.error("Please select valid locations from the suggestions");
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

      // Create booking details for payment step
      const paymentDetailsObj = {
        vehicle: selectedVehicle,
        pickupLocation: selectedPickupLocation,
        dropoffLocation: selectedDropoffLocation,
        date: pickupDate
          ? pickupDate.toLocaleDateString()
          : new Date().toLocaleDateString(),
        time: bookingDetails.time,
        amount: estimatedFare,
        customerInfo: {
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
        },
        userId: currentUser?.uid,
      };

      // Generate an order ID using timestamp and random string
      const newOrderId = `ORD-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 8)}`;

      setPaymentDetails(paymentDetailsObj);
      setOrderId(newOrderId);

      // Save booking with PENDING status before proceeding to payment

      const initialPaymentInfo = {
        paymentMethod: "CCAvenue",
        amount: estimatedFare,
        timestamp: new Date().toISOString(),
        status: "pending",
      };

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
      };

      // Save booking with PENDING status
      const result = await saveBookingToDatabase(
        bookingData,
        initialPaymentInfo,
        "initiated",
        "PENDING"
      );

      if (result) {
        setBookingId(result.id);
        setFormattedBookingId(result.formattedId);
        console.log("Booking saved with PENDING status, orderId:", newOrderId);
      } else {
        console.warn("Failed to save initial booking");
      }

      // Move to payment step
      setStep(4);
    }
  };

  // Find the selected vehicle from vehicles array
  const selectedVehicle = vehicles.find((v) => v.id === selectedCarModel);

  return (
    <div className="space-y-3">
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

          <Button
            type="button"
            className="w-full h-9 text-white text-sm font-medium bg-gradient-to-r from-fleet-red to-fleet-accent hover:opacity-90 hover:shadow-md transition-all rounded-md mt-2"
            onClick={() => handleSubmit(new Event("submit") as any)}
          >
            Book Chauffeur
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

      {step === 4 && paymentDetails && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg border p-5 mb-4">
              <h2 className="text-lg font-medium mb-4">
                Complete Your Payment
              </h2>

              <CCavenueCheckout
                orderId={orderId}
                amount={paymentDetails.amount || 0}
                customerName={paymentDetails.customerInfo?.name || ""}
                customerEmail={paymentDetails.customerInfo?.email || ""}
                customerPhone={paymentDetails.customerInfo?.phone || ""}
                onPaymentSuccess={handlePaymentSuccess}
                onPaymentFailure={handlePaymentFailure}
              />
            </div>

            {/* Test controls only shown in development/test mode */}
            {isTestMode && (
              <div className="mb-4">
                <PaymentTestControls />
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              className="h-8 text-xs border-gray-300 hover:bg-gray-50 transition-all"
              onClick={() => setStep(3)}
            >
              Back to Vehicle Selection
            </Button>
          </div>

          <div className="md:col-span-1">
            <div className="bg-white rounded-lg border p-5 sticky top-5">
              <h2 className="text-lg font-medium mb-3">Booking Summary</h2>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Vehicle</span>
                  <span className="font-medium">
                    {paymentDetails.vehicle?.name || "Selected Vehicle"}
                  </span>
                </div>

                <div className="flex justify-between items-start">
                  <span className="text-gray-600">Pickup</span>
                  <span className="font-medium text-right max-w-[60%]">
                    {paymentDetails.pickupLocation?.name || "Pickup Location"}
                  </span>
                </div>

                <div className="flex justify-between items-start">
                  <span className="text-gray-600">Dropoff</span>
                  <span className="font-medium text-right max-w-[60%]">
                    {paymentDetails.dropoffLocation?.name || "Dropoff Location"}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Date & Time</span>
                  <span className="font-medium">
                    {paymentDetails.date} at {paymentDetails.time}
                  </span>
                </div>
              </div>

              <div className="border-t pt-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-gray-600">Total Amount</span>
                  <span className="text-xl font-semibold text-fleet-red">
                    AED {paymentDetails.amount?.toFixed(2) || "0.00"}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Includes all taxes and fees
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New step 5: Booking Status */}
      {step === 5 && (
        <div className="space-y-6">
          {paymentSuccess ? (
            <div className="rounded-md bg-green-50 p-4 border border-green-200">
              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-green-500 mr-3"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <h3 className="text-green-800 font-medium">
                  Payment Successful!
                </h3>
              </div>
              <p className="text-green-700 text-sm mt-2">
                Your booking has been confirmed. Booking ID:{" "}
                {formattedBookingId || bookingId || orderId}
              </p>
            </div>
          ) : (
            <div className="rounded-md bg-red-50 p-4 border border-red-200">
              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-red-500 mr-3"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <h3 className="text-red-800 font-medium">Payment Failed</h3>
              </div>
              <p className="text-red-700 text-sm mt-2">
                {paymentError ||
                  "There was an issue processing your payment. Please try again."}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <h3 className="font-medium">Booking Status</h3>
            <div className="space-y-2">
              {["initiated", "awaiting", "assigned", "pickup", "dropped"].map(
                (status, index) => (
                  <div key={status} className="flex items-center">
                    <div
                      className={`h-5 w-5 rounded-full mr-3 flex items-center justify-center ${
                        status === "initiated" ||
                        (status === "awaiting" && bookingStatus === "awaiting")
                          ? "bg-green-500"
                          : "bg-gray-200"
                      }`}
                    >
                      {(status === "initiated" ||
                        (status === "awaiting" &&
                          bookingStatus === "awaiting")) && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3 w-3 text-white"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <span
                      className={
                        status === "initiated" ||
                        (status === "awaiting" && bookingStatus === "awaiting")
                          ? "font-medium"
                          : "text-gray-500"
                      }
                    >
                      {status === "initiated"
                        ? "Booking Initiated"
                        : status === "awaiting"
                        ? "Awaiting Confirmation"
                        : status === "assigned"
                        ? "Driver Assigned"
                        : status === "pickup"
                        ? "Pickup Done"
                        : "Dropped at Location"}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>

          {paymentSuccess && completedPaymentDetails && (
            <div className="bg-white rounded-lg border p-4">
              <h3 className="font-medium mb-3">Booking Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Pickup</span>
                  <span className="font-medium">
                    {completedPaymentDetails.pickupLocation?.name ||
                      "Selected Location"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Dropoff</span>
                  <span className="font-medium">
                    {completedPaymentDetails.dropoffLocation?.name ||
                      "Selected Location"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date & Time</span>
                  <span className="font-medium">
                    {completedPaymentDetails.date} at{" "}
                    {completedPaymentDetails.time}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Vehicle</span>
                  <span className="font-medium">
                    {completedPaymentDetails.vehicle?.name ||
                      "Selected Vehicle"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Fare</span>
                  <span className="font-bold text-fleet-red">
                    AED {completedPaymentDetails.amount?.toFixed(2) || "0.00"}
                  </span>
                </div>
                {completedPaymentDetails.paymentInfo && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Transaction ID</span>
                    <span className="font-medium text-xs">
                      {completedPaymentDetails.paymentInfo.transactionId}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            {paymentSuccess ? (
              <>
                <Button
                  type="button"
                  className="flex-1 text-white font-medium bg-gradient-to-r from-fleet-red to-fleet-accent hover:opacity-90"
                  onClick={() => navigate("/my-bookings")}
                >
                  View My Bookings
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={resetForm}
                >
                  Book Another Ride
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep(4)}
                >
                  Try Again
                </Button>

                <Button
                  type="button"
                  className="flex-1 text-white font-medium bg-gradient-to-r from-fleet-red to-fleet-accent hover:opacity-90"
                  onClick={resetForm}
                >
                  Start Over
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BookTaxiForm;
