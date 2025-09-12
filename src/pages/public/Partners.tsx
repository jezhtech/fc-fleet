import Vehicles from "@/components/home/Vehicles";
import Layout from "@/components/Layout";
import Meta from "@/components/Meta";
import { ApplicationForm } from "@/components/partners/ApplicationForm";
import { Checklist } from "@/components/partners/Checklist";
import { ContactUs } from "@/components/partners/ContactUs";
import { FAQ } from "@/components/partners/Faq";
import { HeroSection } from "@/components/partners/HeroSection";
import { Offer } from "@/components/partners/Offer";
import { Start } from "@/components/partners/Start";
import * as React from "react";

const Partners: React.FC = () => {
  return (
    <Layout>
      <Meta
        title="Become a Partner | First Class Fleet"
        description="Join First Class Fleet as a partner. If you own an autopark or provide transportation services, partner with us for profitable orders and a network of clients."
        keywords="become a partner, chauffeur partnership, autopark partner, transportation business, profitable orders, First Class Fleet partners"
        canonicalUrl="https://firstclassfleet.com/partners"
        location="Dubai, UAE"
      />
      <HeroSection />
      <Offer />
      <Vehicles />
      <Checklist />
      <Start />
      <FAQ />
      <ContactUs/>
      <ApplicationForm/>
    </Layout>
  );
};

export default Partners;
