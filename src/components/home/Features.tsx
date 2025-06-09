import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Car, Shield, Clock, Users, CreditCard, MapPin, Star, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  {
    title: 'Elite Chauffeur Service',
    description: 'Multilingual chauffeurs trained in premium hospitality with deep knowledge of UAE.',
    icon: Users,
  },
  {
    title: 'Luxury Fleet Collection',
    description: 'Prestigious selection of Mercedes-Benz S-Class, BMW 7 Series, and premium models.',
    icon: Car,
  },
  {
    title: 'VIP Airport Experience',
    description: 'Seamless meet & greet at all UAE airports with complimentary waiting time.',
    icon: MapPin,
  },
  {
    title: 'Round-the-Clock Availability',
    description: 'Premium transportation service available 24/7 with instant confirmation.',
    icon: Clock,
  },
];

const moreFeatures = [
  {
    title: 'Transparent Pricing',
    description: 'No hidden fees. Know exactly what you pay for.',
    icon: Shield,
  },
  {
    title: 'Corporate Excellence',
    description: 'Specialized services for business executives.',
    icon: Star,
  },
  {
    title: 'Intercity Luxury',
    description: 'Premium travel between all major UAE cities.',
    icon: MapPin,
  },
  {
    title: 'Secure Booking',
    description: 'Easy online system with multiple payment options.',
    icon: CreditCard,
  },
];

const Features = () => {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [showMore, setShowMore] = useState(false);

  return (
    <section id="services" className="py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-fleet-dark mb-6">
            <span className="text-fleet-red">Premium</span> Chauffeur Experience
          </h2>
          <div className="w-20 h-1 bg-fleet-red mx-auto mb-6"></div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Setting the gold standard for luxury transportation in the United Arab Emirates
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              onMouseEnter={() => setHoveredCard(index)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <Card 
                className={`border-none shadow-lg overflow-hidden h-full transition-all duration-300 ${
                  hoveredCard === index ? 'shadow-xl translate-y-[-8px]' : ''
                }`}
              >
                <CardContent className="p-8 flex flex-col items-center text-center">
                  <div className={`mb-6 w-16 h-16 rounded-full flex items-center justify-center ${
                    hoveredCard === index 
                      ? 'bg-fleet-red text-white' 
                      : 'bg-fleet-red/10 text-fleet-red'
                  } transition-colors duration-300`}>
                    <feature.icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-fleet-dark">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid md:grid-cols-2 gap-10 items-center mb-20"
        >
          <div className="overflow-hidden rounded-xl shadow-lg">
            <img 
              src="https://images.unsplash.com/photo-1622670074636-2351ba99ef6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
              alt="Luxury chauffeur service" 
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h3 className="text-3xl font-bold text-fleet-dark mb-6 flex items-center">
              <span className="w-10 h-1 bg-fleet-red mr-4"></span>
              Move Like a King
            </h3>
            <p className="text-lg text-gray-600 mb-6">
              At First Class Fleet, we believe luxury transportation is more than getting from point A to B—it's about the journey itself. Our bespoke chauffeur service offers an unparalleled experience tailored to discerning clients.
            </p>
            <ul className="space-y-4">
              {[
                'Meticulously maintained premium vehicles',
                'Professional chauffeurs with hospitality training',
                'Fixed transparent pricing with no hidden fees',
                'Corporate accounts with dedicated service managers'
              ].map((item, index) => (
                <li key={index} className="flex items-start">
                  <span className="h-6 w-6 rounded-full bg-fleet-red/10 text-fleet-red flex items-center justify-center mr-3 mt-1 flex-shrink-0">
                    <Star className="h-3 w-3" />
                  </span>
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-white p-10 rounded-xl shadow-lg text-center max-w-4xl mx-auto border-t-4 border-fleet-red"
        >
          <h3 className="text-2xl font-bold text-fleet-dark mb-3">Uncompromising Excellence</h3>
          <p className="text-lg text-gray-600 mb-6">
            Experience the difference that has made us Dubai's most trusted chauffeur service
          </p>
          <div className="flex flex-wrap justify-center gap-8 mb-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-fleet-red mb-1">500+</div>
              <div className="text-sm text-gray-500">VERIFIED REVIEWS</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-fleet-red mb-1">98%</div>
              <div className="text-sm text-gray-500">SATISFACTION RATE</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-fleet-red mb-1">24/7</div>
              <div className="text-sm text-gray-500">AVAILABILITY</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-fleet-red mb-1">50+</div>
              <div className="text-sm text-gray-500">LUXURY VEHICLES</div>
            </div>
          </div>
          <div className="flex items-center justify-center space-x-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-fleet-red text-fleet-red" />
            ))}
          </div>
        </motion.div>

        {showMore ? (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10"
          >
            {moreFeatures.map((feature, index) => (
              <Card key={index} className="border-none shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 rounded-full bg-fleet-red/10 flex items-center justify-center mr-3">
                      <feature.icon className="h-5 w-5 text-fleet-red" />
                    </div>
                    <h3 className="text-lg font-bold">{feature.title}</h3>
                  </div>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        ) : (
          <div className="text-center mb-10">
            <button 
              onClick={() => setShowMore(true)}
              className="inline-flex items-center text-fleet-red hover:text-fleet-accent font-medium transition-colors"
            >
              Discover More Features <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default Features;
