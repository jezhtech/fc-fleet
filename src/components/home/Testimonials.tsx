import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";

// Expanded testimonials with more reviews and real avatar URLs
const testimonials = [
  {
    id: 1,
    name: "Sarah Johnson",
    role: "Regular Customer",
    content:
      "Booba Taxi has been my go-to transportation solution for over a year now. The drivers are always professional and the cars are clean and comfortable.",
    rating: 5,
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    location: "Dubai Marina",
  },
  {
    id: 2,
    name: "Michael Chen",
    role: "Business Traveler",
    content:
      "As someone who travels frequently for work, Booba's rental service has saved me countless times. The process is smooth and the vehicles are top-notch.",
    rating: 5,
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    location: "Downtown Dubai",
  },
  {
    id: 3,
    name: "Emma Rodriguez",
    role: "Weekend Traveler",
    content:
      "I rented an SUV for a weekend trip with friends and it was perfect! Great condition, comfortable, and the pickup/drop-off process was so easy.",
    rating: 5,
    avatar: "https://randomuser.me/api/portraits/women/68.jpg",
    location: "Palm Jumeirah",
  },
  {
    id: 4,
    name: "Ahmed Hassan",
    role: "Family Travel",
    content:
      "We needed a spacious vehicle for our family vacation and Booba delivered! The minivan was immaculate and our driver was extremely helpful with our luggage.",
    rating: 4,
    avatar: "https://randomuser.me/api/portraits/men/75.jpg",
    location: "Sharjah",
  },
  {
    id: 5,
    name: "Priya Sharma",
    role: "Airport Transfer",
    content:
      "After a long flight, it was such a relief to have a reliable pickup waiting. The driver tracked my flight and was there despite the delay. Excellent service!",
    rating: 5,
    avatar: "https://randomuser.me/api/portraits/women/26.jpg",
    location: "Abu Dhabi",
  },
];

const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Automatic slide change
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
    }, 7000);

    return () => clearInterval(timer);
  }, []);

  // Functions to handle navigation
  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? testimonials.length - 1 : prevIndex - 1,
    );
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  // Helper function to render stars based on rating
  const renderStars = (rating: number) => {
    return Array(5)
      .fill(0)
      .map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
        />
      ));
  };

  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full translate-x-1/3 translate-y-1/2"></div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-fleet-dark mb-4">
            What Our Customers Say
          </h2>
          <div className="h-1 w-24 bg-primary mx-auto my-6"></div>
          <p className="mt-4 text-gray-600 max-w-2xl mx-auto text-lg">
            Don't just take our word for it. Hear from our satisfied customers
            about their experience with Booba Taxi.
          </p>
        </motion.div>

        <div className="relative max-w-4xl mx-auto px-4 md:px-0">
          {/* Navigation buttons */}
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white/80 hover:bg-white text-primary rounded-full p-3 shadow-md hidden md:block"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white/80 hover:bg-white text-primary rounded-full p-3 shadow-md hidden md:block"
            aria-label="Next testimonial"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* Testimonial carousel */}
          <div
            className="overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="border-none shadow-xl overflow-hidden bg-white">
                  <CardContent className="p-0">
                    <div className="grid md:grid-cols-2">
                      {/* Left side - Customer info */}
                      <div className="bg-primary/10 p-8 flex flex-col justify-center items-center text-center">
                        <div className="relative mb-6">
                          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
                            <img
                              src={testimonials[currentIndex].avatar}
                              alt={testimonials[currentIndex].name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = `https://ui-avatars.com/api/?name=${testimonials[currentIndex].name}&background=FFD700&color=333333&size=100`;
                              }}
                            />
                          </div>
                          <div className="absolute -bottom-2 right-0 bg-primary text-white text-xs py-1 px-2 rounded-full">
                            {testimonials[currentIndex].location}
                          </div>
                        </div>
                        <h3 className="text-xl md:text-2xl font-bold text-fleet-dark mb-1">
                          {testimonials[currentIndex].name}
                        </h3>
                        <p className="text-gray-500 mb-3">
                          {testimonials[currentIndex].role}
                        </p>
                        <div className="flex space-x-1 mb-4">
                          {renderStars(testimonials[currentIndex].rating)}
                        </div>
                      </div>

                      {/* Right side - Testimonial content */}
                      <div className="p-8 flex flex-col justify-center relative">
                        <Quote className="absolute top-6 left-6 h-10 w-10 text-primary/20" />
                        <p className="text-gray-700 text-lg relative z-10 mb-6 italic">
                          "{testimonials[currentIndex].content}"
                        </p>
                        <div className="mt-auto">
                          <div className="h-1 w-12 bg-primary"></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Dots navigation */}
          <div className="flex justify-center mt-8 space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  currentIndex === index
                    ? "bg-primary scale-110 w-8"
                    : "bg-gray-300 hover:bg-gray-400"
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
