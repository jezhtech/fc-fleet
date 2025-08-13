import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import Logo from "./Logo";
import { Button } from "@/components/ui/button";
import { Menu, X, User, Car, BookOpen, Settings, LogOut } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import BookTaxiForm from "./home/BookTaxiForm";
import RentCarForm from "./home/RentCarForm";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/contexts/TranslationContext";
import { cn } from "@/lib/utils";
import { NavProfile } from "./NavProfile";

interface NavbarProps {
  position?: "fixed" | "sticky";
}

const Navbar = ({ position = "sticky" }: NavbarProps) => {
  const [scrolled, setScrolled] = useState(false);
  const { currentUser, userData } = useAuth();
  const { language, setLanguage, translate } = useTranslation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "ar" : "en");
  };

  return (
    <nav
      className={cn(
        "top-0 w-full z-50 transition-all duration-300",
        scrolled
          ? "bg-black/20 shadow-md backdrop-blur-md"
          : "bg-transparent backdrop-blur-sm",
        position
      )}
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Logo />

          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-6">
            <NavLinks position={position} scrolled={scrolled} />
            <Button
              variant="default"
              size="sm"
              onClick={toggleLanguage}
              className={`${
                scrolled || position === "sticky"
                  ? "bg-gray-200 text-fleet-dark"
                  : "bg-white/30 text-white"
              } px-3 py-2`}
            >
              {language === "en" ? "EN" : "AR"}
            </Button>
            <NavProfile
              position={position}
              currentUser={currentUser}
              userData={userData}
              scrolled={scrolled}
            />
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <Button
              variant="default"
              size="sm"
              onClick={toggleLanguage}
              className={`mr-2 ${
                scrolled || position === "sticky"
                  ? "bg-gray-200 text-fleet-dark"
                  : "bg-white/30 text-white"
              } px-3 py-2`}
            >
              {language === "en" ? "EN" : "AR"}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className={`border-2 ${
                    scrolled || position === "sticky"
                      ? "text-fleet-dark border-fleet-dark"
                      : "text-fleet-dark border-fleet-dark"
                  }`}
                >
                  <Menu className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                {/* Main Navigation */}
                <DropdownMenuItem asChild>
                  <Link to="/" className="flex items-center">
                    {translate("nav.home")}
                  </Link>
                </DropdownMenuItem>
                
                {/* Sub-menu items */}
                <DropdownMenuItem asChild>
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="w-full text-left flex items-center text-sm px-2 py-1.5 hover:bg-slate-100 rounded-md">
                        {translate("nav.book_chauffeur")}
                      </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <div className="p-4">
                        <h3 className="text-xl font-bold mb-4 text-fleet-dark">
                          {translate("booking.book_chauffeur")}
                        </h3>
                        <BookTaxiForm />
                      </div>
                    </DialogContent>
                  </Dialog>
                </DropdownMenuItem>
                
                <DropdownMenuItem asChild>
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="w-full text-left flex items-center text-sm px-2 py-1.5 hover:bg-slate-100 rounded-md">
                        {translate("nav.hourly")}
                      </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <div className="p-4">
                        <h3 className="text-xl font-bold mb-4 text-fleet-dark">
                          {translate("booking.hourly")}
                        </h3>
                        <RentCarForm />
                      </div>
                    </DialogContent>
                  </Dialog>
                </DropdownMenuItem>
                
                <DropdownMenuItem asChild>
                  <Link to="/about" className="flex items-center">
                    {translate("nav.about")}
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuItem asChild>
                  <Link to="/contact" className="flex items-center">
                    {translate("nav.contact")}
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuItem asChild>
                  <Link to="/faq" className="flex items-center">
                    {translate("nav.faq")}
                  </Link>
                </DropdownMenuItem>

                {/* User Profile Section */}
                {currentUser && (
                  <>
                    <DropdownMenuSeparator />
                    <div className="px-2 py-1.5">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-8 h-8 bg-fleet-red rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {userData?.firstName?.[0] || userData?.name?.[0] || "U"}
                        </div>
                        <div>
                          <div className="font-semibold text-fleet-dark text-sm">
                            {userData?.firstName && userData?.lastName 
                              ? `${userData.firstName} ${userData.lastName}`
                              : userData?.name || "User"
                            }
                          </div>
                          {userData?.role === "admin" && (
                            <div className="bg-fleet-red text-white text-xs px-2 py-1 rounded">
                              Administrator
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Admin Navigation Links */}
                      {userData?.role === "admin" && (
                        <div className="space-y-1">
                          <DropdownMenuItem asChild>
                            <Link to="/admin/dashboard" className="flex items-center space-x-3">
                              <User className="w-4 h-4" />
                              <span>Dashboard</span>
                            </Link>
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem asChild>
                            <Link to="/admin/drivers" className="flex items-center space-x-3">
                              <Car className="w-4 h-4" />
                              <span>Manage Drivers</span>
                            </Link>
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem asChild>
                            <Link to="/admin/bookings" className="flex items-center space-x-3">
                              <BookOpen className="w-4 h-4" />
                              <span>All Bookings</span>
                            </Link>
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem asChild>
                            <Link to="/admin/settings" className="flex items-center space-x-3">
                              <Settings className="w-4 h-4" />
                              <span>Settings</span>
                            </Link>
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem 
                            onClick={() => {
                              // Handle logout logic here
                            }}
                            className="flex items-center space-x-3 text-fleet-red focus:text-fleet-red"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Logout</span>
                          </DropdownMenuItem>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Remove the old mobile menu code since we're using DropdownMenu now */}
      </div>
    </nav>
  );
};

const NavLinks = ({
  mobile = false,
  position = "sticky",
  scrolled = false,
}: {
  mobile?: boolean;
  position?: "fixed" | "sticky";
  scrolled?: boolean;
}) => {
  const baseClass = mobile
    ? "px-2 py-1 text-fleet-dark hover:text-fleet-red transition-colors"
    : scrolled
    ? "text-white hover:text-fleet-red transition-colors font-medium"
    : "text-white hover:text-fleet-red transition-colors font-medium";

  const { translate } = useTranslation();

  return (
    <>
      <Link
        to="/"
        className={cn(
          baseClass,
          position === "sticky" && "text-fleet-dark hover:text-fleet-red"
        )}
      >
        {translate("nav.home")}
      </Link>
      <Dialog>
        <DialogTrigger asChild>
          <button
            className={cn(
              baseClass,
              position === "sticky" && "text-fleet-dark hover:text-fleet-red"
            )}
          >
            {translate("nav.book_chauffeur")}
          </button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <div className="p-4">
            <h3
              className={cn(
                "text-xl font-bold mb-4",
                position === "sticky" && "text-fleet-dark"
              )}
            >
              {translate("booking.book_chauffeur")}
            </h3>
            <BookTaxiForm />
          </div>
        </DialogContent>
      </Dialog>
      <Dialog>
        <DialogTrigger asChild>
          <button
            className={cn(
              baseClass,
              position === "sticky" && "text-fleet-dark hover:text-fleet-red"
            )}
          >
            {translate("nav.hourly")}
          </button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <div className="p-4">
            <h3
              className={cn(
                "text-xl font-bold mb-4",
                position === "sticky" && "text-fleet-dark"
              )}
            >
              {translate("booking.hourly")}
            </h3>
            <RentCarForm />
          </div>
        </DialogContent>
      </Dialog>
      <Link
        to="/about"
        className={cn(
          baseClass,
          position === "sticky" && "text-fleet-dark hover:text-fleet-red"
        )}
      >
        {translate("nav.about")}
      </Link>
      <Link
        to="/contact"
        className={cn(
          baseClass,
          position === "sticky" && "text-fleet-dark hover:text-fleet-red"
        )}
      >
        {translate("nav.contact")}
      </Link>
      <Link
        to="/faq"
        className={cn(
          baseClass,
          position === "sticky" && "text-fleet-dark hover:text-fleet-red"
        )}
      >
        {translate("nav.faq")}
      </Link>
    </>
  );
};



export default Navbar;
