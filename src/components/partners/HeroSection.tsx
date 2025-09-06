import * as React from "react";
import { Button } from "@/components/ui/button";

export const HeroSection: React.FC = () => {
  const stats = [
    { value: "700+", label: "Partners are already earning with us" },
    { value: "790,000+", label: "Clients have appreciated our services" },
    { value: "1,500,000+", label: "Trips have been successfully completed" },
  ];

  return (
    <div className="w-full space-y-8 container">
      {/* Hero Section */}
      <div className="relative h-[75vh] bg-background text-white rounded-xl overflow-hidden border border-border">
        <div className="absolute inset-0">
          <img
            src="/assets/partner_hero.png"
            alt="Man in a luxury car"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0"></div>
        </div>

        <div className="absolute container mx-auto px-20 bottom-20">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white drop-shadow-lg">
              Do you own an autopark?
            </h1>
            <p className="mt-4 max-w-md text-lg text-gray-200 drop-shadow-md">
              Make First Class Fleet your partner and perform profitable orders.
            </p>
            <div className="mt-8">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white font-bold text-lg px-8 py-6"
              >
                Become a partner
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-around items-center text-center divide-y-2 md:divide-y-0 md:divide-x-2 divide-border">
          {stats.map((stat, index) => (
            <div key={index} className="py-6 md:py-0 md:px-8 flex-1">
              <p className="text-4xl font-bold text-foreground">{stat.value}</p>
              <span className=" text-gray-500">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
