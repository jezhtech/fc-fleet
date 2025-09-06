import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

// List of available languages
export type Language = "en" | "ar";

// Context type
type TranslationContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  translate: (key: string) => string;
  direction: "ltr" | "rtl";
};

// Create the context
const TranslationContext = createContext<TranslationContextType | undefined>(
  undefined,
);

// Translations object
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    "nav.home": "Home",
    "nav.book_chauffeur": "Book Chauffeur",
    "nav.hourly": "Hourly",
    "nav.about": "About",
    "nav.contact": "Contact",
    "nav.partners": "Partners",
    "nav.faq": "FAQ",
    "nav.login": "Login",
    "nav.register": "Register",
    "nav.my_account": "My Account",
    "nav.my_bookings": "My Bookings",
    "nav.logout": "Logout",

    // Home page
    "home.title": "Your Reliable Ride & Rental Solution",
    "home.subtitle":
      "Book a chauffeur for your immediate travel needs or rent a car hourly for longer trips. First Class Fleet offers comfort, reliability, and affordability.",
    "home.book_button": "Book a Chauffeur",

    // Booking form
    "booking.pickup_location": "Pickup Location",
    "booking.dropoff_location": "Dropoff Location",
    "booking.date_time": "Date & Time",
    "booking.book_chauffeur": "Book Chauffeur",
    "booking.hourly": "Hourly",

    // How it works
    "howItWorks.title": "How It Works",

    // Auth forms
    "auth.login": "Log in",
    "auth.register": "Create account",
    "auth.phone": "Phone number",
    "auth.verification_code": "Verification code",
    "auth.send_code": "Send verification code",
    "auth.verify": "Verify",
    "auth.first_name": "First name",
    "auth.last_name": "Last name",
    "auth.email": "Email address",

    // Footer
    "footer.description":
      "Your reliable transportation partner for chauffeur services and hourly rentals.",
    "footer.quick_links": "Quick Links",
    "footer.about_us": "About Us",
    "footer.support": "Support",
    "footer.terms": "Terms of Service",
    "footer.privacy": "Privacy Policy",
    "footer.contact": "Contact",
    "footer.address_line1": "123 Transport Street",
    "footer.address_line2": "City, Country",
    "footer.phone": "Phone: (123) 456-7890",
    "footer.email": "Email: info@firstclassfleet.com",
    "footer.copyright":
      "© {year} First Class Fleet. All rights reserved. Powered by",
  },
  ar: {
    // Navigation
    "nav.home": "الرئيسية",
    "nav.book_chauffeur": "حجز سائق",
    "nav.hourly": "بالساعة",
    "nav.about": "عن الشركة",
    "nav.contact": "اتصل بنا",
    "nav.faq": "الأسئلة الشائعة",
    "nav.login": "تسجيل الدخول",
    "nav.register": "إنشاء حساب",
    "nav.my_account": "حسابي",
    "nav.my_bookings": "حجوزاتي",
    "nav.logout": "تسجيل الخروج",

    // Home page
    "home.title": "حل موثوق للتنقل والإيجار",
    "home.subtitle":
      "احجز سائقًا لاحتياجات السفر الفورية أو استأجر سيارة بالساعة للرحلات الأطول. تقدم First Class Fleet الراحة والموثوقية بأسعار معقولة.",
    "home.book_button": "احجز سائقًا",

    // Booking form
    "booking.pickup_location": "موقع الاستلام",
    "booking.dropoff_location": "موقع التوصيل",
    "booking.date_time": "التاريخ والوقت",
    "booking.book_chauffeur": "حجز سائق",
    "booking.hourly": "بالساعة",

    // How it works
    "howItWorks.title": "كيف يعمل",

    // Auth forms
    "auth.login": "تسجيل الدخول",
    "auth.register": "إنشاء حساب",
    "auth.phone": "رقم الهاتف",
    "auth.verification_code": "رمز التحقق",
    "auth.send_code": "إرسال رمز التحقق",
    "auth.verify": "تحقق",
    "auth.first_name": "الاسم الأول",
    "auth.last_name": "اسم العائلة",
    "auth.email": "البريد الإلكتروني",

    // Footer
    "footer.description":
      "شريكك الموثوق للنقل لخدمات السائقين والإيجار بالساعة.",
    "footer.quick_links": "روابط سريعة",
    "footer.about_us": "من نحن",
    "footer.support": "الدعم",
    "footer.terms": "شروط الخدمة",
    "footer.privacy": "سياسة الخصوصية",
    "footer.contact": "اتصل بنا",
    "footer.address_line1": "١٢٣ شارع النقل",
    "footer.address_line2": "المدينة، البلد",
    "footer.phone": "الهاتف: ٧٨٩٠-٤٥٦ (١٢٣)",
    "footer.email": "البريد الإلكتروني: info@firstclassfleet.com",
    "footer.copyright":
      "© {year} فيرست كلاس فليت. جميع الحقوق محفوظة. مدعوم من",
  },
};

// Translation provider component
export const TranslationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Get saved language from localStorage or default to English
  const getSavedLanguage = (): Language => {
    const savedLang = localStorage.getItem("language");
    return (savedLang === "ar" ? "ar" : "en") as Language;
  };

  const [language, setLanguageState] = useState<Language>(getSavedLanguage());

  // Text direction based on language
  const direction = language === "ar" ? "rtl" : "ltr";

  // Update language and save to localStorage
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);

    // Update document direction
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  };

  // Translation function
  const translate = (key: string): string => {
    return translations[language][key] || key;
  };

  // Set initial document direction on mount
  useEffect(() => {
    document.documentElement.dir = direction;
    document.documentElement.lang = language;
  }, [direction, language]);

  return (
    <TranslationContext.Provider
      value={{ language, setLanguage, translate, direction }}
    >
      {children}
    </TranslationContext.Provider>
  );
};

// Custom hook for using the translation context
export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error("useTranslation must be used within a TranslationProvider");
  }
  return context;
};

export default TranslationProvider;
