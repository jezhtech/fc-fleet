import React, { useState, useEffect } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { Vehicle, Location } from './types';
import { formatCurrency } from '@/utils/currency';

interface VehicleSelectorProps {
  vehicles: Vehicle[];
  selectedCarModel: string;
  onSelect: (vehicleId: string) => void;
  loading: boolean;
  pickupLocation?: Location;
  dropoffLocation?: Location;
}

const VehicleSelector: React.FC<VehicleSelectorProps> = ({
  vehicles,
  selectedCarModel,
  onSelect,
  loading,
  pickupLocation,
  dropoffLocation
}) => {
  // Track active image index for each vehicle
  const [activeImageIndex, setActiveImageIndex] = useState<Record<string, number>>({});
  
  // Initialize active image indices when vehicles change
  useEffect(() => {
    const initialIndices: Record<string, number> = {};
    vehicles.forEach(vehicle => {
      initialIndices[vehicle.id] = 0;
    });
    setActiveImageIndex(initialIndices);
  }, [vehicles]);
  
  // Helper function to calculate estimated price
  const getEstimatedPrice = (vehicle: Vehicle) => {
    if (!vehicle) return 0;
    
    // Calculate distance if pickup and dropoff locations are available
    let distanceKm = 10; // Default distance
    let estimatedMinutes = 30; // Default time
    
    if (pickupLocation && dropoffLocation && 
        pickupLocation.coordinates && dropoffLocation.coordinates) {
      // Calculate actual distance using the Haversine formula
      distanceKm = calculateDistance(
        pickupLocation.coordinates.lat,
        pickupLocation.coordinates.lng,
        dropoffLocation.coordinates.lat,
        dropoffLocation.coordinates.lng
      );
      
      // Estimate travel time based on distance (assuming average speed of 30 km/h in city traffic)
      const averageSpeedKmh = 30;
      const estimatedTravelTimeHours = distanceKm / averageSpeedKmh;
      estimatedMinutes = Math.ceil(estimatedTravelTimeHours * 60);
    }
    
    // Check if we're in peak hours (7-9 AM or 5-7 PM on weekdays)
    const now = new Date();
    const hour = now.getHours();
    const isWeekday = now.getDay() >= 1 && now.getDay() <= 5; // Monday to Friday
    const isPeakHour = isWeekday && ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19));
    
    // Calculate base fare
    let totalPrice = vehicle.basePrice + 
                    (vehicle.perKmPrice * distanceKm) + 
                    (vehicle.perMinutePrice * estimatedMinutes);
    
    // Apply surge pricing during peak hours
    if (isPeakHour) {
      const surgeMultiplier = 1.2;
      totalPrice *= surgeMultiplier;
    }
    
    // Ensure minimum fare
    const minFare = 20; // Minimum fare in AED
    if (totalPrice < minFare) {
      totalPrice = minFare;
    }
    
    // Round to 2 decimal places
    return Math.round(totalPrice * 100) / 100;
  };
  
  // Haversine formula to calculate distance between two coordinates in kilometers
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the Earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c; // Distance in km
    return distance;
  };
  
  const deg2rad = (deg: number): number => {
    return deg * (Math.PI/180);
  };
  
  // Functions to navigate images
  const handleNextImage = (e: React.MouseEvent, carId: string, imagesLength: number) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveImageIndex(prev => ({
      ...prev,
      [carId]: (prev[carId] + 1) % imagesLength
    }));
  };
  
  const handlePrevImage = (e: React.MouseEvent, carId: string, imagesLength: number) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveImageIndex(prev => ({
      ...prev,
      [carId]: (prev[carId] - 1 + imagesLength) % imagesLength
    }));
  };
  
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-fleet-red" />
        <span className="ml-2">Loading vehicles...</span>
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Available Cars</label>
      <RadioGroup 
        value={selectedCarModel} 
        onValueChange={onSelect}
        className="space-y-3"
      >
        {vehicles.map((car) => (
          <div 
            key={car.id} 
            className={`border rounded-md overflow-hidden hover:border-fleet-red cursor-pointer transition-colors ${selectedCarModel === car.id ? 'border-fleet-red bg-fleet-red/10' : ''}`}
            onClick={() => onSelect(car.id)}
          >
            <RadioGroupItem value={car.id} id={car.id} className="sr-only" />
            
            {/* Vehicle Image Section */}
            <div className="relative h-40 w-full bg-gray-100">
              {car.images && car.images.length > 0 ? (
                <>
                  <img 
                    src={car.images[activeImageIndex[car.id] || 0]} 
                    alt={car.name}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Image navigation if multiple images exist */}
                  {car.images.length > 1 && (
                    <>
                      <button 
                        onClick={(e) => handlePrevImage(e, car.id, car.images.length)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button 
                        onClick={(e) => handleNextImage(e, car.id, car.images.length)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors"
                      >
                        <ChevronRight size={16} />
                      </button>
                      
                      {/* Image indicators */}
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1">
                        {car.images.map((_, index) => (
                          <button
                            key={index}
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              setActiveImageIndex(prev => ({
                                ...prev,
                                [car.id]: index
                              }));
                            }}
                            className={`w-1.5 h-1.5 rounded-full ${
                              index === (activeImageIndex[car.id] || 0)
                                ? 'bg-white'
                                : 'bg-white/50'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon size={48} className="text-gray-300" />
                </div>
              )}
            </div>
            
            {/* Vehicle Details Section */}
            <div className="p-3">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium">{car.name}</h4>
                  <p className="text-xs text-gray-500">{car.description}</p>
                  <div className="flex items-center text-xs mt-1">
                    <span className="mr-2">👥 {car.capacity} seats</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-fleet-red">{formatCurrency(getEstimatedPrice(car))}</p>
                  <p className="text-xs text-gray-500">Estimated fare</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
};

export default VehicleSelector; 