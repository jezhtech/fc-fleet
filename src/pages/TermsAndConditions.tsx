
import React from 'react';
import Layout from '@/components/Layout';
import { Card } from '@/components/ui/card';

const TermsAndConditions = () => {
  return (
    <Layout>
      <div className="bg-gradient-to-r from-fleet-red to-fleet-accent py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-white">Terms and Conditions</h1>
          <p className="text-white/90 mt-2">Please read our terms of service carefully</p>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-12">
        <Card className="p-6 prose max-w-none">
          <h2 className="text-2xl font-semibold mb-6">First Class Fleet - Terms and Conditions</h2>
          <p className="text-sm text-gray-500 mb-4">Last updated: May 8, 2025</p>
          
          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-3">1. Introduction</h3>
            <p>Welcome to First Class Fleet ("Company", "we", "our", "us"). These Terms and Conditions govern your use of our website and services operated in the United Arab Emirates (UAE).</p>
            <p>By accessing or using our service, you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access the service.</p>
          </section>
          
          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-3">2. Service Terms</h3>
            <p>First Class Fleet provides chauffeur services and hourly vehicle rental services throughout the UAE subject to the following terms:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>All bookings are subject to vehicle availability.</li>
              <li>Service is available 24 hours a day, 7 days a week, subject to prior reservation.</li>
              <li>Rates are inclusive of fuel, driver allowances, and standard insurance but exclusive of parking fees, toll charges, and inter-emirate border crossing fees.</li>
              <li>Additional waiting charges apply after the first 15 minutes of the scheduled pickup time at the rate of AED 50 per hour.</li>
              <li>Child seats must be requested at the time of booking (available at additional cost).</li>
              <li>In accordance with UAE law, all passengers must wear seat belts.</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-3">3. Booking and Cancellation Policy</h3>
            <p><strong>Booking Confirmation:</strong> All bookings are confirmed upon receipt of booking confirmation email or SMS.</p>
            <p><strong>Cancellation Policy:</strong></p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Cancellations made more than 2 hours prior to the scheduled pickup time: No charge</li>
              <li>Cancellations made less than 2 hours prior to the scheduled pickup time: 30% of the fare</li>
              <li>No-show: 100% of the fare</li>
              <li>For airport pickups, cancellations must be made 3 hours prior to the scheduled pickup time to avoid charges.</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-3">4. Payment Terms</h3>
            <p>We accept payment through credit/debit cards, digital payment methods, and cash (to the driver). For corporate accounts, we offer monthly invoicing subject to credit approval.</p>
            <p>All payments are processed in UAE Dirhams (AED). For international credit card payments, conversion rates are determined by your card issuer.</p>
            <p>Payment receipts are provided upon request and can be downloaded from your account dashboard.</p>
          </section>
          
          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-3">5. User Responsibilities</h3>
            <p>When using our services, users agree to:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Provide accurate personal and booking information.</li>
              <li>Treat drivers and vehicles with respect.</li>
              <li>Not engage in any illegal activities during the service.</li>
              <li>Comply with UAE laws and regulations regarding public behavior and transportation.</li>
              <li>Take responsibility for any damage caused by them or their accompanying passengers to the vehicle.</li>
              <li>Not consume alcoholic beverages in the vehicle (in accordance with UAE law).</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-3">6. Liability</h3>
            <p>First Class Fleet maintains comprehensive insurance for all our vehicles in accordance with UAE traffic and transport regulations.</p>
            <p>We are not liable for:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Delays caused by traffic conditions, road works, or other circumstances beyond our control.</li>
              <li>Loss or damage to passenger belongings left in the vehicle.</li>
              <li>Failure to reach destinations within passenger-stipulated times when affected by circumstances beyond our control.</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-3">7. Governing Law</h3>
            <p>These Terms shall be governed and construed in accordance with the laws of the United Arab Emirates. Any disputes relating to these terms will be subject to the exclusive jurisdiction of the courts of Dubai, UAE.</p>
          </section>
          
          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-3">8. Changes to Terms</h3>
            <p>We reserve the right to modify these terms at any time. When we do, we will revise the updated date at the top of this page.</p>
            <p>Continued use of our service after changes means you accept the revised terms.</p>
          </section>
          
          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-3">9. Contact Us</h3>
            <p>If you have any questions about these Terms, please contact us at:</p>
            <p><strong>Email:</strong> info@firstclassfleet.ae</p>
            <p><strong>Phone:</strong> +971 4 XXX XXXX</p>
            <p><strong>Address:</strong> P.O. Box XXXXX, Dubai, United Arab Emirates</p>
          </section>
        </Card>
      </div>
    </Layout>
  );
};

export default TermsAndConditions;
