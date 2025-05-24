import { useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';

// Set your Mapbox access token here (fallback) 
const MAPBOX_TOKEN = 'pk.eyJ1IjoiamV6aHRlY2giLCJhIjoiY21haWZjYTU3MGZwdzJxcHplNmVvZG01cyJ9.U3oEFHFClMiTs7jT8G1b2g';

// Check if a Mapbox token appears valid (basic format check)
const isValidMapboxToken = (token: string): boolean => {
  return /^pk\.[a-zA-Z0-9_-]{50,}$/i.test(token);
};

/**
 * Custom hook to initialize Mapbox with the correct access token
 * This ensures that the token is set properly across the application
 */
export const useMapboxToken = () => {
  const [tokenInitialized, setTokenInitialized] = useState(false);
  const [tokenValue, setTokenValue] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    try {
      // Try to get token from environment first, then fallback
      const envToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
      const token = envToken || MAPBOX_TOKEN;
      
      // Basic validation
      if (!token) {
        throw new Error('No Mapbox token available');
      }
      
      if (!isValidMapboxToken(token)) {
        console.warn('Mapbox token does not appear to be in the correct format, but will try to use it anyway');
      }
      
      // Set the global Mapbox token
      mapboxgl.accessToken = token;
      setTokenValue(token);
      
      // Verify the token was set
      if (!mapboxgl.accessToken) {
        throw new Error('Failed to set Mapbox token');
      }
      
      console.log('✓ Mapbox token initialized successfully');
      setTokenInitialized(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown token initialization error';
      console.error('Mapbox token initialization error:', errorMessage);
      setError(errorMessage);
      
      // Still set initialized to true so the app can fall back to alternative rendering
      setTokenInitialized(true);
    }
  }, []);

  return { 
    token: tokenValue, 
    isInitialized: tokenInitialized,
    error
  };
};

export default useMapboxToken; 