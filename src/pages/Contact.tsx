
import React from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { MapPin, Phone, Mail, MessageSquare, Clock } from 'lucide-react';
import { toast } from 'sonner';

const Contact = () => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast.success("Your message has been sent! We'll get back to you soon.");
    // In a real app, you would send the form data to a server
  };

  return (
    <Layout>
      <div className="bg-gradient-to-r from-fleet-red to-fleet-accent py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Contact Us</h1>
          <p className="text-white/90 text-lg max-w-2xl mx-auto">
            Get in touch with our team for inquiries, support, or feedback. We're here to help!
          </p>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-3xl font-bold text-fleet-dark mb-6 flex items-center">
              <MessageSquare className="mr-2 h-6 w-6" />
              Send Us a Message
            </h2>
            <p className="text-gray-700 mb-8">
              Have questions or need assistance? Fill out the form below and our team will get back to you as soon as possible.
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-1">Full Name</label>
                  <Input id="name" placeholder="John Smith" required />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-1">Email Address</label>
                  <Input id="email" type="email" placeholder="john@example.com" required />
                </div>
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium mb-1">Phone Number</label>
                <Input id="phone" placeholder="(123) 456-7890" />
              </div>
              
              <div>
                <label htmlFor="subject" className="block text-sm font-medium mb-1">Subject</label>
                <Input id="subject" placeholder="How can we help you?" required />
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-1">Your Message</label>
                <Textarea id="message" placeholder="Type your message here..." className="min-h-[150px]" required />
              </div>
              
              <Button 
                type="submit"
                className="w-full bg-gradient-to-r from-fleet-red to-fleet-accent text-white hover:opacity-90"
              >
                Send Message
              </Button>
            </form>
          </div>
          
          <div>
            <h2 className="text-3xl font-bold text-fleet-dark mb-6">Contact Information</h2>
            <p className="text-gray-700 mb-8">
              You can reach out to us through any of the following channels or visit our office during business hours.
            </p>
            
            <div className="space-y-6">
              <Card className="p-4">
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-fleet-red mt-1 mr-4" />
                  <div>
                    <h3 className="font-semibold mb-1">Our Location</h3>
                    <p className="text-gray-600">123 Transport Street, City, Country</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-start">
                  <Phone className="h-5 w-5 text-fleet-red mt-1 mr-4" />
                  <div>
                    <h3 className="font-semibold mb-1">Phone Number</h3>
                    <p className="text-gray-600">(123) 456-7890</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-start">
                  <Mail className="h-5 w-5 text-fleet-red mt-1 mr-4" />
                  <div>
                    <h3 className="font-semibold mb-1">Email Address</h3>
                    <p className="text-gray-600">info@firstclassfleet.com</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-start">
                  <Clock className="h-5 w-5 text-fleet-red mt-1 mr-4" />
                  <div>
                    <h3 className="font-semibold mb-1">Business Hours</h3>
                    <p className="text-gray-600">Monday - Friday: 8:00 AM - 8:00 PM</p>
                    <p className="text-gray-600">Saturday - Sunday: 9:00 AM - 6:00 PM</p>
                  </div>
                </div>
              </Card>
            </div>
            
            <div className="mt-8">
              <h3 className="font-semibold mb-4">Follow Us</h3>
              <div className="flex space-x-4">
                <a href="#" className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center hover:bg-fleet-red hover:text-white transition-colors">
                  <span>FB</span>
                </a>
                <a href="#" className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center hover:bg-fleet-red hover:text-white transition-colors">
                  <span>TW</span>
                </a>
                <a href="#" className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center hover:bg-fleet-red hover:text-white transition-colors">
                  <span>IG</span>
                </a>
                <a href="#" className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center hover:bg-fleet-red hover:text-white transition-colors">
                  <span>LI</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Contact;
