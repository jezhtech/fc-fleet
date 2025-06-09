import React from 'react';
import Layout from '@/components/Layout';
import Hero from '@/components/home/Hero';
import Vehicles from '@/components/home/Vehicles';
import Testimonials from '@/components/home/Testimonials';
import CallToAction from '@/components/home/CallToAction';
import SimpleMapSection from '@/components/home/SimpleMapSection';
import PremiumFeatures from '@/components/home/HowItWorks';
import Meta from '@/components/Meta';

const Index = () => {
  return (
    <Layout>
      <Meta 
        title="Premium Chauffeur & Luxury Car Service in Dubai, UAE"
        description="First Class Fleet offers premium chauffeur services in Dubai, Abu Dhabi, and across UAE. Book professional drivers, luxury vehicles, and airport transfers. Available 24/7."
        keywords="chauffeur service Dubai, luxury car rental UAE, professional drivers Abu Dhabi, airport transfer Dubai, Dubai chauffeur service, private driver UAE"
        canonicalUrl="https://firstclassfleet.com"
        location="Dubai, UAE"
      />
      <Hero />
      <PremiumFeatures />
      <SimpleMapSection />
      <Vehicles />
      <Testimonials />
      <CallToAction />
    </Layout>
  );
};

export default Index;
