
import React from 'react';
import Layout from '@/components/Layout';
import { Card } from '@/components/ui/card';

const PrivacyPolicy = () => {
  return (
    <Layout>
      <div className="bg-gradient-to-r from-fleet-red to-fleet-accent py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-white">Privacy Policy</h1>
          <p className="text-white/90 mt-2">How we handle and protect your information</p>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-12">
        <Card className="p-6 prose max-w-none">
          <h2 className="text-2xl font-semibold mb-6">First Class Fleet - Privacy Policy</h2>
          <p className="text-sm text-gray-500 mb-4">Last updated: May 8, 2025</p>
          
          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-3">1. Introduction</h3>
            <p>First Class Fleet ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our services in the United Arab Emirates.</p>
            <p>By using our services, you consent to the data practices described in this policy. We operate in accordance with the UAE Federal Decree-Law No. (45) of 2021 regarding the Protection of Personal Data (PDPL) and other applicable UAE data protection laws.</p>
          </section>
          
          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-3">2. Information We Collect</h3>
            <p><strong>Personal Information:</strong></p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Contact information (name, email address, phone number)</li>
              <li>Emirates ID information (for certain services, in compliance with UAE regulations)</li>
              <li>Billing information and payment details</li>
              <li>Pick-up and drop-off locations</li>
              <li>Travel preferences</li>
            </ul>
            
            <p className="mt-4"><strong>Technical Information:</strong></p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Device information (device type, operating system, browser type)</li>
              <li>IP address</li>
              <li>Usage data and app interaction</li>
              <li>Location data (with your permission)</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-3">3. How We Use Your Information</h3>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Provide and maintain our services</li>
              <li>Process and complete transactions</li>
              <li>Send you service-related communications</li>
              <li>Improve our services and develop new features</li>
              <li>Provide customer support</li>
              <li>Comply with UAE legal requirements and regulatory obligations</li>
              <li>Prevent fraud and enhance security</li>
            </ul>
            
            <p className="mt-4">In accordance with UAE law, we will only use your personal information for the purposes for which we collected it, unless we reasonably consider that we need to use it for another reason compatible with the original purpose.</p>
          </section>
          
          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-3">4. Disclosure of Your Information</h3>
            <p>We may share your information with:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Our drivers and service providers to fulfill your booking</li>
              <li>Payment processors to process your payments</li>
              <li>Service providers who perform services on our behalf</li>
              <li>UAE government authorities when required by law</li>
              <li>Third parties in the event of a reorganization, merger, or sale</li>
            </ul>
            
            <p className="mt-4">Any third-party service providers we use are required to respect the security of your personal data and to treat it in accordance with UAE law.</p>
          </section>
          
          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-3">5. Data Security</h3>
            <p>We implement appropriate security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction. These measures comply with UAE data protection standards.</p>
            <p>While we use commercially reasonable efforts to protect your personal information, no method of transmission over the Internet or electronic storage is 100% secure. Therefore, we cannot guarantee absolute security.</p>
          </section>
          
          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-3">6. Data Retention</h3>
            <p>We retain your personal information for as long as necessary to fulfill the purposes for which we collected it, including for the purposes of satisfying any legal, accounting, or reporting requirements in accordance with UAE law.</p>
            <p>In some circumstances, we may anonymize your personal information so that it can no longer be associated with you, in which case we may use such information without further notice to you.</p>
          </section>
          
          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-3">7. Your Rights</h3>
            <p>Under UAE data protection laws, you have rights regarding your personal information, including:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>The right to access the personal information we hold about you</li>
              <li>The right to request correction of your personal information</li>
              <li>The right to request deletion of your personal information</li>
              <li>The right to object to processing of your personal information</li>
              <li>The right to data portability</li>
            </ul>
            <p className="mt-4">To exercise these rights, please contact us using the details provided below.</p>
          </section>
          
          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-3">8. Children's Privacy</h3>
            <p>Our services are not intended for use by children under the age of 18 without parental consent. We do not knowingly collect personal information from children under 18. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.</p>
          </section>
          
          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-3">9. Changes to This Privacy Policy</h3>
            <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.</p>
            <p>You are advised to review this Privacy Policy periodically for any changes.</p>
          </section>
          
          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-3">10. Contact Us</h3>
            <p>If you have questions about this Privacy Policy, please contact us at:</p>
            <p><strong>Privacy Officer</strong><br />
            First Class Fleet<br />
            P.O. Box XXXXX, Dubai, United Arab Emirates<br />
            Email: privacy@firstclassfleet.ae<br />
            Phone: +971 4 XXX XXXX</p>
          </section>
        </Card>
      </div>
    </Layout>
  );
};

export default PrivacyPolicy;
