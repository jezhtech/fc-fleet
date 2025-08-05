import React, { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  requireAdmin?: boolean;
  requireDriver?: boolean;
  requireCustomer?: boolean; // Add customer requirement
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  requireAdmin = false,
  requireDriver = false,
  requireCustomer = false,
}) => {
  const {
    currentUser,
    loading,
    isDriver,
    isAdmin: isAdminUser,
    userData,
    needsRegistration,
    userRole,
  } = useAuth();
  const location = useLocation();
  const [roleCheckComplete, setRoleCheckComplete] = useState(false);

  // Check if user has correct role permissions
  useEffect(() => {
    if (!currentUser) {
      setRoleCheckComplete(true);
      return;
    }

    // If user needs registration, don't check roles yet
    if (needsRegistration) {
      setRoleCheckComplete(true);
      return;
    }

    if (!requireAdmin && !requireDriver && !requireCustomer) {
      // No special role required
      setRoleCheckComplete(true);
      return;
    }

    // Set role check as complete once userData is loaded
    if (userData) {
      setRoleCheckComplete(true);
    }
  }, [currentUser, requireAdmin, requireDriver, requireCustomer, userData, needsRegistration]);

  // Show loading state while checking authentication
  if (loading || !roleCheckComplete) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-red-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login with return URL
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user needs registration, redirect to registration
  if (needsRegistration) {
    return <Navigate to="/register" state={{ from: location }} replace />;
  }

  // If admin access required but user is not admin, redirect to home
  if (requireAdmin && !isAdminUser) {
    return <Navigate to="/" replace />;
  }

  // If driver access required but user is not a driver, redirect to home
  if (requireDriver && !isDriver) {
    return <Navigate to="/" replace />;
  }

  // If customer access required but user is not a customer, redirect to home
  if (requireCustomer && (isDriver || isAdminUser)) {
    return <Navigate to="/" replace />;
  }

  // If authenticated and passes role checks, render children
  return <Outlet />;
};

export default ProtectedRoute;
