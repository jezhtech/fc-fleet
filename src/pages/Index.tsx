import React from 'react';
import Layout from '@/components/Layout';
import Hero from '@/components/home/Hero';
import Features from '@/components/home/Features';
import Vehicles from '@/components/home/Vehicles';
import Testimonials from '@/components/home/Testimonials';
import CallToAction from '@/components/home/CallToAction';
import MapSection from '@/components/home/MapSection';
import HowItWorks from '@/components/home/HowItWorks';
import { Link } from 'react-router-dom';

const Index = () => {
  return (
    <Layout>
      <Hero />
      <HowItWorks />
      <Features />
      <MapSection />
      <Vehicles />
      <Testimonials />
      <CallToAction />
      <div className="flex flex-col space-y-4">
        <Link to="/firebase-example" className="text-blue-500 hover:underline">
          Firebase Example
        </Link>
      </div>
    </Layout>
  );
};

export default Index;
