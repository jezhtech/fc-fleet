import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Clock, Smartphone, TrendingUp, Users } from "lucide-react";
import * as React from "react";

export const Offer: React.FC = () => {
  const offers = [
    {
      icon: <Users className="h-8 w-8 text-inherit" />,
      title: "Access to More Clients",
      description:
        "Gain access to our extensive network of corporate and leisure clients, ensuring a steady stream of booking requests.",
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-inherit" />,
      title: "Increased Earnings",
      description:
        "Benefit from our competitive commission rates and optimized pricing to maximize your profitability on every ride.",
    },
    {
      icon: <Smartphone className="h-8 w-8 text-inherit" />,
      title: "State-of-the-Art Technology",
      description:
        "Utilize our intuitive partner app to manage bookings, track earnings, and communicate with clients seamlessly.",
    },
    {
      icon: <Clock className="h-8 w-8 text-inherit" />,
      title: "Flexible Working Hours",
      description:
        "Enjoy the freedom to choose your own working hours. Drive as much or as little as you want, whenever you want.",
    },
  ];

  return (
    <section className="py-12 bg-background sm:py-16 lg:py-20">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl xl:text-5xl">
            What do we <span className="text-primary">offer?</span>
          </h2>
          <p className="max-w-2xl mx-auto mt-4 text-base font-normal text-muted-foreground sm:mt-6 sm:text-lg">
            Partnering with First Class Fleet means more than just getting
            rides. It means joining a community dedicated to excellence.
          </p>
        </div>

        <div className="grid gap-6 mt-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8 xl:gap-10">
          <div className="row-span-2">
            <img
              src="/assets/partner_offer.jpg"
              className="h-full object-cover rounded-xl"
            />
          </div>
          {offers.map((offer, index) => (
            <Card
              key={index}
              className={cn(
                "overflow-hidden rounded-xl text-center border-border/80 hover:border-primary/60 hover:shadow-lg transition-all duration-300",
                index === 0 ? "bg-primary text-white" : "bg-muted/50",
              )}
            >
              <CardHeader>
                <div
                  className={cn(
                    "flex mb-4",
                    index === 0 ? "text-white" : "text-primary",
                  )}
                >
                  {offer.icon}
                </div>
                <CardTitle className="text-left">{offer.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={cn("text-left", index === 0 ? "text-gray-300" : "text-muted-foreground")}>
                  {offer.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
