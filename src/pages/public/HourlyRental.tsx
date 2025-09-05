import React from "react";
import Layout from "@/components/Layout";
import { Car } from "lucide-react";
import { Card } from "@/components/ui/card";
import RentCarForm from "@/components/home/RentCarForm";
import { formatCurrency } from "@/utils/currency";

const HourlyRental = () => {
  return (
    <Layout>
      <div className="bg-gradient-to-r from-primary to-fleet-accent py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Hourly Car Rental
          </h1>
          <p className="text-white/90 text-lg max-w-2xl mx-auto">
            Flexible car rentals by the hour. Perfect for short trips, errands,
            or business meetings.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div>
            <h2 className="text-3xl font-bold text-fleet-dark mb-6 flex items-center">
              <Car className="mr-2 h-6 w-6" />
              Rent a Car by the Hour
            </h2>
            <p className="text-gray-700 mb-8">
              Need a car for just a few hours? Our hourly rental service is
              perfect for short trips, errands, or business meetings. Enter your
              details below to book.
            </p>

            <Card className="p-6 shadow-lg">
              <RentCarForm />
            </Card>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-fleet-dark mb-6">
              How Hourly Rentals Work
            </h2>
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6 shadow-md">
                <h3 className="text-xl font-bold text-fleet-dark mb-2">
                  1. Book Your Car
                </h3>
                <p className="text-gray-700">
                  Choose your preferred vehicle type, pickup location, date, and
                  duration.
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-md">
                <h3 className="text-xl font-bold text-fleet-dark mb-2">
                  2. Pickup Your Vehicle
                </h3>
                <p className="text-gray-700">
                  Arrive at the designated location, complete a quick check, and
                  hit the road.
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-md">
                <h3 className="text-xl font-bold text-fleet-dark mb-2">
                  3. Use as Needed
                </h3>
                <p className="text-gray-700">
                  Drive as needed within your booked time. Fuel is included for
                  up to 100 miles per booking.
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-md">
                <h3 className="text-xl font-bold text-fleet-dark mb-2">
                  4. Return the Vehicle
                </h3>
                <p className="text-gray-700">
                  Return the car to the same location when your rental period is
                  complete.
                </p>
              </div>
            </div>

            <div className="mt-8 bg-primary/10 p-6 rounded-lg">
              <h3 className="text-xl font-bold text-fleet-dark mb-2">
                Hourly Rates
              </h3>
              <p className="text-gray-700 mb-4">
                Our competitive hourly rates include insurance and maintenance.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-md shadow-sm">
                  <p className="text-lg font-bold text-fleet-dark">Economy</p>
                  <p className="text-primary font-bold">
                    {formatCurrency(12)}/hour
                  </p>
                </div>
                <div className="bg-white p-4 rounded-md shadow-sm">
                  <p className="text-lg font-bold text-fleet-dark">Comfort</p>
                  <p className="text-primary font-bold">
                    {formatCurrency(18)}/hour
                  </p>
                </div>
                <div className="bg-white p-4 rounded-md shadow-sm">
                  <p className="text-lg font-bold text-fleet-dark">SUV</p>
                  <p className="text-primary font-bold">
                    {formatCurrency(24)}/hour
                  </p>
                </div>
                <div className="bg-white p-4 rounded-md shadow-sm">
                  <p className="text-lg font-bold text-fleet-dark">Premium</p>
                  <p className="text-primary font-bold">
                    {formatCurrency(35)}/hour
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default HourlyRental;
