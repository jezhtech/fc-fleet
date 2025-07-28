import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { MapPin, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Location } from './types';
import { useGoogleMapsToken } from '@/hooks/useGoogleMapsToken';
import { googleMapsService } from '@/services/googleMapsService';

interface LocationSelectorProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onLocationSelect: (location: Location) => void;
  placeholder: string;
}

// Famous places in UAE with coordinates
const FAMOUS_PLACES = [
  {
    place_id: 'famous-1',
    mainName: 'Burj Khalifa',
    secondaryAddress: 'Downtown Dubai',
    display_name: 'Burj Khalifa, Downtown Dubai, Dubai, United Arab Emirates',
    lat: '25.197197',
    lon: '55.274376'
  },
  {
    place_id: 'famous-2',
    mainName: 'Dubai Mall',
    secondaryAddress: 'Downtown Dubai',
    display_name: 'Dubai Mall, Downtown Dubai, Dubai, United Arab Emirates',
    lat: '25.198765',
    lon: '55.279499'
  },
  {
    place_id: 'famous-3',
    mainName: 'Palm Jumeirah',
    secondaryAddress: 'Dubai',
    display_name: 'Palm Jumeirah, Dubai, United Arab Emirates',
    lat: '25.112288',
    lon: '55.138592'
  },
  {
    place_id: 'famous-4',
    mainName: 'Dubai Marina',
    secondaryAddress: 'Dubai',
    display_name: 'Dubai Marina, Dubai, United Arab Emirates',
    lat: '25.071093',
    lon: '55.130042'
  },
  {
    place_id: 'famous-5',
    mainName: 'Sheikh Zayed Grand Mosque',
    secondaryAddress: 'Abu Dhabi',
    display_name: 'Sheikh Zayed Grand Mosque, Abu Dhabi, United Arab Emirates',
    lat: '24.412834',
    lon: '54.475127'
  },
  {
    place_id: 'famous-6',
    mainName: 'Emirates Palace',
    secondaryAddress: 'Abu Dhabi',
    display_name: 'Emirates Palace, Abu Dhabi, United Arab Emirates',
    lat: '24.460719',
    lon: '54.317341'
  },
  {
    place_id: 'famous-7',
    mainName: 'Global Village',
    secondaryAddress: 'Dubai',
    display_name: 'Global Village, Dubai, United Arab Emirates',
    lat: '25.067475',
    lon: '55.301651'
  },
  {
    place_id: 'famous-8',
    mainName: 'Al Ain Zoo',
    secondaryAddress: 'Al Ain',
    display_name: 'Al Ain Zoo, Al Ain, United Arab Emirates',
    lat: '24.175321',
    lon: '55.736567'
  },
  {
    place_id: 'famous-9',
    mainName: 'Dubai International Airport',
    secondaryAddress: 'Dubai',
    display_name: 'Dubai International Airport, Dubai, United Arab Emirates',
    lat: '25.252777',
    lon: '55.364445'
  },
  {
    place_id: 'famous-10',
    mainName: 'Sharjah Corniche',
    secondaryAddress: 'Sharjah',
    display_name: 'Sharjah Corniche, Sharjah, United Arab Emirates',
    lat: '25.357152',
    lon: '55.383621'
  }
];

const LocationSelector: React.FC<LocationSelectorProps> = ({
  id,
  label,
  value,
  onChange,
  onLocationSelect,
  placeholder
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>(FAMOUS_PLACES);
  const [isLoading, setIsLoading] = useState(false);
  const [locationSelected, setLocationSelected] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSearchRef = useRef<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Initialize Google Maps
  const { token, isInitialized, error: tokenError } = useGoogleMapsToken();

  // Google Places API for geocoding
  const fetchSuggestions = async (query: string) => {
    if (!query || query.length < 2) {
      // Show famous places if query is empty or too short
      setSuggestions(FAMOUS_PLACES);
      return;
    }

    // Avoid duplicate searches for the same query
    if (query === lastSearchRef.current && suggestions.length > 0) {
      return;
    }
    
    lastSearchRef.current = query;
    setIsLoading(true);
    setIsOpen(true);
    
    try {
      // Initialize Google Maps if not already done
      if (!googleMapsService.isReady() && token) {
        console.log('Initializing Google Maps with token:', token.substring(0, 10) + '...');
        await googleMapsService.initialize({ apiKey: token });
      }
      
      if (!googleMapsService.isReady()) {
        throw new Error('Google Maps not initialized');
      }
      
      console.log('Google Maps is ready, searching for:', query);
      
      // Search for places using Google Places API
      const places = await googleMapsService.searchPlaces(query, {
        limit: 10,
        types: ['establishment', 'geocode']
      });
      
      console.log('Google Places API results:', places);
      
      if (places.length > 0) {
        // Convert Google Places results to our format
        const enhancedData = places.map(enrichGooglePlaceData);
        
        // Remove duplicates based on place_id
        const uniqueData = enhancedData.filter((item, index, self) => 
          index === self.findIndex(t => t.place_id === item.place_id)
        );
        
        setSuggestions(uniqueData);
        console.log('Enhanced Google Places data:', uniqueData);
      } else {
        console.log('No suggestions found for query:', query);
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Error fetching location suggestions:', error);
      toast.error('Could not load location suggestions. Please try again.');
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Add more context and useful info to location data
  const enrichLocationData = (item: any) => {
    // Extract the main place name more intelligently
    const displayParts = item.display_name.split(', ');
    
    // Prioritize English name
    let mainName = displayParts[0];
    if (item.namedetails) {
      // Try to get English name from namedetails
      mainName = item.namedetails.name || item.namedetails.name_en || displayParts[0];
      
      // If the name has Arabic characters, use English alternatives
      if (/[\u0600-\u06FF]/.test(mainName)) {
        mainName = item.namedetails.alt_name || item.namedetails.name_en || displayParts[0];
        // If still has Arabic, use first part of display name which should be in English
        if (/[\u0600-\u06FF]/.test(mainName)) {
          mainName = displayParts[0];
        }
      }
    }
    
    // Check for business names in extra tags
    let locationType = '';
    if (item.extratags) {
      const businessName = item.extratags.name || item.extratags.brand || item.extratags.operator;
      if (businessName && !(/[\u0600-\u06FF]/.test(businessName))) {
        mainName = businessName;
      }
      
      // Extract business type information
      if (item.extratags.shop) {
        locationType = `${item.extratags.shop} shop`;
      } else if (item.extratags.amenity) {
        locationType = item.extratags.amenity;
      } else if (item.extratags.office) {
        locationType = `${item.extratags.office} office`;
      } else if (item.extratags.building) {
        locationType = item.extratags.building;
      }
    }
    
    // Use category from tags if available
    if (!locationType && item.type) {
      locationType = item.type;
    }
    
    // Create a more user-friendly secondary address by removing redundant info
    // and ensuring it's only in English
    const secondaryParts = displayParts
      .slice(1, Math.min(displayParts.length, 3))
      .filter(Boolean)
      // Filter out parts containing Arabic characters
      .filter(part => !(/[\u0600-\u06FF]/.test(part)));
    
    const secondaryAddress = secondaryParts.join(', ');
    
    return {
      ...item,
      mainName,
      secondaryAddress,
      type: locationType
    };
  };

  // Convert Google Places API results to our format
  const enrichGooglePlaceData = (place: google.maps.places.PlaceResult) => {
    const mainName = place.name || 'Unknown Location';
    const displayName = place.formatted_address || place.name || 'Unknown Address';
    
    // Extract secondary address (everything after the main name)
    const addressParts = displayName.split(', ');
    const secondaryAddress = addressParts.slice(1, Math.min(addressParts.length, 3)).join(', ');
    
    // Get coordinates
    const lat = place.geometry?.location?.lat() || 0;
    const lng = place.geometry?.location?.lng() || 0;
    
    // Determine location type
    let locationType = '';
    if (place.types && place.types.length > 0) {
      const type = place.types[0];
      if (type.includes('restaurant')) locationType = 'restaurant';
      else if (type.includes('hotel')) locationType = 'hotel';
      else if (type.includes('shopping')) locationType = 'shopping center';
      else if (type.includes('airport')) locationType = 'airport';
      else if (type.includes('hospital')) locationType = 'hospital';
      else if (type.includes('school')) locationType = 'school';
      else if (type.includes('establishment')) locationType = 'business';
      else locationType = type;
    }
    
    return {
      place_id: place.place_id || `google-${Date.now()}-${Math.random()}`,
      mainName,
      secondaryAddress,
      display_name: displayName,
      lat: lat.toString(),
      lon: lng.toString(),
      type: locationType,
      geometry: place.geometry
    };
  };

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Reset the location selected flag when input changes
    if (locationSelected) {
      setLocationSelected(false);
    }
    
    if (value.trim().length >= 2) {
      setIsLoading(true);
      searchTimeoutRef.current = setTimeout(() => {
        console.log(`Searching for ${id}: "${value}"`);
        
        // Use the query as-is for Google Places API
        // Google Places API will automatically handle UAE context and provide better results
        fetchSuggestions(value);
      }, 300); // Reduced debounce delay for better responsiveness
    } else {
      // Show famous places when input is empty or has fewer than 2 characters
      setSuggestions(FAMOUS_PLACES);
      setIsLoading(false);
    }
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [value, id, locationSelected]);

  const handleLocationSelect = (item: any) => {
    try {
      if (!item.lat || !item.lon) {
        console.error('Location data missing coordinates:', item);
        toast.error('Invalid location data. Please select another location.');
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
          lng: parseFloat(item.lon)
        }
      };
      
      // Set the selected state flag to prevent reopening dropdown
      setLocationSelected(true);
      
      // Update the input value and call onLocationSelect
      onChange(location.name);
      onLocationSelect(location);
      
      // Close the dropdown
      setIsOpen(false);
      
      // Blur input to remove focus
      if (inputRef.current) {
        inputRef.current.blur();
      }
    } catch (error) {
      console.error('Error processing selected location:', error);
      toast.error('Could not process selected location. Please try again.');
    }
  };

  // Guaranteed to show dropdown on click, but only if no location has been selected yet
  const handleInputClick = () => {
    // Only open dropdown if no location is selected or user has typed something new
    if (!locationSelected) {
      // Force dropdown to open and show suggestions
      setIsOpen(true);
      setSuggestions(suggestions.length > 0 ? suggestions : FAMOUS_PLACES);
    }
    
    // Focus the input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="space-y-1 relative" ref={containerRef}>
      {label && <label htmlFor={id} className="text-xs font-medium text-gray-700">{label}</label>}
      <div className="relative">
        <MapPin className="absolute left-2 top-2.5 h-3.5 w-3.5 text-gray-500 pointer-events-none" />
        <Input
          ref={inputRef}
          id={id}
          name={id}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            // If user types, clear the selected flag
            if (locationSelected) {
              setLocationSelected(false);
            }
          }}
          onClick={handleInputClick}
          onFocus={() => {
            // Only open dropdown on focus if no location is selected or user has changed the value
            if (!locationSelected) {
              handleInputClick();
            }
          }}
          placeholder={placeholder}
          className={`pl-7 py-1.5 h-9 text-sm rounded-md w-full text-gray-800 bg-white border-gray-200 ${locationSelected ? 'bg-gray-50' : ''}`}
          required
          autoComplete="off"
        />
        
        {isOpen && (
          <div className="absolute z-50 w-full mt-0.5 bg-white rounded-md shadow-lg border border-gray-200">
            <div className="rounded-md overflow-hidden">
              <div className="max-h-[250px] overflow-y-auto">
                {isLoading && (
                  <div className="flex items-center justify-center py-2 px-3">
                    <Loader2 className="h-3 w-3 animate-spin mr-2 text-gray-500" />
                    <span className="text-xs text-gray-600">Loading...</span>
                  </div>
                )}
                
                {!isLoading && suggestions.length === 0 && (
                  <div className="p-3 text-center">
                    <div className="text-xs text-gray-600 mb-1">
                      {value.length < 2 ? 
                        "Popular locations shown below" : 
                        "No locations found"
                      }
                    </div>
                    {value.length >= 2 && (
                      <div className="text-[10px] text-gray-500">
                        Try adding more details like city name or landmark
                      </div>
                    )}
                  </div>
                )}
                
                {suggestions.length > 0 && (
                  <div>
                    <div className="px-2 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 border-b border-gray-200">
                      {value.length < 2 ? "Popular Places in UAE" : "Locations in UAE"}
                    </div>
                    <div>
                      {suggestions.map((item) => (
                        <div
                          key={item.place_id}
                          className="py-1.5 px-2 cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleLocationSelect(item)}
                        >
                          <div className="flex items-start gap-1.5">
                            <MapPin className="mt-0.5 h-3 w-3 flex-shrink-0 text-gray-500" />
                            <div className="flex flex-col">
                              <span className="text-sm font-medium leading-tight text-gray-800">{item.mainName}</span>
                              {item.secondaryAddress && (
                                <span className="text-[10px] text-gray-500 truncate max-w-[220px]">
                                  {item.secondaryAddress}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
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