import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import BookTaxiForm from '../home/booking-form/BookTaxiForm';
import RentCarForm from './RentCarForm';
import { motion } from 'framer-motion';
import { ChevronRight, CheckCircle } from 'lucide-react';

const Hero = () => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
      {/* Background video with overlay */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <video 
          src="/assets/videoplayback.mp4"
          className="absolute inset-0 min-w-[100%] min-h-[100%] w-auto h-auto object-cover"
          autoPlay
          loop
          muted
          playsInline
          style={{ 
            transform: 'scale(1.4)',
            objectPosition: 'center center'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-fleet-dark/90 via-fleet-dark/80 to-fleet-dark/70"></div>
      </div>
      
      {/* Red accent line */}
      <div className="absolute left-0 top-0 bottom-0 w-1 md:w-2 bg-fleet-red z-10"></div>
      
      <div className="container mx-auto px-4 relative z-10 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="lg:col-span-6 text-center lg:text-left"
          >
            <div className="inline-block border-b-2 border-fleet-red pb-2 mb-6">
              <span className="text-white/80 uppercase tracking-widest text-sm">First Class Fleet</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-8 leading-tight">
              The Art of <span className="text-fleet-red">Luxury</span> Transportation in Dubai
            </h1>
            
            <p className="text-white/80 text-lg mb-8 max-w-xl">
              Experience unparalleled chauffeur services tailored for those who expect nothing but excellence. Your journey deserves our premium touch.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 mb-12">
              {['Professional Chauffeurs', 'Premium Fleet', 'Fixed Pricing'].map((item, index) => (
                <div key={index} className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-fleet-red mr-2 flex-shrink-0" />
                  <span className="text-white font-medium">{item}</span>
                </div>
              ))}
            </div>
            
            <div className="flex flex-wrap gap-4 mb-8 justify-center lg:justify-start">
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    className="bg-fleet-red hover:bg-fleet-red/90 text-white font-medium text-lg px-8 py-6 rounded-none shadow-lg"
                  >
                    Book Your Chauffeur
                    <ChevronRight className={`ml-2 transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-0 rounded-none">
                  <div className="p-6 bg-white">
                    <h3 className="text-xl font-bold mb-4 flex items-center">
                      <span className="w-2 h-6 bg-fleet-red mr-3"></span>
                      Book Premium Transportation
                    </h3>
                    <BookTaxiForm />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="lg:col-span-6"
          >
            <Card className="rounded-none overflow-hidden shadow-2xl border-0 bg-white/95">
              <div className="border-t-4 border-fleet-red">
                <Tabs defaultValue="taxi" className="w-full">
                  <TabsList className="grid grid-cols-2 w-full rounded-none mb-0 bg-gray-100">
                    <TabsTrigger 
                      value="taxi" 
                      className="data-[state=active]:bg-white data-[state=active]:shadow-none py-4 rounded-none"
                    >
                      Chauffeur Service
                    </TabsTrigger>
                    <TabsTrigger 
                      value="rental" 
                      className="data-[state=active]:bg-white data-[state=active]:shadow-none py-4 rounded-none"
                    >
                      Hourly Hire
                    </TabsTrigger>
                  </TabsList>
                  <div className="p-6">
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
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
