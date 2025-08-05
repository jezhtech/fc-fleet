import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { logout } from '@/lib/authUtils';

// Icons import or define inline SVGs here...

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, userData } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Force re-render on location changes
  useEffect(() => {
    // Close mobile menu when route changes
    setMobileMenuOpen(false);
    setProfileMenuOpen(false);
  }, [location]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!userData) return 'U';
    
    const firstInitial = userData.firstName ? userData.firstName.charAt(0) : '';
    const lastInitial = userData.lastName ? userData.lastName.charAt(0) : '';
    
    return (firstInitial + lastInitial).toUpperCase();
  };

  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-red-500">
              First Class Fleet
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8 items-center">
            <Link to="/" className="text-gray-700 hover:text-red-500">
              Home
            </Link>
            <Link to="/about" className="text-gray-700 hover:text-red-500">
              About
            </Link>
            <Link to="/contact" className="text-gray-700 hover:text-red-500">
              Contact
            </Link>
            {currentUser ? (
              <div className="relative" ref={profileMenuRef}>
                <button 
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center space-x-2"
                  aria-label="User menu"
                  data-testid="user-menu-button"
                >
                  <div className="w-10 h-10 rounded-full bg-red-100 text-red-800 flex items-center justify-center font-medium">
                    {getUserInitials()}
                  </div>
                  <span className="hidden sm:inline">{userData?.firstName || 'User'}</span>
                </button>
                
                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg overflow-hidden z-20">
                    <div className="px-4 py-2 border-b">
                      <p className="font-medium">{userData?.firstName} {userData?.lastName}</p>
                      <p className="text-sm text-gray-500">{userData?.email}</p>
                    </div>
                    <Link 
                      to="/my-account" 
                      className="block px-4 py-2 text-gray-700 hover:bg-red-500 hover:text-white"
                    >
                      My Account
                    </Link>
                    <Link 
                      to="/my-bookings" 
                      className="block px-4 py-2 text-gray-700 hover:bg-red-500 hover:text-white"
                    >
                      My Bookings
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-500 hover:text-white"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" className="text-gray-700 hover:text-red-500">
                    Log in
                  </Button>
                </Link>
                <Link to="/register">
                  <Button className="bg-red-500 hover:bg-red-600 text-white">
                    Sign up
                  </Button>
                </Link>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <span className="text-2xl">✕</span>
            ) : (
              <span className="text-2xl">☰</span>
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden mt-4 py-2">
            <Link to="/" className="block py-2 text-gray-700 hover:text-red-500">
              Home
            </Link>
            <Link to="/about" className="block py-2 text-gray-700 hover:text-red-500">
              About
            </Link>
            <Link to="/contact" className="block py-2 text-gray-700 hover:text-red-500">
              Contact
            </Link>
            {currentUser ? (
              <>
                <div className="flex items-center space-x-2 py-2">
                  <div className="w-8 h-8 rounded-full bg-red-100 text-red-800 flex items-center justify-center font-medium">
                    {getUserInitials()}
                  </div>
                  <div>
                    <p className="font-medium">{userData?.firstName} {userData?.lastName}</p>
                    <p className="text-xs text-gray-500">{userData?.email}</p>
                  </div>
                </div>
                <div className="border-t border-gray-200 my-2"></div>
                <Link to="/my-account" className="block py-2 text-gray-700 hover:text-red-500">
                  My Account
                </Link>
                <Link to="/my-bookings" className="block py-2 text-gray-700 hover:text-red-500">
                  My Bookings
                </Link>
                <button 
                  onClick={handleLogout}
                  className="block py-2 text-red-600 hover:text-red-700 w-full text-left"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex flex-col space-y-2 mt-2">
                <Link to="/login">
                  <Button variant="ghost" className="w-full justify-start">
                    Log in
                  </Button>
                </Link>
                <Link to="/register">
                  <Button className="w-full bg-red-500 hover:bg-red-600">
                    Sign up
                  </Button>
                </Link>
              </div>
            )}
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header; 