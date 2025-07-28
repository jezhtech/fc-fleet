import React, { useRef, useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useGoogleMapsToken } from '@/hooks/useGoogleMapsToken';
import { googleMapsService } from '@/services/googleMapsService';

interface GoogleMapProps {
  initialCoordinates?: [number, number];
  initialZoom?: number;
  height?: string;
  width?: string;
  onMapLoaded?: (map: google.maps.Map) => void;
  onMapClick?: (e: google.maps.MapMouseEvent) => void;
  className?: string;
  simpleStyle?: boolean; // Use simpler map style for dialogs
}

const LOAD_TIMEOUT = 5000;

const GoogleMap = ({
  initialCoordinates = [55.2708, 25.2048], // Dubai coordinates as default
  initialZoom = 10,
  height = '500px',
  width = '100%',
  onMapLoaded,
  onMapClick,
  className = '',
  simpleStyle = false, // Default to standard style
}: GoogleMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [loadAttempts, setLoadAttempts] = useState(0);
  
  // Initialize Google Maps token
  const { token, isInitialized, error: tokenError } = useGoogleMapsToken();
  
  // If there's a token error, propagate it to map error
  useEffect(() => {
    if (tokenError) {
      setMapError(`Google Maps token error: ${tokenError}`);
    }
  }, [tokenError]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    if (!isInitialized || !token) {
      console.log('Waiting for Google Maps token to initialize...');
      return;
    }

    const initializeMap = async () => {
      try {
        // Initialize Google Maps service
        await googleMapsService.initialize({ apiKey: token });
        
        // Create map using the service
        const newMap = await googleMapsService.createMap(mapContainer.current!, {
          center: { lat: initialCoordinates[1], lng: initialCoordinates[0] },
          zoom: initialZoom,
          mapTypeId: simpleStyle ? google.maps.MapTypeId.ROADMAP : google.maps.MapTypeId.ROADMAP,
        });
        
        map.current = newMap;

        // Add click event listener
        if (onMapClick) {
          newMap.addListener('click', onMapClick);
        }

        // Add load event listener
        newMap.addListener('tilesloaded', () => {
          if (!mapLoaded) {
            setMapLoaded(true);
            if (onMapLoaded) {
              onMapLoaded(newMap);
            }
          }
        });

        console.log('✓ Google Map initialized successfully');
      } catch (error) {
        console.error('Google Map initialization error:', error);
        setMapError(error instanceof Error ? error.message : 'Unknown map initialization error');
        
        // Retry logic
        if (loadAttempts < 3) {
          setTimeout(() => {
            setLoadAttempts(prev => prev + 1);
            setMapError(null);
          }, 1000 * (loadAttempts + 1));
        }
      }
    };

    // Set a timeout for map loading
    const timeoutId = setTimeout(() => {
      if (!mapLoaded) {
        setMapError('Map loading timeout. Please refresh the page.');
      }
    }, LOAD_TIMEOUT);

    initializeMap();

    return () => {
      clearTimeout(timeoutId);
      if (map.current) {
        // Clean up map instance
        google.maps.event.clearInstanceListeners(map.current);
      }
    };
  }, [token, isInitialized, initialCoordinates, initialZoom, onMapClick, onMapLoaded, mapLoaded, loadAttempts, simpleStyle]);

  // Show loading state
  if (!isInitialized || !token) {
    return (
      <Card className={`${className} flex items-center justify-center`} style={{ height, width }}>
        <div className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-gray-600">Initializing Google Maps...</span>
        </div>
      </Card>
    );
  }

  // Show error state
  if (mapError) {
    return (
      <Card className={`${className} flex items-center justify-center`} style={{ height, width }}>
        <div className="flex items-center space-x-2 text-red-600">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm">{mapError}</span>
        </div>
      </Card>
    );
  }

  // Show loading state while map is loading
  if (!mapLoaded) {
    return (
      <Card className={`${className} flex items-center justify-center`} style={{ height, width }}>
        <div className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-gray-600">Loading map...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className={className} style={{ height, width }}>
      <div 
        ref={mapContainer} 
        className="w-full h-full rounded-md"
        style={{ minHeight: '300px' }}
      />
    </Card>
  );
};

export default GoogleMap; 