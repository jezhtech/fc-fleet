
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const testimonials = [
  {
    id: 1,
    name: 'Sarah Johnson',
    role: 'Regular Customer',
    content: 'Booba Taxi has been my go-to transportation solution for over a year now. The drivers are always professional and the cars are clean and comfortable.',
    avatar: 'https://placehold.co/100/FFD700/333333?text=SJ',
  },
  {
    id: 2,
    name: 'Michael Chen',
    role: 'Business Traveler',
    content: 'As someone who travels frequently for work, Booba\'s rental service has saved me countless times. The process is smooth and the vehicles are top-notch.',
    avatar: 'https://placehold.co/100/FFD700/333333?text=MC',
  },
  {
    id: 3,
    name: 'Emma Rodriguez',
    role: 'Weekend Traveler',
    content: 'I rented an SUV for a weekend trip with friends and it was perfect! Great condition, comfortable, and the pickup/drop-off process was so easy.',
    avatar: 'https://placehold.co/100/FFD700/333333?text=ER',
  },
];

const Testimonials = () => {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-booba-dark">What Our Customers Say</h2>
          <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
            Don't just take our word for it. Hear from our satisfied customers about their experience with Booba Taxi.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} className="border-none shadow-lg card-hover">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="mb-4 w-20 h-20 rounded-full overflow-hidden">
                  <img 
                    src={testimonial.avatar} 
                    alt={testimonial.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-lg font-bold">{testimonial.name}</h3>
                <p className="text-gray-500 text-sm mb-4">{testimonial.role}</p>
                <p className="text-gray-600 italic">"{testimonial.content}"</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
