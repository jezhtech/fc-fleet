import React, { useState, useEffect, useRef } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Location } from './types';
import mapService, { DEFAULT_CENTER } from '../../../services/mapService';
import useMapboxToken from '@/hooks/useMapboxToken';

interface RouteMapProps {
  pickupLocation?: Location;
  dropoffLocation?: Location;
}

const RouteMap: React.FC<RouteMapProps> = ({ pickupLocation, dropoffLocation }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const routeLine = useRef<mapboxgl.Layer | null>(null);
  const isMapReady = useRef(false);
  const [markersAdded, setMarkersAdded] = useState(false);
  
  // Get token from the hook
  const { token, isInitialized, error: tokenError } = useMapboxToken();
  
  // Set token in mapService when available
  useEffect(() => {
    if (token && isInitialized) {
      mapService.setToken(token);
    }
  }, [token, isInitialized]);
  
  // Handle token errors
  useEffect(() => {
    if (tokenError) {
      setError(`Mapbox token error: ${tokenError}`);
    }
  }, [tokenError]);

  // Create luxury car icon element for pickup marker
  const createLuxuryCarElement = () => {
    const el = document.createElement('div');
    el.className = 'luxury-car-marker';
    el.style.width = '40px';
    el.style.height = '40px';
    el.style.display = 'flex';
    el.style.justifyContent = 'center';
    el.style.alignItems = 'center';
    el.style.borderRadius = '50%';
    el.style.backgroundColor = 'white';
    el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
    el.style.fontSize = '22px'; // Make the emoji larger
    el.style.paddingBottom = '4px'; // Visual adjustment for emoji vertical alignment
    
    // Use car emoji instead of SVG
    el.textContent = '🚙';
    
    return el;
  };
  
  // Get actual driving route using Mapbox Directions API
  const getDirectionsRoute = async (pickup: Location, dropoff: Location) => {
    try {
      setRouteLoading(true);
      
      // Form the request URL for the Mapbox Directions API
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${pickup.longitude},${pickup.latitude};${dropoff.longitude},${dropoff.latitude}?geometries=geojson&overview=full&access_token=${token}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch route: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        
        // Update the route on the map
        if (map.current && map.current.getSource('route')) {
          (map.current.getSource('route') as mapboxgl.GeoJSONSource).setData({
            type: 'Feature',
            properties: {},
            geometry: route.geometry
          });
          
          // Get route distance and duration
          const distance = (route.distance / 1000).toFixed(1); // km
          const duration = Math.round(route.duration / 60); // minutes
          console.log(`Route: ${distance} km, ${duration} minutes`);
        }
      } else {
        console.warn('No routes found between locations');
      }
    } catch (error) {
      console.error('Error fetching directions:', error);
      // Fallback to straight line if directions API fails
      fallbackToStraightLine(pickup, dropoff);
    } finally {
      setRouteLoading(false);
    }
  };
  
  // Fallback to straight line if directions API fails
  const fallbackToStraightLine = (pickup: Location, dropoff: Location) => {
    if (map.current && map.current.getSource('route')) {
      (map.current.getSource('route') as mapboxgl.GeoJSONSource).setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: [
            [pickup.longitude, pickup.latitude],
            [dropoff.longitude, dropoff.latitude]
          ]
        }
      });
    }
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    if (!isInitialized || !token) {
      console.log('Waiting for Mapbox token to initialize...');
      return;
    }

    const initializeMap = async () => {
      try {
        // Ensure the token is set before creating the map
        mapService.setToken(token);
        
        // Wait for any preloading to complete
        await mapService.waitForInitialization();
        
        // Create map using the map service
        const newMap = await mapService.createMap(mapContainer.current);
        map.current = newMap;

        // Add minimal attribution control
        map.current.addControl(
          new mapboxgl.AttributionControl({ compact: true }),
          'bottom-right'
        );

        // Add navigation control with minimal options
        map.current.addControl(
          new mapboxgl.NavigationControl({ showCompass: false }),
          'top-right'
        );

        // Optimize initial load
        map.current.once('load', () => {
          setLoading(false);
          isMapReady.current = true;

          // Add route source and layer with optimized settings
          map.current?.addSource('route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: []
              }
            },
            maxzoom: 18,
            tolerance: 3,
            buffer: 0,
            lineMetrics: true,
          });

          map.current?.addLayer({
            id: 'route',
            type: 'line',
            source: 'route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round',
              visibility: 'visible',
            },
            paint: {
              'line-color': '#E53935', // Bright red color for the route
              'line-width': 6,
              'line-opacity': 0.9
            },
            minzoom: 1,
            maxzoom: 18,
          });
          
          // Update markers after map is ready
          updateMapMarkers();
        });

        // Add error handler
        map.current.on('error', (e) => {
          console.error('Mapbox error:', e.error);
          setError(`Map error: ${e.error?.message || 'Unknown error'}`);
        });

        // Optimize performance during map movement
        map.current.on('movestart', () => {
          if (map.current) {
            map.current.getCanvas().style.imageRendering = 'pixelated';
          }
        });

        map.current.on('moveend', () => {
          if (map.current) {
            map.current.getCanvas().style.imageRendering = 'auto';
          }
        });

        // Handle resize efficiently
        const handleResize = () => {
          if (map.current && isMapReady.current) {
            requestAnimationFrame(() => {
              map.current?.resize();
            });
          }
        };
        window.addEventListener('resize', handleResize);

        return () => {
          window.removeEventListener('resize', handleResize);
          if (map.current && isMapReady.current) {
            map.current.remove();
            map.current = null;
            isMapReady.current = false;
          }
        };
      } catch (err) {
        console.error('Error initializing Mapbox map:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize map');
        setLoading(false);
      }
    };

    initializeMap();
  }, [isInitialized, token]);

  // Function to update map markers
  const updateMapMarkers = () => {
    if (!map.current || !isMapReady.current) return;

    try {
      // Clear existing markers
      Object.values(markers.current).forEach(marker => marker.remove());
      markers.current = {};

      // Add new markers
      if (pickupLocation) {
        // Create a custom marker with car emoji for pickup
        const carElement = createLuxuryCarElement();
        markers.current.pickup = new mapboxgl.Marker({
          element: carElement,
          anchor: 'bottom',
          offset: [0, -10] // Adjusted offset for emoji positioning
        })
          .setLngLat([pickupLocation.longitude, pickupLocation.latitude])
          .addTo(map.current);
      }

      if (dropoffLocation) {
        // Red marker for dropoff location
        markers.current.dropoff = new mapboxgl.Marker({ 
          color: '#E53935', // Match the route color
          scale: 0.9 // Slightly smaller than default
        })
          .setLngLat([dropoffLocation.longitude, dropoffLocation.latitude])
          .addTo(map.current);
      }

      // Fit bounds to show both markers if they exist
      if (pickupLocation && dropoffLocation) {
        const bounds = new mapboxgl.LngLatBounds()
          .extend([pickupLocation.longitude, pickupLocation.latitude])
          .extend([dropoffLocation.longitude, dropoffLocation.latitude]);

        map.current.fitBounds(bounds, {
          padding: { top: 70, bottom: 70, left: 70, right: 70 },
          maxZoom: 15,
          duration: 1000 // Smooth animation
        });
        
        // Get and display actual driving route
        getDirectionsRoute(pickupLocation, dropoffLocation);
      }
      // Center on single marker if only one exists
      else if (pickupLocation) {
        map.current.flyTo({
          center: [pickupLocation.longitude, pickupLocation.latitude],
          zoom: 13,
          duration: 1000 // Smooth animation
        });
      }
      else if (dropoffLocation) {
        map.current.flyTo({
          center: [dropoffLocation.longitude, dropoffLocation.latitude],
          zoom: 13,
          duration: 1000 // Smooth animation
        });
      }
      
      setMarkersAdded(true);
    } catch (error) {
      console.error('Error updating map markers:', error);
    }
  };

  // Update markers and route when locations change
  useEffect(() => {
    updateMapMarkers();
  }, [pickupLocation, dropoffLocation]);

  const handleReload = () => {
    window.location.reload();
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[280px] bg-red-50 text-red-500 rounded-md">
        <AlertTriangle className="h-6 w-6 mb-1" />
        <div className="text-center text-xs mb-2">
          {error}
        </div>
        <button 
          onClick={handleReload}
          className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
        >
          Reload Map
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-[280px] w-full rounded-lg overflow-hidden border border-gray-100 shadow-md bg-gray-50/50">
      <div ref={mapContainer} className="absolute inset-0" />
      {(loading || routeLoading) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80 backdrop-blur-sm">
          <div className="bg-white/90 p-2 rounded-full shadow-md">
            <Loader2 className="h-6 w-6 text-fleet-red animate-spin" />
          </div>
        </div>
      )}
      {!loading && !markersAdded && !(pickupLocation || dropoffLocation) && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-xs text-gray-600 bg-white/90 px-3 py-1.5 rounded-md shadow-sm">
            Enter locations above to display on map
          </p>
        </div>
      )}
    </div>
  );
};

export default RouteMap; 
 