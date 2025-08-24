import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { transportService, vehicleService } from '@/services';
import type { Transport, VehicleWithTransport, VehicleDisplay } from '@/types';

const Vehicles = () => {
  const [vehicles, setVehicles] = useState<VehicleDisplay[]>([]);
  const [taxiTypes, setTaxiTypes] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(3);
  const carouselRef = useRef<HTMLDivElement>(null);
  // Add state for tracking active image index for each vehicle
  const [activeImageIndex, setActiveImageIndex] = useState<{[key: string]: number}>({});

  useEffect(() => {
    fetchTaxiTypes();
    
    // Set number of visible items based on window width
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setVisibleCount(1);
      } else if (window.innerWidth < 1024) {
        setVisibleCount(2);
      } else {
        setVisibleCount(3);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Fetch taxi types from API
  const fetchTaxiTypes = async () => {
    try {
      const response = await transportService.getAllTransports();
      
      if (response.success && response.data) {
        const taxiTypesData: Record<string, string> = {};
        response.data.forEach((transport) => {
          taxiTypesData[transport.id] = transport.name;
        });
        
        setTaxiTypes(taxiTypesData);
        // After getting taxi types, fetch vehicles
        fetchVehicles(taxiTypesData);
      } else {
        console.error('Failed to fetch taxi types:', response.message);
        toast.error('Failed to load transport types');
        setTaxiTypes({});
        setVehicles([]);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error fetching taxi types:', error);
      toast.error('Failed to load transport types');
      setTaxiTypes({});
      setVehicles([]);
      setIsLoading(false);
    }
  };

  // Helper function to get a taxi type name for a given ID
  const getTaxiTypeName = async (taxiTypeId: string, existingMappings: Record<string, string>) => {
    // First check our existing mappings
    if (existingMappings[taxiTypeId]) {
      return existingMappings[taxiTypeId];
    }
    
    // If not found, try to fetch it directly
    try {
      const response = await transportService.getTransportById(taxiTypeId);
      
      if (response.success && response.data) {
        return response.data.name;
      }
    } catch (error) {
      console.error(`Error fetching taxi type ${taxiTypeId}:`, error);
    }
    
    // Return empty string if not found
    return '';
  };

  const fetchVehicles = async (taxiTypeMapping: Record<string, string>) => {
    try {
      setIsLoading(true);
      
      // Fetch vehicles from API
      const response = await vehicleService.getAllVehicles();
      
      if (response.success && response.data) {
        // Create an array to hold promises for taxi type name resolution
        const vehiclePromises = response.data.map(async (vehicleData) => {
          const taxiTypeId = vehicleData.transportId || '';
          
          // Determine vehicle category for features (simplified categories)
          let vehicleCategory = 'economy';
          if (vehicleData.name?.toLowerCase().includes('premium') || 
              vehicleData.description?.toLowerCase().includes('premium')) {
            vehicleCategory = 'premium';
          } else if (vehicleData.name?.toLowerCase().includes('suv') || 
                    vehicleData.description?.toLowerCase().includes('suv') ||
                    vehicleData.capacity >= 6) {
            vehicleCategory = 'suv';
          }
          
          // Get the taxi type name, either from our mapping or by fetching it
          let taxiTypeName = '';
          if (taxiTypeId) {
            taxiTypeName = await getTaxiTypeName(taxiTypeId, taxiTypeMapping);
          }
          
          // Create feature list with appropriate icons
          const featuresList = [
            {
              icon: '👤',
              text: `${vehicleData.capacity} Passengers`
            },
            {
              icon: '❄️',
              text: 'AC'
            },
            {
              icon: '🧳',
              text: `${Math.floor(vehicleData.capacity / 2)} Luggage`
            }
          ];
          
          // Add vehicle category specific feature
          if (vehicleCategory === 'premium') {
            featuresList.push({
              icon: '🌟',
              text: 'Premium Features'
            });
          } else if (vehicleCategory === 'suv') {
            featuresList.push({
              icon: '📏',
              text: 'Spacious Interior'
            });
          }
          
          // Calculate estimated price (base price + some markup for display)
          const estimatedPrice = vehicleData.basePrice + (vehicleData.perKmPrice * 10) + (vehicleData.perMinPrice * 15);
          
          // Use first image or empty array if no image
          const images = vehicleData.imageUrl ? [vehicleData.imageUrl] : [];
          
          return {
            id: vehicleData.id,
            name: vehicleData.name,
            description: vehicleData.description,
            image: images[0] || '/placeholder.svg',
            price: estimatedPrice,
            features: featuresList,
            taxiTypeId: taxiTypeId,
            taxiTypeName: taxiTypeName,
            capacity: vehicleData.capacity,
            basePrice: vehicleData.basePrice,
            perKmPrice: vehicleData.perKmPrice,
            perMinutePrice: vehicleData.perMinPrice,
            images: images
          };
        });
        
        const processedVehicles = await Promise.all(vehiclePromises);
        setVehicles(processedVehicles);
      } else {
        console.error('Failed to fetch vehicles:', response.message);
        toast.error('Failed to load vehicles');
        setVehicles([]);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      toast.error('Failed to load vehicles');
      setVehicles([]);
    } finally {
      setIsLoading(false);
    }
  };

  const nextSlide = () => {
    if (vehicles.length <= visibleCount) return;
    setCurrentIndex((prevIndex) => (prevIndex + 1) % (vehicles.length - visibleCount + 1));
  };

  const prevSlide = () => {
    if (vehicles.length <= visibleCount) return;
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? vehicles.length - visibleCount : prevIndex - 1));
  };

  // Auto-advance carousel
  useEffect(() => {
    const interval = setInterval(() => {
      if (vehicles.length > visibleCount) {
        nextSlide();
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [vehicles.length, visibleCount, currentIndex]);

  // Handle dot indicator click
  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Function to handle next image in a vehicle's image carousel
  const handleNextImage = (vehicleId: string, imagesLength: number) => {
    setActiveImageIndex(prev => ({
      ...prev,
      [vehicleId]: (prev[vehicleId] + 1) % imagesLength
    }));
  };
  
  // Function to handle previous image in a vehicle's image carousel
  const handlePrevImage = (vehicleId: string, imagesLength: number) => {
    setActiveImageIndex(prev => ({
      ...prev,
      [vehicleId]: (prev[vehicleId] - 1 + imagesLength) % imagesLength
    }));
  };
  
  // Initialize active image indices when vehicles are loaded
  useEffect(() => {
    const initialIndices: {[key: string]: number} = {};
    vehicles.forEach(vehicle => {
      initialIndices[vehicle.id] = 0;
    });
    setActiveImageIndex(initialIndices);
    
    // Set up automatic image rotation for each vehicle
    const timers: NodeJS.Timeout[] = [];
    
    vehicles.forEach(vehicle => {
      if (vehicle.images && vehicle.images.length > 1) {
        const timer = setInterval(() => {
          handleNextImage(vehicle.id, vehicle.images.length);
        }, 5000); // Rotate every 5 seconds
        timers.push(timer);
      }
    });
    
    return () => {
      timers.forEach(timer => clearInterval(timer));
    };
  }, [vehicles]);

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-fleet-dark mb-4">Our Fleet</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Explore our variety of vehicles for all your transportation needs. From economy to premium options, we have the perfect ride for every occasion.
          </p>
        </motion.div>
        
        {isLoading ? (
          <div className="flex flex-col justify-center items-center min-h-[300px]">
            <Loader2 className="h-10 w-10 text-fleet-red animate-spin mb-4" />
            <span className="text-gray-600 text-center">
              Loading vehicles from our fleet...<br/>
              <span className="text-sm text-gray-500">This may take a moment</span>
            </span>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No vehicles available at the moment. Please check back later.</p>
          </div>
        ) : (
          <div className="relative px-8">
            {/* Carousel Navigation Buttons */}
            {vehicles.length > visibleCount && (
              <>
                <button 
                  onClick={prevSlide} 
                  className="absolute left-0 top-1/2 transform -translate-y-1/2 z-20 bg-white/80 hover:bg-white text-fleet-red rounded-full p-2 shadow-md"
                  aria-label="Previous vehicle"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button 
                  onClick={nextSlide} 
                  className="absolute right-0 top-1/2 transform -translate-y-1/2 z-20 bg-white/80 hover:bg-white text-fleet-red rounded-full p-2 shadow-md"
                  aria-label="Next vehicle"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
            
            {/* Carousel Container */}
            <div className="overflow-hidden">
              <div 
                ref={carouselRef}
                className="flex transition-all duration-500 ease-in-out"
                style={{ 
                  transform: `translateX(-${currentIndex * (100 / visibleCount)}%)`,
                  width: `${(vehicles.length / visibleCount) * 100}%`
                }}
              >
                {vehicles.map((vehicle) => (
                  <div 
                    key={vehicle.id} 
                    className="px-3"
                    style={{ width: `${100 / vehicles.length * visibleCount}%` }}
                  >
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full border border-gray-200">
                      <div className="relative h-60 bg-gray-100"
                        onTouchStart={(e) => {
                          const touchStart = e.touches[0].clientX;
                          const element = e.currentTarget;
                          
                          element.ontouchend = (endEvent) => {
                            const touchEnd = endEvent.changedTouches[0].clientX;
                            const diff = touchStart - touchEnd;
                            
                            // If swipe distance is significant
                            if (Math.abs(diff) > 30) {
                              if (diff > 0) {
                                // Swiped left, go to next image
                                if (vehicle.images.length > 1) {
                                  handleNextImage(vehicle.id, vehicle.images.length);
                                }
                              } else {
                                // Swiped right, go to previous image
                                if (vehicle.images.length > 1) {
                                  handlePrevImage(vehicle.id, vehicle.images.length);
                                }
                              }
                            }
                            
                            element.ontouchend = null;
                          };
                        }}
                      >
                        {/* Taxi Type Tag */}
                        <div className="absolute top-2 left-2 z-10 bg-gradient-to-r from-fleet-red to-fleet-accent text-white px-3 py-1 rounded-full text-xs font-semibold shadow-md">
                          {vehicle.taxiTypeName}
                        </div>
                        
                        {/* Image Carousel */}
                        {vehicle.images && vehicle.images.length > 0 ? (
                          <>
                            <div className="relative w-full h-full overflow-hidden">
                              <AnimatePresence mode="wait">
                                <motion.img 
                                  key={activeImageIndex[vehicle.id] || 0}
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  transition={{ duration: 0.3 }}
                                  src={vehicle.images[activeImageIndex[vehicle.id] || 0]} 
                                  alt={vehicle.name}
                                  className="w-full h-full object-cover object-center"
                                  onError={(e) => {
                                    e.currentTarget.src = '/placeholder.svg';
                                  }}
                                />
                              </AnimatePresence>
                              
                              {/* Image Navigation Controls - Only show if multiple images */}
                              {vehicle.images.length > 1 && (
                                <>
                                  {/* Previous Button */}
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePrevImage(vehicle.id, vehicle.images.length);
                                    }}
                                    className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1.5 transition-colors shadow-md"
                                    aria-label="Previous image"
                                  >
                                    <ChevronLeft className="h-4 w-4" />
                                  </button>
                                  
                                  {/* Next Button */}
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleNextImage(vehicle.id, vehicle.images.length);
                                    }}
                                    className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1.5 transition-colors shadow-md"
                                    aria-label="Next image"
                                  >
                                    <ChevronRight className="h-4 w-4" />
                                  </button>
                                  
                                  {/* Image Indicators/Dots */}
                                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1.5">
                                    {vehicle.images.map((_, idx) => (
                                      <button
                                        key={idx}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveImageIndex(prev => ({
                                            ...prev,
                                            [vehicle.id]: idx
                                          }));
                                        }}
                                        className={`w-2 h-2 rounded-full transition-all ${
                                          idx === (activeImageIndex[vehicle.id] || 0)
                                            ? 'bg-fleet-red scale-125 shadow-sm'
                                            : 'bg-gray-300 hover:bg-gray-400'
                                        }`}
                                        aria-label={`Go to image ${idx + 1}`}
                                      />
                                    ))}
                                  </div>
                                </>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <img 
                              src="/placeholder.svg"
                              alt="No image available"
                              className="h-24 w-24 opacity-40"
                />
              </div>
                        )}
                      </div>
                      <CardContent className="p-4 md:p-6">
                        <div className="flex flex-row justify-between items-center mb-3">
                          <h3 className="text-xl font-bold">{vehicle.name}</h3>
                          <div className="text-lg font-bold text-fleet-red">AED {vehicle.price}/hr</div>
                </div>
                        <p className="text-gray-600 text-sm md:text-base mb-3 line-clamp-2">{vehicle.description}</p>
                <div className="grid grid-cols-2 gap-2 mb-4">
                          {vehicle.features.map((feature, index) => (
                    <div key={index} className="text-sm text-gray-500 flex items-center">
                              <span className="mr-1.5 text-fleet-red">{feature.icon}</span>
                              {feature.text}
                    </div>
                  ))}
                </div>
                <Button className="w-full bg-gradient-to-r from-fleet-red to-fleet-accent text-white hover:opacity-90">
                  Book Now
                </Button>
              </CardContent>
            </Card>
                  </div>
          ))}
              </div>
        </div>
        
            {/* Pagination Dots */}
            {vehicles.length > visibleCount && (
              <div className="flex justify-center mt-6 space-x-2">
                {Array.from({ length: vehicles.length - visibleCount + 1 }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      currentIndex === index 
                        ? 'bg-fleet-red scale-110' 
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            )}
        </div>
        )}
      </div>
    </section>
  );
};

export default Vehicles;