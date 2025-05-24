
import React from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';

const About = () => {
  return (
    <Layout>
      <div className="bg-gradient-to-r from-fleet-red to-fleet-accent py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">About Us</h1>
          <p className="text-white/90 text-lg max-w-2xl mx-auto">
            Learn about our commitment to excellence in chauffeur services and hourly car rentals.
          </p>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col md:flex-row gap-12 items-center mb-16">
          <div className="md:w-1/2">
            <h2 className="text-3xl font-bold text-fleet-dark mb-6 flex items-center">
              <Info className="mr-2 h-6 w-6" />
              Our Story
            </h2>
            <p className="text-gray-700 mb-4">
              First Class Fleet began with a vision to transform the transportation industry by providing exceptional service that goes beyond just getting from point A to point B.
            </p>
            <p className="text-gray-700 mb-4">
              Founded in 2015, we started with just three vehicles and a commitment to customer satisfaction. Today, we're proud to have expanded our fleet to over 50 vehicles while maintaining our dedication to quality service.
            </p>
            <p className="text-gray-700">
              Our mission remains unchanged: to provide reliable, comfortable, and affordable transportation solutions for all our customers' needs, whether it's a quick ride across town or a multi-day rental.
            </p>
          </div>
          <div className="md:w-1/2">
            <div className="bg-gray-200 h-80 rounded-lg flex items-center justify-center">
              <span className="text-gray-400">Company Image</span>
            </div>
          </div>
        </div>
        
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-fleet-dark mb-8 text-center">Our Values</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-fleet-red/10 rounded-full flex items-center justify-center mb-4">
                <span className="text-fleet-red text-xl">✓</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Reliability</h3>
              <p className="text-gray-600">
                We understand the importance of punctuality and dependability when it comes to transportation services.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-fleet-red/10 rounded-full flex items-center justify-center mb-4">
                <span className="text-fleet-red text-xl">★</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Quality</h3>
              <p className="text-gray-600">
                From our vehicles to our chauffeurs, we maintain the highest standards of quality in everything we do.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-fleet-red/10 rounded-full flex items-center justify-center mb-4">
                <span className="text-fleet-red text-xl">♥</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Customer Focus</h3>
              <p className="text-gray-600">
                Your satisfaction is our priority. We go above and beyond to ensure an exceptional experience.
              </p>
            </div>
          </div>
        </div>
        
        <div className="text-center">
          <h2 className="text-3xl font-bold text-fleet-dark mb-6">Ready to Experience Our Service?</h2>
          <p className="text-gray-700 mb-8 max-w-2xl mx-auto">
            Join our thousands of satisfied customers and discover why we're the preferred choice for transportation services.
          </p>
          <Button className="bg-gradient-to-r from-fleet-red to-fleet-accent text-white hover:opacity-90 px-8 py-6 text-lg">
            Book a Chauffeur
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default About;
