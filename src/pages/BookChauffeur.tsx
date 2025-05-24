
import React from 'react';
import Layout from '@/components/Layout';
import { Book } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import BookTaxiForm from '@/components/home/BookTaxiForm';

const BookChauffeur = () => {
  return (
    <Layout>
      <div className="bg-gradient-to-r from-fleet-red to-fleet-accent py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Book a Chauffeur</h1>
          <p className="text-white/90 text-lg max-w-2xl mx-auto">
            Reliable and professional chauffeur service for your transportation needs.
          </p>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div>
            <h2 className="text-3xl font-bold text-fleet-dark mb-6 flex items-center">
              <Book className="mr-2 h-6 w-6" />
              Book a Chauffeur
            </h2>
            <p className="text-gray-700 mb-8">
              Need a ride? Our chauffeur service offers comfortable and reliable transportation. Enter your details below to book.
            </p>
            
            <Card className="p-6 shadow-lg">
              <BookTaxiForm />
            </Card>
          </div>
          
          <div>
            <h2 className="text-3xl font-bold text-fleet-dark mb-6">Why Choose Our Chauffeur Service?</h2>
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6 shadow-md">
                <h3 className="text-xl font-bold text-fleet-dark mb-2">1. Professional Drivers</h3>
                <p className="text-gray-700">Experienced and courteous chauffeurs committed to providing exceptional service.</p>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-md">
                <h3 className="text-xl font-bold text-fleet-dark mb-2">2. Comfortable Vehicles</h3>
                <p className="text-gray-700">Well-maintained fleet of vehicles to ensure a comfortable ride every time.</p>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-md">
                <h3 className="text-xl font-bold text-fleet-dark mb-2">3. Punctual Service</h3>
                <p className="text-gray-700">We value your time and ensure timely pickups and drop-offs.</p>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-md">
                <h3 className="text-xl font-bold text-fleet-dark mb-2">4. Transparent Pricing</h3>
                <p className="text-gray-700">Clear pricing with no hidden charges or surprise fees.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BookChauffeur;
