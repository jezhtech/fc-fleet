
import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import BookTaxiForm from './BookTaxiForm';

const CallToAction = () => {
  return (
    <section className="py-16 bg-fleet-red/10">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-fleet-dark mb-6">
          Ready to Experience Our Service?
        </h2>
        <p className="text-gray-700 max-w-2xl mx-auto mb-8">
          Whether you need a chauffeur right now or want to rent a car hourly for your next trip,
          we've got you covered. Join our satisfied customers today!
        </p>
        <div className="flex flex-wrap justify-center">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-fleet-red to-fleet-accent text-white hover:opacity-90 text-lg px-6 py-6">
                Book a Chauffeur
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <div className="p-4">
                <h3 className="text-xl font-bold mb-4">Book a Chauffeur</h3>
                <BookTaxiForm />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
