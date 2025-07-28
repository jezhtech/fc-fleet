import React, { useState } from "react";
import { Link } from "react-router-dom";
import Logo from "./Logo";
import { useTranslation } from "@/contexts/TranslationContext";
import {
  MapPin,
  Phone,
  Mail,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const Footer = () => {
  const { translate } = useTranslation();
  const currentYear = new Date().getFullYear();
  const [expandedLocation, setExpandedLocation] = useState<string | null>(null);

  const toggleLocation = (location: string) => {
    if (expandedLocation === location) {
      setExpandedLocation(null);
    } else {
      setExpandedLocation(location);
    }
  };

  const locations = [
    {
      id: "uae",
      name: "UAE",
      address: ["Saphire Tower", "Deira 780610, UAE"],
    },
    {
      id: "oman",
      name: "Oman",
      address: ["Murooj Grand Al Khuwair", "Muscat"],
    },
    {
      id: "usa",
      name: "USA",
      address: ["13279 Bluejacket", "Street Overland Park, KS", "66213"],
    },
    {
      id: "png",
      name: "Papua New Guinea",
      address: ["Sec 112, Lot 25, Bomana", "Sogeri Rd"],
    },
    {
      id: "india",
      name: "India",
      address: ["Sree Sai Complex", "Nagercoil,", "India – 629001"],
    },
  ];

  return (
    <footer className="bg-white text-black pt-12 pb-8 shadow-md">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Logo />
            <p className="mt-4">
              First Class Fleet provides premium chauffeur services across
              Dubai, Abu Dhabi, and the entire UAE. We specialize in airport
              transfers, corporate transportation, intercity travel, and hourly
              chauffeur hire.
            </p>
            <div className="flex space-x-4 mt-4">
              <a
                href="https://facebook.com/firstclassfleet"
                aria-label="Facebook"
                className="text-fleet-red hover:text-fleet-accent"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://instagram.com/firstclassfleet"
                aria-label="Instagram"
                className="text-fleet-red hover:text-fleet-accent"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com/firstclassfleet"
                aria-label="Twitter"
                className="text-fleet-red hover:text-fleet-accent"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="https://linkedin.com/company/firstclassfleet"
                aria-label="LinkedIn"
                className="text-fleet-red hover:text-fleet-accent"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h5 className="text-lg font-bold mb-4">Our Services</h5>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="hover:text-fleet-red">
                  Dubai Chauffeur Service
                </Link>
              </li>
              <li>
                <Link to="/book-chauffeur" className="hover:text-fleet-red">
                  Airport Transfers
                </Link>
              </li>
              <li>
                <Link to="/book-chauffeur" className="hover:text-fleet-red">
                  Corporate Transportation
                </Link>
              </li>
              <li>
                <Link to="/book-chauffeur" className="hover:text-fleet-red">
                  Intercity Travel UAE
                </Link>
              </li>
              <li>
                <Link to="/book-chauffeur" className="hover:text-fleet-red">
                  Hourly Chauffeur Hire
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-fleet-red">
                  About Our Fleet
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="text-lg font-bold mb-4">Service Areas</h5>
            <ul className="space-y-2">
              <li>
                <Link to="/book-chauffeur" className="hover:text-fleet-red">
                  Dubai Chauffeur Services
                </Link>
              </li>
              <li>
                <Link to="/book-chauffeur" className="hover:text-fleet-red">
                  Abu Dhabi Transportation
                </Link>
              </li>
              <li>
                <Link to="/book-chauffeur" className="hover:text-fleet-red">
                  Sharjah Chauffeur Hire
                </Link>
              </li>
              <li>
                <Link to="/book-chauffeur" className="hover:text-fleet-red">
                  Ajman Car Services
                </Link>
              </li>
              <li>
                <Link to="/book-chauffeur" className="hover:text-fleet-red">
                  Ras Al Khaimah Transfers
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-fleet-red">
                  Frequently Asked Questions
                </Link>
              </li>
            </ul>
          </div>

          <div itemScope itemType="https://schema.org/LocalBusiness">
            <h5 className="text-lg font-bold mb-4">Contact Us</h5>
            <address className="not-italic space-y-3">
              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-fleet-red mr-2 mt-1 flex-shrink-0" />
                <p
                  itemProp="address"
                  itemScope
                  itemType="https://schema.org/PostalAddress"
                >
                  <span itemProp="streetAddress">123 Sheikh Zayed Road</span>
                  <br />
                  <span itemProp="addressLocality">Dubai</span>,
                  <span itemProp="addressCountry">United Arab Emirates</span>
                </p>
              </div>
              <div className="flex items-center">
                <Phone className="h-5 w-5 text-fleet-red mr-2 flex-shrink-0" />
                <p>
                  <a
                    href="tel:+971568693458"
                    itemProp="telephone"
                    className="hover:text-fleet-red"
                  >
                    +971 56 869 3458
                  </a>
                </p>
              </div>
              <div className="flex items-center">
                <Mail className="h-5 w-5 text-fleet-red mr-2 flex-shrink-0" />
                <p>
                  <a
                    href="mailto:booking@fcfleets.com"
                    itemProp="email"
                    className="hover:text-fleet-red"
                  >
                    booking@fcfleets.com
                  </a>
                </p>
              </div>
              <div>
                <p className="text-sm mt-2">Available 24/7 for bookings</p>
                <p
                  className="text-sm"
                  itemProp="openingHours"
                  content="Mo-Su 00:00-23:59"
                >
                  Open 24 hours, 7 days a week
                </p>
              </div>
              <meta
                itemProp="name"
                content="First Class Fleet - Dubai Chauffeur Service"
              />
              <meta itemProp="image" content="/logo.png" />
              <meta itemProp="url" content="https://firstclassfleet.com" />
              <meta itemProp="priceRange" content="$$$" />
            </address>
          </div>
        </div>

        <div className="mt-8 pt-6">
          <h5 className="text-lg font-bold mb-4">Our Global Offices</h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {locations.map((location) => (
              <div
                key={location.id}
                className="border rounded p-3 hover:shadow-md transition-shadow"
              >
                <button
                  onClick={() => toggleLocation(location.id)}
                  className="flex justify-between items-center w-full font-bold text-lg mb-2"
                >
                  {location.name}
                  {expandedLocation === location.id ? (
                    <ChevronUp className="h-4 w-4 text-fleet-red" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-fleet-red" />
                  )}
                </button>
                <div
                  className={`transition-all duration-300 overflow-hidden ${
                    expandedLocation === location.id
                      ? "max-h-40 opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  {location.address.map((line, index) => (
                    <p key={index} className="text-sm">
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center text-gray-600 text-sm">
          <p>
            &copy; {currentYear} First Class Fleet LLC. All rights reserved.
            Developed by{" "}
            <a
              href="https://www.jezx.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-fleet-red hover:underline"
            >
              JezX
            </a>
            {" | "}
            <a
              href="https://enyard.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-fleet-red hover:underline"
            >
              ENYARD
            </a>
          </p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <Link to="/terms" className="hover:text-fleet-red">
              Terms & Conditions
            </Link>
            <Link to="/privacy" className="hover:text-fleet-red">
              Privacy Policy
            </Link>
            <Link to="/contact" className="hover:text-fleet-red">
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
