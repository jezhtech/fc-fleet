import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import About from "./pages/About";
import Contact from "./pages/Contact";
import AdminDashboard from "./pages/AdminDashboard";
import AdminTaxiTypes from "./pages/AdminTaxiTypes";
import AdminFareSettings from "./pages/AdminFareSettings";
import AdminGeofencing from "./pages/AdminGeofencing";
import AdminVehicleTypes from "./pages/AdminVehicleTypes";
import AdminRentalVehicles from "./pages/AdminRentalVehicles";
import AdminPaymentSettings from "./pages/AdminPaymentSettings";
import AdminUsers from "./pages/AdminUsers";
import AdminDrivers from "./pages/AdminDrivers";
import AdminBookings from "./pages/AdminBookings";
import AdminSettings from "./pages/AdminSettings";
import DriverDashboard from "./pages/DriverDashboard";
import DriverBankDetails from "./pages/DriverBankDetails";
import DriverProfile from "./pages/DriverProfile";
import DriverRides from "./pages/DriverRides";
import DriverEarnings from "./pages/DriverEarnings";
import DriverSettings from "./pages/DriverSettings";
import MyAccount from "./pages/MyAccount";
import MyBookings from "./pages/MyBookings";
import NotFound from "./pages/NotFound";
import FAQ from "./pages/FAQ";
import TermsAndConditions from "./pages/TermsAndConditions";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import BookChauffeur from "./pages/BookChauffeur";
import BookingStatus from "./pages/BookingStatus";
import FirebaseExample from "./components/FirebaseExample";
import EmergencyFallback from "./pages/EmergencyFallback";
import { AuthProvider } from "./contexts/AuthContext";
import TranslationProvider from "./contexts/TranslationContext";
import ProtectedRoute from "./components/ProtectedRoute";
import React, { Component, ErrorInfo, useState, useEffect } from 'react';

const queryClient = new QueryClient();

// Debug component to track rendering
const DebugWrapper = ({ id, children }: { id: string, children: React.ReactNode }) => {
  useEffect(() => {
    console.log(`DebugWrapper ${id} mounted`);
    return () => console.log(`DebugWrapper ${id} unmounted`);
  }, [id]);
  
  return <>{children}</>;
};

// Error boundary component to handle application errors gracefully
class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
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
            <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
            <p className="text-gray-700 mb-4">
              The application encountered an error. This could be due to a configuration issue or a temporary problem.
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
  // Display a simple loading message first to check if basic rendering works
  const [showApp, setShowApp] = useState(false);
  
  useEffect(() => {
    console.log("App component mounted");
    
    // Delay showing the real app to check if this part renders
    setTimeout(() => {
      console.log("Showing full app now");
      setShowApp(true);
    }, 1000);
    
    return () => console.log("App component unmounted");
  }, []);
  
  if (!showApp) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-fleet-red mb-4">First Class Fleet</h1>
          <p className="text-gray-600">Loading application...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <DebugWrapper id="app-root">
        <QueryClientProvider client={queryClient}>
          <DebugWrapper id="query-provider">
            <AuthProvider>
              <DebugWrapper id="auth-provider">
                <TranslationProvider>
                  <DebugWrapper id="translation-provider">
                    <TooltipProvider>
                      <DebugWrapper id="tooltip-provider">
                        <Toaster />
                        <Sonner />
                        <BrowserRouter>
                          <DebugWrapper id="browser-router">
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
                              
                              {/* Protected User Routes */}
                              <Route path="/my-account" element={
                                <ProtectedRoute>
                                  <MyAccount />
                                </ProtectedRoute>
                              } />
                              <Route path="/my-bookings" element={
                                <ProtectedRoute>
                                  <MyBookings />
                                </ProtectedRoute>
                              } />
                              
                              {/* Protected Admin Routes */}
                              <Route path="/admin" element={
                                <ProtectedRoute requireAdmin={true}>
                                  <AdminDashboard />
                                </ProtectedRoute>
                              } />
                              <Route path="/admin/users" element={
                                <ProtectedRoute requireAdmin={true}>
                                  <AdminUsers />
                                </ProtectedRoute>
                              } />
                              <Route path="/admin/drivers" element={
                                <ProtectedRoute requireAdmin={true}>
                                  <AdminDrivers />
                                </ProtectedRoute>
                              } />
                              <Route path="/admin/taxi-types" element={
                                <ProtectedRoute requireAdmin={true}>
                                  <AdminTaxiTypes />
                                </ProtectedRoute>
                              } />
                              <Route path="/admin/vehicle-types" element={
                                <ProtectedRoute requireAdmin={true}>
                                  <AdminVehicleTypes />
                                </ProtectedRoute>
                              } />
                              <Route path="/admin/fare-settings" element={
                                <ProtectedRoute requireAdmin={true}>
                                  <AdminFareSettings />
                                </ProtectedRoute>
                              } />
                              <Route path="/admin/geofencing" element={
                                <ProtectedRoute requireAdmin={true}>
                                  <AdminGeofencing />
                                </ProtectedRoute>
                              } />
                              <Route path="/admin/bookings" element={
                                <ProtectedRoute requireAdmin={true}>
                                  <AdminBookings />
                                </ProtectedRoute>
                              } />
                              <Route path="/admin/payment-settings" element={
                                <ProtectedRoute requireAdmin={true}>
                                  <AdminPaymentSettings />
                                </ProtectedRoute>
                              } />
                              <Route path="/admin/settings" element={
                                <ProtectedRoute requireAdmin={true}>
                                  <AdminSettings />
                                </ProtectedRoute>
                              } />
                              
                              {/* Protected Driver Routes */}
                              <Route path="/driver" element={
                                <ProtectedRoute>
                                  <DriverDashboard />
                                </ProtectedRoute>
                              } />
                              <Route path="/driver/profile" element={
                                <ProtectedRoute>
                                  <DriverProfile />
                                </ProtectedRoute>
                              } />
                              <Route path="/driver/rides" element={
                                <ProtectedRoute>
                                  <DriverRides />
                                </ProtectedRoute>
                              } />
                              <Route path="/driver/earnings" element={
                                <ProtectedRoute>
                                  <DriverEarnings />
                                </ProtectedRoute>
                              } />
                              <Route path="/driver/bank-details" element={
                                <ProtectedRoute>
                                  <DriverBankDetails />
                                </ProtectedRoute>
                              } />
                              <Route path="/driver/settings" element={
                                <ProtectedRoute>
                                  <DriverSettings />
                                </ProtectedRoute>
                              } />
                              
                              {/* Example and Wildcard Routes */}
                              <Route path="/firebase-example" element={<FirebaseExample />} />
                              <Route path="*" element={<NotFound />} />
                            </Routes>
                          </DebugWrapper>
                        </BrowserRouter>
                      </DebugWrapper>
                    </TooltipProvider>
                  </DebugWrapper>
                </TranslationProvider>
              </DebugWrapper>
            </AuthProvider>
          </DebugWrapper>
        </QueryClientProvider>
      </DebugWrapper>
    </ErrorBoundary>
  );
};

export default App;
