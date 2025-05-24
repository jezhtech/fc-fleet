import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import BookTaxiForm from '../home/booking-form/BookTaxiForm';
import RentCarForm from './RentCarForm';

const Hero = () => {
  return (
    <div className="bg-gradient-to-br from-fleet-red/90 to-fleet-accent pt-10 pb-16 md:pt-16 md:pb-24">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center gap-8">
          <div className="lg:w-1/2 mb-6 lg:mb-0">
            <h1 className="text-white text-4xl md:text-5xl lg:text-6xl font-bold mb-4 animate-fade-in">
              Your Reliable Ride & Rental Solution
            </h1>
            <p className="text-white/90 text-lg mb-6 max-w-lg animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Book a chauffeur for your immediate travel needs or rent a car hourly for longer trips.
              First Class Fleet offers comfort, reliability, and affordability.
            </p>
            <div className="flex flex-wrap gap-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-white text-fleet-red hover:bg-white/90 hover:shadow-md transition-all text-lg px-6 py-4 rounded-md">
                    Book a Chauffeur
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-0">
                  <div className="p-4 bg-gradient-to-r from-fleet-red/10 to-fleet-accent/10">
                    <h3 className="text-lg font-bold mb-3">Book a Chauffeur</h3>
                    <BookTaxiForm />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          <div className="lg:w-1/2 lg:pl-4 w-full max-w-md lg:max-w-full mx-auto animate-scale-in">
            <Card className="rounded-xl overflow-hidden shadow-xl border-0">
              <div className="bg-gradient-to-r from-gray-50 to-white p-0">
                <Tabs defaultValue="taxi" className="w-full">
                  <TabsList className="grid grid-cols-2 w-full rounded-t-none mb-0 bg-gray-100/80">
                    <TabsTrigger 
                      value="taxi" 
                      className="data-[state=active]:bg-white data-[state=active]:shadow-none py-3"
                    >
                      Book a Chauffeur
                    </TabsTrigger>
                    <TabsTrigger 
                      value="rental" 
                      className="data-[state=active]:bg-white data-[state=active]:shadow-none py-3"
                    >
                      Hourly
                    </TabsTrigger>
                  </TabsList>
                  <div className="p-4">
                    <TabsContent value="taxi" className="mt-0 pt-2">
                      <BookTaxiForm />
                    </TabsContent>
                    <TabsContent value="rental" className="mt-0 pt-2">
                      <RentCarForm />
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
