import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Star,
  Users,
  Clock,
  Calendar,
  Car,
  CheckCircle,
  MapPin,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  bookingService,
  BookingWithRelations,
  userService,
  UserWithDriverDetail,
} from "@/services";

const DriverDashboard = () => {
  const navigate = useNavigate();

  const { userData, currentUser, isDriver } = useAuth();
  const [driverData, setDriverData] = useState<UserWithDriverDetail | null>(
    null,
  );
  const [assignedRides, setAssignedRides] = useState<BookingWithRelations[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRides: 0,
    completedRides: 0,
    cancelledRides: 0,
    earnings: 0,
    rating: 0,
  });

  // Fetch driver data from API
  useEffect(() => {
    const fetchDriverData = async () => {
      if (!userData || !isDriver || !currentUser?.uid) return;

      try {
        setIsLoading(true);
        try {
          const driverResponse = await userService.getDriver(currentUser.uid);
          if (driverResponse.success && driverResponse.data) {
            const apiDriver = driverResponse.data;

            setDriverData(apiDriver);
            // Update stats
            setStats((prev) => ({
              ...prev,
              totalRides: 0,
              rating: 0,
              earnings: 0,
            }));
          }
        } catch (apiError) {
          console.error(
            "Error fetching from API, falling back to Firestore:",
            apiError,
          );

          // Fallback to direct Firestore calls
          const driverRef = doc(firestore, "drivers", currentUser.uid);
          const driverSnap = await getDoc(driverRef);

          if (driverSnap.exists()) {
            const driver = {
              id: driverSnap.id,
              ...driverSnap.data(),
            } as DriverData;
            setDriverData(driver);

            // Update stats
            setStats((prev) => ({
              ...prev,
              totalRides: driver.rides || 0,
              rating: driver.rating || 0,
              earnings: driver.earnings || 0,
            }));

            // Fetch vehicle type information
            if (driver.vehicleTypeId) {
              const vehicleTypeRef = doc(
                firestore,
                "vehicleTypes",
                driver.vehicleTypeId,
              );
              const vehicleTypeSnap = await getDoc(vehicleTypeRef);
              if (vehicleTypeSnap.exists()) {
                const vehicleTypeData = vehicleTypeSnap.data();
                setDriverData((prev) => {
                  if (!prev) return null;
                  return {
                    ...prev,
                    vehicleTypeName: vehicleTypeData.name || "Unknown Vehicle",
                  };
                });
              }
            }
          } else {
          }
        }

        // Fetch assigned rides (bookings where this driver is assigned)
        if (currentUser.uid) {
          const bookingsResponse = await bookingService.getBookingsByUserId(
            userData.id,
          );
          const bookings = bookingsResponse.data;

          setAssignedRides(bookings);

          // Update stats with completed and cancelled rides
          const completedRides = bookings.filter(
            (b) => b.status === "completed",
          );
          const cancelledRides = bookings.filter(
            (b) => b.status === "cancelled",
          );

          setStats((prev) => ({
            ...prev,
            completedRides: completedRides.length,
            cancelledRides: cancelledRides.length,
          }));
        }
      } catch (error) {
        console.error("Error fetching driver data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (userData && isDriver) {
      fetchDriverData();
    } else {
      setIsLoading(false);
    }
  }, [userData, isDriver]);

  // Format date
  const formatDate = (dateString: string | Date) => {
    const date =
      typeof dateString === "string" ? new Date(dateString) : dateString;
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const [isOnline, setIsOnline] = React.useState(false);

  const toggleStatus = () => {
    const newStatus = !isOnline;
    setIsOnline(newStatus);
    toast.success(
      newStatus
        ? "You are now online and can receive ride requests!"
        : "You are now offline.",
    );
  };

  return (
    <DashboardLayout userType="driver">
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-fleet-red"></div>
        </div>
      ) : !driverData ? (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <AlertTriangle className="h-16 w-16 text-amber-500" />
              <h2 className="text-2xl font-bold">Driver Account Not Found</h2>
              <p className="text-gray-600 max-w-md">
                We couldn't find your driver account information. This may be
                because your account is still being set up by the administrator.
              </p>
              <p className="text-gray-500">
                Please contact support if you believe this is an error.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{stats.totalRides}</div>
                <p className="text-sm text-gray-500">Total Rides</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{stats.completedRides}</div>
                <p className="text-sm text-gray-500">Completed</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  AED {stats.earnings.toFixed(2)}
                </div>
                <p className="text-sm text-gray-500">Total Earnings</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold flex items-center">
                  {stats.rating.toFixed(1)}{" "}
                  <Star className="h-5 w-5 text-yellow-400 ml-1" />
                </div>
                <p className="text-sm text-gray-500">Rating</p>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle>Driver Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-md font-medium mb-2">Personal Details</h3>
                  <div className="space-y-2">
                    <div className="flex items-start">
                      <Users className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                      <div>
                        <p className="font-medium">{driverData.firstName}</p>
                        <p className="text-sm text-gray-500">
                          Driver ID: {driverData.id.substring(0, 8)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Badge
                        className={`${driverData.driverDetails.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                      >
                        {driverData.driverDetails.status === "active"
                          ? "Active"
                          : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                      <p className="text-sm">Joined: {driverData.createdAt}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-md font-medium mb-2">
                    Vehicle Information
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Car className="h-5 w-5 text-gray-400 mr-2" />
                      <p className="text-sm">
                        {driverData.driverDetails.vehicleTypeId ||
                          "Standard Vehicle"}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-gray-400 mr-2" />
                      <p className="text-sm">
                        Vehicle Number: {driverData.driverDetails.vehicleNumber}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>
                Assigned Rides
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({assignedRides.length} active)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {assignedRides.length > 0 ? (
                <div className="space-y-4">
                  {assignedRides.map((ride, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <Badge className="bg-indigo-100 text-indigo-800">
                            {ride.status === "assigned"
                              ? "Assigned"
                              : "In Progress"}
                          </Badge>
                          <span className="ml-2 text-sm text-gray-500">
                            {ride.id || `Booking #${ride.id.substring(0, 8)}`}
                          </span>
                        </div>
                        <div className="text-sm font-medium">
                          {ride.amount || "AED 0.00"}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm">
                            {ride.pickupDate
                              ? formatDate(ride.pickupDate)
                              : "N/A"}
                          </span>
                        </div>

                        <div className="flex items-start">
                          <MapPin className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                          <div className="text-sm">
                            <p className="font-medium">
                              Pickup:{" "}
                              {ride.pickupLocation?.name ||
                                ride.pickupLocation.address ||
                                "N/A"}
                            </p>
                            <p>
                              Dropoff:{" "}
                              {ride.dropoffLocation?.name ||
                                ride.dropoffLocation.address ||
                                "N/A"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start">
                          <Users className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                          <div className="text-sm">
                            <p className="font-medium">
                              {ride.user?.firstName || "Customer"}
                            </p>
                            <p className="text-gray-500">
                              {ride.user?.lastName || "No phone provided"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex gap-2">
                        <Button
                          onClick={() =>
                            navigate(`/driver/start-ride/${ride.id}`)
                          }
                          variant="default"
                          size="sm"
                        >
                          Start Ride
                        </Button>
                        <Button variant="outline" size="sm">
                          Call Customer
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Car className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No active rides assigned to you</p>
                  <p className="text-sm mt-1">
                    New ride assignments will appear here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </DashboardLayout>
  );
};

export default DriverDashboard;
