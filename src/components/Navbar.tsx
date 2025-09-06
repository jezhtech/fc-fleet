import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Logo from "./Logo";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
        "top-0 w-full z-20 transition-all duration-300",
        scrolled
          ? "bg-black/20 shadow-md backdrop-blur-md"
          : "bg-transparent backdrop-blur-sm",
        position,
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
          <div className="md:hidden flex items-center space-x-2">
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
    ? "px-2 py-1 text-fleet-dark hover:text-primary transition-colors"
    : scrolled
      ? "text-white hover:text-primary transition-colors font-medium"
      : "text-white hover:text-primary transition-colors font-medium";

  const { translate } = useTranslation();

  return (
    <>
      <Link
        to="/"
        className={cn(
          baseClass,
          position === "sticky" && "text-fleet-dark hover:text-primary",
        )}
      >
        {translate("nav.home")}
      </Link>
      <Link
        to="/about"
        className={cn(
          baseClass,
          position === "sticky" && "text-fleet-dark hover:text-primary",
        )}
      >
        {translate("nav.about")}
      </Link>
      <Link
        to="/contact"
        className={cn(
          baseClass,
          position === "sticky" && "text-fleet-dark hover:text-primary",
        )}
      >
        {translate("nav.contact")}
      </Link>
      <Link
        to="/faq"
        className={cn(
          baseClass,
          position === "sticky" && "text-fleet-dark hover:text-primary",
        )}
      >
        {translate("nav.faq")}
      </Link>
    </>
  );
};

export default Navbar;
