
import React from 'react';
import Layout from '@/components/Layout';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card } from '@/components/ui/card';

const FAQ = () => {
  return (
    <Layout>
      <div className="bg-gradient-to-r from-fleet-red to-fleet-accent py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-white">Frequently Asked Questions</h1>
          <p className="text-white/90 mt-2">Find answers to the most common questions about First Class Fleet</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <Card className="p-6">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-lg font-medium">How do I book a chauffeur service?</AccordionTrigger>
              <AccordionContent className="text-gray-600">
                You can book a chauffeur service through our website by clicking on the "Book Chauffeur" button in the navigation menu. Fill in your pickup and drop-off details, select your preferred vehicle, and confirm your booking. You can also call our customer service at +971 4 XXX XXXX for assistance.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-2">
              <AccordionTrigger className="text-lg font-medium">What areas do you serve in the UAE?</AccordionTrigger>
              <AccordionContent className="text-gray-600">
                First Class Fleet operates throughout the United Arab Emirates, including Dubai, Abu Dhabi, Sharjah, Ajman, Fujairah, Ras Al Khaimah, and Umm Al Quwain. We also provide inter-emirate transfers and services to key destinations within the GCC region.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-3">
              <AccordionTrigger className="text-lg font-medium">How do I pay for my booking?</AccordionTrigger>
              <AccordionContent className="text-gray-600">
                We accept various payment methods including credit/debit cards, Apple Pay, Google Pay, and cash payments to the driver. For corporate clients, we also offer account-based billing options with monthly invoicing.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-4">
              <AccordionTrigger className="text-lg font-medium">What if I need to cancel my booking?</AccordionTrigger>
              <AccordionContent className="text-gray-600">
                Our cancellation policy allows free cancellation up to 2 hours before the scheduled pickup time. Cancellations made less than 2 hours before the scheduled time may incur a 30% charge of the total booking amount. No-shows will be charged the full fare.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-5">
              <AccordionTrigger className="text-lg font-medium">Do you provide airport transfers?</AccordionTrigger>
              <AccordionContent className="text-gray-600">
                Yes, we specialize in airport transfers to and from all major airports in the UAE, including Dubai International Airport, Abu Dhabi International Airport, and Sharjah International Airport. Our drivers monitor flight arrivals and will adjust pickup times accordingly in case of delays.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-6">
              <AccordionTrigger className="text-lg font-medium">What types of vehicles are available?</AccordionTrigger>
              <AccordionContent className="text-gray-600">
                Our fleet includes a wide range of luxury vehicles including sedans (Mercedes E-Class, BMW 5 Series), SUVs (Range Rover, Cadillac Escalade), vans (Mercedes V-Class), and premium luxury vehicles (Mercedes S-Class, Rolls Royce). All vehicles are maintained to the highest standards of comfort and safety.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-7">
              <AccordionTrigger className="text-lg font-medium">Can I hire a car for multiple days?</AccordionTrigger>
              <AccordionContent className="text-gray-600">
                Yes, we offer multi-day chauffeur services with competitive daily rates. For extended bookings of more than 3 days, please contact our customer service for special rates and arrangements.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-8">
              <AccordionTrigger className="text-lg font-medium">Are your drivers professionally trained?</AccordionTrigger>
              <AccordionContent className="text-gray-600">
                All our chauffeurs are professionally trained, licensed, and have extensive knowledge of UAE roads and destinations. They undergo rigorous background checks, defensive driving training, and customer service excellence programs to ensure the highest quality of service.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>
      </div>
    </Layout>
  );
};

export default FAQ;
