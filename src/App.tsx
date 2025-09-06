import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/public/Index";
import Login from "./pages/public/Login";
import Register from "./pages/public/Register";
import About from "./pages/public/About";
import Contact from "./pages/public/Contact";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminTaxiTypes from "./pages/admin/AdminTaxiTypes";
import AdminFareSettings from "./pages/admin/AdminFareSettings";
import AdminGeofencing from "./pages/admin/AdminGeofencing";
import AdminVehicleTypes from "./pages/admin/AdminVehicleTypes";
import AdminPaymentSettings from "./pages/admin/AdminPaymentSettings";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminDrivers from "./pages/admin/AdminDrivers";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminSettings from "./pages/admin/AdminSettings";
import DriverDashboard from "./pages/driver/DriverDashboard";
import DriverBankDetails from "./pages/driver/DriverBankDetails";
import DriverProfile from "./pages/driver/DriverProfile";
import DriverRides from "./pages/driver/DriverRides";
import DriverEarnings from "./pages/driver/DriverEarnings";
import DriverSettings from "./pages/driver/DriverSettings";
import DriverWelcome from "./pages/driver/DriverWelcome";
import MyAccount from "./pages/user/MyAccount";
import MyBookings from "./pages/user/MyBookings";
import NotFound from "./pages/public/NotFound";
import FAQ from "./pages/public/FAQ";
import TermsAndConditions from "./pages/public/TermsAndConditions";
import PrivacyPolicy from "./pages/public/PrivacyPolicy";
import BookChauffeur from "./pages/user/BookChauffeur";
import BookingStatus from "./pages/public/BookingStatus";
import EmergencyFallback from "./pages/public/EmergencyFallback";
import HourlyRental from "./pages/public/HourlyRental";

import { AuthProvider } from "./contexts/AuthContext";
import TranslationProvider from "./contexts/TranslationContext";
import ProtectedRoute from "./components/ProtectedRoute";
import React, { Component, ErrorInfo } from "react";
import DriverStartRide from "./pages/driver/DriverStartRide";
import { ThemeProvider } from "next-themes";
import { APP_TYPE } from "./config";

// Error boundary component to handle application errors gracefully
class ErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Application error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI when an error occurs
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              Something went wrong
            </h1>
            <p className="text-gray-700 mb-4">
              The application encountered an error. This could be due to a
              configuration issue or a temporary problem.
            </p>
            <pre className="bg-gray-100 p-3 rounded text-xs mb-4 overflow-auto max-h-32">
              {this.state.error?.toString() || "Unknown error"}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 transition"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const App = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <TranslationProvider>
          <TooltipProvider>
            <Toaster />
            <ThemeProvider
              defaultTheme={APP_TYPE}
              themes={["fleet", "booba"]}
              attribute="class"
            >
              <BrowserRouter>
                <Routes>
                  {/* Fallback Route (will be shown if other components fail) */}
                  <Route path="/fallback" element={<EmergencyFallback />} />

                  {/* Public Routes */}
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/faq" element={<FAQ />} />
                  <Route path="/terms" element={<TermsAndConditions />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/book-chauffeur" element={<BookChauffeur />} />
                  <Route path="/booking-status" element={<BookingStatus />} />
                  <Route path="/hourly-rental" element={<HourlyRental />} />

                  {/* User Routes */}
                  <Route path="/user" element={<ProtectedRoute />}>
                    <Route path="my-account" element={<MyAccount />} />
                    <Route path="my-bookings" element={<MyBookings />} />
                    <Route path="book-chauffeur" element={<BookChauffeur />} />
                  </Route>

                  {/* Admin Routes */}
                  <Route
                    path="/admin"
                    element={<ProtectedRoute requireAdmin={true} />}
                  >
                    <Route index element={<AdminDashboard />} />
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="drivers" element={<AdminDrivers />} />
                    <Route path="taxi-types" element={<AdminTaxiTypes />} />
                    <Route
                      path="vehicle-types"
                      element={<AdminVehicleTypes />}
                    />
                    <Route
                      path="fare-settings"
                      element={<AdminFareSettings />}
                    />
                    <Route path="geofencing" element={<AdminGeofencing />} />
                    <Route path="bookings" element={<AdminBookings />} />
                    <Route
                      path="payment-settings"
                      element={<AdminPaymentSettings />}
                    />
                    <Route path="settings" element={<AdminSettings />} />
                  </Route>

                  {/* Driver Routes */}
                  <Route
                    path="/driver"
                    element={<ProtectedRoute requireDriver={true} />}
                  >
                    {/* Protected Driver Routes */}
                    <Route index element={<DriverDashboard />} />
                    <Route path="welcome" element={<DriverWelcome />} />
                    <Route path="profile" element={<DriverProfile />} />
                    <Route path="rides" element={<DriverRides />} />
                    <Route
                      path="start-ride/:rideId"
                      element={<DriverStartRide />}
                    />
                    <Route path="earnings" element={<DriverEarnings />} />
                    <Route
                      path="bank-details"
                      element={<DriverBankDetails />}
                    />
                    <Route path="settings" element={<DriverSettings />} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </ThemeProvider>
          </TooltipProvider>
        </TranslationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
