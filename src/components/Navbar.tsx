import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import Logo from "./Logo";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
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
  const [isOpen, setIsOpen] = useState(false);
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
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
              className={`border-2 ${
                scrolled || position === "sticky"
                  ? "text-white border-white"
                  : "text-white border-white"
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
                <NavProfile
                  mobile
                  currentUser={currentUser}
                  userData={userData}
                />
              </div>
            </div>
          </div>
        )}
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
