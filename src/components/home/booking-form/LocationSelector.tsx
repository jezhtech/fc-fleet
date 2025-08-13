import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { MapPin, Loader2, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Location } from "./types";
import { useGoogleMapsToken } from "@/hooks/useGoogleMapsToken";
import { googleMapsService, PlaceResult } from "@/services/googleMapsService";
import { cn } from "@/lib/utils";

interface LocationSelectorProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onLocationSelect: (location: Location) => void;
  placeholder: string;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  id,
  label,
  value,
  onChange,
  onLocationSelect,
  placeholder,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [locationSelected, setLocationSelected] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSearchRef = useRef<string>("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize Google Maps
  const { token, isInitialized, error: tokenError } = useGoogleMapsToken();

  // Handle outside clicks to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Google Places API for geocoding
  const fetchSuggestions = async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    // Avoid duplicate searches for the same query
    if (query === lastSearchRef.current && suggestions.length > 0) {
      return;
    }

    lastSearchRef.current = query;
    setIsLoading(true);

    try {
      // Initialize Google Maps if not already done
      if (!googleMapsService.isReady() && token) {
        await googleMapsService.initialize({ apiKey: token });
      }

      if (!googleMapsService.isReady()) {
        throw new Error("Google Maps not initialized");
      }

      // Create UAE center location (Dubai)
      const uaeCenter = new google.maps.LatLng(25.2048, 55.2708);

      // Search for places using Google Places API with UAE focus
      const places = await googleMapsService.searchPlaces(query, {
        limit: 10,
        types: ["establishment", "geocode"],
      });

      if (places.length > 0) {
        // Convert Google Places results to our format
        const enhancedData = places.map(enrichGooglePlaceData);

        // Remove duplicates based on place_id
        const uniqueData = enhancedData.filter(
          (item, index, self) =>
            index === self.findIndex((t) => t.place_id === item.place_id)
        );

        setSuggestions(uniqueData);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error("Error fetching location suggestions:", error);
      toast.error("Could not load location suggestions. Please try again.");
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Convert Google Places API results to our format
  const enrichGooglePlaceData = (place: PlaceResult) => {
    const mainName = place.displayName?.text || "Unknown Location";
    const displayName =
      place.formattedAddress || place.displayName?.text || "Unknown Address";

    // Extract secondary address (everything after the main name)
    const addressParts = displayName.split(", ");
    const secondaryAddress = addressParts
      .slice(1, Math.min(addressParts.length, 3))
      .join(", ");

    // Get coordinates
    const lat = place.location?.latitude || 0;
    const lng = place.location?.longitude || 0;

    // Determine location type
    let locationType = "";
    if (place.types && place.types.length > 0) {
      const type = place.types[0];
      if (type.includes("restaurant")) locationType = "restaurant";
      else if (type.includes("hotel")) locationType = "hotel";
      else if (type.includes("shopping")) locationType = "shopping center";
      else if (type.includes("airport")) locationType = "airport";
      else if (type.includes("hospital")) locationType = "hospital";
      else if (type.includes("school")) locationType = "school";
      else if (type.includes("establishment")) locationType = "business";
      else locationType = type;
    }

    return {
      place_id: place.id || `google-${Date.now()}-${Math.random()}`,
      mainName,
      secondaryAddress,
      display_name: displayName,
      lat: lat.toString(),
      lon: lng.toString(),
      type: locationType,
      geometry: {
        location: {
          lat: () => lat,
          lng: () => lng,
        },
      },
    };
  };

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // If a location was just selected, don't search again
    if (locationSelected) {
      return;
    }

    if (value.trim().length >= 2) {
      setIsLoading(true);
      searchTimeoutRef.current = setTimeout(() => {
        fetchSuggestions(value);
      }, 300);
    } else {
      // Only show suggestions if user has typed something
      setSuggestions([]);
      setIsLoading(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [value, locationSelected]);

  const handleLocationSelect = (item: any) => {
    try {
      if (!item.lat || !item.lon) {
        console.error("Location data missing coordinates:", item);
        toast.error("Invalid location data. Please select another location.");
        return;
      }

      // Use the mainName from Google Places data
      const location: Location = {
        name: item.mainName,
        longitude: parseFloat(item.lon),
        latitude: parseFloat(item.lat),
        address: item.display_name,
        placeId: item.place_id.toString(),
        coordinates: {
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
        },
      };

      // Set the selected state flag to prevent reopening dropdown
      setLocationSelected(true);

      // Clear the search timeout to prevent searching after selection
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }

      // Update the input value and call onLocationSelect
      onChange(location.name);
      onLocationSelect(location);

      // Close the dropdown
      setIsOpen(false);
    } catch (error) {
      console.error("Error processing selected location:", error);
      toast.error("Could not process selected location. Please try again.");
    }
  };

  const handleInputChange = (newValue: string) => {
    onChange(newValue);
    // If user types, clear the selected flag and allow searching again
    if (locationSelected) {
      setLocationSelected(false);
    }
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  return (
    <div className="space-y-1 relative">
      {label && (
        <label htmlFor={id} className="text-xs font-medium text-gray-700">
          {label}
        </label>
      )}

      <div className="relative" ref={containerRef}>
        <MapPin className="absolute left-2 top-2.5 h-3.5 w-3.5 text-gray-500 pointer-events-none" />
        <Input
          ref={inputRef}
          id={id}
          name={id}
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className="pl-7 py-1.5 h-9 text-sm rounded-md w-full text-gray-800 bg-white border-gray-200"
          required
          autoComplete="off"
        />

        {isOpen && (suggestions.length > 0 || isLoading) && (
          <div className="absolute z-50 w-full mt-0.5 bg-white rounded-md shadow-lg border border-gray-200">
            <div className="rounded-md overflow-hidden">
              <div className="max-h-[250px] overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center py-4 px-3">
                    <Loader2 className="h-4 w-4 animate-spin mr-2 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      Searching locations...
                    </span>
                  </div>
                ) : suggestions.length > 0 ? (
                  suggestions.map((item) => (
                    <div
                      key={item.place_id}
                      className="py-1.5 px-2 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleLocationSelect(item)}
                    >
                      <div className="flex items-start gap-1.5">
                        <MapPin className="mt-0.5 h-3 w-3 flex-shrink-0 text-gray-500" />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium leading-tight text-gray-800">
                            {item.mainName}
                          </span>
                          {item.secondaryAddress && (
                            <span className="text-[10px] text-gray-500 truncate max-w-[220px]">
                              {item.secondaryAddress}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  value &&
                  value.length >= 2 && (
                    <div className="py-4 px-3 text-center text-sm text-gray-500">
                      No locations found.
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationSelector;
