import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { transportService, vehicleService } from "@/services";
import type { VehicleDisplay } from "@/types";

// Swiper imports
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import config from "@/config";

const Vehicles = () => {
  const [vehicles, setVehicles] = useState<VehicleDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState<{
    [key: string]: number;
  }>({});

  useEffect(() => {
    fetchTaxiTypes();
  }, []);

  const fetchTaxiTypes = async () => {
    try {
      const response = await transportService.getAllTransports();
      if (response.success && response.data) {
        const taxiTypesData: Record<string, string> = {};
        response.data.forEach((transport) => {
          taxiTypesData[transport.id] = transport.name;
        });
        fetchVehicles(taxiTypesData);
      } else {
        console.error("Failed to fetch taxi types:", response.message);
        toast.error("Failed to load transport types");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error fetching taxi types:", error);
      toast.error("Failed to load transport types");
      setIsLoading(false);
    }
  };

  const getTaxiTypeName = async (
    taxiTypeId: string,
    existingMappings: Record<string, string>,
  ) => {
    if (existingMappings[taxiTypeId]) {
      return existingMappings[taxiTypeId];
    }
    try {
      const response = await transportService.getTransportById(taxiTypeId);
      if (response.success && response.data) {
        return response.data.name;
      }
    } catch (error) {
      console.error(`Error fetching taxi type ${taxiTypeId}:`, error);
    }
    return "";
  };

  const fetchVehicles = async (taxiTypeMapping: Record<string, string>) => {
    try {
      setIsLoading(true);
      const response = await vehicleService.getAllVehicles();
      if (response.success && response.data) {
        const vehiclePromises = response.data.map(async (vehicleData) => {
          const taxiTypeId = vehicleData.transportId || "";
          let vehicleCategory = "economy";
          if (
            vehicleData.name?.toLowerCase().includes("premium") ||
            vehicleData.description?.toLowerCase().includes("premium")
          ) {
            vehicleCategory = "premium";
          } else if (
            vehicleData.name?.toLowerCase().includes("suv") ||
            vehicleData.description?.toLowerCase().includes("suv") ||
            vehicleData.capacity >= 6
          ) {
            vehicleCategory = "suv";
          }

          const taxiTypeName = taxiTypeId
            ? await getTaxiTypeName(taxiTypeId, taxiTypeMapping)
            : "";

          const featuresList = [
            { icon: "👤", text: `${vehicleData.capacity} Passengers` },
            { icon: "❄️", text: "AC" },
            {
              icon: "🧳",
              text: `${Math.floor(vehicleData.capacity / 2)} Luggage`,
            },
          ];

          if (vehicleCategory === "premium") {
            featuresList.push({ icon: "🌟", text: "Premium Features" });
          } else if (vehicleCategory === "suv") {
            featuresList.push({ icon: "📏", text: "Spacious Interior" });
          }

          const images = vehicleData.imageUrl ? [vehicleData.imageUrl] : [];

          return {
            ...vehicleData,
            features: featuresList,
            taxiTypeId,
            taxiTypeName,
            basePrice: Number(vehicleData.basePrice),
            perKmPrice: Number(vehicleData.perKmPrice),
            perHourPrice: Number(vehicleData.perHourPrice),
            images,
          };
        });

        const processedVehicles = await Promise.all(vehiclePromises);
        setVehicles(processedVehicles);
      } else {
        console.error("Failed to fetch vehicles:", response.message);
        toast.error("Failed to load vehicles");
      }
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      toast.error("Failed to load vehicles");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextImage = (vehicleId: string, imagesLength: number) => {
    setActiveImageIndex((prev) => ({
      ...prev,
      [vehicleId]: ((prev[vehicleId] || 0) + 1) % imagesLength,
    }));
  };

  const handlePrevImage = (vehicleId: string, imagesLength: number) => {
    setActiveImageIndex((prev) => ({
      ...prev,
      [vehicleId]: ((prev[vehicleId] || 0) - 1 + imagesLength) % imagesLength,
    }));
  };

  useEffect(() => {
    const initialIndices: { [key: string]: number } = {};
    vehicles.forEach((vehicle) => {
      initialIndices[vehicle.id] = 0;
    });
    setActiveImageIndex(initialIndices);

    const timers: NodeJS.Timeout[] = [];
    vehicles.forEach((vehicle) => {
      if (vehicle.images && vehicle.images.length > 1) {
        const timer = setInterval(() => {
          handleNextImage(vehicle.id, vehicle.images.length);
        }, 5000);
        timers.push(timer);
      }
    });

    return () => {
      timers.forEach((timer) => clearInterval(timer));
    };
  }, [vehicles]);

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-fleet-dark mb-4">
            Our Fleet
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Explore our variety of vehicles for all your transportation needs.
            From economy to premium options, we have the perfect ride for every
            occasion.
          </p>
        </motion.div>

        {isLoading ? (
          <div className="flex flex-col justify-center items-center min-h-[300px]">
            <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
            <span className="text-gray-600 text-center">
              Loading vehicles from our fleet...
              <br />
              <span className="text-sm text-gray-500">
                This may take a moment
              </span>
            </span>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No vehicles available at the moment. Please check back later.</p>
          </div>
        ) : (
          <div className="relative">
            <Swiper
              modules={[Navigation, Pagination, Autoplay]}
              spaceBetween={30}
              slidesPerView={1}
              loop={true}
              autoplay={{
                delay: 5000,
                disableOnInteraction: false,
              }}
              pagination={{
                clickable: true,
                el: ".swiper-pagination-custom",
              }}
              navigation={{
                nextEl: ".swiper-button-next-custom",
                prevEl: ".swiper-button-prev-custom",
              }}
              breakpoints={{
                768: {
                  slidesPerView: 2,
                  spaceBetween: 20,
                },
                1024: {
                  slidesPerView: 3,
                  spaceBetween: 30,
                },
              }}
              className="!pb-12"
            >
              {vehicles.map((vehicle) => (
                <SwiperSlide key={vehicle.id} className="h-full">
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full border border-gray-200 flex flex-col">
                    <div className="relative h-60 bg-gray-100">
                      <div className="absolute top-2 left-2 z-10 bg-gradient-to-r from-primary to-fleet-accent text-white px-3 py-1 rounded-full text-xs font-semibold shadow-md">
                        {vehicle.taxiTypeName}
                      </div>

                      {vehicle.images && vehicle.images.length > 0 ? (
                        <div className="relative w-full h-full overflow-hidden">
                          <AnimatePresence mode="wait">
                            <motion.img
                              key={activeImageIndex[vehicle.id] || 0}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              src={
                                vehicle.images[
                                  activeImageIndex[vehicle.id] || 0
                                ]
                              }
                              alt={vehicle.name}
                              className="w-full h-full object-contain object-center"
                              onError={(e) => {
                                e.currentTarget.src = "/placeholder.svg";
                              }}
                            />
                          </AnimatePresence>

                          {vehicle.images.length > 1 && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePrevImage(
                                    vehicle.id,
                                    vehicle.images.length,
                                  );
                                }}
                                className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1.5 transition-colors shadow-md"
                                aria-label="Previous image"
                              >
                                <ChevronLeft className="h-4 w-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleNextImage(
                                    vehicle.id,
                                    vehicle.images.length,
                                  );
                                }}
                                className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1.5 transition-colors shadow-md"
                                aria-label="Next image"
                              >
                                <ChevronRight className="h-4 w-4" />
                              </button>
                              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1.5">
                                {vehicle.images.map((_, idx) => (
                                  <button
                                    key={idx}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveImageIndex((prev) => ({
                                        ...prev,
                                        [vehicle.id]: idx,
                                      }));
                                    }}
                                    className={`w-2 h-2 rounded-full transition-all ${
                                      idx ===
                                      (activeImageIndex[vehicle.id] || 0)
                                        ? "bg-primary scale-125 shadow-sm"
                                        : "bg-gray-300 hover:bg-gray-400"
                                    }`}
                                    aria-label={`Go to image ${idx + 1}`}
                                  />
                                ))}
                              </div>
                            </>
                          )}
                        </div>
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
                    <CardContent className="p-4 md:p-6 flex flex-col flex-grow">
                      <div className="flex flex-row justify-between items-center mb-3">
                        <h3 className="text-xl font-bold">{vehicle.name}</h3>
                        <div className="text-lg font-bold text-primary">
                          {Number(vehicle.perHourPrice).toFixed(0)}{" "}
                          {config.currency}/hr
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm md:text-base mb-3 line-clamp-2 flex-grow">
                        {vehicle.description}
                      </p>
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        {vehicle.features.map((feature, index) => (
                          <div
                            key={index}
                            className="text-sm text-gray-500 flex items-center"
                          >
                            <span className="mr-1.5 text-primary">
                              {feature.icon}
                            </span>
                            {feature.text}
                          </div>
                        ))}
                      </div>
                      <Button className="w-full bg-gradient-to-r from-primary to-fleet-accent text-white hover:opacity-90 mt-auto">
                        Book Now
                      </Button>
                    </CardContent>
                  </Card>
                </SwiperSlide>
              ))}
            </Swiper>

            {/* Custom Navigation */}
            <div className="swiper-button-prev-custom absolute -left-14 top-1/2 transform -translate-y-1/2 z-20 cursor-pointer bg-white/80 hover:bg-white text-primary rounded-full p-2 shadow-md">
              <ChevronLeft className="h-6 w-6" />
            </div>
            <div className="swiper-button-next-custom absolute -right-14 top-1/2 transform -translate-y-1/2 z-20 cursor-pointer bg-white/80 hover:bg-white text-primary rounded-full p-2 shadow-md">
              <ChevronRight className="h-6 w-6" />
            </div>

            {/* Custom Pagination */}
            <div className="swiper-pagination-custom text-center mt-4" />
          </div>
        )}
      </div>
    </section>
  );
};

export default Vehicles;
