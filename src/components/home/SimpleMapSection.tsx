import React, { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  MapPin,
  ArrowRight,
  Car,
  Clock,
  CreditCard,
  Loader2,
} from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { LocationSelector } from "@/components/home/booking-form";
import type { Location, Vehicle } from "@/components/home/booking-form/types";
import { firestore } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useGoogleMapsToken } from "@/hooks/useGoogleMapsToken";
import { googleMapsService } from "@/services/googleMapsService";

interface FareEstimate {
  distance: number;
  duration: number;
  price: number;
  currency: string;
  breakdown?: {
    baseFare: number;
    distanceFare: number;
    timeFare: number;
    surgeMultiplier: number;
    zoneSurcharge: number;
  };
}

const SimpleMapSection = () => {
  // Location state
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [selectedPickupLocation, setSelectedPickupLocation] = useState<
    Location | undefined
  >(undefined);
  const [selectedDropoffLocation, setSelectedDropoffLocation] = useState<
    Location | undefined
  >(undefined);

  // Vehicle state
  const [selectedVehicleType, setSelectedVehicleType] = useState("");
  const [taxiTypes, setTaxiTypes] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);

  // Map state
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const pickupMarkerRef = useRef<google.maps.Marker | null>(null);
  const dropoffMarkerRef = useRef<google.maps.Marker | null>(null);
  const directionsRenderer = useRef<google.maps.DirectionsRenderer | null>(
    null
  );
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Fare calculation state
  const [fareEstimate, setFareEstimate] = useState<FareEstimate | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [routeDetails, setRouteDetails] = useState<{
    distance: string;
    duration: string;
  } | null>(null);

  // Add state for geofencing zones
  const [zones, setZones] = useState<any[]>([]);

  // Token initialization
  const { token, isInitialized, error: tokenError } = useGoogleMapsToken();

  // Fetch taxi types from Firebase on component mount
  useEffect(() => {
    fetchTaxiTypes();
    fetchVehicles();
    fetchZones();
  }, []);

  // Handle token errors
  useEffect(() => {
    if (tokenError) {
      setMapError(`Google Maps token error: ${tokenError}`);
    }
  }, [tokenError]);

  // Initialize Google Maps
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    if (!isInitialized || !token) {
      console.log("Waiting for Google Maps token to initialize...");
      return;
    }

    const initializeMap = async () => {
      try {
        setMapError(null);

        // Initialize Google Maps service
        await googleMapsService.initialize({ apiKey: token });

        // Create map using the service
        const newMap = await googleMapsService.createMap(
          mapContainerRef.current!,
          {
            center: { lat: 25.2048, lng: 55.2708 }, // Dubai center
            zoom: 10,
          }
        );

        mapRef.current = newMap;

        // Initialize directions renderer
        directionsRenderer.current = new google.maps.DirectionsRenderer({
          map: newMap,
          suppressMarkers: true, // We'll add our own markers
          polylineOptions: {
            strokeColor: "#e42240", // fleet-red
            strokeWeight: 4,
            strokeOpacity: 0.8,
          },
        });

        // Set map as loaded immediately after initialization
        setMapLoaded(true);
        console.log("✓ Google Map initialized successfully");
      } catch (error) {
        console.error("Google Map initialization error:", error);
        setMapError(
          error instanceof Error
            ? error.message
            : "Unknown map initialization error"
        );
      }
    };

    initializeMap();

    return () => {
      if (mapRef.current) {
        // Clean up map instance
        google.maps.event.clearInstanceListeners(mapRef.current);
      }
    };
  }, [token, isInitialized]);

  // Fetch taxi types from Firebase
  const fetchTaxiTypes = async () => {
    try {
      setIsLoadingVehicles(true);
      const taxiTypesRef = collection(firestore, "taxiTypes");
      const taxiTypesSnapshot = await getDocs(taxiTypesRef);

      const taxiTypesData: any[] = [];
      taxiTypesSnapshot.forEach((doc) => {
        taxiTypesData.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      setTaxiTypes(taxiTypesData);

      if (taxiTypesData.length > 0) {
        // Set the first taxi type as default selected
        setSelectedVehicleType(taxiTypesData[0].id);
      }
    } catch (error) {
      console.error("Error fetching taxi types:", error);

      // Use fallback data if Firebase fetch fails
      const fallbackTaxiTypes = [
        { id: "economy", name: "Economy", emoji: "🚗" },
        { id: "comfort", name: "Comfort", emoji: "🚕" },
        { id: "suv", name: "SUV", emoji: "🚙" },
        { id: "premium", name: "Premium", emoji: "🏎️" },
      ];

      setTaxiTypes(fallbackTaxiTypes);
      setSelectedVehicleType(fallbackTaxiTypes[0].id);
    } finally {
      setIsLoadingVehicles(false);
    }
  };

  // Fetch vehicles from Firebase
  const fetchVehicles = async () => {
    try {
      const vehiclesRef = collection(firestore, "vehicles");
      const vehiclesSnapshot = await getDocs(vehiclesRef);

      const vehicleData: Vehicle[] = [];
      vehiclesSnapshot.forEach((doc) => {
        vehicleData.push({
          id: doc.id,
          ...doc.data(),
        } as Vehicle);
      });

      // If no vehicles were found in Firebase, use fallback data for testing
      if (vehicleData.length === 0) {
        const fallbackVehicles: Vehicle[] = [
          {
            id: "economy-car",
            taxiTypeId: "economy",
            name: "Economy",
            description: "Affordable ride for everyday use",
            basePrice: 10,
            perKmPrice: 1.5,
            perMinutePrice: 0.2,
            capacity: 4,
            images: [],
          },
          {
            id: "comfort-car",
            taxiTypeId: "comfort",
            name: "Comfort",
            description: "More spacious with amenities",
            basePrice: 15,
            perKmPrice: 2.0,
            perMinutePrice: 0.25,
            capacity: 4,
            images: [],
          },
          {
            id: "suv-car",
            taxiTypeId: "suv",
            name: "SUV",
            description: "Larger vehicle for groups",
            basePrice: 20,
            perKmPrice: 2.5,
            perMinutePrice: 0.3,
            capacity: 6,
            images: [],
          },
          {
            id: "premium-car",
            taxiTypeId: "premium",
            name: "Premium",
            description: "Luxury vehicles with premium service",
            basePrice: 30,
            perKmPrice: 3.5,
            perMinutePrice: 0.4,
            capacity: 4,
            images: [],
          },
        ];
        setVehicles(fallbackVehicles);
      } else {
        setVehicles(vehicleData);
      }
    } catch (error) {
      console.error("Error fetching vehicles:", error);

      // Use fallback data if Firebase fetch fails
      const fallbackVehicles: Vehicle[] = [
        {
          id: "economy-car",
          taxiTypeId: "economy",
          name: "Economy",
          description: "Affordable ride for everyday use",
          basePrice: 10,
          perKmPrice: 1.5,
          perMinutePrice: 0.2,
          capacity: 4,
          images: [],
        },
        {
          id: "comfort-car",
          taxiTypeId: "comfort",
          name: "Comfort",
          description: "More spacious with amenities",
          basePrice: 15,
          perKmPrice: 2.0,
          perMinutePrice: 0.25,
          capacity: 4,
          images: [],
        },
        {
          id: "suv-car",
          taxiTypeId: "suv",
          name: "SUV",
          description: "Larger vehicle for groups",
          basePrice: 20,
          perKmPrice: 2.5,
          perMinutePrice: 0.3,
          capacity: 6,
          images: [],
        },
        {
          id: "premium-car",
          taxiTypeId: "premium",
          name: "Premium",
          description: "Luxury vehicles with premium service",
          basePrice: 30,
          perKmPrice: 3.5,
          perMinutePrice: 0.4,
          capacity: 4,
          images: [],
        },
      ];
      setVehicles(fallbackVehicles);
    }
  };

  // Add a function to fetch geofencing zones
  const fetchZones = async () => {
    try {
      const zonesRef = collection(firestore, "zones");
      const zonesSnapshot = await getDocs(zonesRef);

      const zonesData: any[] = [];
      zonesSnapshot.forEach((doc) => {
        zonesData.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      setZones(zonesData);
    } catch (error) {
      console.error("Error fetching zones:", error);
    }
  };

  // Update map markers
  const updateMapMarkers = () => {
    if (!mapRef.current || !googleMapsService.isReady()) return;

    // Remove existing markers
    if (pickupMarkerRef.current) {
      pickupMarkerRef.current.setMap(null);
      pickupMarkerRef.current = null;
    }

    if (dropoffMarkerRef.current) {
      dropoffMarkerRef.current.setMap(null);
      dropoffMarkerRef.current = null;
    }

    const bounds = new google.maps.LatLngBounds();

    // Add pickup marker if location exists
    if (selectedPickupLocation && selectedPickupLocation.coordinates) {
      const pickupMarker = googleMapsService.createMarker(
        {
          lat: selectedPickupLocation.coordinates.lat,
          lng: selectedPickupLocation.coordinates.lng,
        },
        {
          map: mapRef.current,
          icon: {
            url:
              "data:image/svg+xml;charset=UTF-8," +
              encodeURIComponent(`
              <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="18" fill="#2ecc71" stroke="white" stroke-width="2"/>
                <text x="20" y="25" text-anchor="middle" fill="white" font-size="16" font-weight="bold">🚗</text>
              </svg>
            `),
            scaledSize: new google.maps.Size(40, 40),
            anchor: new google.maps.Point(20, 20),
          },
          title: `Pickup: ${selectedPickupLocation.name}`,
        }
      );

      pickupMarkerRef.current = pickupMarker;
      bounds.extend({
        lat: selectedPickupLocation.coordinates.lat,
        lng: selectedPickupLocation.coordinates.lng,
      });
    }

    // Add dropoff marker if location exists
    if (selectedDropoffLocation && selectedDropoffLocation.coordinates) {
      const dropoffMarker = googleMapsService.createMarker(
        {
          lat: selectedDropoffLocation.coordinates.lat,
          lng: selectedDropoffLocation.coordinates.lng,
        },
        {
          map: mapRef.current,
          icon: {
            url:
              "data:image/svg+xml;charset=UTF-8," +
              encodeURIComponent(`
              <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="18" fill="#e74c3c" stroke="white" stroke-width="2"/>
                <text x="20" y="25" text-anchor="middle" fill="white" font-size="16" font-weight="bold">📍</text>
              </svg>
            `),
            scaledSize: new google.maps.Size(40, 40),
            anchor: new google.maps.Point(20, 20),
          },
          title: `Dropoff: ${selectedDropoffLocation.name}`,
        }
      );

      dropoffMarkerRef.current = dropoffMarker;
      bounds.extend({
        lat: selectedDropoffLocation.coordinates.lat,
        lng: selectedDropoffLocation.coordinates.lng,
      });
    }

    // Fit map bounds to include both markers if they exist
    if (!bounds.isEmpty()) {
      mapRef.current.fitBounds(bounds, 50); // 50px padding
    }
  };

  // Update route
  const updateRoute = async () => {
    if (
      !mapRef.current ||
      !directionsRenderer.current ||
      !googleMapsService.isReady()
    )
      return;

    if (
      !selectedPickupLocation ||
      !selectedDropoffLocation ||
      !selectedPickupLocation.coordinates ||
      !selectedDropoffLocation.coordinates
    ) {
      return;
    }

    try {
      const directionsResult = await googleMapsService.getDirections(
        {
          lat: selectedPickupLocation.coordinates.lat,
          lng: selectedPickupLocation.coordinates.lng,
        },
        {
          lat: selectedDropoffLocation.coordinates.lat,
          lng: selectedDropoffLocation.coordinates.lng,
        }
      );

      if (directionsResult) {
        directionsRenderer.current.setDirections(directionsResult);
      } else {
        // Clear directions if no route found
        directionsRenderer.current.setDirections({ routes: [] } as any);
      }
    } catch (error) {
      console.error("Error updating route:", error);
      // Clear directions on error
      if (directionsRenderer.current) {
        directionsRenderer.current.setDirections({ routes: [] } as any);
      }
    }
  };

  // Handle pickup location selection
  const handlePickupLocationSelect = (location: Location) => {
    setSelectedPickupLocation(location);
    setPickup(location.name);
  };

  // Handle dropoff location selection
  const handleDropoffLocationSelect = (location: Location) => {
    setSelectedDropoffLocation(location);
    setDropoff(location.name);
  };

  // Update markers and route when locations change
  useEffect(() => {
    if (mapLoaded) {
      updateMapMarkers();
      updateRoute();
    }
  }, [selectedPickupLocation, selectedDropoffLocation, mapLoaded]);

  // Add a function to get average pricing for a taxi type
  const getAveragePricingForTaxiType = (taxiTypeId: string) => {
    // Filter vehicles by the selected taxi type
    const vehiclesForTaxiType = vehicles.filter(
      (v) => v.taxiTypeId === taxiTypeId
    );

    if (vehiclesForTaxiType.length === 0) {
      // Fallback if no vehicles found for this taxi type
      return {
        basePrice: 20,
        perKmPrice: 2.0,
        perMinutePrice: 0.3,
      };
    }

    // Calculate average pricing
    const totalBasePrice = vehiclesForTaxiType.reduce(
      (sum, v) => sum + v.basePrice,
      0
    );
    const totalPerKmPrice = vehiclesForTaxiType.reduce(
      (sum, v) => sum + v.perKmPrice,
      0
    );
    const totalPerMinutePrice = vehiclesForTaxiType.reduce(
      (sum, v) => sum + v.perMinutePrice,
      0
    );

    return {
      basePrice: totalBasePrice / vehiclesForTaxiType.length,
      perKmPrice: totalPerKmPrice / vehiclesForTaxiType.length,
      perMinutePrice: totalPerMinutePrice / vehiclesForTaxiType.length,
    };
  };

  // Add a function to check if a point is in a zone (for geofencing)
  const isPointInZone = (lat: number, lng: number, zone: any) => {
    // This is a simplified check - in a real app, you would use a proper geofencing algorithm
    // Assuming zone has boundaries defined as simple box with min/max lat/lng
    if (zone.boundaries) {
      const { minLat, maxLat, minLng, maxLng } = zone.boundaries;
      return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
    }
    return false;
  };

  // Add a function to get zone surcharge based on pickup and dropoff locations
  const getZoneSurcharge = (
    pickupLat: number,
    pickupLng: number,
    dropoffLat: number,
    dropoffLng: number
  ) => {
    let surcharge = 1.0; // Default, no surcharge

    // Find pickup zone
    const pickupZone = zones.find((zone) =>
      isPointInZone(pickupLat, pickupLng, zone)
    );

    // Find dropoff zone
    const dropoffZone = zones.find((zone) =>
      isPointInZone(dropoffLat, dropoffLng, zone)
    );

    // Apply zone specific surcharges
    if (pickupZone && pickupZone.surcharge) {
      surcharge *= pickupZone.surcharge;
    }

    if (dropoffZone && dropoffZone.surcharge) {
      surcharge *= dropoffZone.surcharge;
    }

    // Cross-zone surcharge (for trips that cross between zones)
    if (pickupZone && dropoffZone && pickupZone.id !== dropoffZone.id) {
      surcharge *= 1.1; // 10% surcharge for cross-zone trips
    }

    return surcharge;
  };

  // Calculate route and fare
  const calculateRoute = async () => {
    if (!selectedPickupLocation || !selectedDropoffLocation) {
      toast.error("Please enter both pickup and drop-off locations");
      return;
    }

    if (!token || !mapRef.current) {
      toast.error("Map services not available. Please try again later.");
      return;
    }

    if (
      !selectedPickupLocation.coordinates ||
      !selectedDropoffLocation.coordinates
    ) {
      toast.error("Invalid location coordinates");
      return;
    }

    if (!selectedVehicleType) {
      toast.error("Please select a vehicle type");
      return;
    }

    try {
      setIsCalculating(true);
      setFareEstimate(null);

      // Get directions from Google Maps
      const directionsResult = await googleMapsService.getDirections(
        {
          lat: selectedPickupLocation.coordinates.lat,
          lng: selectedPickupLocation.coordinates.lng,
        },
        {
          lat: selectedDropoffLocation.coordinates.lat,
          lng: selectedDropoffLocation.coordinates.lng,
        }
      );

      if (
        directionsResult &&
        directionsResult.routes &&
        directionsResult.routes.length > 0
      ) {
        const route = directionsResult.routes[0];
        const leg = route.legs[0];

        // Update route on map
        if (directionsRenderer.current) {
          directionsRenderer.current.setDirections(directionsResult);
        }
        updateMapMarkers();

        // Extract distance and duration
        const distanceText = leg.distance?.text || "0 km";
        const durationText = leg.duration?.text || "0 min";

        // Convert to numeric values for calculations
        const distanceKm = parseFloat(
          distanceText.replace(" km", "").replace(",", "")
        );
        const durationMinutes = parseInt(
          durationText
            .replace(" min", "")
            .replace(" hour", "60")
            .replace(" hours", "60")
        );

        setRouteDetails({
          distance: distanceText,
          duration: durationText,
        });

        // Get average pricing for selected taxi type
        const averagePricing =
          getAveragePricingForTaxiType(selectedVehicleType);

        // Check if we're in peak hours (7-9 AM or 5-7 PM on weekdays)
        const now = new Date();
        const hour = now.getHours();
        const isWeekday = now.getDay() >= 1 && now.getDay() <= 5; // Monday to Friday
        const isPeakHour =
          isWeekday && ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19));

        // Apply surge pricing during peak hours
        const surgeMultiplier = isPeakHour ? 1.2 : 1.0;

        // Get geofencing zone surcharge
        const zoneSurcharge = getZoneSurcharge(
          selectedPickupLocation.coordinates.lat,
          selectedPickupLocation.coordinates.lng,
          selectedDropoffLocation.coordinates.lat,
          selectedDropoffLocation.coordinates.lng
        );

        // Calculate base fare
        let baseFare = averagePricing.basePrice;

        // Calculate distance fare
        let distanceFare = distanceKm * averagePricing.perKmPrice;

        // Calculate time fare
        let timeFare = durationMinutes * averagePricing.perMinutePrice;

        // Calculate total fare before multipliers
        let totalFare = baseFare + distanceFare + timeFare;

        // Apply multipliers
        totalFare *= surgeMultiplier; // Peak hour surge
        totalFare *= zoneSurcharge; // Zone-based surcharge

        // Apply minimum fare if needed (assuming 20 AED minimum fare)
        const minFare = 20;
        if (totalFare < minFare) {
          totalFare = minFare;
        }

        // Round to nearest whole number for simpler display
        const roundedFare = Math.round(totalFare);

        setFareEstimate({
          distance: distanceKm,
          duration: durationMinutes * 60, // Convert to seconds for consistency
          price: roundedFare,
          currency: "AED",
          breakdown: {
            baseFare: baseFare,
            distanceFare: distanceFare,
            timeFare: timeFare,
            surgeMultiplier: surgeMultiplier,
            zoneSurcharge: zoneSurcharge,
          },
        });
      } else {
        toast.error("No route found between these locations");
      }
    } catch (error) {
      console.error("Error calculating route:", error);
      toast.error("Failed to calculate route. Please try again.");
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <section className="py-16 relative overflow-hidden bg-white text-gray-800">
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-fleet-red">Fare</span> Estimator
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Get an instant estimate for your premium chauffeur ride
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Map Section - Takes 3/5 of the width on large screens */}
          <div
            className="lg:col-span-3 order-2 lg:order-1 bg-gray-100 rounded-xl overflow-hidden shadow-md"
            style={{ height: "500px" }}
          >
            <div className="w-full h-full">
              {mapError ? (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="h-12 w-12 text-red-400 mx-auto mb-2" />
                    <p className="text-gray-600">Map Error</p>
                    <p className="text-sm text-gray-500">{mapError}</p>
                  </div>
                </div>
              ) : (
                <div
                  ref={mapContainerRef}
                  className="w-full h-full rounded-xl"
                  style={{ minHeight: "500px" }}
                />
              )}
            </div>
          </div>

          {/* Fare Calculator Section - Takes 2/5 of the width on large screens */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <Card className="p-6 bg-white border border-gray-200 text-gray-800 shadow-lg">
              <div className="mb-4">
                <h3 className="text-xl font-bold flex items-center">
                  <span className="bg-fleet-red/10 w-8 h-8 rounded-full flex items-center justify-center mr-3">
                    <MapPin className="h-4 w-4 text-fleet-red" />
                  </span>
                  Plan Your Journey
                </h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="pickup"
                    className="text-sm font-medium text-gray-700 block"
                  >
                    Pickup Location
                  </Label>
                  <LocationSelector
                    id="pickup"
                    label=""
                    value={pickup}
                    onChange={(value) => setPickup(value)}
                    onLocationSelect={handlePickupLocationSelect}
                    placeholder="Enter pickup address"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="dropoff"
                    className="text-sm font-medium text-gray-700 block"
                  >
                    Drop-off Location
                  </Label>
                  <LocationSelector
                    id="dropoff"
                    label=""
                    value={dropoff}
                    onChange={(value) => setDropoff(value)}
                    onLocationSelect={handleDropoffLocationSelect}
                    placeholder="Enter destination address"
                  />
                </div>

                {/* Vehicle Type Selector */}
                <div className="py-2">
                  <Label className="text-sm font-medium mb-3 block text-gray-700">
                    Select Vehicle Type:
                  </Label>
                  {isLoadingVehicles ? (
                    <div className="animate-pulse h-16 bg-gray-100 rounded-lg"></div>
                  ) : (
                    <RadioGroup
                      value={selectedVehicleType}
                      onValueChange={setSelectedVehicleType}
                      className="grid grid-cols-2 gap-3"
                    >
                      {taxiTypes.length > 0 ? (
                        taxiTypes.map((taxiType) => (
                          <div key={taxiType.id} className="col-span-1">
                            <label
                              htmlFor={`vehicle-${taxiType.id}`}
                              className={`flex flex-col items-center p-3 rounded-lg cursor-pointer transition-all border ${
                                selectedVehicleType === taxiType.id
                                  ? "bg-fleet-red/10 border-fleet-red text-gray-800"
                                  : "bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700"
                              }`}
                            >
                              <RadioGroupItem
                                value={taxiType.id}
                                id={`vehicle-${taxiType.id}`}
                                className="sr-only"
                              />
                              <div
                                className="text-2xl mb-1"
                                dangerouslySetInnerHTML={{
                                  __html: taxiType.emoji,
                                }}
                              ></div>
                              <div className="font-medium text-sm">
                                {taxiType.name}
                              </div>
                            </label>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-2 text-center text-gray-500 py-4">
                          No vehicle types available
                        </div>
                      )}
                    </RadioGroup>
                  )}
                </div>

                <Button
                  onClick={calculateRoute}
                  disabled={isCalculating || !pickup || !dropoff}
                  className="w-full bg-fleet-red hover:bg-red-600 text-white border-none h-12 rounded-lg mt-4"
                >
                  {isCalculating ? (
                    <>
                      <span className="animate-spin mr-2">◌</span>{" "}
                      Calculating...
                    </>
                  ) : (
                    <>
                      Calculate Fare <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {fareEstimate && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 rounded-xl overflow-hidden shadow-lg"
              >
                <div className="bg-fleet-red p-4 text-center text-white">
                  <h4 className="font-bold text-lg">Estimated Fare</h4>
                  <div className="text-3xl font-bold mt-1">
                    {fareEstimate.currency} {fareEstimate.price.toFixed(2)}
                  </div>
                </div>

                <div className="bg-white p-5 border border-gray-200 max-h-[400px] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center">
                      <Car className="h-4 w-4 text-fleet-red mr-2" />
                      <div>
                        <div className="text-xs text-gray-500">Distance</div>
                        <div className="font-medium text-gray-800">
                          {routeDetails?.distance}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-fleet-red mr-2" />
                      <div>
                        <div className="text-xs text-gray-500">Duration</div>
                        <div className="font-medium text-gray-800">
                          {routeDetails?.duration}
                        </div>
                      </div>
                    </div>
                  </div>

                  {fareEstimate.breakdown && (
                    <div className="mt-4 pt-3 border-t border-gray-200">
                      <h5 className="text-sm font-medium mb-2 text-gray-800">
                        Fare Breakdown
                      </h5>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Base Fare</span>
                          <span className="text-gray-800">
                            {fareEstimate.currency}{" "}
                            {fareEstimate.breakdown.baseFare.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            Distance ({routeDetails?.distance})
                          </span>
                          <span className="text-gray-800">
                            {fareEstimate.currency}{" "}
                            {fareEstimate.breakdown.distanceFare.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            Time ({routeDetails?.duration})
                          </span>
                          <span className="text-gray-800">
                            {fareEstimate.currency}{" "}
                            {fareEstimate.breakdown.timeFare.toFixed(2)}
                          </span>
                        </div>

                        {fareEstimate.breakdown.surgeMultiplier > 1 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">
                              Peak Hour Surge (x
                              {fareEstimate.breakdown.surgeMultiplier})
                            </span>
                            <span className="text-gray-800">
                              +{fareEstimate.currency}{" "}
                              {(
                                (fareEstimate.breakdown.baseFare +
                                  fareEstimate.breakdown.distanceFare +
                                  fareEstimate.breakdown.timeFare) *
                                (fareEstimate.breakdown.surgeMultiplier - 1)
                              ).toFixed(2)}
                            </span>
                          </div>
                        )}

                        {fareEstimate.breakdown.zoneSurcharge > 1 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">
                              Zone Surcharge (x
                              {fareEstimate.breakdown.zoneSurcharge.toFixed(2)})
                            </span>
                            <span className="text-gray-800">
                              +{fareEstimate.currency}{" "}
                              {(
                                (fareEstimate.breakdown.baseFare +
                                  fareEstimate.breakdown.distanceFare +
                                  fareEstimate.breakdown.timeFare) *
                                fareEstimate.breakdown.surgeMultiplier *
                                (fareEstimate.breakdown.zoneSurcharge - 1)
                              ).toFixed(2)}
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between pt-2 border-t border-gray-200 font-medium">
                          <span className="text-gray-800">Total Fare</span>
                          <span className="text-gray-800">
                            {fareEstimate.currency}{" "}
                            {fareEstimate.price.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 text-center text-xs text-gray-500 italic">
                    This is an estimated price. Actual fare may vary based on
                    traffic, waiting time, and other factors.
                  </div>

                  <div className="flex justify-center mt-4">
                    <Button className="bg-fleet-red text-white hover:bg-fleet-red/90 w-full flex items-center justify-center">
                      <CreditCard className="mr-2 h-4 w-4" />
                      Book Now
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SimpleMapSection;
