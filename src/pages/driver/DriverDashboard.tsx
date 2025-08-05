import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Line, BarChart, Bar } from 'recharts';
import { toast } from 'sonner';
import { Star, Users, Clock, Calendar, ChartBar, Car, CheckCircle, MapPin, AlertTriangle } from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { getDriver } from '@/services/userService';

// Define interfaces for driver and booking data
interface DriverData {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  status: 'active' | 'inactive' | 'suspended';
  taxiTypeId?: string;
  vehicleTypeId?: string;
  vehicleNumber?: string;
  rating?: number;
  rides?: number;
  earnings?: number;
  joined?: string;
  vehicleTypeName?: string;
  [key: string]: any; // Allow additional properties
}

interface BookingData {
  id: string;
  formattedId?: string;
  status: string;
  customerInfo?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  pickupLocation?: {
    name?: string;
  };
  dropoffLocation?: {
    name?: string;
  };
  pickup?: string;
  dropoff?: string;
  amount?: string;
  pickupDateTime?: {
    toDate: () => Date;
  };
  [key: string]: any; // Allow additional properties
}

const earningsData = [
  { name: 'Mon', earnings: 120 },
  { name: 'Tue', earnings: 145 },
  { name: 'Wed', earnings: 105 },
  { name: 'Thu', earnings: 190 },
  { name: 'Fri', earnings: 210 },
  { name: 'Sat', earnings: 250 },
  { name: 'Sun', earnings: 180 },
];

const performanceData = [
  { name: 'Week 1', rides: 32, rating: 4.7 },
  { name: 'Week 2', rides: 28, rating: 4.8 },
  { name: 'Week 3', rides: 35, rating: 4.9 },
  { name: 'Week 4', rides: 42, rating: 4.8 },
];

const DriverDashboard = () => {
  const { userData, currentUser, isDriver, loading } = useAuth();
  const [driverData, setDriverData] = useState<DriverData | null>(null);
  const [assignedRides, setAssignedRides] = useState<BookingData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRides: 0,
    completedRides: 0,
    cancelledRides: 0,
    earnings: 0,
    rating: 0
  });

  // Fetch driver data from API
  useEffect(() => {
    const fetchDriverData = async () => {
      if (!userData || !isDriver || !currentUser?.uid) return;
      
      try {
        setIsLoading(true);
        
        // Try to fetch driver data from API first
        try {
          const driverResponse = await getDriver(currentUser.uid);
          if (driverResponse.success && driverResponse.data) {
            const apiDriver = driverResponse.data;
            const driver: DriverData = {
              id: apiDriver.id,
              name: apiDriver.name,
              email: apiDriver.email,
              phone: apiDriver.phone,
              status: apiDriver.status,
              taxiTypeId: apiDriver.taxiTypeId,
              vehicleTypeId: apiDriver.vehicleTypeId,
              vehicleNumber: apiDriver.vehicleNumber,
              rating: apiDriver.rating,
              rides: apiDriver.rides,
              earnings: apiDriver.earnings,
              joined: apiDriver.joined,
            };
            
            setDriverData(driver);
            
            // Update stats
            setStats(prev => ({
              ...prev,
              totalRides: driver.rides || 0,
              rating: driver.rating || 0,
              earnings: driver.earnings || 0
            }));
            
            // Fetch vehicle type information
            if (driver.vehicleTypeId) {
              const vehicleTypeRef = doc(firestore, 'vehicleTypes', driver.vehicleTypeId);
              const vehicleTypeSnap = await getDoc(vehicleTypeRef);
              if (vehicleTypeSnap.exists()) {
                const vehicleTypeData = vehicleTypeSnap.data();
                setDriverData(prev => {
                  if (!prev) return null;
                  return {
                    ...prev,
                    vehicleTypeName: vehicleTypeData.name || 'Unknown Vehicle'
                  };
                });
              }
            }
          } else {
            
          }
        } catch (apiError) {
          console.error('Error fetching from API, falling back to Firestore:', apiError);
          
          // Fallback to direct Firestore calls
          const driverRef = doc(firestore, 'drivers', currentUser.uid);
          const driverSnap = await getDoc(driverRef);
          
          if (driverSnap.exists()) {
            const driver = { id: driverSnap.id, ...driverSnap.data() } as DriverData;
            setDriverData(driver);
            
            // Update stats
            setStats(prev => ({
              ...prev,
              totalRides: driver.rides || 0,
              rating: driver.rating || 0,
              earnings: driver.earnings || 0
            }));
            
            // Fetch vehicle type information
            if (driver.vehicleTypeId) {
              const vehicleTypeRef = doc(firestore, 'vehicleTypes', driver.vehicleTypeId);
              const vehicleTypeSnap = await getDoc(vehicleTypeRef);
              if (vehicleTypeSnap.exists()) {
                const vehicleTypeData = vehicleTypeSnap.data();
                setDriverData(prev => {
                  if (!prev) return null;
                  return {
                    ...prev,
                    vehicleTypeName: vehicleTypeData.name || 'Unknown Vehicle'
                  };
                });
              }
            }
          } else {
            
          }
        }
        
        // Fetch assigned rides (bookings where this driver is assigned)
        if (currentUser.uid) {
          const bookingsRef = collection(firestore, 'bookings');
          const q = query(
            bookingsRef, 
            where('driverId', '==', currentUser.uid),
            where('status', 'in', ['driver_assigned', 'in_progress'])
          );
          
          const bookingSnapshot = await getDocs(q);
          const rides: BookingData[] = [];
          
          bookingSnapshot.forEach(doc => {
            const booking = { id: doc.id, ...doc.data() } as BookingData;
            rides.push(booking);
          });
          
          setAssignedRides(rides);
          
          // Update stats with completed and cancelled rides
          const completedQuery = query(
            bookingsRef,
            where('driverId', '==', currentUser.uid),
            where('status', '==', 'completed')
          );
          
          const cancelledQuery = query(
            bookingsRef,
            where('driverId', '==', currentUser.uid),
            where('status', '==', 'cancelled')
          );
          
          const [completedSnap, cancelledSnap] = await Promise.all([
            getDocs(completedQuery),
            getDocs(cancelledQuery)
          ]);
          
          setStats(prev => ({
            ...prev,
            completedRides: completedSnap.size,
            cancelledRides: cancelledSnap.size
          }));
        }
      } catch (error) {
        console.error('Error fetching driver data:', error);
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
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const [isOnline, setIsOnline] = React.useState(false);
  
  const toggleStatus = () => {
    const newStatus = !isOnline;
    setIsOnline(newStatus);
    toast.success(newStatus ? "You are now online and can receive ride requests!" : "You are now offline.");
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
                We couldn't find your driver account information. This may be because your account is still being set up by the administrator.
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
                <div className="text-2xl font-bold">AED {stats.earnings.toFixed(2)}</div>
                <p className="text-sm text-gray-500">Total Earnings</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold flex items-center">
                  {stats.rating.toFixed(1)} <Star className="h-5 w-5 text-yellow-400 ml-1" />
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
                        <p className="font-medium">{driverData.name}</p>
                        <p className="text-sm text-gray-500">Driver ID: {driverData.id.substring(0, 8)}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Badge className={`${driverData.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {driverData.status === 'active' ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                      <p className="text-sm">Joined: {driverData.joined}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-md font-medium mb-2">Vehicle Information</h3>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Car className="h-5 w-5 text-gray-400 mr-2" />
                      <p className="text-sm">{driverData.vehicleTypeName || 'Standard Vehicle'}</p>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-gray-400 mr-2" />
                      <p className="text-sm">Vehicle Number: {driverData.vehicleNumber}</p>
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
                            {ride.status === 'driver_assigned' ? 'Assigned' : 'In Progress'}
                          </Badge>
                          <span className="ml-2 text-sm text-gray-500">
                            {ride.formattedId || `Booking #${ride.id.substring(0, 8)}`}
                          </span>
                        </div>
                        <div className="text-sm font-medium">
                          {ride.amount || 'AED 0.00'}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm">
                            {ride.pickupDateTime ? formatDate(ride.pickupDateTime.toDate()) : 'N/A'}
                          </span>
                        </div>
                        
                        <div className="flex items-start">
                          <MapPin className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                          <div className="text-sm">
                            <p className="font-medium">Pickup: {ride.pickupLocation?.name || ride.pickup || 'N/A'}</p>
                            <p>Dropoff: {ride.dropoffLocation?.name || ride.dropoff || 'N/A'}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start">
                          <Users className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                          <div className="text-sm">
                            <p className="font-medium">
                              {ride.customerInfo?.name || 'Customer'}
                            </p>
                            <p className="text-gray-500">
                              {ride.customerInfo?.phone || 'No phone provided'}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 flex gap-2">
                        <Button variant="default" size="sm">
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
                  <p className="text-sm mt-1">New ride assignments will appear here</p>
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
