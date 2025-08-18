import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  MapPin,
  Navigation,
  Play,
  Square,
  AlertTriangle,
  CheckCircle,
  Clock,
  Car,
  User,
  Phone,
} from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getBookingDetails } from "@/services/bookingService";
import { useGoogleMapsToken } from "@/hooks/useGoogleMapsToken";
import { googleMapsService } from "@/services/googleMapsService";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { firestore } from "@/lib/firebase";

// Ride status types
type RideStatus =
  | "pending"
  | "starting"
  | "in_progress"
  | "completed"
  | "cancelled";

// Location interface
interface Location {
  lat: number;
  lng: number;
  name?: string;
  address?: string;
}

// Ride details interface
interface RideDetails {
  id: string;
  pickupLocation: Location;
  dropoffLocation: Location;
  customerInfo: {
    name: string;
    phone: string;
    email: string;
  };
  vehicleInfo: {
    type: string;
    model: string;
    number: string;
  };
  fare: number;
  status: RideStatus;
  pickupDateTime: string;
  estimatedDuration: number; // in minutes
  estimatedDistance: number; // in km
}

const DriverStartRide = () => {
  const { rideId } = useParams();
  const navigate = useNavigate();

  // State management
  const [rideDetails, setRideDetails] = useState<RideDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [rideStatus, setRideStatus] = useState<RideStatus>("pending");
  const [driverLocation, setDriverLocation] = useState<Location | null>(null);
  const [isAtPickup, setIsAtPickup] = useState(false);
  const [isAtDropoff, setIsAtDropoff] = useState(false);
  const [showStartPrompt, setShowStartPrompt] = useState(false);
  const [showEndPrompt, setShowEndPrompt] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Map refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const directionsRenderer = useRef<google.maps.DirectionsRenderer | null>(
    null
  );
  const driverMarkerRef = useRef<google.maps.Marker | null>(null);
  const pickupMarkerRef = useRef<google.maps.Marker | null>(null);
  const dropoffMarkerRef = useRef<google.maps.Marker | null>(null);

  // Location tracking
  const locationWatchId = useRef<number | null>(null);
  const locationCheckInterval = useRef<NodeJS.Timeout | null>(null);

  // Google Maps
  const { token, isInitialized } = useGoogleMapsToken();

  // Fetch ride details on component mount
  useEffect(() => {
    if (rideId) {
      fetchRideDetails();
    }
  }, [rideId]);

  // Initialize map when ride details are loaded
  useEffect(() => {
    if (rideDetails && isInitialized && token) {
      initializeMap();
    }
  }, [rideDetails, isInitialized, token]);

  // Start location tracking when ride starts
  useEffect(() => {
    if (rideStatus === "in_progress") {
      startLocationTracking();
    } else {
      stopLocationTracking();
    }

    return () => {
      stopLocationTracking();
    };
  }, [rideStatus]);

  // Check location proximity periodically
  useEffect(() => {
    if (rideDetails && driverLocation) {
      checkLocationProximity();
    }
  }, [driverLocation, rideDetails]);

  const fetchRideDetails = async () => {
    try {
      setLoading(true);
      const response = await getBookingDetails(rideId!);

      if (response.success) {
        const data = response.data;

        // Transform the data to match our interface
        const transformedRide: RideDetails = {
          id: data.id,
          pickupLocation: {
            lat:
              data.pickupLocation?.coordinates?.lat ||
              data.pickup?.coordinates?.lat ||
              25.2048,
            lng:
              data.pickupLocation?.coordinates?.lng ||
              data.pickup?.coordinates?.lng ||
              55.2708,
            name: data.pickupLocation?.name || data.pickup || "Pickup Location",
            address:
              data.pickupLocation?.address || data.pickup || "Pickup Address",
          },
          dropoffLocation: {
            lat:
              data.dropoffLocation?.coordinates?.lat ||
              data.dropoff?.coordinates?.lat ||
              25.2048,
            lng:
              data.dropoffLocation?.coordinates?.lng ||
              data.dropoff?.coordinates?.lng ||
              55.2708,
            name:
              data.dropoffLocation?.name || data.dropoff || "Dropoff Location",
            address:
              data.dropoffLocation?.address ||
              data.dropoff ||
              "Dropoff Address",
          },
          customerInfo: {
            name: data.customerInfo?.name || "Customer",
            phone: data.customerInfo?.phone || "N/A",
            email: data.customerInfo?.email || "N/A",
          },
          vehicleInfo: {
            type:
              typeof data.vehicle === "object"
                ? data.vehicle?.name || "Vehicle"
                : data.vehicle || data.vehicleType || "Vehicle",
            model:
              typeof data.vehicle === "object"
                ? data.vehicle?.description || "Model"
                : data.vehicleModel || "Model",
            number: data.vehicleNumber || "N/A",
          },
          fare: data.amount || data.fare || 0,
          status: data.status || "pending",
          pickupDateTime:
            data.pickupDateTime || data.date || new Date().toISOString(),
          estimatedDuration: data.estimatedDuration || 30,
          estimatedDistance: data.estimatedDistance || 10,
        };

        setRideDetails(transformedRide);
        setRideStatus(transformedRide.status);
      } else {
        toast.error("Failed to fetch ride details");
        navigate("/driver/dashboard");
      }
    } catch (error) {
      console.error("Error fetching ride details:", error);
      toast.error("Failed to load ride details");
      navigate("/driver/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const initializeMap = async () => {
    if (!mapContainerRef.current || !rideDetails) return;

    try {
      // Initialize Google Maps service
      await googleMapsService.initialize({ apiKey: token });

      // Create map
      const map = await googleMapsService.createMap(mapContainerRef.current, {
        center: {
          lat: rideDetails.pickupLocation.lat,
          lng: rideDetails.pickupLocation.lng,
        },
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        gestureHandling: "cooperative",
      });

      mapRef.current = map;

      // Initialize directions renderer
      directionsRenderer.current = new google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: "#e42240",
          strokeWeight: 4,
          strokeOpacity: 0.8,
        },
      });

      // Add pickup marker
      pickupMarkerRef.current = new google.maps.Marker({
        position: {
          lat: rideDetails.pickupLocation.lat,
          lng: rideDetails.pickupLocation.lng,
        },
        map: map,
        title: "Pickup Location",
        icon: {
          url:
            "data:image/svg+xml;charset=UTF-8," +
            encodeURIComponent(`
              <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="18" fill="transparent"/>
                <text x="20" y="25" text-anchor="middle" fill="white" font-size="20" font-weight="bold">🚗</text>
              </svg>
            `),
          scaledSize: new google.maps.Size(40, 40),
          anchor: new google.maps.Point(12, 12),
        },
      });

      // Add dropoff marker
      dropoffMarkerRef.current = new google.maps.Marker({
        position: {
          lat: rideDetails.dropoffLocation.lat,
          lng: rideDetails.dropoffLocation.lng,
        },
        map: map,
        title: "Dropoff Location",
        icon: {
          url:
            "data:image/svg+xml;charset=UTF-8," +
            encodeURIComponent(`
              <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="18" fill="transparent"/>
                <text x="20" y="25" text-anchor="middle" fill="white" font-size="20" font-weight="bold">📍</text>
              </svg>
            `),
          scaledSize: new google.maps.Size(40, 40),
          anchor: new google.maps.Point(12, 12),
        },
      });

      // Draw route
      drawRoute();

      // Get driver's current location
      getCurrentLocation();
    } catch (error) {
      console.error("Error initializing map:", error);
      toast.error("Failed to initialize map");
    }
  };

  const drawRoute = async () => {
    if (!directionsRenderer.current || !rideDetails) return;

    try {
      const directionsResult = await googleMapsService.getDirections(
        {
          lat: rideDetails.pickupLocation.lat,
          lng: rideDetails.pickupLocation.lng,
        },
        {
          lat: rideDetails.dropoffLocation.lat,
          lng: rideDetails.dropoffLocation.lng,
        }
      );

      if (directionsResult) {
        directionsRenderer.current.setDirections(directionsResult);
      }
    } catch (error) {
      console.error("Error drawing route:", error);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: Location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setDriverLocation(location);
        setLocationError(null);

        // Add driver marker to map
        if (mapRef.current) {
          if (driverMarkerRef.current) {
            driverMarkerRef.current.setMap(null);
          }

          driverMarkerRef.current = new google.maps.Marker({
            position: { lat: location.lat, lng: location.lng },
            map: mapRef.current,
            title: "Your Location",
            icon: {
              url:
                "data:image/svg+xml;charset=UTF-8," +
                encodeURIComponent(`
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" fill="#3B82F6" stroke="white" stroke-width="2"/>
                  <path d="M12 2a8 8 0 0 0-8 8c0 5.4 7.1 13.5 8 13.5s8-8.1 8-13.5a8 8 0 0 0-8-8z" stroke="white" stroke-width="2"/>
                </svg>
              `),
              scaledSize: new google.maps.Size(32, 32),
              anchor: new google.maps.Point(16, 16),
            },
          });
        }
      },
      (error) => {
        console.error("Error getting location:", error);
        setLocationError("Failed to get your current location");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const startLocationTracking = () => {
    if (!navigator.geolocation) return;

    locationWatchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const location: Location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setDriverLocation(location);

        // Update driver marker position
        if (driverMarkerRef.current && mapRef.current) {
          driverMarkerRef.current.setPosition({
            lat: location.lat,
            lng: location.lng,
          });
        }

        // Update driver location in Firestore if ride is active
        if (
          rideDetails &&
          (rideStatus === "in_progress" || rideStatus === "starting")
        ) {
          updateDriverLocationInFirestore(location);
        }
      },
      (error) => {
        console.error("Error tracking location:", error);
        setLocationError("Failed to track location");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );

    // Check location proximity every 10 seconds
    locationCheckInterval.current = setInterval(() => {
      if (driverLocation && rideDetails) {
        checkLocationProximity();
      }
    }, 10000);
  };

  const stopLocationTracking = () => {
    if (locationWatchId.current) {
      navigator.geolocation.clearWatch(locationWatchId.current);
      locationWatchId.current = null;
    }

    if (locationCheckInterval.current) {
      clearInterval(locationCheckInterval.current);
      locationCheckInterval.current = null;
    }
  };

  const checkLocationProximity = () => {
    if (!driverLocation || !rideDetails) return;

    const pickupDistance = calculateDistance(
      driverLocation.lat,
      driverLocation.lng,
      rideDetails.pickupLocation.lat,
      rideDetails.pickupLocation.lng
    );

    const dropoffDistance = calculateDistance(
      driverLocation.lat,
      driverLocation.lng,
      rideDetails.dropoffLocation.lat,
      rideDetails.dropoffLocation.lng
    );

    // Check if at pickup location (within 100 meters)
    const atPickup = pickupDistance <= 0.1;
    setIsAtPickup(atPickup);

    // Check if at dropoff location (within 100 meters)
    const atDropoff = dropoffDistance <= 0.1;
    setIsAtDropoff(atDropoff);

    // Show appropriate prompts
    if (atPickup && rideStatus === "pending") {
      setShowStartPrompt(true);
    } else if (atDropoff && rideStatus === "in_progress") {
      setShowEndPrompt(true);
    }

    // Log location for debugging
    console.log("Location check:", {
      pickupDistance: pickupDistance.toFixed(3) + " km",
      dropoffDistance: dropoffDistance.toFixed(3) + " km",
      atPickup,
      atDropoff,
      driverLocation: `${driverLocation.lat.toFixed(
        6
      )}, ${driverLocation.lng.toFixed(6)}`,
    });
  };

  const updateDriverLocationInFirestore = async (location: Location) => {
    if (!rideDetails) return;

    try {
      const bookingRef = doc(firestore, "bookings", rideDetails.id);
      await updateDoc(bookingRef, {
        driverLocation: {
          lat: location.lat,
          lng: location.lng,
          timestamp: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating driver location in Firestore:", error);
    }
  };

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const startRide = async () => {
    try {
      if (!rideDetails) return;

      setRideStatus("starting");
      setShowStartPrompt(false);

      // Check driver location before starting
      if (!driverLocation) {
        toast.error(
          "Unable to get your location. Please check location permissions."
        );
        setRideStatus("pending");
        return;
      }

      // Update booking status in Firestore
      const bookingRef = doc(firestore, "bookings", rideDetails.id);
      await updateDoc(bookingRef, {
        status: "started",
        rideStartedAt: serverTimestamp(),
        driverLocation: {
          lat: driverLocation.lat,
          lng: driverLocation.lng,
          timestamp: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      });

      // Show countdown
      toast.success("Ride starting in 3 seconds...");

      setTimeout(() => {
        setRideStatus("in_progress");
        toast.success("Ride started! Safe journey!");
      }, 3000);
    } catch (error) {
      console.error("Error starting ride:", error);
      toast.error("Failed to start ride");
      setRideStatus("pending");
    }
  };

  const endRide = async () => {
    try {
      if (!rideDetails) return;

      // Check driver location before ending
      if (!driverLocation) {
        toast.error(
          "Unable to get your location. Please check location permissions."
        );
        return;
      }

      setRideStatus("completed");
      setShowEndPrompt(false);

      // Update booking status in Firestore
      const bookingRef = doc(firestore, "bookings", rideDetails.id);
      await updateDoc(bookingRef, {
        status: "completed",
        rideEndedAt: serverTimestamp(),
        driverLocation: {
          lat: driverLocation.lat,
          lng: driverLocation.lng,
          timestamp: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      });

      toast.success("Ride completed successfully!");

      // Navigate to completion page or dashboard
      setTimeout(() => {
        navigate("/driver/dashboard");
      }, 2000);
    } catch (error) {
      console.error("Error ending ride:", error);
      toast.error("Failed to end ride");
      setRideStatus("in_progress");
    }
  };

  const getStatusBadge = (status: RideStatus) => {
    const statusConfig = {
      pending: { color: "bg-yellow-100 text-yellow-800", text: "Pending" },
      starting: { color: "bg-blue-100 text-blue-800", text: "Starting..." },
      in_progress: {
        color: "bg-green-100 text-green-800",
        text: "In Progress",
      },
      completed: { color: "bg-gray-100 text-gray-800", text: "Completed" },
      cancelled: { color: "bg-red-100 text-red-800", text: "Cancelled" },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return <Badge className={config.color}>{config.text}</Badge>;
  };

  if (loading) {
    return (
      <DashboardLayout userType="driver">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-fleet-red" />
          <span className="ml-2">Loading ride details...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (!rideDetails) {
    return (
      <DashboardLayout userType="driver">
        <div className="text-center py-8">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Ride Not Found</h2>
          <p className="text-gray-600 mb-4">
            The requested ride could not be found.
          </p>
          <Button onClick={() => navigate("/driver/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="driver">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">
              Ride #{rideDetails.id.slice(-8)}
            </h1>
            <p className="text-gray-600">Manage your current ride</p>
          </div>
          {getStatusBadge(rideStatus)}
        </div>

        {/* Location Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Driver Location Status */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">Driver Location</span>
                </div>
                <Badge variant={driverLocation ? "default" : "destructive"}>
                  {driverLocation ? "Active" : "Inactive"}
                </Badge>
              </div>
              {driverLocation && (
                <div className="mt-2 text-sm text-gray-600">
                  <p>Lat: {driverLocation.lat.toFixed(6)}</p>
                  <p>Lng: {driverLocation.lng.toFixed(6)}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pickup Location Status */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Pickup</span>
                </div>
                <Badge variant={isAtPickup ? "default" : "secondary"}>
                  {isAtPickup ? "At Location" : "Not at Location"}
                </Badge>
              </div>
              {driverLocation && (
                <div className="mt-2 text-sm text-gray-600">
                  <p>
                    Distance:{" "}
                    {calculateDistance(
                      driverLocation.lat,
                      driverLocation.lng,
                      rideDetails.pickupLocation.lat,
                      rideDetails.pickupLocation.lng
                    ).toFixed(3)}{" "}
                    km
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dropoff Location Status */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-red-600" />
                  <span className="font-medium">Dropoff</span>
                </div>
                <Badge variant={isAtDropoff ? "default" : "secondary"}>
                  {isAtDropoff ? "At Location" : "Not at Location"}
                </Badge>
              </div>
              {driverLocation && (
                <div className="mt-2 text-sm text-gray-600">
                  <p>
                    Distance:{" "}
                    {calculateDistance(
                      driverLocation.lat,
                      driverLocation.lng,
                      rideDetails.dropoffLocation.lat,
                      rideDetails.dropoffLocation.lng
                    ).toFixed(3)}{" "}
                    km
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Location Alert */}
        {locationError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{locationError}</AlertDescription>
          </Alert>
        )}

        {/* Not at pickup location alert */}
        {!isAtPickup && rideStatus === "pending" && (
          <Alert>
            <MapPin className="h-4 w-4" />
            <AlertDescription>
              You are not at the pickup location. Please navigate to the pickup
              point to start the ride.
            </AlertDescription>
          </Alert>
        )}

        {/* Start ride prompt */}
        {showStartPrompt && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              You are at the pickup location! Ready to start the ride?
            </AlertDescription>
            <div className="mt-3">
              <Button
                onClick={startRide}
                className="bg-green-600 hover:bg-green-700"
              >
                <Play className="h-4 w-4 mr-2" />
                Start Ride
              </Button>
            </div>
          </Alert>
        )}

        {/* End ride prompt */}
        {showEndPrompt && (
          <Alert className="border-blue-200 bg-blue-50">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              You have reached the dropoff location. Ready to end the ride?
            </AlertDescription>
            <div className="mt-3">
              <Button
                onClick={endRide}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Square className="h-4 w-4 mr-2" />
                End Ride
              </Button>
            </div>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Navigation className="h-5 w-5 mr-2" />
                  Route Map
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  ref={mapContainerRef}
                  className="w-full h-96 rounded-lg border"
                />
              </CardContent>
            </Card>
          </div>

          {/* Ride Details */}
          <div className="space-y-4">
            {/* Customer Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Customer Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">{rideDetails.customerInfo.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium flex items-center">
                    <Phone className="h-4 w-4 mr-2" />
                    {rideDetails.customerInfo.phone}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">
                    {rideDetails.customerInfo.email}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Vehicle Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Car className="h-5 w-5 mr-2" />
                  Vehicle Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="font-medium">{rideDetails.vehicleInfo.type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Model</p>
                  <p className="font-medium">{rideDetails.vehicleInfo.model}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Number</p>
                  <p className="font-medium">
                    {rideDetails.vehicleInfo.number}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Trip Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Trip Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Pickup</p>
                  <p className="font-medium">
                    {rideDetails.pickupLocation.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {rideDetails.pickupLocation.address}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Dropoff</p>
                  <p className="font-medium">
                    {rideDetails.dropoffLocation.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {rideDetails.dropoffLocation.address}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <p className="text-sm text-gray-500">Distance</p>
                    <p className="font-medium">
                      {rideDetails.estimatedDistance} km
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Duration</p>
                    <p className="font-medium">
                      {rideDetails.estimatedDuration} min
                    </p>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-sm text-gray-500">Fare</p>
                  <p className="text-xl font-bold text-fleet-red">
                    AED {rideDetails.fare}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            {rideStatus === "pending" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Ride Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm text-gray-600 p-3 bg-blue-50 rounded-lg">
                    <p className="font-medium mb-1">📍 Location Check</p>
                    <p className="text-xs">
                      {isAtPickup
                        ? "✅ You are at the pickup location"
                        : "❌ You are not at the pickup location"}
                    </p>
                    {driverLocation && (
                      <p className="text-xs mt-1">
                        Your location: {driverLocation.lat.toFixed(6)},{" "}
                        {driverLocation.lng.toFixed(6)}
                      </p>
                    )}
                  </div>

                  <Button
                    onClick={getCurrentLocation}
                    className="w-full"
                    variant="outline"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Update My Location
                  </Button>

                  <Button
                    onClick={startRide}
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={!isAtPickup || !driverLocation}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Ride
                  </Button>

                  {!isAtPickup && (
                    <p className="text-xs text-yellow-600 text-center">
                      ⚠️ You must be at the pickup location to start the ride
                    </p>
                  )}

                  {!driverLocation && (
                    <p className="text-xs text-red-600 text-center">
                      ❌ Location access required to start ride
                    </p>
                  )}

                  <Button
                    onClick={() => navigate("/driver/dashboard")}
                    className="w-full"
                    variant="outline"
                  >
                    Back to Dashboard
                  </Button>
                </CardContent>
              </Card>
            )}

            {rideStatus === "starting" && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center p-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-3"></div>
                    <p className="text-green-600 font-medium">
                      Starting Ride...
                    </p>
                    <p className="text-sm text-gray-500">
                      Please wait while we prepare your ride
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {rideStatus === "in_progress" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Ride in Progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm text-gray-600 p-3 bg-green-50 rounded-lg">
                    <p className="font-medium mb-1">📍 Location Check</p>
                    <p className="text-xs">
                      {isAtDropoff
                        ? "✅ You are at the dropoff location"
                        : "❌ You are not at the dropoff location"}
                    </p>
                    {driverLocation && (
                      <p className="text-xs mt-1">
                        Your location: {driverLocation.lat.toFixed(6)},{" "}
                        {driverLocation.lng.toFixed(6)}
                      </p>
                    )}
                  </div>

                  <Button
                    onClick={endRide}
                    className="w-full bg-red-600 hover:bg-red-700"
                    disabled={!isAtDropoff || !driverLocation}
                  >
                    <Square className="h-4 w-4 mr-2" />
                    End Ride
                  </Button>

                  {!isAtDropoff && (
                    <p className="text-xs text-yellow-600 text-center">
                      ⚠️ You must be at the dropoff location to end the ride
                    </p>
                  )}

                  {!driverLocation && (
                    <p className="text-xs text-red-600 text-center">
                      ❌ Location access required to end ride
                    </p>
                  )}

                  <Button
                    onClick={getCurrentLocation}
                    className="w-full"
                    variant="outline"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Update Location
                  </Button>
                </CardContent>
              </Card>
            )}

            {rideStatus === "completed" && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center p-4">
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                    <p className="text-green-600 font-medium">
                      Ride Completed!
                    </p>
                    <p className="text-sm text-gray-500">
                      Redirecting to dashboard...
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DriverStartRide;
