import React from 'react';
import { Users, Car, MapPin, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const PremiumFeatures = () => {
  const features = [
    {
      icon: <Users className="h-8 w-8" />,
      title: 'Elite Chauffeur Service',
      description: 'Multilingual chauffeurs trained in premium hospitality with deep knowledge of UAE.'
    },
    {
      icon: <Car className="h-8 w-8" />,
      title: 'Luxury Fleet Collection',
      description: 'Prestigious selection of Mercedes-Benz S-Class, BMW 7 Series, and premium models.'
    },
    {
      icon: <MapPin className="h-8 w-8" />,
      title: 'VIP Airport Experience',
      description: 'Seamless meet & greet at all UAE airports with complimentary waiting time.'
    },
    {
      icon: <Clock className="h-8 w-8" />,
      title: 'Round-the-Clock Availability',
      description: 'Premium transportation service available 24/7 with instant confirmation.'
    }
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-fleet-red/5 rounded-full translate-x-1/3 -translate-y-1/2"></div>
      <div className="absolute -bottom-20 left-0 w-80 h-80 bg-gray-100 rounded-full"></div>
      <div className="absolute top-1/3 left-10 w-16 h-16 bg-fleet-red/10 rounded-full"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="inline-block text-5xl font-bold mb-3">
            <span className="text-fleet-red">Premium</span>
            <span className="text-fleet-dark"> Chauffeur Experience</span>
          </h2>
          
          <div className="h-1 w-24 bg-fleet-red mx-auto my-6"></div>
          
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Setting the gold standard for luxury transportation in the United Arab Emirates
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <div className="relative bg-white rounded-xl shadow-xl overflow-hidden transition-all duration-300 group-hover:shadow-2xl group-hover:-translate-y-1 h-full">
                {/* Top accent line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-fleet-red"></div>
                
                {/* Icon circle that overlaps the top */}
                <div className="flex justify-center">
                  <div className="relative -top-6 w-20 h-20 rounded-full bg-white p-1.5 shadow-lg">
                    <div className="w-full h-full rounded-full bg-red-50 flex items-center justify-center text-fleet-red">
                      {feature.icon}
                    </div>
                  </div>
                </div>
                
                <div className="px-6 pb-8 pt-2 text-center">
                  <h3 className="text-xl font-bold text-fleet-dark mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-24 max-w-3xl mx-auto text-center"
        >
          <div className="relative">
            <div className="absolute -top-8 left-0 w-20 h-20 bg-fleet-red/10 rounded-full -z-10"></div>
            <div className="absolute -bottom-8 right-0 w-20 h-20 bg-fleet-red/10 rounded-full -z-10"></div>
            
            <div className="py-4 px-6 border-l-4 border-fleet-red bg-white rounded-r-lg shadow-md">
              <p className="text-xl text-gray-700 italic font-light">
                "The epitome of luxury transportation, crafted for those who value excellence."
              </p>
              <div className="mt-4 inline-flex items-center justify-center">
                <div className="h-px w-8 bg-fleet-red"></div>
                <span className="mx-3 text-sm text-gray-500 uppercase tracking-wider font-medium">First Class Fleet</span>
                <div className="h-px w-8 bg-fleet-red"></div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PremiumFeatures;
