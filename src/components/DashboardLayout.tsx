import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Logo from './Logo';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import {
  User,
  Settings,
  Car,
  Bell,
  Menu,
  Home,
  MapPin,
  DollarSign,
  Map,
  CreditCard,
  Users,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { logout } from '@/lib/authUtils';

interface DashboardLayoutProps {
  children: React.ReactNode;
  userType: 'admin' | 'driver';
}

const DashboardLayout = ({ children, userType }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { userData } = useAuth();
  
  // Function to handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!userData) return userType === 'admin' ? 'A' : 'D';
    
    const firstInitial = userData.firstName ? userData.firstName.charAt(0) : '';
    const lastInitial = userData.lastName ? userData.lastName.charAt(0) : '';
    
    return (firstInitial + lastInitial).toUpperCase();
  };
  
  const navigation = userType === 'admin' 
    ? [
        { name: 'Dashboard', href: '/admin', icon: Home },
        { name: 'Users', href: '/admin/users', icon: User },
        { name: 'Drivers', href: '/admin/drivers', icon: Users },
        { name: 'Taxi Types', href: '/admin/taxi-types', icon: Car },
        { name: 'Vehicle Types', href: '/admin/vehicle-types', icon: Car },
        { name: 'Fare Settings', href: '/admin/fare-settings', icon: DollarSign },
        { name: 'Geofencing', href: '/admin/geofencing', icon: Map },
        { name: 'Bookings', href: '/admin/bookings', icon: Bell },
        { name: 'Payment Settings', href: '/admin/payment-settings', icon: CreditCard },
        { name: 'Settings', href: '/admin/settings', icon: Settings },
      ]
    : [
        { name: 'Dashboard', href: '/driver', icon: Home },
        { name: 'My Profile', href: '/driver/profile', icon: User },
        { name: 'My Rides', href: '/driver/rides', icon: Car },
        { name: 'Earnings', href: '/driver/earnings', icon: DollarSign },
        { name: 'Bank Details', href: '/driver/bank-details', icon: CreditCard },
        { name: 'Settings', href: '/driver/settings', icon: Settings },
      ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={cn(
          "bg-white fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out border-r",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="h-full flex flex-col">
          <div className="px-4 py-6 border-b">
            <Logo />
            <p className="mt-2 text-sm text-gray-500 capitalize">{userType} Dashboard</p>
          </div>
          
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center px-4 py-3 text-sm font-medium rounded-md group transition-colors",
                  location.pathname === item.href
                    ? "bg-fleet-red/20 text-fleet-red"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <item.icon className={cn(
                  "mr-3 h-5 w-5",
                  location.pathname === item.href
                    ? "text-fleet-red"
                    : "text-gray-500"
                )} />
                {item.name}
              </Link>
            ))}
          </nav>
          
          <div className="px-4 py-4 border-t">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" /> Log out
            </Button>
          </div>
        </div>
      </aside>
      
      {/* Content area */}
      <div className="flex-1 flex flex-col md:ml-64">
        <header className="bg-white shadow z-10">
          <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="icon"
              className="md:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu />
            </Button>
            <div className="ml-auto flex items-center space-x-4">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              <div className="flex items-center space-x-2">
                {userData && (
                  <div className="hidden md:block text-right mr-2">
                    <p className="text-sm font-medium">{userData.firstName} {userData.lastName}</p>
                    <p className="text-xs text-gray-500">{userData.email}</p>
                  </div>
                )}
              <div className="h-8 w-8 rounded-full bg-fleet-red flex items-center justify-center text-white">
                <span className="font-medium text-sm">
                    {getUserInitials()}
                </span>
                </div>
              </div>
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
      
      {/* Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <Toaster />
    </div>
  );
};

export default DashboardLayout;
