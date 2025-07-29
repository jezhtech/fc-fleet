import { useEffect, useState } from "react";

// Set your Google Maps API key here (fallback)
const GOOGLE_MAPS_API_KEY = "YOUR_GOOGLE_MAPS_API_KEY";

// Check if a Google Maps API key appears valid (basic format check)
const isValidGoogleMapsApiKey = (key: string): boolean => {
  return /^AIza[0-9A-Za-z-_]{35}$/.test(key);
};

/**
 * Custom hook to initialize Google Maps with the correct API key
 * This ensures that the API key is set properly across the application
 */
export const useGoogleMapsToken = () => {
  const [tokenInitialized, setTokenInitialized] = useState(false);
  const [tokenValue, setTokenValue] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Try to get token from environment first, then fallback
      const envToken = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      const token = envToken || GOOGLE_MAPS_API_KEY;

      // Basic validation
      if (!token) {
        throw new Error("No Google Maps API key available");
      }

      if (!isValidGoogleMapsApiKey(token)) {
        console.warn(
          "Google Maps API key does not appear to be in the correct format, but will try to use it anyway"
        );
      }

      setTokenValue(token);

      setTokenInitialized(true);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Unknown API key initialization error";
      console.error("Google Maps API key initialization error:", errorMessage);
      setError(errorMessage);

      // Still set initialized to true so the app can fall back to alternative rendering
      setTokenInitialized(true);
    }
  }, []);

  return {
    token: tokenValue,
    isInitialized: tokenInitialized,
    error,
  };
};
