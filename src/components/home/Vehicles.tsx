
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Placeholder cars data
const cars = [
  {
    id: 1,
    name: 'Economy Sedan',
    description: 'Great for city commutes and short trips',
    image: '/placeholder.svg',
    price: 25,
    features: ['4 Passengers', 'AC', '2 Luggage', 'Fuel Efficient']
  },
  {
    id: 2,
    name: 'Comfort SUV',
    description: 'Perfect for families and longer journeys',
    image: '/placeholder.svg',
    price: 35,
    features: ['7 Passengers', 'AC', '3 Luggage', 'Spacious']
  },
  {
    id: 3,
    name: 'Premium Sedan',
    description: 'Luxury for business trips and special occasions',
    image: '/placeholder.svg',
    price: 45,
    features: ['4 Passengers', 'AC', '2 Luggage', 'Premium Features']
  },
];

const Vehicles = () => {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-fleet-dark mb-4">Our Fleet</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Explore our variety of vehicles for all your transportation needs. From economy to premium options, we have the perfect ride for every occasion.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {cars.map((car) => (
            <Card key={car.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-48 bg-gray-200 flex items-center justify-center">
                <img 
                  src={car.image} 
                  alt={car.name}
                  className="h-32 w-32 object-contain"
                />
              </div>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-bold">{car.name}</h3>
                  <div className="text-lg font-bold text-fleet-red">${car.price}/hr</div>
                </div>
                <p className="text-gray-600 mb-4">{car.description}</p>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {car.features.map((feature, index) => (
                    <div key={index} className="text-sm text-gray-500 flex items-center">
                      <span className="mr-1">✓</span> {feature}
                    </div>
                  ))}
                </div>
                <Button className="w-full bg-gradient-to-r from-fleet-red to-fleet-accent text-white hover:opacity-90">
                  Book Now
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-10">
          <Button className="bg-gradient-to-r from-fleet-red to-fleet-accent text-white hover:opacity-90 px-8 py-6 text-lg">
            View All Vehicles
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Vehicles;
