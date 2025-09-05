import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import BookTaxiForm from "./booking-form/BookTaxiForm";
import { motion } from "framer-motion";
import { PhoneCall, Calendar, ChevronRight } from "lucide-react";
import config from "@/config";

const CallToAction = () => {
  return (
    <section className="py-24 relative overflow-hidden bg-white">
      {/* Red accent lines */}
      <div className="absolute left-0 top-0 h-1 w-1/3 bg-primary"></div>
      <div className="absolute right-0 bottom-0 h-1 w-1/3 bg-primary"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center mb-6">
                <div className="w-12 h-1 bg-primary mr-4"></div>
                <span className="text-gray-500 uppercase tracking-wider text-sm font-medium">
                  Book Now
                </span>
              </div>

              <h2 className="text-3xl md:text-4xl font-bold text-fleet-dark mb-6 leading-tight">
                Elevate Your Journey with {config.title}
              </h2>

              <p className="text-gray-600 mb-8">
                Experience the perfect blend of luxury, reliability, and
                professional service. Our premium chauffeur experience awaits
                you.
              </p>

              <ul className="space-y-4 mb-10">
                {[
                  "Personalized service tailored to your preferences",
                  "Discreet, professional chauffeurs",
                  "Meticulously maintained luxury vehicles",
                  "Seamless booking process",
                ].map((item, index) => (
                  <li key={index} className="flex items-start">
                    <div className="w-6 h-6 rounded-full border-2 border-primary flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                    </div>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>

              <div className="flex flex-col sm:flex-row gap-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-primary hover:bg-primary/90 text-white font-medium text-lg px-8 py-6 rounded-none shadow-md group transition-all">
                      <Calendar className="mr-2 h-5 w-5" />
                      Book Your Chauffeur
                      <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-0 rounded-none">
                    <div className="p-6 bg-white">
                      <h3 className="text-xl font-bold mb-4 flex items-center">
                        <span className="w-2 h-6 bg-primary mr-3"></span>
                        Book Premium Transportation
                      </h3>
                      <BookTaxiForm />
                    </div>
                  </DialogContent>
                </Dialog>

                <Button
                  variant="outline"
                  className="bg-transparent border-2 border-primary text-primary hover:bg-primary/5 text-lg px-8 py-6 rounded-none group transition-all"
                  onClick={() => (window.location.href = "tel:+971568693458")}
                >
                  <PhoneCall className="mr-2 h-5 w-5" />
                  Call for Assistance
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="absolute -top-6 -left-6 w-24 h-24 border-t-2 border-l-2 border-primary"></div>
              <div className="absolute -bottom-6 -right-6 w-24 h-24 border-b-2 border-r-2 border-primary"></div>

              <div
                className="w-full h-full overflow-hidden shadow-xl relative"
                style={{ aspectRatio: "16/9" }}
              >
                <video
                  src="/assets/videoplayback.mp4"
                  className="absolute inset-0 w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              </div>

              <div className="absolute bottom-0 left-0 right-0 bg-fleet-dark/80 text-white p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-white/70 uppercase tracking-wider mb-1">
                      Our Promise
                    </div>
                    <div className="text-xl font-semibold">
                      Move Like a King
                    </div>
                  </div>
                  <div className="text-primary">
                    <div className="text-3xl font-bold">24/7</div>
                    <div className="text-xs">AVAILABILITY</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
