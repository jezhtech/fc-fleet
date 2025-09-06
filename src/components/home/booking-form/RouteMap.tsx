import React, { useState, useEffect, useRef } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { Location } from "@/types";
import { useGoogleMapsToken } from "@/hooks/useGoogleMapsToken";
import { googleMapsService } from "@/services/googleMapsService";

interface RouteMapProps {
  pickupLocation?: Location;
  dropoffLocation?: Location;
}

const RouteMap: React.FC<RouteMapProps> = ({
  pickupLocation,
  dropoffLocation,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const markers = useRef<{ [key: string]: google.maps.Marker }>({});
  const directionsRenderer = useRef<google.maps.DirectionsRenderer | null>(
    null,
  );
  const isMapReady = useRef(false);

  // Get token from the hook
  const { token, isInitialized, error: tokenError } = useGoogleMapsToken();

  // Handle token errors
  useEffect(() => {
    if (tokenError) {
      setError(`Google Maps token error: ${tokenError}`);
    }
  }, [tokenError]);

  // Get actual driving route using Google Directions API
  const getDirectionsRoute = async (pickup: Location, dropoff: Location) => {
    try {
      setRouteLoading(true);

      if (!googleMapsService.isReady()) {
        throw new Error("Google Maps not initialized");
      }

      const directionsResult = await googleMapsService.getDirections(
        { lat: pickup.coordinates.latitude, lng: pickup.coordinates.longitude },
        {
          lat: dropoff.coordinates.latitude,
          lng: dropoff.coordinates.longitude,
        },
      );

      if (directionsResult && directionsRenderer.current) {
        directionsRenderer.current.setDirections(directionsResult);
      } else {
        console.warn("No routes found between locations");
      }
    } catch (error) {
      console.error("Error fetching directions:", error);
      // Fallback to straight line if directions API fails
      fallbackToStraightLine(pickup, dropoff);
    } finally {
      setRouteLoading(false);
    }
  };

  // Fallback to straight line if directions API fails
  const fallbackToStraightLine = (pickup: Location, dropoff: Location) => {
    if (map.current && directionsRenderer.current) {
      // Clear existing directions
      directionsRenderer.current.setDirections({ routes: [] } as any);

      // Create a simple polyline between the two points
      new google.maps.Polyline({
        path: [
          {
            lat: pickup.coordinates.latitude,
            lng: pickup.coordinates.longitude,
          },
          {
            lat: dropoff.coordinates.latitude,
            lng: dropoff.coordinates.longitude,
          },
        ],
        geodesic: true,
        strokeColor: "#FF0000",
        strokeOpacity: 1.0,
        strokeWeight: 2,
        map: map.current,
      });
    }
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    if (!isInitialized || !token) {
      return;
    }

    const initializeMap = async () => {
      let loadingTimeout: NodeJS.Timeout;

      try {
        setLoading(true);

        // Set a timeout to prevent infinite loading
        loadingTimeout = setTimeout(() => {
          if (loading) {
            isMapReady.current = true;
            setLoading(false);
          }
        }, 10000); // 10 second timeout

        // Initialize Google Maps service

        await googleMapsService.initialize({ apiKey: token });

        // Create map using the service

        const newMap = await googleMapsService.createMap(
          mapContainer?.current,
          {
            center: { lat: 25.2048, lng: 55.2708 }, // Dubai center
            zoom: 10,
          },
        );

        map.current = newMap;

        // Initialize directions renderer
        directionsRenderer.current = new google.maps.DirectionsRenderer({
          map: newMap,
          suppressMarkers: true, // We'll add our own markers
          polylineOptions: {
            strokeColor: "#DC2626", // Red color to match fleet theme
            strokeWeight: 4,
            strokeOpacity: 0.8,
          },
        });

        // Add resize listener
        const handleResize = () => {
          if (map.current) {
            google.maps.event.trigger(map.current, "resize");
          }
        };

        window.addEventListener("resize", handleResize);

        // Wait for map tiles to load before setting ready
        newMap.addListener("tilesloaded", () => {
          clearTimeout(loadingTimeout);
          isMapReady.current = true;
          setLoading(false);
        });
      } catch (error) {
        clearTimeout(loadingTimeout);
        console.error("Google Route Map initialization error:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Unknown map initialization error",
        );
        setLoading(false);
      }
    };

    initializeMap();

    return () => {
      if (map.current) {
        // Clean up map instance
        google.maps.event.clearInstanceListeners(map.current);
      }
    };
  }, [token, isInitialized]);

  // Update map markers when locations change
  const updateMapMarkers = () => {
    if (!map.current || !isMapReady.current) return;

    // Clear existing markers
    Object.values(markers.current).forEach((marker) => marker.setMap(null));
    markers.current = {};

    // Clear existing directions
    if (directionsRenderer.current) {
      directionsRenderer.current.setDirections({ routes: [] } as any);
    }

    const bounds = new google.maps.LatLngBounds();

    // Add pickup marker
    if (pickupLocation) {
      const pickupMarker = googleMapsService.createMarker(
        {
          lat: pickupLocation.coordinates.latitude,
          lng: pickupLocation.coordinates.longitude,
        },
        {
          map: map.current,
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
            anchor: new google.maps.Point(20, 20),
          },
          title: `Pickup: ${pickupLocation.name}`,
        },
      );

      markers.current["pickup"] = pickupMarker;
      bounds.extend({
        lat: pickupLocation.coordinates.latitude,
        lng: pickupLocation.coordinates.longitude,
      });
    }

    // Add dropoff marker
    if (dropoffLocation) {
      const dropoffMarker = googleMapsService.createMarker(
        {
          lat: dropoffLocation.coordinates.latitude,
          lng: dropoffLocation.coordinates.longitude,
        },
        {
          map: map.current,
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
            anchor: new google.maps.Point(20, 20),
          },
          title: `Dropoff: ${dropoffLocation.name}`,
        },
      );

      markers.current["dropoff"] = dropoffMarker;
      bounds.extend({
        lat: dropoffLocation.coordinates.latitude,
        lng: dropoffLocation.coordinates.longitude,
      });
    }

    // Fit map to bounds if we have markers
    if (!bounds.isEmpty()) {
      map.current.fitBounds(bounds, 50); // 50px padding
    }

    // Get route if both locations are available
    if (pickupLocation && dropoffLocation) {
      getDirectionsRoute(pickupLocation, dropoffLocation);
    }
  };

  // Update markers when locations change
  useEffect(() => {
    if (isMapReady.current) {
      updateMapMarkers();
    }
  }, [pickupLocation, dropoffLocation, isMapReady.current]);

  // Ensure loading is false when map is ready
  useEffect(() => {
    if (isMapReady.current && loading) {
      setLoading(false);
    }
  }, [isMapReady.current, loading]);

  const handleReload = () => {
    setError(null);
    setLoading(true);
    isMapReady.current = false;

    // Clear existing map
    if (map.current) {
      google.maps.event.clearInstanceListeners(map.current);
      map.current = null;
    }

    // Clear markers
    Object.values(markers.current).forEach((marker) => marker.setMap(null));
    markers.current = {};

    // Clear directions renderer
    if (directionsRenderer.current) {
      directionsRenderer.current.setMap(null);
      directionsRenderer.current = null;
    }
  };

  if (error) {
    return (
      <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 text-red-600 mb-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">Map Error</span>
          </div>
          <p className="text-xs text-gray-600 mb-2">{error}</p>
          <button
            onClick={handleReload}
            className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-64 bg-gray-100 rounded-lg overflow-hidden relative">
      <div ref={mapContainer} className="w-full h-full" />
      {routeLoading && (
        <div className="absolute top-2 left-2 bg-white bg-opacity-90 rounded px-2 py-1">
          <div className="flex items-center space-x-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span className="text-xs">Calculating route...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteMap;
