
import React from 'react';
import { MapPin, Calendar, CreditCard, Car } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      icon: <MapPin className="h-10 w-10 text-fleet-red" />,
      title: 'Set Your Location',
      description: 'Enter your pickup and drop-off locations to find available taxis nearby.'
    },
    {
      icon: <Car className="h-10 w-10 text-fleet-red" />,
      title: 'Choose Vehicle Type',
      description: 'Select from different vehicle types based on your needs and group size.'
    },
    {
      icon: <Calendar className="h-10 w-10 text-fleet-red" />,
      title: 'Book Instantly or Schedule',
      description: 'Get a taxi right away or schedule a pickup for a later time.'
    },
    {
      icon: <CreditCard className="h-10 w-10 text-fleet-red" />,
      title: 'Pay & Go',
      description: 'Pay securely through our platform and enjoy your ride with our professional drivers.'
    }
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-fleet-dark mb-4">How It Works</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Booking a taxi or renting a car with First Class Fleet is quick and easy. Follow these simple steps and you'll be on your way in no time.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <div className="flex flex-col items-center text-center">
                <div className="p-3 bg-fleet-red/10 rounded-full mb-4">
                  {step.icon}
                </div>
                <h3 className="text-xl font-semibold text-fleet-dark mb-3">
                  <span className="inline-block bg-fleet-red text-white w-6 h-6 rounded-full text-sm mr-2">
                    {index + 1}
                  </span>
                  {step.title}
                </h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
