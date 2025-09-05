import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

const AdminGeofencing = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the AdminFareSettings page with zones tab selected
    navigate("/admin/fare-settings?tab=zones");
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
      <p className="text-gray-500">
        Redirecting to Fare Settings & Geofencing...
      </p>
    </div>
  );
};

export default AdminGeofencing;
