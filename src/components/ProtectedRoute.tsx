import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { isAdmin } from '@/lib/authUtils';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [adminCheckComplete, setAdminCheckComplete] = useState(false);

  // Check if user is admin when needed
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (requireAdmin && currentUser) {
        const adminStatus = await isAdmin(currentUser.uid);
        setIsAdminUser(adminStatus);
      }
      setAdminCheckComplete(true);
    };

    if (currentUser && requireAdmin) {
      checkAdminStatus();
    } else {
      setAdminCheckComplete(true);
    }
  }, [currentUser, requireAdmin]);

  // Show loading state while checking authentication
  if (loading || (requireAdmin && !adminCheckComplete)) {
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

  // If admin access required but user is not admin, redirect to home
  if (requireAdmin && !isAdminUser) {
    console.log('Non-admin user attempting to access admin route');
    return <Navigate to="/" replace />;
  }

  // If authenticated and passes admin check when needed, render children
  return <>{children}</>;
};

export default ProtectedRoute; 