
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Map, MapPin } from 'lucide-react';
import { toast } from 'sonner';

const MapSection = () => {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');

  const handleFareEstimate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin || !destination) {
      toast.error('Please enter both pickup and drop-off locations');
      return;
    }
    toast.success('Calculating fare estimate...');
    // In a real app, this would call an API to calculate the fare
  };

  return (
    <section className="py-16 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-fleet-dark mb-4">Fare Estimate</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Get a quick estimate of your fare before booking your ride.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="order-2 md:order-1 animate-fade-in">
            <Card className="shadow-lg overflow-hidden">
              <div className="bg-gray-200 h-64 relative">
                {/* This is a placeholder for the map */}
                <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                  <Map className="h-20 w-20 text-gray-400" />
                  <span className="absolute text-sm text-gray-600">Interactive map will be integrated here</span>
                </div>
              </div>
            </Card>
          </div>
          
          <div className="order-1 md:order-2 animate-scale-in">
            <Card className="p-6">
              <form onSubmit={handleFareEstimate}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="origin" className="text-sm font-medium mb-1 block">Pickup Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                      <Input 
                        id="origin" 
                        className="pl-10" 
                        placeholder="Enter pickup address"
                        value={origin}
                        onChange={(e) => setOrigin(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="destination" className="text-sm font-medium mb-1 block">Drop-off Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                      <Input 
                        id="destination" 
                        className="pl-10" 
                        placeholder="Enter destination address"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full text-white font-medium bg-gradient-to-r from-fleet-red to-fleet-accent hover:opacity-90"
                  >
                    Calculate Fare
                  </Button>
                </div>
              </form>
              
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-semibold mb-2">Available Vehicle Types:</h4>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="justify-start">
                    <span className="mr-2">🚗</span> Economy
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <span className="mr-2">🚕</span> Comfort
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <span className="mr-2">🚙</span> SUV
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <span className="mr-2">🏎️</span> Premium
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MapSection;
