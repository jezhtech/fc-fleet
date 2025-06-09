import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from './Logo';
import { Button } from '@/components/ui/button';
import { Menu, X, User } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import BookTaxiForm from './home/BookTaxiForm';
import RentCarForm from './home/RentCarForm';
import { useAuth } from '@/contexts/AuthContext';
import { logout } from '@/lib/authUtils';
import { useTranslation } from '@/contexts/TranslationContext';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { currentUser, userData } = useAuth();
  const { language, setLanguage, translate } = useTranslation();
  
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  useEffect(() => {
    console.log('Navbar auth state:', { currentUser, userData });
  }, [currentUser, userData]);

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
      scrolled ? 'bg-black/40 shadow-md backdrop-blur-md' : 'bg-transparent backdrop-blur-sm'
    }`}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Logo />
          
          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-6">
            <NavLinks scrolled={scrolled} />
            <Button 
              variant="default" 
              size="sm" 
              onClick={toggleLanguage}
              className={`${
                scrolled ? 'bg-gray-200 text-fleet-dark' : 'bg-white/30 text-white'
              } px-3 py-2`}
            >
              {language === 'en' ? 'EN' : 'AR'}
            </Button>
            <AuthButtons currentUser={currentUser} userData={userData} scrolled={scrolled} />
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <Button 
              variant="default" 
              size="sm"
              onClick={toggleLanguage}
              className={`mr-2 ${
                scrolled ? 'bg-gray-200 text-fleet-dark' : 'bg-white/30 text-white'
              } px-3 py-2`}
            >
              {language === 'en' ? 'EN' : 'AR'}
            </Button>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
              className={`border-2 ${
                scrolled ? 'text-white border-white' : 'text-white border-white'
              }`}
            >
              {isOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>
        
        {/* Mobile menu */}
        {isOpen && (
          <div className="md:hidden py-4 animate-fade-in bg-white/95 backdrop-blur-md rounded-b-lg shadow-lg">
            <div className="flex flex-col space-y-4">
              <NavLinks mobile />
              <div className="flex flex-col space-y-2 pt-2 border-t">
                <AuthButtons mobile currentUser={currentUser} userData={userData} />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

const NavLinks = ({ mobile = false, scrolled = false }: { mobile?: boolean, scrolled?: boolean }) => {
  const baseClass = mobile 
    ? "px-2 py-1 text-fleet-dark hover:text-fleet-red transition-colors" 
    : scrolled 
      ? "text-white hover:text-fleet-red transition-colors font-medium"
      : "text-white hover:text-fleet-red transition-colors font-medium";
  
  const { translate } = useTranslation();
  
  return (
    <>
      <Link to="/" className={baseClass}>{translate('nav.home')}</Link>
      <Dialog>
        <DialogTrigger asChild>
          <button className={baseClass}>{translate('nav.book_chauffeur')}</button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <div className="p-4">
            <h3 className="text-xl font-bold mb-4">{translate('booking.book_chauffeur')}</h3>
            <BookTaxiForm />
          </div>
        </DialogContent>
      </Dialog>
      <Dialog>
        <DialogTrigger asChild>
          <button className={baseClass}>{translate('nav.hourly')}</button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <div className="p-4">
            <h3 className="text-xl font-bold mb-4">{translate('booking.hourly')}</h3>
            <RentCarForm />
          </div>
        </DialogContent>
      </Dialog>
      <Link to="/about" className={baseClass}>{translate('nav.about')}</Link>
      <Link to="/contact" className={baseClass}>{translate('nav.contact')}</Link>
      <Link to="/faq" className={baseClass}>{translate('nav.faq')}</Link>
    </>
  );
};

const AuthButtons = ({ 
  mobile = false, 
  currentUser, 
  userData,
  scrolled = false
}: { 
  mobile?: boolean, 
  currentUser: any, 
  userData: any,
  scrolled?: boolean
}) => {
  const navigate = useNavigate();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const { translate } = useTranslation();

  const handleLogout = async () => {
    try {
      await logout();
      setProfileMenuOpen(false);
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
  
  if (currentUser) {
    if (mobile) {
      return (
        <>
          <div className="flex items-center gap-2 p-2">
            <div className="w-8 h-8 rounded-full bg-red-100 text-red-800 flex items-center justify-center font-medium">
              {getUserInitials()}
            </div>
            <div>
              <p className="font-medium">{userData?.firstName || 'User'}</p>
              <p className="text-xs text-gray-500">{userData?.email}</p>
            </div>
          </div>
          <Link to="/my-account" className="w-full">
            <Button variant="outline" className="w-full justify-start">{translate('nav.my_account')}</Button>
          </Link>
          <Link to="/my-bookings" className="w-full">
            <Button variant="outline" className="w-full justify-start">{translate('nav.my_bookings')}</Button>
          </Link>
          <Button 
            variant="outline" 
            className="w-full justify-start text-red-600"
            onClick={handleLogout}
          >
            {translate('nav.logout')}
          </Button>
        </>
      );
    }
    
    return (
      <div className="relative" ref={profileMenuRef}>
        <button 
          onClick={() => setProfileMenuOpen(!profileMenuOpen)}
          className={`flex items-center gap-2 ${scrolled ? 'text-white' : 'text-white'}`}
          aria-label="User menu"
        >
          <div className="w-10 h-10 rounded-full bg-red-100 text-red-800 flex items-center justify-center font-medium">
            {getUserInitials()}
          </div>
          <span className="hidden sm:inline">{userData?.firstName || 'User'}</span>
        </button>
        
        {profileMenuOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50">
            <div className="px-4 py-2 border-b">
              <p className="font-medium">{userData?.firstName} {userData?.lastName}</p>
              <p className="text-sm text-gray-500">{userData?.email}</p>
            </div>
            <Link 
              to="/my-account" 
              className="block px-4 py-2 text-gray-700 hover:bg-red-500 hover:text-white"
            >
              {translate('nav.my_account')}
            </Link>
            <Link 
              to="/my-bookings" 
              className="block px-4 py-2 text-gray-700 hover:bg-red-500 hover:text-white"
            >
              {translate('nav.my_bookings')}
            </Link>
            <button 
              onClick={handleLogout}
              className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-500 hover:text-white"
            >
              {translate('nav.logout')}
            </button>
          </div>
        )}
      </div>
    );
  }
  
  if (mobile) {
    return (
      <>
        <Link to="/login" className="w-full">
          <Button variant="outline" className="w-full">{translate('nav.login')}</Button>
        </Link>
        <Link to="/register" className="w-full">
          <Button className="w-full bg-fleet-red text-white hover:bg-fleet-red/90">{translate('nav.register')}</Button>
        </Link>
      </>
    );
  }
  
  return (
    <>
      <Link to="/login">
        <Button 
          variant="outline" 
          className={`border-2 ${
            scrolled 
              ? 'bg-white/30 text-white border-white hover:bg-white/40' 
              : 'bg-white/30 text-white border-white hover:bg-white/40'
          } font-medium`}
        >
          {translate('nav.login')}
        </Button>
      </Link>
      <Link to="/register">
        <Button className="bg-fleet-red text-white hover:bg-fleet-red/90 font-medium">{translate('nav.register')}</Button>
      </Link>
    </>
  );
};

export default Navbar;
