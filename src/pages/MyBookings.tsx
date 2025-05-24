import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Calendar, Map, Clock, Car, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import { firestore, firebaseInitialized } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import InvoiceGenerator from '@/components/invoice/InvoiceGenerator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import FirebaseTest from '@/components/FirebaseTest';

// Booking type definition
interface Booking {
  id: string;
  type: string;
  status: string;
  date: Date;
  pickup: string;
  dropoff: string;
  vehicle: string;
  amount: string;
  paymentInfo?: {
    transactionId?: string;
    paymentMethod?: string;
    timestamp?: string;
  };
  customerInfo?: {
    name: string;
    email: string;
    phone: string;
  };
  createdAt?: string;
}

const BookingCard = ({ booking }: { booking: Booking }) => {
  const [showInvoice, setShowInvoice] = useState(false);

  const handleInvoiceSuccess = () => {
    toast.success('Invoice downloaded successfully');
    setShowInvoice(false);
  };

  const handleInvoiceError = (error: string) => {
    toast.error(error || 'Failed to generate invoice');
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">{booking.type} Service</CardTitle>
          <p className="text-sm text-gray-500">Booking ID: {booking.id}</p>
        </div>
        <Badge className={`
          ${booking.status === 'completed' ? 'bg-green-100 text-green-800' : 
            booking.status === 'initiated' ? 'bg-blue-100 text-blue-800' : 
            booking.status === 'awaiting' ? 'bg-yellow-100 text-yellow-800' : 
            'bg-red-100 text-red-800'}
        `}>
          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Date</p>
                <p className="text-sm text-gray-500">{format(booking.date, 'MMMM d, yyyy')}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Car className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Vehicle</p>
                <p className="text-sm text-gray-500">{booking.vehicle}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <Map className="h-5 w-5 text-gray-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Pickup Location</p>
              <p className="text-sm text-gray-500">{booking.pickup}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <Map className="h-5 w-5 text-gray-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Dropoff Location</p>
              <p className="text-sm text-gray-500">{booking.dropoff}</p>
            </div>
          </div>
          
          <div className="flex justify-between items-center pt-2 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-500">Amount</p>
              <p className="text-lg font-semibold">{booking.amount}</p>
            </div>
            
            <div className="flex gap-2">
              <Dialog open={showInvoice} onOpenChange={setShowInvoice}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-1"
                    disabled={booking.status === 'cancelled' || booking.status === 'failed'}
                  >
                    <FileText className="h-4 w-4" />
                    <span className="hidden sm:inline">Invoice</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Invoice for Booking #{booking.id}</DialogTitle>
                  </DialogHeader>
                  <InvoiceGenerator 
                    booking={booking} 
                    onSuccess={handleInvoiceSuccess}
                    onError={handleInvoiceError}
                  />
                </DialogContent>
              </Dialog>
              
              {(booking.status === 'completed' || booking.status === 'awaiting') && (
                <Button 
                  size="sm" 
                  className="bg-fleet-red hover:bg-fleet-red/90 flex items-center gap-1"
                >
                  <Clock className="h-4 w-4" />
                  <span className="hidden sm:inline">Track</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Demo bookings to show when Firebase fails or for development
const DEMO_BOOKINGS: Booking[] = [
  {
    id: 'BK123456',
    type: 'Chauffeur',
    status: 'completed',
    date: new Date(),
    pickup: 'Dubai Mall, Dubai',
    dropoff: 'Palm Jumeirah, Dubai',
    vehicle: 'Mercedes S-Class',
    amount: 'AED 320.00',
    customerInfo: {
      name: 'John Doe',
      email: 'john@example.com', 
      phone: '+971 50 123 4567'
    },
    paymentInfo: {
      transactionId: 'TX12345',
      paymentMethod: 'Credit Card',
      timestamp: new Date().toISOString()
    }
  },
  {
    id: 'BK789012',
    type: 'Hourly',
    status: 'awaiting',
    date: new Date(Date.now() + 86400000), // Tomorrow
    pickup: 'Dubai International Airport',
    dropoff: 'Burj Al Arab',
    vehicle: 'Cadillac Escalade',
    amount: 'AED 450.00',
    customerInfo: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+971 50 123 4567'
    }
  }
];

const MyBookings = () => {
  const { currentUser, userData } = useAuth();
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [pastBookings, setPastBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [useDemoData, setUseDemoData] = useState(false);
  const [showDebugTools, setShowDebugTools] = useState(false);

  useEffect(() => {
    console.log("MyBookings component mounted");
    console.log("Current user:", currentUser?.uid, currentUser?.email);
    console.log("User data:", userData);
    console.log("Firebase initialized:", firebaseInitialized);
    
    const fetchBookings = async () => {
      if (!currentUser) {
        console.log("No current user, showing demo data");
        setUseDemoData(true);
        setUpcomingBookings([DEMO_BOOKINGS[1]]);
        setPastBookings([DEMO_BOOKINGS[0]]);
        setLoading(false);
        return;
      }

      if (!firebaseInitialized) {
        console.warn("Firebase not initialized, showing demo data");
        setUseDemoData(true);
        setUpcomingBookings([DEMO_BOOKINGS[1]]);
        setPastBookings([DEMO_BOOKINGS[0]]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        console.log("Fetching bookings for user:", currentUser.email);

        // Reference to the bookings collection
        const bookingsRef = collection(firestore, 'bookings');
        
        // Try multiple query approaches to find bookings
        let querySnapshot;
        let userBookingsQuery;
        
        // Approach 1: Try with customer email in customerInfo
        if (currentUser.email) {
          console.log("Querying by customerInfo.email:", currentUser.email);
          userBookingsQuery = query(
            bookingsRef,
            where('customerInfo.email', '==', currentUser.email)
          );
          
          querySnapshot = await getDocs(userBookingsQuery);
          console.log(`Found ${querySnapshot.size} bookings by email in customerInfo`);
        }
        
        // Approach 2: Try with user ID if first approach returned no results
        if (!querySnapshot || querySnapshot.empty) {
          console.log("Querying by userId:", currentUser.uid);
          userBookingsQuery = query(
            bookingsRef,
            where('userId', '==', currentUser.uid)
          );
          
          querySnapshot = await getDocs(userBookingsQuery);
          console.log(`Found ${querySnapshot.size} bookings by userId`);
        }
        
        // Approach 3: Try with user email field directly
        if (!querySnapshot || querySnapshot.empty) {
          console.log("Querying by email field directly:", currentUser.email);
          userBookingsQuery = query(
            bookingsRef,
            where('email', '==', currentUser.email)
          );
          
          querySnapshot = await getDocs(userBookingsQuery);
          console.log(`Found ${querySnapshot.size} bookings by direct email field`);
        }
        
        // Approach 4: Try with user phone number if available
        if ((!querySnapshot || querySnapshot.empty) && userData?.phoneNumber) {
          console.log("Querying by phone number:", userData.phoneNumber);
          userBookingsQuery = query(
            bookingsRef,
            where('phoneNumber', '==', userData.phoneNumber)
          );
          
          querySnapshot = await getDocs(userBookingsQuery);
          console.log(`Found ${querySnapshot.size} bookings by phone number`);
        }
        
        // If we still have no results, show demo data
        if (!querySnapshot || querySnapshot.empty) {
          console.log("No bookings found with any query method, using demo data");
          setUseDemoData(true);
          setUpcomingBookings([DEMO_BOOKINGS[1]]);
          setPastBookings([DEMO_BOOKINGS[0]]);
          setLoading(false);
          return;
        }
        
        console.log(`Processing ${querySnapshot.size} bookings`);
        const now = new Date();
        const upcoming: Booking[] = [];
        const past: Booking[] = [];

        querySnapshot.forEach((doc) => {
          try {
            console.log(`Processing booking: ${doc.id}`);
            const data = doc.data();
            console.log("Booking data:", data);
            
            // Convert Firestore timestamp to Date, with fallbacks
            let bookingDate: Date;
            try {
              if (data.date?.toDate && typeof data.date.toDate === 'function') {
                // Firestore timestamp
                bookingDate = data.date.toDate();
                console.log("Using Firestore timestamp date:", bookingDate);
              } else if (data.date) {
                // ISO string or other date format
                bookingDate = new Date(data.date);
                console.log("Using string date:", bookingDate);
              } else if (data.createdAt?.toDate && typeof data.createdAt.toDate === 'function') {
                bookingDate = data.createdAt.toDate();
                console.log("Using Firestore timestamp createdAt:", bookingDate);
              } else if (data.createdAt) {
                bookingDate = new Date(data.createdAt);
                console.log("Using string createdAt:", bookingDate);
              } else {
                bookingDate = new Date();
                console.log("Using current date as fallback");
              }
            } catch (e) {
              console.error("Date conversion error:", e);
              bookingDate = new Date();
            }
            
            // Extract amount with fallbacks
            let amount = "AED 0.00";
            if (typeof data.amount === 'number') {
              amount = `AED ${data.amount.toFixed(2)}`;
            } else if (typeof data.totalAmount === 'number') {
              amount = `AED ${data.totalAmount.toFixed(2)}`;
            } else if (typeof data.price === 'number') {
              amount = `AED ${data.price.toFixed(2)}`;
            }
            
            const booking: Booking = {
              id: doc.id,
              type: data.type || data.bookingType || 'Chauffeur',
              status: data.status || 'initiated',
              date: bookingDate,
              pickup: data.pickupLocation?.name || data.pickup || data.origin || 'N/A',
              dropoff: data.dropoffLocation?.name || data.dropoff || data.destination || 'N/A',
              vehicle: data.vehicle?.name || data.vehicleType || data.car || 'Standard Vehicle',
              amount: amount,
              paymentInfo: data.paymentInfo || {},
              customerInfo: data.customerInfo || {
                name: userData?.firstName ? `${userData.firstName} ${userData.lastName || ''}` : currentUser.displayName || 'User',
                email: currentUser.email || 'N/A',
                phone: userData?.phoneNumber || data.phoneNumber || 'N/A'
              },
              createdAt: data.createdAt ? (
                typeof data.createdAt.toDate === 'function' ? 
                  data.createdAt.toDate().toISOString() : 
                  String(data.createdAt)
              ) : new Date().toISOString()
            };

            // Sort into upcoming or past based on date
            if (bookingDate > now && booking.status !== 'completed' && booking.status !== 'cancelled') {
              upcoming.push(booking);
            } else {
              past.push(booking);
            }
          } catch (err) {
            console.error(`Error processing booking ${doc.id}:`, err);
            // Continue with other bookings even if one fails
          }
        });

        console.log(`Processed ${upcoming.length} upcoming and ${past.length} past bookings`);
        setUpcomingBookings(upcoming);
        setPastBookings(past);
        setUseDemoData(false);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching bookings:', err);
        setError('Failed to load bookings. Please try again.');
        
        // Use demo data after multiple failures
        if (retryCount >= 2) {
          console.log("Using demo data after multiple failures");
          setUseDemoData(true);
          setUpcomingBookings([DEMO_BOOKINGS[1]]);
          setPastBookings([DEMO_BOOKINGS[0]]);
        }
        setLoading(false);
      }
    };

    fetchBookings();
  }, [currentUser, userData, retryCount]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  const toggleDebugTools = () => {
    setShowDebugTools(prev => !prev);
  };

  return (
    <Layout>
      <div className="bg-gradient-to-r from-fleet-red to-fleet-accent py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-white">My Bookings</h1>
          <p className="text-white/90 mt-2">View and manage your bookings</p>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 text-fleet-red animate-spin mb-4" />
            <p className="text-gray-600">Loading your bookings...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4 max-w-lg mx-auto">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
            <Button onClick={handleRetry} variant="outline" className="ml-2">
              Try Again
            </Button>
          </div>
        ) : (
          <>
            {useDemoData && (
              <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded mb-6">
                <div className="flex">
                  <AlertTriangle className="h-6 w-6 text-amber-500 mr-2" />
                  <div>
                    <p className="text-amber-800 font-medium">Using Sample Data</p>
                    <p className="text-amber-700 text-sm">
                      We're unable to find your bookings. Showing sample bookings instead.
                    </p>
                  </div>
                </div>
              </div>
            )}
          
            <Tabs defaultValue="upcoming" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="upcoming" className="text-base">
                  Upcoming ({upcomingBookings.length})
                </TabsTrigger>
                <TabsTrigger value="past" className="text-base">
                  Past ({pastBookings.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="upcoming" className="space-y-4">
                {upcomingBookings.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">You don't have any upcoming bookings.</p>
                    <Link to="/">
                      <Button>Book a Ride</Button>
                    </Link>
                  </div>
                ) : (
                  upcomingBookings.map(booking => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))
                )}
              </TabsContent>
              
              <TabsContent value="past" className="space-y-4">
                {pastBookings.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">You don't have any past bookings.</p>
                  </div>
                ) : (
                  pastBookings.map(booking => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))
                )}
              </TabsContent>
            </Tabs>
            
            {/* Debug section */}
            <div className="mt-12 border-t pt-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={toggleDebugTools}
                className="mb-4"
              >
                {showDebugTools ? 'Hide Debug Tools' : 'Show Debug Tools'}
              </Button>
              
              {showDebugTools && (
                <div className="mt-4">
                  <h3 className="text-lg font-medium mb-3">Debug Information</h3>
                  <div className="bg-gray-50 p-3 rounded mb-4">
                    <p><strong>User ID:</strong> {currentUser?.uid || 'Not logged in'}</p>
                    <p><strong>User Email:</strong> {currentUser?.email || 'N/A'}</p>
                    <p><strong>Firebase Initialized:</strong> {firebaseInitialized ? 'Yes' : 'No'}</p>
                    <p><strong>Using Demo Data:</strong> {useDemoData ? 'Yes' : 'No'}</p>
                    <p><strong>Retry Count:</strong> {retryCount}</p>
                  </div>
                  
                  <FirebaseTest />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default MyBookings;
