import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { Toaster } from '@/components/ui/sonner';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <Navbar />
      <main className="flex-1 w-full transition-all">
        {children}
      </main>
      <Toaster position="top-right" />
      <Footer />
    </div>
  );
};

export default Layout;
