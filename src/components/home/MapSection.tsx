import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { MapPin, Clock, Car, CheckCircle2, ArrowRight, CreditCard, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import MapboxMap from '@/components/MapboxMap';
import mapService from '@/services/mapService';
import useMapboxToken from '@/hooks/useMapboxToken';
import { firestore } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { LocationSelector } from '@/components/home/booking-form';
import type { Location, Vehicle } from '@/components/home/booking-form/types';

// Define vehicle types and pricing
const vehicleOptions = [
  {
    id: 'economy',
    name: 'Economy',
    icon: '🚗',
    basePrice: 10,
    perKmPrice: 1.5,
    minFare: 15,
    description: 'Affordable ride for everyday use'
  },
  {
    id: 'comfort',
    name: 'Comfort',
    icon: '🚕',
    basePrice: 15,
    perKmPrice: 2.0,
    minFare: 20,
    description: 'More spacious with amenities'
  },
  {
    id: 'suv',
    name: 'SUV',
    icon: '🚙',
    basePrice: 20,
    perKmPrice: 2.5,
    minFare: 25,
    description: 'Larger vehicle for groups'
  },
  {
    id: 'premium',
    name: 'Premium',
    icon: '🏎️',
    basePrice: 30,
    perKmPrice: 3.5,
    minFare: 40,
    description: 'Luxury vehicles with premium service'
  }
];

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

const MapSection = () => {
  // Location state
  const [selectedPickupLocation, setSelectedPickupLocation] = useState<Location | undefined>(undefined);
  const [selectedDropoffLocation, setSelectedDropoffLocation] = useState<Location | undefined>(undefined);
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  
  // Vehicle state
  const [selectedVehicleType, setSelectedVehicleType] = useState('');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [taxiTypes, setTaxiTypes] = useState<any[]>([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);
  
  // Map state
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const pickupMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const dropoffMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const routeLayerAdded = useRef<boolean>(false);
  
  // Fare calculation state
  const [fareEstimate, setFareEstimate] = useState<FareEstimate | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [routeDetails, setRouteDetails] = useState<{
    distance: string;
    duration: string;
  } | null>(null);

  // Token initialization
  const { token } = useMapboxToken();

  // Add state for geofencing zones
  const [zones, setZones] = useState<any[]>([]);

  // Fetch taxi types and vehicles from Firebase on component mount
  useEffect(() => {
    fetchTaxiTypes();
    fetchZones();
  }, []);

  // Fetch taxi types from Firebase
  const fetchTaxiTypes = async () => {
    try {
      setIsLoadingVehicles(true);
      const taxiTypesRef = collection(firestore, 'taxiTypes');
      const taxiTypesSnapshot = await getDocs(taxiTypesRef);
      
      const taxiTypesData: any[] = [];
      taxiTypesSnapshot.forEach((doc) => {
        taxiTypesData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setTaxiTypes(taxiTypesData);
      
      if (taxiTypesData.length > 0) {
        // Set the first taxi type as default selected
        setSelectedVehicleType(taxiTypesData[0].id);
        // Fetch vehicles based on selected taxi type
        await fetchVehicles();
      }
    } catch (error) {
      console.error('Error fetching taxi types:', error);
      toast.error('Failed to load taxi type data');
      setIsLoadingVehicles(false);
    }
  };

  // Fetch vehicles from Firebase
  const fetchVehicles = async () => {
    try {
      setIsLoadingVehicles(true);
      const vehiclesRef = collection(firestore, 'vehicles');
      const vehiclesSnapshot = await getDocs(vehiclesRef);
      
      const vehicleData: Vehicle[] = [];
      vehiclesSnapshot.forEach((doc) => {
        vehicleData.push({
          id: doc.id,
          ...doc.data()
        } as Vehicle);
      });
      
      // If no vehicles were found in Firebase, use fallback data for testing
      if (vehicleData.length === 0) {
        const fallbackVehicles: Vehicle[] = [
          {
            id: 'economy-car',
            taxiTypeId: 'economy',
            name: 'Economy',
            description: 'Affordable ride for everyday use',
            basePrice: 10,
            perKmPrice: 1.5,
            perMinutePrice: 0.2,
            capacity: 4,
            images: []
          },
          {
            id: 'comfort-car',
            taxiTypeId: 'comfort',
            name: 'Comfort',
            description: 'More spacious with amenities',
            basePrice: 15,
            perKmPrice: 2.0,
            perMinutePrice: 0.25,
            capacity: 4,
            images: []
          },
          {
            id: 'suv-car',
            taxiTypeId: 'suv',
            name: 'SUV',
            description: 'Larger vehicle for groups',
            basePrice: 20,
            perKmPrice: 2.5,
            perMinutePrice: 0.3,
            capacity: 6,
            images: []
          },
          {
            id: 'premium-car',
            taxiTypeId: 'premium',
            name: 'Premium',
            description: 'Luxury vehicles with premium service',
            basePrice: 30,
            perKmPrice: 3.5,
            perMinutePrice: 0.4,
            capacity: 4,
            images: []
          }
        ];
        setVehicles(fallbackVehicles);
      } else {
        setVehicles(vehicleData);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      toast.error('Failed to load vehicle data');
      
      // Use fallback data if Firebase fetch fails
      const fallbackVehicles: Vehicle[] = [
        {
          id: 'economy-car',
          taxiTypeId: 'economy',
          name: 'Economy',
          description: 'Affordable ride for everyday use',
          basePrice: 10,
          perKmPrice: 1.5,
          perMinutePrice: 0.2,
          capacity: 4,
          images: []
        },
        {
          id: 'comfort-car',
          taxiTypeId: 'comfort',
          name: 'Comfort',
          description: 'More spacious with amenities',
          basePrice: 15,
          perKmPrice: 2.0,
          perMinutePrice: 0.25,
          capacity: 4,
          images: []
        },
        {
          id: 'suv-car',
          taxiTypeId: 'suv',
          name: 'SUV',
          description: 'Larger vehicle for groups',
          basePrice: 20,
          perKmPrice: 2.5,
          perMinutePrice: 0.3,
          capacity: 6,
          images: []
        },
        {
          id: 'premium-car',
          taxiTypeId: 'premium',
          name: 'Premium',
          description: 'Luxury vehicles with premium service',
          basePrice: 30,
          perKmPrice: 3.5,
          perMinutePrice: 0.4,
          capacity: 4,
          images: []
        }
      ];
      setVehicles(fallbackVehicles);
    } finally {
      setIsLoadingVehicles(false);
    }
  };

  // Add a function to fetch geofencing zones
  const fetchZones = async () => {
    try {
      const zonesRef = collection(firestore, 'zones');
      const zonesSnapshot = await getDocs(zonesRef);
      
      const zonesData: any[] = [];
      zonesSnapshot.forEach((doc) => {
        zonesData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setZones(zonesData);
    } catch (error) {
      console.error('Error fetching zones:', error);
    }
  };

  // Handle map load
  const handleMapLoaded = (map: mapboxgl.Map) => {
    console.log('Map loaded successfully in MapSection');
    mapRef.current = map;
    
    // Add source and layer for the route
    map.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: []
        }
      }
    });
    
    map.addLayer({
      id: 'route',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#e42240', // fleet-red
        'line-width': 6
      }
    });
    
    routeLayerAdded.current = true;

    // Force resize to ensure map renders properly
    setTimeout(() => {
      if (mapRef.current) {
        console.log('Resizing map to ensure visibility');
        mapRef.current.resize();
      }
    }, 100);
  };

  // Update markers on the map
  const updateMapMarkers = () => {
    if (!mapRef.current) return;
    
    // Remove existing markers
    if (pickupMarkerRef.current) {
      pickupMarkerRef.current.remove();
      pickupMarkerRef.current = null;
    }
    
    if (dropoffMarkerRef.current) {
      dropoffMarkerRef.current.remove();
      dropoffMarkerRef.current = null;
    }
    
    // Add pickup marker if location exists
    if (selectedPickupLocation && selectedPickupLocation.coordinates) {
      const el = document.createElement('div');
      el.className = 'marker pickup-marker';
      el.style.backgroundColor = '#2ecc71';
      el.style.width = '20px';
      el.style.height = '20px';
      el.style.borderRadius = '50%';
      el.style.border = '2px solid white';
      el.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.3)';
      
      pickupMarkerRef.current = new mapboxgl.Marker(el)
        .setLngLat([selectedPickupLocation.coordinates.lng, selectedPickupLocation.coordinates.lat])
        .addTo(mapRef.current);
    }
    
    // Add dropoff marker if location exists
    if (selectedDropoffLocation && selectedDropoffLocation.coordinates) {
      const el = document.createElement('div');
      el.className = 'marker dropoff-marker';
      el.style.backgroundColor = '#e74c3c';
      el.style.width = '20px';
      el.style.height = '20px';
      el.style.borderRadius = '50%';
      el.style.border = '2px solid white';
      el.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.3)';
      
      dropoffMarkerRef.current = new mapboxgl.Marker(el)
        .setLngLat([selectedDropoffLocation.coordinates.lng, selectedDropoffLocation.coordinates.lat])
        .addTo(mapRef.current);
    }
    
    // Fit map bounds to include both markers if they exist
    if (selectedPickupLocation && selectedDropoffLocation && 
        selectedPickupLocation.coordinates && 
        selectedDropoffLocation.coordinates && 
        mapRef.current) {
      const bounds = new mapboxgl.LngLatBounds()
        .extend([selectedPickupLocation.coordinates.lng, selectedPickupLocation.coordinates.lat])
        .extend([selectedDropoffLocation.coordinates.lng, selectedDropoffLocation.coordinates.lat]);
      
      mapRef.current.fitBounds(bounds, {
        padding: { top: 50, bottom: 50, left: 50, right: 50 },
        maxZoom: 15
      });
    }
  };

  // Update route on the map
  const updateRoute = (coordinates: [number, number][]) => {
    if (!mapRef.current || !routeLayerAdded.current) return;
    
    const source = mapRef.current.getSource('route') as mapboxgl.GeoJSONSource;
    
    if (source) {
      source.setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates
        }
      });
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

  // Add a function to get average pricing for a taxi type
  const getAveragePricingForTaxiType = (taxiTypeId: string) => {
    // Filter vehicles by the selected taxi type
    const vehiclesForTaxiType = vehicles.filter(v => v.taxiTypeId === taxiTypeId);
    
    if (vehiclesForTaxiType.length === 0) {
      // Fallback if no vehicles found for this taxi type
      return {
        basePrice: 20,
        perKmPrice: 2.0,
        perMinutePrice: 0.3
      };
    }
    
    // Calculate average pricing
    const totalBasePrice = vehiclesForTaxiType.reduce((sum, v) => sum + v.basePrice, 0);
    const totalPerKmPrice = vehiclesForTaxiType.reduce((sum, v) => sum + v.perKmPrice, 0);
    const totalPerMinutePrice = vehiclesForTaxiType.reduce((sum, v) => sum + v.perMinutePrice, 0);
    
    return {
      basePrice: totalBasePrice / vehiclesForTaxiType.length,
      perKmPrice: totalPerKmPrice / vehiclesForTaxiType.length,
      perMinutePrice: totalPerMinutePrice / vehiclesForTaxiType.length
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
  const getZoneSurcharge = (pickupLat: number, pickupLng: number, dropoffLat: number, dropoffLng: number) => {
    let surcharge = 1.0; // Default, no surcharge
    
    // Find pickup zone
    const pickupZone = zones.find(zone => isPointInZone(pickupLat, pickupLng, zone));
    
    // Find dropoff zone
    const dropoffZone = zones.find(zone => isPointInZone(dropoffLat, dropoffLng, zone));
    
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

  // Update the calculateRoute function to use average pricing and geofencing
  const calculateRoute = async () => {
    if (!selectedPickupLocation || !selectedDropoffLocation) {
      toast.error('Please enter both pickup and drop-off locations');
      return;
    }

    if (!token || !mapRef.current) {
      toast.error('Map services not available. Please try again later.');
      return;
    }
    
    if (!selectedPickupLocation.coordinates || !selectedDropoffLocation.coordinates) {
      toast.error('Invalid location coordinates');
      return;
    }
    
    if (!selectedVehicleType) {
      toast.error('Please select a vehicle type');
      return;
    }
    
    try {
      setIsCalculating(true);
      setFareEstimate(null);
      
      // Get directions from Mapbox
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/` +
        `${selectedPickupLocation.coordinates.lng},${selectedPickupLocation.coordinates.lat};` +
        `${selectedDropoffLocation.coordinates.lng},${selectedDropoffLocation.coordinates.lat}?` +
        `alternatives=false&` +
        `geometries=geojson&` +
        `overview=full&` +
        `steps=false&` +
        `access_token=${token}`
      );
      
      if (!response.ok) throw new Error('Directions request failed');
      
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        
        // Update route on map
        updateRoute(route.geometry.coordinates);
        updateMapMarkers();
        
        // Convert meters to kilometers and seconds to minutes
        const distanceKm = route.distance / 1000;
        const durationMinutes = Math.round(route.duration / 60);
        
        setRouteDetails({
          distance: `${distanceKm.toFixed(1)} km`,
          duration: `${durationMinutes} min`
        });
        
        // Get average pricing for selected taxi type
        const averagePricing = getAveragePricingForTaxiType(selectedVehicleType);
        
        // Check if we're in peak hours (7-9 AM or 5-7 PM on weekdays)
        const now = new Date();
        const hour = now.getHours();
        const isWeekday = now.getDay() >= 1 && now.getDay() <= 5; // Monday to Friday
        const isPeakHour = isWeekday && ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19));
        
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
          duration: route.duration,
          price: roundedFare,
          currency: 'AED',
          breakdown: {
            baseFare: baseFare,
            distanceFare: distanceFare,
            timeFare: timeFare,
            surgeMultiplier: surgeMultiplier,
            zoneSurcharge: zoneSurcharge
          }
        });
      } else {
        toast.error('No route found between these locations');
      }
    } catch (error) {
      console.error('Error calculating route:', error);
      toast.error('Failed to calculate route. Please try again.');
    } finally {
      setIsCalculating(false);
    }
  };

  // Update markers when locations change
  useEffect(() => {
    if (mapRef.current && (selectedPickupLocation || selectedDropoffLocation)) {
      updateMapMarkers();
    }
  }, [selectedPickupLocation, selectedDropoffLocation]);

  // Get taxi type emoji
  const getTaxiTypeEmoji = (taxiTypeId: string) => {
    const taxiType = taxiTypes.find(t => t.id === taxiTypeId);
    return taxiType?.emoji || '🚗';
  };

  // Get taxi type name
  const getTaxiTypeName = (taxiTypeId: string) => {
    const taxiType = taxiTypes.find(t => t.id === taxiTypeId);
    return taxiType?.name || 'Vehicle';
  };

  return (
    <section className="py-16 relative overflow-hidden bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('/assets/pattern-bg.png')] bg-repeat"></div>
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
          <p className="text-gray-300 max-w-2xl mx-auto">
            Get an instant estimate for your premium chauffeur ride
          </p>
        </motion.div>
        
        <div className="grid lg:grid-cols-5 gap-6 min-h-[600px]">
          {/* Map Section - Takes 3/5 of the width on large screens */}
          <div className="lg:col-span-3 order-2 lg:order-1 rounded-xl overflow-hidden shadow-xl" style={{ height: '600px', minHeight: '600px' }}>
            <MapboxMap 
              height="100%"
              width="100%"
              onMapLoaded={handleMapLoaded}
              initialZoom={11}
            />
          </div>
          
          {/* Fare Calculator Section - Takes 2/5 of the width on large screens */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <Card className="p-6 bg-white/10 backdrop-blur-lg border-white/20 text-white shadow-xl" style={{ minHeight: '600px' }}>
              <div className="mb-4">
                <h3 className="text-xl font-bold flex items-center">
                  <span className="bg-fleet-red/20 w-8 h-8 rounded-full flex items-center justify-center mr-3">
                    <MapPin className="h-4 w-4 text-fleet-red" />
                  </span>
                  Plan Your Journey
                </h3>
              </div>
              
              <div className="space-y-5 mt-2">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="pickup" className="text-sm font-medium text-gray-300 block">
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
                  
                  <div className="flex justify-center">
                    <div className="w-0.5 h-6 bg-gray-600"></div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dropoff" className="text-sm font-medium text-gray-300 block">
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
                  </div>
                  
                <div className="py-3">
                  <Label className="text-sm font-medium mb-3 block text-gray-300">Select Vehicle Type:</Label>
                  {isLoadingVehicles ? (
                    <div className="animate-pulse h-16 bg-white/5 rounded-lg"></div>
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
                                  ? 'bg-fleet-red/20 border-fleet-red/50' 
                                  : 'bg-white/5 border-white/10 hover:bg-white/10'
                              }`}
                            >
                              <RadioGroupItem 
                                value={taxiType.id} 
                                id={`vehicle-${taxiType.id}`}
                                className="sr-only"
                              />
                              <div className="text-2xl mb-1" dangerouslySetInnerHTML={{__html: taxiType.emoji}}></div>
                              <div className="font-medium text-sm">{taxiType.name}</div>
                            </label>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-2 text-center text-gray-400 py-4">
                          No vehicle types available
                        </div>
                      )}
                    </RadioGroup>
                  )}
                </div>
                
                <Button 
                  onClick={calculateRoute}
                  disabled={isCalculating || !pickup || !dropoff}
                  className="w-full bg-fleet-red hover:bg-red-600 text-white border-none h-12 rounded-lg mt-2"
                >
                  {isCalculating ? (
                    <><span className="animate-spin mr-2">◌</span> Calculating...</>
                  ) : (
                    <>Calculate Fare <ArrowRight className="ml-2 h-4 w-4" /></>
                  )}
                  </Button>
              </div>
            </Card>
            
            {fareEstimate && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 rounded-xl overflow-hidden"
              >
                <div className="bg-fleet-red p-4 text-center">
                  <h4 className="font-bold text-lg">Estimated Fare</h4>
                  <div className="text-3xl font-bold mt-1">
                    {fareEstimate.currency} {fareEstimate.price.toFixed(2)}
                  </div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-lg p-5 border border-white/10 max-h-[400px] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center">
                      <Car className="h-4 w-4 text-fleet-red mr-2" />
                      <div>
                        <div className="text-xs text-gray-400">Distance</div>
                        <div className="font-medium">{routeDetails?.distance}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-fleet-red mr-2" />
                      <div>
                        <div className="text-xs text-gray-400">Duration</div>
                        <div className="font-medium">{routeDetails?.duration}</div>
                      </div>
                    </div>
                  </div>
                  
                  {fareEstimate.breakdown && (
                    <div className="mt-4 pt-3 border-t border-gray-700">
                      <h5 className="text-sm font-medium mb-2">Fare Breakdown</h5>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Base Fare</span>
                          <span>{fareEstimate.currency} {fareEstimate.breakdown.baseFare.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Distance ({routeDetails?.distance})</span>
                          <span>{fareEstimate.currency} {fareEstimate.breakdown.distanceFare.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Time ({routeDetails?.duration})</span>
                          <span>{fareEstimate.currency} {fareEstimate.breakdown.timeFare.toFixed(2)}</span>
                        </div>
                        
                        {fareEstimate.breakdown.surgeMultiplier > 1 && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Peak Hour Surge (x{fareEstimate.breakdown.surgeMultiplier})</span>
                            <span>+{fareEstimate.currency} {((fareEstimate.breakdown.baseFare + fareEstimate.breakdown.distanceFare + fareEstimate.breakdown.timeFare) * (fareEstimate.breakdown.surgeMultiplier - 1)).toFixed(2)}</span>
                          </div>
                        )}
                        
                        {fareEstimate.breakdown.zoneSurcharge > 1 && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Zone Surcharge (x{fareEstimate.breakdown.zoneSurcharge.toFixed(2)})</span>
                            <span>+{fareEstimate.currency} {((fareEstimate.breakdown.baseFare + fareEstimate.breakdown.distanceFare + fareEstimate.breakdown.timeFare) * fareEstimate.breakdown.surgeMultiplier * (fareEstimate.breakdown.zoneSurcharge - 1)).toFixed(2)}</span>
                          </div>
                        )}
                        
                        <div className="flex justify-between pt-2 border-t border-gray-700 font-medium">
                          <span>Total Fare</span>
                          <span>{fareEstimate.currency} {fareEstimate.price.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-center mt-4">
                    <Button
                      className="bg-white text-gray-900 hover:bg-gray-200 w-full flex items-center justify-center"
                      onClick={() => {
                        toast.success('Redirecting to booking page...');
                        // In a real app, this would redirect to the booking page
                      }}
                    >
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

export default MapSection;
