import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from '@/components/ui/card';
import { Loader2, AlertTriangle } from 'lucide-react';
import useMapboxToken from '@/hooks/useMapboxToken';
import mapService from '@/services/mapService';

// NOTE: Don't set the token here - we use the hook to initialize it
// This prevents having multiple token declarations

interface MapboxMapProps {
  initialCoordinates?: [number, number];
  initialZoom?: number;
  height?: string;
  width?: string;
  onMapLoaded?: (map: mapboxgl.Map) => void;
  onMapClick?: (e: mapboxgl.MapMouseEvent) => void;
  className?: string;
  simpleStyle?: boolean; // Use simpler map style for dialogs
}

const MAPBOX_STYLES = {
  // Direct style URLs instead of shorthand style strings
  light: 'mapbox://styles/mapbox/light-v11',
  streets: 'mapbox://styles/mapbox/streets-v12',
  basic: 'mapbox://styles/mapbox/basic-v9',
};

const LOAD_TIMEOUT = 5000; // Reduced from 8000ms to 5000ms

const MapboxMap = ({
  initialCoordinates = [55.2708, 25.2048], // Dubai coordinates as default
  initialZoom = 10,
  height = '500px',
  width = '100%',
  onMapLoaded,
  onMapClick,
  className = '',
  simpleStyle = false, // Default to standard style
}: MapboxMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [loadAttempts, setLoadAttempts] = useState(0);
  
  // Initialize Mapbox token
  const { token, isInitialized, error: tokenError } = useMapboxToken();
  
  // If there's a token error, propagate it to map error
  useEffect(() => {
    if (tokenError) {
      setMapError(`Mapbox token error: ${tokenError}`);
    }
  }, [tokenError]);
  
  // Set token in mapService when available
  useEffect(() => {
    if (token && isInitialized) {
      mapService.setToken(token);
    }
  }, [token, isInitialized]);
  
  // Retry logic for map creation
  const attemptMapInitialization = async () => {
    if (!mapContainer.current || !token || map.current) return;
    
    try {
      console.log(`Attempting map initialization (attempt ${loadAttempts + 1})`);
      
      // Ensure token is set before map creation
      mapService.setToken(token);
      
      // Wait for any preloading to complete
      await mapService.waitForInitialization();
      
      // Create the map using mapService
      const newMap = await mapService.createMap(mapContainer.current, {
        style: simpleStyle ? MAPBOX_STYLES.basic : MAPBOX_STYLES.streets,
        center: initialCoordinates,
        zoom: initialZoom,
      });

      map.current = newMap;

      // Add comprehensive error handling
      map.current.on('error', (e) => {
        console.error('Mapbox error:', e.error);
        setMapError(`Map error: ${e.error?.message || 'Unknown map error'}`);
      });

      // Add load handler
      map.current.once('load', () => {
        console.log('Map loaded successfully');
        setMapLoaded(true);
        if (onMapLoaded && map.current) {
          try {
            onMapLoaded(map.current);
          } catch (error) {
            console.error('Error in onMapLoaded callback:', error);
            setMapError('Error in map callback');
          }
        }
      });

      // Add click handler if provided
      if (onMapClick) {
        map.current.on('click', onMapClick);
      }
    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError(`Failed to initialize map: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Clean up any partially created map
      if (map.current) {
        try {
          map.current.remove();
        } catch { /* ignore */ }
        map.current = null;
      }
      
      // Increment attempts counter
      setLoadAttempts(prev => prev + 1);
    }
  };
  
  // Create map instance once token is initialized
  useEffect(() => {
    if (!isInitialized) {
      console.log('Waiting for Mapbox token to initialize...');
      return;
    }
    
    // More aggressive retry for first attempt
    if (loadAttempts === 0) {
      attemptMapInitialization();
    } else if (loadAttempts < 3 && !map.current && !mapError) {
      // Delay subsequent retries
      const retryTimeout = setTimeout(() => {
        attemptMapInitialization();
      }, 1000);
      return () => clearTimeout(retryTimeout);
    }
    
    return () => {
      if (map.current) {
        try {
          map.current.remove();
        } catch (error) {
          console.error('Error removing map:', error);
        } finally {
          map.current = null;
        }
      }
    };
  }, [isInitialized, loadAttempts, token]);

  // Shorter timeout for map loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!mapLoaded) {
        if (map.current) {
          console.warn('Map load timeout - forcing loaded state');
          setMapLoaded(true);
          
          if (onMapLoaded && map.current) {
            try {
              onMapLoaded(map.current);
            } catch (error) {
              console.error('Error in onMapLoaded emergency callback:', error);
            }
          }
        } else if (loadAttempts < 3) {
          // Try one more time
          console.warn('Map load timeout - attempting retry');
          setLoadAttempts(prev => prev + 1);
        } else {
          // Give up after 3 attempts
          setMapError('Map failed to load after multiple attempts');
        }
      }
    }, LOAD_TIMEOUT);
    
    return () => clearTimeout(timeout);
  }, [mapLoaded, loadAttempts, onMapLoaded]);

  const handleReload = () => {
    // Reset error state
    setMapError(null);
    
    // Remove existing map if any
    if (map.current) {
      try {
        map.current.remove();
      } catch { /* ignore */ }
      map.current = null;
    }
    
    // Reset states
    setMapLoaded(false);
    setLoadAttempts(0);
    
    // Force window reload if we've tried too many times
    if (loadAttempts >= 3) {
      window.location.reload();
    }
  };

  return (
    <Card className={`relative overflow-hidden ${className}`}>
      <div 
        ref={mapContainer} 
        style={{ height, width }} 
        className="mapboxgl-map"
      >
        {!mapLoaded && !mapError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100/60 z-10">
            <Loader2 className="h-10 w-10 text-fleet-red animate-spin" />
            <span className="ml-2 text-gray-600">Loading map...</span>
          </div>
        )}
        
        {mapError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50 z-10 p-4">
            <AlertTriangle className="h-12 w-12 text-red-500 mb-2" />
            <p className="text-red-600 font-medium mb-2">Map Error</p>
            <p className="text-sm text-center max-w-md">{mapError}</p>
            <button 
              onClick={handleReload} 
              className="mt-4 px-4 py-2 bg-fleet-red text-white rounded-md hover:bg-red-600"
            >
              Reload Map
            </button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default MapboxMap;
