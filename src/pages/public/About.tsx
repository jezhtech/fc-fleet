import React from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Info, Award, Clock, Shield, Users, Star } from "lucide-react";
import { Link } from "react-router-dom";
import Meta from "@/components/Meta";

const About = () => {
  return (
    <Layout>
      <Meta
        title="About First Class Fleet | Leading Chauffeur Service in UAE"
        description="Dubai's premier chauffeur service since 2015, providing luxury transportation across UAE with professional drivers and premium vehicles. Learn about our services."
        keywords="chauffeur service UAE, Dubai luxury transportation, about First Class Fleet, premium car service UAE, professional drivers Dubai, chauffeur company history"
        canonicalUrl="https://firstclassfleet.com/about"
        location="Dubai, UAE"
      />
      <div className="bg-gradient-to-r from-primary to-fleet-accent py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            About First Class Fleet | Leading Chauffeur Service in UAE
          </h1>
          <p className="text-white/90 text-lg max-w-3xl mx-auto">
            Dubai's premier chauffeur and luxury transportation company
            providing exceptional service across the United Arab Emirates since
            2015.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col md:flex-row gap-12 items-center mb-16">
          <div className="md:w-1/2">
            <h2 className="text-3xl font-bold text-fleet-dark mb-6 flex items-center">
              <Info className="mr-2 h-6 w-6" />
              UAE's Premier Chauffeur Service
            </h2>
            <p className="text-gray-700 mb-4">
              First Class Fleet was established in Dubai in 2015 with a vision
              to transform the luxury transportation industry across the UAE by
              providing exceptional chauffeur services that meet international
              standards of excellence.
            </p>
            <p className="text-gray-700 mb-4">
              What began with a select fleet of premium vehicles has grown into
              one of the UAE's most respected chauffeur services, now operating
              over 50 luxury vehicles including Mercedes-Benz, BMW, and Lexus
              models. Our reach extends from Dubai to Abu Dhabi, Sharjah, and
              all Emirates.
            </p>
            <p className="text-gray-700">
              Today, we proudly serve business executives, tourists, VIPs, and
              residents with professional chauffeur services for airport
              transfers, corporate travel, intercity journeys, and special
              events throughout the UAE.
            </p>
          </div>
          <div className="md:w-1/2">
            <div className="bg-gray-200 h-80 rounded-lg overflow-hidden">
              <img
                src="/images/dubai-chauffeur-service.jpg"
                alt="First Class Fleet Dubai Chauffeur Service"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src =
                    "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1074&q=80";
                }}
              />
            </div>
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-3xl font-bold text-fleet-dark mb-8 text-center">
            Why Choose Our Dubai Chauffeur Service
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Clock className="text-primary h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">24/7 Reliability</h3>
              <p className="text-gray-600">
                Our chauffeurs are available round-the-clock in Dubai, Abu
                Dhabi, and all major UAE cities, ensuring timely service
                regardless of your schedule.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Award className="text-primary h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Premium Fleet</h3>
              <p className="text-gray-600">
                Experience luxury with our meticulously maintained vehicles,
                including the latest models from Mercedes-Benz, BMW, and other
                prestigious brands.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Users className="text-primary h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">
                Professional Chauffeurs
              </h3>
              <p className="text-gray-600">
                Our multilingual, professionally trained chauffeurs have
                extensive knowledge of Dubai and UAE roads, ensuring a smooth
                and comfortable journey.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-3xl font-bold text-fleet-dark mb-6 text-center">
            Our Premium UAE Transportation Services
          </h2>
          <div className="grid md:grid-cols-2 gap-8 mt-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-bold mb-2 flex items-center">
                <Star className="mr-2 h-5 w-5 text-primary" />
                Dubai Airport Transfers
              </h3>
              <p className="text-gray-600 mb-4">
                Seamless pickups and drop-offs at Dubai International Airport
                (DXB) and Al Maktoum International Airport (DWC) with flight
                tracking and free waiting time.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-bold mb-2 flex items-center">
                <Star className="mr-2 h-5 w-5 text-primary" />
                Corporate Transportation
              </h3>
              <p className="text-gray-600 mb-4">
                Specialized business travel services for executives visiting
                Dubai and Abu Dhabi, with priority scheduling and dedicated
                account management.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-bold mb-2 flex items-center">
                <Star className="mr-2 h-5 w-5 text-primary" />
                Intercity Travel
              </h3>
              <p className="text-gray-600 mb-4">
                Luxury chauffeur service between Dubai, Abu Dhabi, Sharjah,
                Ajman, and all Emirates with fixed transparent pricing and
                comfortable vehicles.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-bold mb-2 flex items-center">
                <Star className="mr-2 h-5 w-5 text-primary" />
                Hourly Chauffeur Hire
              </h3>
              <p className="text-gray-600 mb-4">
                Flexible hourly chauffeur service in Dubai for business
                meetings, shopping, or sightseeing with the convenience of
                having a dedicated driver at your disposal.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold text-fleet-dark mb-6">
            Experience Dubai's Finest Chauffeur Service Today
          </h2>
          <p className="text-gray-700 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied clients who trust First Class Fleet for
            premium chauffeur services across Dubai, Abu Dhabi, and the entire
            UAE.
          </p>
          <Link to="/book-chauffeur">
            <Button className="bg-gradient-to-r from-primary to-fleet-accent text-white hover:opacity-90 px-8 py-6 text-lg">
              Book Your Dubai Chauffeur
            </Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default About;
