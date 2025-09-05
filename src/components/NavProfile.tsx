import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/contexts/TranslationContext";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { logout } from "@/lib/authUtils";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  User as UserIcon,
  Car,
  Settings,
  LogOut,
  BookOpen,
  DollarSign,
  MapPin,
  LogInIcon,
} from "lucide-react";
import { Badge } from "./ui/badge";
import { User } from "@/types";
import { User as FirebaseUser } from "firebase/auth";

export const NavProfile = ({
  mobile = false,
  currentUser,
  userData,
  scrolled = false,
  position = "sticky",
}: {
  mobile?: boolean;
  currentUser: FirebaseUser;
  userData: User;
  scrolled?: boolean;
  position?: "fixed" | "sticky";
}) => {
  const navigate = useNavigate();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const { translate } = useTranslation();
  const { isDriver, isAdmin, userRole } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      setProfileMenuOpen(false);
      navigate("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setProfileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!userData) return "U";

    const firstInitial = userData.firstName ? userData.firstName.charAt(0) : "";
    const lastInitial = userData.lastName ? userData.lastName.charAt(0) : "";

    return (firstInitial + lastInitial).toUpperCase();
  };

  // Get user display name
  const getUserDisplayName = () => {
    if (userData?.firstName) {
      return `${userData.firstName} ${userData.lastName || ""}`.trim();
    }
    return userData?.name || "User";
  };

  // Get user role display
  const getUserRoleDisplay = () => {
    if (isAdmin) return "Administrator";
    if (isDriver) return "Driver";
    return "Customer";
  };

  // Get role-specific navigation links
  const getRoleSpecificLinks = () => {
    if (isAdmin) {
      return [
        {
          to: "/admin",
          label: "Dashboard",
          icon: <UserIcon className="h-4 w-4" />,
        },
        {
          to: "/admin/drivers",
          label: "Manage Drivers",
          icon: <Car className="h-4 w-4" />,
        },
        {
          to: "/admin/bookings",
          label: "All Bookings",
          icon: <BookOpen className="h-4 w-4" />,
        },
        {
          to: "/admin/settings",
          label: "Settings",
          icon: <Settings className="h-4 w-4" />,
        },
      ];
    }

    if (isDriver) {
      return [
        {
          to: "/driver",
          label: "Dashboard",
          icon: <Car className="h-4 w-4" />,
        },
        {
          to: "/driver/rides",
          label: "My Rides",
          icon: <MapPin className="h-4 w-4" />,
        },
        {
          to: "/driver/earnings",
          label: "Earnings",
          icon: <DollarSign className="h-4 w-4" />,
        },
        {
          to: "/driver/profile",
          label: "Profile",
          icon: <UserIcon className="h-4 w-4" />,
        },
        {
          to: "/driver/settings",
          label: "Settings",
          icon: <Settings className="h-4 w-4" />,
        },
      ];
    }

    return [
      {
        to: "/user/my-account",
        label: "My Account",
        icon: <UserIcon className="h-4 w-4" />,
      },
      {
        to: "/user/my-bookings",
        label: "My Bookings",
        icon: <BookOpen className="h-4 w-4" />,
      },
    ];
  };

  if (currentUser) {
    return (
      <div className="relative" ref={profileMenuRef}>
        <button
          onClick={() => setProfileMenuOpen(!profileMenuOpen)}
          className={`flex items-center gap-2 ${
            scrolled ? "text-white" : "text-white"
          }`}
          aria-label="User menu"
        >
          <div className="w-9 h-9 shrink-0 rounded-md md:rounded-full bg-primary/20 text-primary flex items-center justify-center font-medium">
            {getUserInitials()}
          </div>
          <span
            className={cn(
              "hidden md:inline",
              position === "sticky" && "text-fleet-dark",
            )}
          >
            {getUserDisplayName()}
          </span>
        </button>

        {profileMenuOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl overflow-hidden shadow-lg z-50">
            <div className="px-4 py-3 border-b">
              <div className="flex items-center gap-2">
                <p className="font-medium">{getUserDisplayName()}</p>
                <Badge>{getUserRoleDisplay()}</Badge>
              </div>
              {isDriver && userData.driverDetails && (
                <p className="text-xs text-gray-400 mt-1">
                  Rating: {userData.driverDetails.rating?.toFixed(1) || "0.0"} •{" "}
                  {userData.driverDetails.rides || 0} rides
                </p>
              )}
            </div>

            {getRoleSpecificLinks().map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-primary hover:text-white"
                onClick={() => setProfileMenuOpen(false)}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full text-left px-4 py-2 text-primar hover:bg-primary/90 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              {translate("nav.logout")}
            </button>
          </div>
        )}
      </div>
    );
  }

  if (mobile) {
    return (
      <>
        <Link to="/login">
          <Button size="sm" variant="outline" className={`border font-medium`}>
            <LogInIcon className="h-4 w-4" />
          </Button>
        </Link>
      </>
    );
  }

  return (
    <>
      <Link to="/login">
        <Button variant="outline" className={`border font-medium`}>
          {translate("nav.login")}
        </Button>
      </Link>
      <Link to="/register">
        <Button className="bg-primary text-white hover:bg-primary/90 font-medium">
          {translate("nav.register")}
        </Button>
      </Link>
    </>
  );
};
