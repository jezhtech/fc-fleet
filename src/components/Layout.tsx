import React from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { Toaster } from "@/components/ui/sonner";
import { useLocation } from "react-router-dom";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <Navbar position={isHome ? "fixed" : "sticky"} />
      <main className="flex-1 w-full transition-all">{children}</main>
      <Toaster position="bottom-right" />
      <Footer />
    </div>
  );
};

export default Layout;
