import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Navigation, Play, Square, AlertTriangle, CheckCircle, Clock, Car, User, Phone } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getBookingDetails } from "@/services/bookingService";
import { useGoogleMapsToken } from "@/hooks/useGoogleMapsToken";
import { googleMapsService } from "@/services/googleMapsService";

// Ride status types
type RideStatus = 'pending' | 'starting' | 'in_progress' | 'completed' | 'cancelled';

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
  const [rideStatus, setRideStatus] = useState<RideStatus>('pending');
  const [driverLocation, setDriverLocation] = useState<Location | null>(null);
  const [isAtPickup, setIsAtPickup] = useState(false);
  const [isAtDropoff, setIsAtDropoff] = useState(false);
  const [showStartPrompt, setShowStartPrompt] = useState(false);
  const [showEndPrompt, setShowEndPrompt] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  
  // Map refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const directionsRenderer = useRef<google.maps.DirectionsRenderer | null>(null);
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
    if (rideStatus === 'in_progress') {
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
            lat: data.pickupLocation?.coordinates?.lat || data.pickup?.coordinates?.lat || 25.2048,
            lng: data.pickupLocation?.coordinates?.lng || data.pickup?.coordinates?.lng || 55.2708,
            name: data.pickupLocation?.name || data.pickup || 'Pickup Location',
            address: data.pickupLocation?.address || data.pickup || 'Pickup Address'
          },
          dropoffLocation: {
            lat: data.dropoffLocation?.coordinates?.lat || data.dropoff?.coordinates?.lat || 25.2048,
            lng: data.dropoffLocation?.coordinates?.lng || data.dropoff?.coordinates?.lng || 55.2708,
            name: data.dropoffLocation?.name || data.dropoff || 'Dropoff Location',
            address: data.dropoffLocation?.address || data.dropoff || 'Dropoff Address'
          },
          customerInfo: {
            name: data.customerInfo?.name || 'Customer',
            phone: data.customerInfo?.phone || 'N/A',
            email: data.customerInfo?.email || 'N/A'
          },
          vehicleInfo: {
            type: typeof data.vehicle === 'object' ? data.vehicle?.name || 'Vehicle' : data.vehicle || data.vehicleType || 'Vehicle',
            model: typeof data.vehicle === 'object' ? data.vehicle?.description || 'Model' : data.vehicleModel || 'Model',
            number: data.vehicleNumber || 'N/A'
          },
          fare: data.amount || data.fare || 0,
          status: data.status || 'pending',
          pickupDateTime: data.pickupDateTime || data.date || new Date().toISOString(),
          estimatedDuration: data.estimatedDuration || 30,
          estimatedDistance: data.estimatedDistance || 10
        };
        
        setRideDetails(transformedRide);
        setRideStatus(transformedRide.status);
      } else {
        toast.error('Failed to fetch ride details');
        navigate('/driver/dashboard');
      }
    } catch (error) {
      console.error('Error fetching ride details:', error);
      toast.error('Failed to load ride details');
      navigate('/driver/dashboard');
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
          lng: rideDetails.pickupLocation.lng 
        },
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        gestureHandling: "cooperative"
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
          lng: rideDetails.pickupLocation.lng 
        },
        map: map,
        title: 'Pickup Location',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" fill="#10B981" stroke="white" stroke-width="2"/>
              <path d="M12 6v6l4 2" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(24, 24),
          anchor: new google.maps.Point(12, 12)
        }
      });

      // Add dropoff marker
      dropoffMarkerRef.current = new google.maps.Marker({
        position: { 
          lat: rideDetails.dropoffLocation.lat, 
          lng: rideDetails.dropoffLocation.lng 
        },
        map: map,
        title: 'Dropoff Location',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" fill="#EF4444" stroke="white" stroke-width="2"/>
              <path d="M12 6v6l4 2" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(24, 24),
          anchor: new google.maps.Point(12, 12)
        }
      });

      // Draw route
      drawRoute();

      // Get driver's current location
      getCurrentLocation();

    } catch (error) {
      console.error('Error initializing map:', error);
      toast.error('Failed to initialize map');
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
      console.error('Error drawing route:', error);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: Location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
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
            title: 'Your Location',
            icon: {
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" fill="#3B82F6" stroke="white" stroke-width="2"/>
                  <path d="M12 2a8 8 0 0 0-8 8c0 5.4 7.1 13.5 8 13.5s8-8.1 8-13.5a8 8 0 0 0-8-8z" stroke="white" stroke-width="2"/>
                </svg>
              `),
              scaledSize: new google.maps.Size(32, 32),
              anchor: new google.maps.Point(16, 16)
            }
          });
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        setLocationError('Failed to get your current location');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const startLocationTracking = () => {
    if (!navigator.geolocation) return;

    locationWatchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const location: Location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setDriverLocation(location);
        
        // Update driver marker position
        if (driverMarkerRef.current && mapRef.current) {
          driverMarkerRef.current.setPosition({ lat: location.lat, lng: location.lng });
        }
      },
      (error) => {
        console.error('Error tracking location:', error);
        setLocationError('Failed to track location');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
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
    if (atPickup && rideStatus === 'pending') {
      setShowStartPrompt(true);
    } else if (atDropoff && rideStatus === 'in_progress') {
      setShowEndPrompt(true);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const startRide = async () => {
    try {
      setRideStatus('starting');
      setShowStartPrompt(false);
      
      // Show countdown
      toast.success('Ride starting in 3 seconds...');
      
      setTimeout(() => {
        setRideStatus('in_progress');
        toast.success('Ride started! Safe journey!');
      }, 3000);
      
    } catch (error) {
      console.error('Error starting ride:', error);
      toast.error('Failed to start ride');
      setRideStatus('pending');
    }
  };

  const endRide = async () => {
    try {
      setRideStatus('completed');
      setShowEndPrompt(false);
      toast.success('Ride completed successfully!');
      
      // Navigate to completion page or dashboard
      setTimeout(() => {
        navigate('/driver/dashboard');
      }, 2000);
      
    } catch (error) {
      console.error('Error ending ride:', error);
      toast.error('Failed to end ride');
    }
  };

  const getStatusBadge = (status: RideStatus) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      starting: { color: 'bg-blue-100 text-blue-800', text: 'Starting...' },
      in_progress: { color: 'bg-green-100 text-green-800', text: 'In Progress' },
      completed: { color: 'bg-gray-100 text-gray-800', text: 'Completed' },
      cancelled: { color: 'bg-red-100 text-red-800', text: 'Cancelled' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Badge className={config.color}>
        {config.text}
      </Badge>
    );
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
          <p className="text-gray-600 mb-4">The requested ride could not be found.</p>
          <Button onClick={() => navigate('/driver/dashboard')}>
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
            <h1 className="text-2xl font-bold">Ride #{rideDetails.id.slice(-8)}</h1>
            <p className="text-gray-600">Manage your current ride</p>
          </div>
          {getStatusBadge(rideStatus)}
        </div>

        {/* Location Alert */}
        {locationError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{locationError}</AlertDescription>
          </Alert>
        )}

        {/* Not at pickup location alert */}
        {!isAtPickup && rideStatus === 'pending' && (
          <Alert>
            <MapPin className="h-4 w-4" />
            <AlertDescription>
              You are not at the pickup location. Please navigate to the pickup point to start the ride.
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
              <Button onClick={startRide} className="bg-green-600 hover:bg-green-700">
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
              <Button onClick={endRide} className="bg-blue-600 hover:bg-blue-700">
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
                  <p className="font-medium">{rideDetails.customerInfo.email}</p>
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
                  <p className="font-medium">{rideDetails.vehicleInfo.number}</p>
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
                  <p className="font-medium">{rideDetails.pickupLocation.name}</p>
                  <p className="text-xs text-gray-500">{rideDetails.pickupLocation.address}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Dropoff</p>
                  <p className="font-medium">{rideDetails.dropoffLocation.name}</p>
                  <p className="text-xs text-gray-500">{rideDetails.dropoffLocation.address}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <p className="text-sm text-gray-500">Distance</p>
                    <p className="font-medium">{rideDetails.estimatedDistance} km</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Duration</p>
                    <p className="font-medium">{rideDetails.estimatedDuration} min</p>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-sm text-gray-500">Fare</p>
                  <p className="text-xl font-bold text-fleet-red">AED {rideDetails.fare}</p>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            {rideStatus === 'pending' && (
              <Card>
                <CardContent className="pt-6">
                  <Button 
                    onClick={getCurrentLocation} 
                    className="w-full mb-3"
                    variant="outline"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Update My Location
                  </Button>
                  <Button 
                    onClick={() => navigate('/driver/dashboard')} 
                    className="w-full"
                    variant="outline"
                  >
                    Back to Dashboard
                  </Button>
                </CardContent>
              </Card>
            )}

            {rideStatus === 'in_progress' && (
              <Card>
                <CardContent className="pt-6">
                  <Button 
                    onClick={endRide} 
                    className="w-full"
                    disabled={!isAtDropoff}
                  >
                    <Square className="h-4 w-4 mr-2" />
                    End Ride
                  </Button>
                  {!isAtDropoff && (
                    <p className="text-xs text-gray-500 text-center mt-2">
                      You must be at the dropoff location to end the ride
                    </p>
                  )}
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
