
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Car, MapPin, User, Bell } from 'lucide-react';

const features = [
  {
    title: 'Quick Bookings',
    description: 'Book a taxi in less than a minute and get on your way.',
    icon: Car,
  },
  {
    title: 'Premium Cars',
    description: 'Choose from our fleet of well-maintained, comfortable vehicles.',
    icon: MapPin,
  },
  {
    title: 'Professional Drivers',
    description: 'Our drivers are trained, vetted, and professional.',
    icon: User,
  },
  {
    title: 'Secure Payments',
    description: 'Multiple payment options for your convenience.',
    icon: Bell,
  },
];

const Features = () => {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-fleet-dark">Why Choose First Class Fleet</h2>
          <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
            Experience the best taxi service and car rental in town with features that make your journey comfortable and hassle-free.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-none shadow-lg card-hover">
              <CardContent className="p-6 text-center">
                <div className="mx-auto mb-4 w-16 h-16 bg-fleet-red/10 rounded-full flex items-center justify-center">
                  <feature.icon className="h-8 w-8 text-fleet-red" />
                </div>
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
