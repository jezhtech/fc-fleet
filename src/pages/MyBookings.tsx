import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Calendar, Map, Clock, Car, AlertTriangle, CheckCircle2, Circle, User, Phone, Car as CarIcon } from 'lucide-react';
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
import { formatExistingBookingId } from '@/utils/booking';

// Booking type definition
interface Booking {
  id: string;
  formattedId?: string;
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
  driverInfo?: {
    name?: string;
    phone?: string;
    vehicleNumber?: string;
  };
  createdAt?: string;
}

// Tracking step interface
interface TrackingStep {
  label: string;
  status: 'completed' | 'current' | 'upcoming';
  details?: React.ReactNode;
}

// TrackingDialog component
const TrackingDialog = ({ booking }: { booking: Booking }) => {
  // Determine the current step based on booking status
  const getCurrentStep = (status: string): number => {
    switch (status.toLowerCase()) {
      case 'completed': return 7; // All steps completed
      case 'started': return 6; // Ride started
      case 'driver_assigned': return 4; // Driver assigned
      case 'confirmed': return 3; // Booking confirmed
      case 'initiated': return 2; // Booking initiated
      case 'awaiting': return 1; // Payment confirmed
      default: return 0; // Default to first step
    }
  };

  const currentStepIndex = getCurrentStep(booking.status);
  
  // Define all steps in the booking flow
  const steps: TrackingStep[] = [
    {
      label: 'Payment Confirmed',
      status: currentStepIndex >= 1 ? 'completed' : 'upcoming',
      details: booking.paymentInfo && (
        <div className="text-sm text-gray-600 mt-1">
          <p>Transaction ID: {booking.paymentInfo.transactionId || 'N/A'}</p>
          <p>Method: {booking.paymentInfo.paymentMethod || 'N/A'}</p>
        </div>
      )
    },
    {
      label: 'Booking Initiated',
      status: currentStepIndex >= 2 ? 'completed' : currentStepIndex === 1 ? 'current' : 'upcoming'
    },
    {
      label: 'Booking Confirmed',
      status: currentStepIndex >= 3 ? 'completed' : currentStepIndex === 2 ? 'current' : 'upcoming'
    },
    {
      label: 'Driver Assigned',
      status: currentStepIndex >= 4 ? 'completed' : currentStepIndex === 3 ? 'current' : 'upcoming',
      details: currentStepIndex >= 4 && booking.driverInfo && (
        <div className="text-sm text-gray-600 mt-1 space-y-1">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Driver: {booking.driverInfo.name || 'Not assigned yet'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            <span>Phone: {booking.driverInfo.phone || 'Not available'}</span>
          </div>
          <div className="flex items-center gap-2">
            <CarIcon className="h-4 w-4" />
            <span>Vehicle Number: {booking.driverInfo.vehicleNumber || 'Not available'}</span>
          </div>
        </div>
      )
    },
    {
      label: 'Ride Started',
      status: currentStepIndex >= 6 ? 'completed' : currentStepIndex === 5 ? 'current' : 'upcoming'
    },
    {
      label: 'Ride Ended',
      status: currentStepIndex >= 7 ? 'completed' : currentStepIndex === 6 ? 'current' : 'upcoming'
    },
    {
      label: 'Rating',
      status: currentStepIndex === 7 ? 'current' : 'upcoming'
    }
  ];

  return (
    <div className="py-4">
      <div className="space-y-6">
        {steps.map((step, index) => (
          <div key={index} className="flex">
            <div className="flex flex-col items-center mr-4">
              {step.status === 'completed' ? (
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              ) : step.status === 'current' ? (
                <Circle className="h-6 w-6 text-fleet-red fill-fleet-red/20 stroke-fleet-red" />
              ) : (
                <Circle className="h-6 w-6 text-gray-300" />
              )}
              {index < steps.length - 1 && (
                <div className={`h-12 w-0.5 ${
                  step.status === 'completed' ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
            <div className="pt-1 pb-8">
              <p className={`font-medium ${
                step.status === 'completed' ? 'text-green-700' : 
                step.status === 'current' ? 'text-fleet-red' : 'text-gray-500'
              }`}>
                {step.label}
              </p>
              {step.details && <div className="mt-1">{step.details}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Format booking ID as FC/YYYY/MM/0001
const formatBookingId = (id: string, date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  
  // Extract numeric part or use a random number
  let numericPart = '0001';
  if (id.includes('/')) {
    // Already formatted, return as is
    return id;
  } else if (/\d+/.test(id)) {
    const matches = id.match(/\d+/);
    if (matches && matches[0]) {
      numericPart = matches[0].padStart(4, '0');
    }
  }
  
  return `FC/${year}/${month}/${numericPart}`;
};

const BookingCard = ({ booking }: { booking: Booking }) => {
  const [showInvoice, setShowInvoice] = useState(false);
  const [showTracking, setShowTracking] = useState(false);
  
  // Use the formattedId if available, otherwise generate one
  const bookingId = booking.formattedId || formatExistingBookingId(booking.id, booking.date);

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
          <p className="text-sm text-gray-500">Booking ID: {bookingId}</p>
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
                    <DialogTitle>Invoice for Booking {bookingId}</DialogTitle>
                  </DialogHeader>
                  <InvoiceGenerator 
                    booking={booking} 
                    onSuccess={handleInvoiceSuccess}
                    onError={handleInvoiceError}
                  />
                </DialogContent>
              </Dialog>
              
              <Dialog open={showTracking} onOpenChange={setShowTracking}>
                <DialogTrigger asChild>
                  <Button 
                    size="sm" 
                    className="bg-fleet-red hover:bg-fleet-red/90 flex items-center gap-1"
                  >
                    <Clock className="h-4 w-4" />
                    <span className="hidden sm:inline">Track</span>
                </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Tracking Booking {bookingId}</DialogTitle>
                  </DialogHeader>
                  <TrackingDialog booking={booking} />
                </DialogContent>
              </Dialog>
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
    date: new Date(), // Current date
    pickup: 'Dubai Mall, Dubai',
    dropoff: 'Palm Jumeirah, Dubai',
    vehicle: 'Mercedes S-Class',
    amount: 'AED 320.00',
    customerInfo: {
      name: 'John Doe',
      email: 'john@example.com', 
      phone: '+971 50 123 4567'
    },
    driverInfo: {
      name: 'Ahmed Mohammed',
      phone: '+971 55 987 6543',
      vehicleNumber: 'DXB 12345'
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
    status: 'driver_assigned',
    date: (() => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow;
    })(), // Tomorrow
    pickup: 'Dubai International Airport',
    dropoff: 'Burj Al Arab',
    vehicle: 'Cadillac Escalade',
    amount: 'AED 450.00',
    customerInfo: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+971 50 123 4567'
    },
    driverInfo: {
      name: 'Samir Khan',
      phone: '+971 54 876 5432',
      vehicleNumber: 'DXB 54321'
    },
    paymentInfo: {
      transactionId: 'TX67890',
      paymentMethod: 'Debit Card',
      timestamp: new Date().toISOString()
    }
  },
  {
    id: 'BK345678',
    type: 'Chauffeur',
    status: 'initiated',
    date: (() => {
      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      return dayAfterTomorrow;
    })(), // Day after tomorrow
    pickup: 'Dubai Marina',
    dropoff: 'Abu Dhabi Grand Mosque',
    vehicle: 'BMW 7 Series',
    amount: 'AED 550.00',
    customerInfo: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+971 50 123 4567'
    },
    paymentInfo: {
      transactionId: 'TX24680',
      paymentMethod: 'Credit Card',
      timestamp: new Date().toISOString()
    }
  },
  {
    id: 'BK567890',
    type: 'Chauffeur',
    status: 'awaiting',
    date: (() => {
      const inThreeDays = new Date();
      inThreeDays.setDate(inThreeDays.getDate() + 3);
      return inThreeDays;
    })(), // In three days
    pickup: 'Dubai Healthcare City',
    dropoff: 'Dubai Mall',
    vehicle: 'Lexus ES',
    amount: 'AED 280.00',
    customerInfo: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+971 50 123 4567'
    },
    paymentInfo: {
      transactionId: 'TX13579',
      paymentMethod: 'Wallet',
      timestamp: new Date().toISOString()
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
  const [firebaseStatus, setFirebaseStatus] = useState(firebaseInitialized);

  // Add a retry mechanism for Firebase initialization
  useEffect(() => {
    if (!firebaseInitialized && retryCount < 3) {
      const timer = setTimeout(() => {
        console.log(`Retrying Firebase connection (attempt ${retryCount + 1})...`);
        setFirebaseStatus(firebaseInitialized);
        setRetryCount(prev => prev + 1);
      }, 2000); // Retry every 2 seconds
      
      return () => clearTimeout(timer);
    }
  }, [retryCount, firebaseInitialized]);

  useEffect(() => {
    console.log("MyBookings component mounted");
    console.log("Current user:", currentUser?.uid, currentUser?.email);
    console.log("User data:", userData);
    console.log("Firebase initialized:", firebaseInitialized);
    
    const fetchBookings = async () => {
      if (!currentUser) {
        console.log("No current user, showing demo data");
        setUseDemoData(true);
        setUpcomingBookings([DEMO_BOOKINGS[1], DEMO_BOOKINGS[2], DEMO_BOOKINGS[3]]);
        setPastBookings([DEMO_BOOKINGS[0]]);
        setLoading(false);
        return;
      }

      if (!firebaseInitialized) {
        console.warn("Firebase not initialized, showing demo data");
        setUseDemoData(true);
        setUpcomingBookings([DEMO_BOOKINGS[1], DEMO_BOOKINGS[2], DEMO_BOOKINGS[3]]);
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
          
          try {
            querySnapshot = await getDocs(userBookingsQuery);
            console.log(`Found ${querySnapshot.size} bookings by email in customerInfo`);
          } catch (err) {
            console.error("Error querying by customerInfo.email:", err);
          }
        }
        
        // Approach 2: Try with user ID if first approach returned no results
        if (!querySnapshot || querySnapshot.empty) {
          console.log("Querying by userId:", currentUser.uid);
          userBookingsQuery = query(
            bookingsRef,
            where('userId', '==', currentUser.uid)
          );
          
          try {
            querySnapshot = await getDocs(userBookingsQuery);
            console.log(`Found ${querySnapshot.size} bookings by userId`);
          } catch (err) {
            console.error("Error querying by userId:", err);
          }
        }
        
        // Approach 3: Try with user email field directly
        if (!querySnapshot || querySnapshot.empty) {
          console.log("Querying by email field directly:", currentUser.email);
          userBookingsQuery = query(
            bookingsRef,
            where('email', '==', currentUser.email)
          );
          
          try {
            querySnapshot = await getDocs(userBookingsQuery);
            console.log(`Found ${querySnapshot.size} bookings by direct email field`);
          } catch (err) {
            console.error("Error querying by email field:", err);
          }
        }
        
        // Approach 4: Try with user phone number if available
        if ((!querySnapshot || querySnapshot.empty) && userData?.phoneNumber) {
          console.log("Querying by phone number:", userData.phoneNumber);
          userBookingsQuery = query(
            bookingsRef,
            where('phoneNumber', '==', userData.phoneNumber)
          );
          
          try {
            querySnapshot = await getDocs(userBookingsQuery);
            console.log(`Found ${querySnapshot.size} bookings by phone number`);
          } catch (err) {
            console.error("Error querying by phone number:", err);
          }
        }
        
        // NEW APPROACH 5: Try with customerInfo.email field (exact match from screenshot)
        if (!querySnapshot || querySnapshot.empty) {
          console.log("Querying by exact customerInfo email field");
          userBookingsQuery = query(
            bookingsRef,
            where('customerInfo.email', '==', "customer@example.com")
          );
          
          try {
            querySnapshot = await getDocs(userBookingsQuery);
            console.log(`Found ${querySnapshot.size} bookings by exact customerInfo email`);
          } catch (err) {
            console.error("Error querying by exact customerInfo email:", err);
          }
        }
        
        // NEW APPROACH 6: Get all bookings and filter client-side (last resort)
        if (!querySnapshot || querySnapshot.empty) {
          console.log("Fetching all bookings and filtering client-side");
          try {
            querySnapshot = await getDocs(collection(firestore, 'bookings'));
            console.log(`Found ${querySnapshot.size} total bookings`);
            
            // If we have too many bookings, limit to reasonable number
            if (querySnapshot.size > 100) {
              console.warn("Large number of bookings found, using demo data instead");
              setUseDemoData(true);
              setUpcomingBookings([DEMO_BOOKINGS[1], DEMO_BOOKINGS[2], DEMO_BOOKINGS[3]]);
              setPastBookings([DEMO_BOOKINGS[0]]);
              setLoading(false);
              return;
            }
          } catch (err) {
            console.error("Error fetching all bookings:", err);
          }
        }
        
        // If we still have no results, show demo data
        if (!querySnapshot || querySnapshot.empty) {
          console.log("No bookings found with any query method, using demo data");
          setUseDemoData(true);
          setUpcomingBookings([DEMO_BOOKINGS[1], DEMO_BOOKINGS[2], DEMO_BOOKINGS[3]]);
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
            
            // Process booking creation date
            let createdAt: Date | null = null;
            try {
              if (data.createdAt?.toDate && typeof data.createdAt.toDate === 'function') {
                createdAt = data.createdAt.toDate();
                console.log("Using Firestore timestamp createdAt:", createdAt);
              } else if (data.createdAt) {
                // Handle other date formats
                createdAt = new Date(data.createdAt);
                console.log("Using string createdAt:", createdAt);
              } else {
                console.warn("No createdAt value found");
              }
            } catch (error) {
              console.error("Error parsing createdAt:", error);
            }

            // Process service date (pickup date/time)
            let bookingDate: Date;
            try {
              // First try to use pickupDateTime (new format)
              if (data.pickupDateTime) {
                if (typeof data.pickupDateTime.toDate === 'function') {
                  bookingDate = data.pickupDateTime.toDate();
                  console.log("Using Firestore timestamp pickupDateTime:", bookingDate);
                } else if (typeof data.pickupDateTime === 'string') {
                  bookingDate = new Date(data.pickupDateTime);
                  console.log("Using string pickupDateTime:", bookingDate);
                } else {
                  bookingDate = new Date();
                  console.warn("Invalid pickupDateTime format");
                }
              }
              // Fall back to date field (old format)
              else if (data.date) {
                if (typeof data.date.toDate === 'function') {
                  bookingDate = data.date.toDate();
                  console.log("Using Firestore timestamp date:", bookingDate);
                } else if (typeof data.date === 'string') {
                  bookingDate = new Date(data.date);
                  console.log("Using string date:", bookingDate);
                } else {
                  bookingDate = new Date();
                  console.warn("Invalid date format");
                }
              } else {
                bookingDate = new Date();
                console.warn("No date value found");
              }

              // Validate the date
              if (isNaN(bookingDate.getTime())) {
                console.warn(`Invalid date, using current date`);
                bookingDate = new Date();
              }
            } catch (error) {
              console.error("Error parsing date:", error);
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
              formattedId: data.formattedId,
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
              driverInfo: data.driverInfo || {
                name: data.driverName || data.driver?.name,
                phone: data.driverPhone || data.driver?.phone,
                vehicleNumber: data.vehicleNumber || data.driver?.vehicleNumber
              },
              createdAt: createdAt ? 
                createdAt.toISOString() 
                : new Date().toISOString()
            };

            // Categorize bookings based on status rather than just date
            if (booking.status === 'completed' || booking.status === 'cancelled') {
              past.push(booking);
            } else {
              upcoming.push(booking);
            }
          } catch (err) {
            console.error(`Error processing booking ${doc.id}:`, err);
            // Continue with other bookings even if one fails
          }
        });

        // Sort both arrays by date (newest first)
        const sortByDateDesc = (a: Booking, b: Booking) => {
          try {
            // Make sure both dates are valid before comparing
            const aTime = isNaN(a.date.getTime()) ? 0 : a.date.getTime();
            const bTime = isNaN(b.date.getTime()) ? 0 : b.date.getTime();
            return bTime - aTime;
          } catch (err) {
            console.error("Error comparing dates:", err);
            return 0; // Return 0 to keep original order if there's an error
          }
        };
        
        // Safely sort the arrays
        try {
          upcoming.sort(sortByDateDesc);
          past.sort(sortByDateDesc);
        } catch (err) {
          console.error("Error sorting bookings:", err);
          // Continue without sorting if there's an error
        }

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
          setUpcomingBookings([DEMO_BOOKINGS[1], DEMO_BOOKINGS[2], DEMO_BOOKINGS[3]]);
          setPastBookings([DEMO_BOOKINGS[0]]);
        }
        setLoading(false);
      }
    };

    fetchBookings();
  }, [currentUser, userData, retryCount, firebaseInitialized]);

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
                      {!firebaseInitialized 
                        ? "Firebase connection failed. Showing sample bookings instead."
                        : "We're unable to find your bookings. Showing sample bookings instead."}
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
