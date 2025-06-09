import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, FileText, Calendar, Clock, User, Car, MapPin, CheckCircle, 
  X, UserCheck, Download, Filter, FileSpreadsheet, AlertCircle, ArrowUpDown, Loader2 
} from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { collection, getDocs, doc, updateDoc, getDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { formatExistingBookingId, updateAllBookingIds } from '@/utils/booking';
import InvoiceGenerator from '@/components/invoice/InvoiceGenerator';
import * as XLSX from 'xlsx';

// Booking interface
interface Booking {
  id: string;
  formattedId?: string;
  type: string;
  user: string;
  driver: string;
  vehicle: string;
  pickup: string;
  dropoff: string;
  date: Date;
  status: string;
  amount: string;
  userId?: string;
  driverId?: string;
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
  createdAt?: Date;
  cancellationReason?: string;
}

// Driver interface
interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  vehicle: string;
  rating: number;
}

const AdminBookings = () => {
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'confirm' | 'assign' | 'cancel' | 'invoice'>('confirm');
  const [isUpdatingIds, setIsUpdatingIds] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  
  // Filtering and sorting
  const [selectedTab, setSelectedTab] = useState('all');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const [bookingIdFilter, setBookingIdFilter] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'date'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterOpen, setFilterOpen] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  
  // Convert amount from string with currency to number
  const parseAmount = (amountStr: string): number => {
    // Remove currency symbol and any non-numeric characters except decimal point
    return parseFloat(amountStr.replace(/[^0-9.]/g, '')) || 0;
  };
  
  // Filter bookings based on search term and other filters
  const filteredBookings = bookings
    .filter(booking => 
      // Text search filter
      (booking.formattedId?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    booking.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
       (booking.customerInfo?.name || booking.user).toLowerCase().includes(searchTerm.toLowerCase()) ||
       booking.customerInfo?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       booking.customerInfo?.phone?.toLowerCase().includes(searchTerm.toLowerCase())) &&
      
      // Tab filter for booking type
      (selectedTab === 'all' || 
       (selectedTab === 'chauffeur' && booking.type.toLowerCase().includes('chauffeur')) ||
       (selectedTab === 'rental' && booking.type.toLowerCase().includes('rental'))) &&
      
      // Status filter
      (!statusFilter || statusFilter === 'all' || booking.status === statusFilter) &&
      
      // Date filter
      (!dateFilter || 
        (booking.date && 
          booking.date.getFullYear() === dateFilter.getFullYear() && 
          booking.date.getMonth() === dateFilter.getMonth() && 
          booking.date.getDate() === dateFilter.getDate())) &&
      
      // Booking ID filter
      (!bookingIdFilter || 
        (booking.formattedId && booking.formattedId.toLowerCase().includes(bookingIdFilter.toLowerCase())))
    )
    .sort((a, b) => {
      // Sort based on selected sort field and order
      const fieldA = sortBy === 'createdAt' ? (a.createdAt || new Date(0)) : a.date;
      const fieldB = sortBy === 'createdAt' ? (b.createdAt || new Date(0)) : b.date;
      
      if (sortOrder === 'asc') {
        return fieldA.getTime() - fieldB.getTime();
      } else {
        return fieldB.getTime() - fieldA.getTime();
      }
    });
  
  // Function to safely format dates
  const safeFormatDate = (date: any, formatString: string): string => {
    try {
      // Check if date is valid
      const d = date instanceof Date ? date : new Date(date);
      if (isNaN(d.getTime())) {
        return 'Invalid date';
      }
      return format(d, formatString);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };
  
  // Load bookings and drivers from Firebase
  useEffect(() => {
    const fetchBookings = async () => {
      setIsLoading(true);
      try {
        const bookingsRef = collection(firestore, 'bookings');
        const q = query(bookingsRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        
        const bookingsData: Booking[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          let bookingDate: Date;
          let createdDate: Date = new Date();
          
          // Process creation date (when booking was made)
          try {
            if (data.createdAt && typeof data.createdAt.toDate === 'function') {
              createdDate = data.createdAt.toDate();
            } else if (data.createdAt) {
              createdDate = new Date(data.createdAt);
            }
            
            // Validate the created date
            if (isNaN(createdDate.getTime())) {
              createdDate = new Date();
            }
          } catch (error) {
            console.error(`Error parsing creation date for booking ${doc.id}:`, error);
            createdDate = new Date();
          }
          
          // Process service date (when the ride is scheduled)
          try {
            // First try to use pickupDateTime (new format)
            if (data.pickupDateTime) {
              if (typeof data.pickupDateTime.toDate === 'function') {
                bookingDate = data.pickupDateTime.toDate();
              } else if (typeof data.pickupDateTime === 'string') {
                bookingDate = new Date(data.pickupDateTime);
              } else {
                bookingDate = new Date();
              }
            }
            // Fall back to date field (old format)
            else if (data.date) {
              if (typeof data.date.toDate === 'function') {
                bookingDate = data.date.toDate();
              } else if (typeof data.date === 'string') {
                bookingDate = new Date(data.date);
              } else {
                bookingDate = new Date();
              }
            } else {
              bookingDate = new Date();
            }
            
            // Validate the date
            if (isNaN(bookingDate.getTime())) {
              console.warn(`Invalid date for booking ${doc.id}, using current date`);
              bookingDate = new Date();
            }
          } catch (error) {
            console.error(`Error parsing date for booking ${doc.id}:`, error);
            bookingDate = new Date();
          }
          
          // Format amount to AED currency
          let amount = data.amount ? `AED ${parseFloat(data.amount).toFixed(2)}` : 'AED 0.00';
          if (typeof data.amount === 'string' && data.amount.includes('$')) {
            amount = data.amount.replace('$', 'AED ');
          }
          
          bookingsData.push({
            id: doc.id,
            formattedId: data.formattedId,
            type: data.type || data.bookingType || 'Chauffeur',
            user: data.customerInfo?.name || 'Unknown User',
            driver: data.driverInfo?.name || 'Not Assigned',
            vehicle: data.vehicle?.name || data.vehicleType || 'Standard Vehicle',
            pickup: data.pickupLocation?.name || data.pickup || 'N/A',
            dropoff: data.dropoffLocation?.name || data.dropoff || 'N/A',
            date: bookingDate,
            status: data.status || 'initiated',
            amount: amount,
            userId: data.userId,
            driverId: data.driverId,
            customerInfo: data.customerInfo,
            driverInfo: data.driverInfo,
            createdAt: createdDate,
            cancellationReason: data.cancellationReason
          });
        });
        
        setBookings(bookingsData);
      } catch (error) {
        console.error('Error fetching bookings:', error);
        toast.error('Failed to load bookings');
      } finally {
        setIsLoading(false);
      }
    };
    
    const fetchDrivers = async () => {
      try {
        const driversRef = collection(firestore, 'drivers');
        const q = query(driversRef, where('status', '==', 'active'));
        const snapshot = await getDocs(q);
        
        const driversData: Driver[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          driversData.push({
            id: doc.id,
            name: data.name || `${data.firstName || ''} ${data.lastName || ''}`,
            email: data.email || '',
            phone: data.phone || data.phoneNumber || '',
            status: data.status || 'active',
            vehicle: data.vehicle?.name || data.vehicleType || 'Standard Vehicle',
            rating: data.rating || 4.5
          });
        });
        
        setDrivers(driversData);
      } catch (error) {
        console.error('Error fetching drivers:', error);
        setDrivers([]);
      }
    };
    
    fetchBookings();
    fetchDrivers();
  }, []);

  // Helper function to get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'initiated': return 'bg-gray-100 text-gray-800';
      case 'driver_assigned': return 'bg-indigo-100 text-indigo-800';
      case 'awaiting': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Format status text for display
  const formatStatus = (status: string) => {
    return status.replace('_', ' ').split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };
  
  // Open dialog for booking action
  const openDialog = (booking: Booking, type: 'confirm' | 'assign' | 'cancel' | 'invoice') => {
    setSelectedBooking(booking);
    setDialogType(type);
    setSelectedDriver('');
    setDialogOpen(true);
    
    // If we're assigning a driver, fetch fresh driver data
    if (type === 'assign') {
      fetchDriversForAssignment();
    }
  };
  
  // Fetch active drivers for assignment
  const fetchDriversForAssignment = async () => {
    try {
      setIsLoadingDrivers(true);
      const driversRef = collection(firestore, 'drivers');
      const q = query(driversRef, where('status', '==', 'active'));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        console.log('No active drivers found');
        toast.error('No active drivers available for assignment');
        setDrivers([]);
        return;
      }
      
      const driversData: Driver[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        driversData.push({
          id: doc.id,
          name: data.name || `${data.firstName || ''} ${data.lastName || ''}`,
          email: data.email || '',
          phone: data.phone || data.phoneNumber || '',
          status: data.status || 'active',
          vehicle: data.vehicleNumber || 'Unknown Vehicle',
          rating: data.rating || 4.5
        });
      });
      
      console.log('Loaded drivers for assignment:', driversData);
      setDrivers(driversData);
    } catch (error) {
      console.error('Error fetching drivers for assignment:', error);
      toast.error('Failed to load available drivers');
      setDrivers([]);
    } finally {
      setIsLoadingDrivers(false);
    }
  };
  
  // Update booking status in Firestore
  const updateBookingStatus = async () => {
    if (!selectedBooking) return;
    
    try {
      const bookingRef = doc(firestore, 'bookings', selectedBooking.id);
      
      if (dialogType === 'confirm') {
        await updateDoc(bookingRef, {
          status: 'confirmed',
          updatedAt: new Date()
        });
        toast.success('Booking confirmed successfully');
      } 
      else if (dialogType === 'assign' && selectedDriver) {
        // Get driver details
        const driverRef = doc(firestore, 'drivers', selectedDriver);
        const driverSnap = await getDoc(driverRef);
        const driverData = driverSnap.data();
        
        await updateDoc(bookingRef, {
          status: 'driver_assigned',
          driverId: selectedDriver,
          driverInfo: {
            name: driverData?.name || `${driverData?.firstName || ''} ${driverData?.lastName || ''}`,
            phone: driverData?.phone || driverData?.phoneNumber || '',
            vehicleNumber: driverData?.vehicleNumber || driverData?.vehicleId || ''
          },
          updatedAt: new Date()
        });
        toast.success('Driver assigned successfully');
      } 
      else if (dialogType === 'cancel') {
        await updateDoc(bookingRef, {
          status: 'cancelled',
          cancellationReason: cancellationReason.trim(),
          updatedAt: new Date()
        });
        toast.success('Booking cancelled successfully');
        setCancellationReason(''); // Reset the cancellation reason
      }
      
      // Refresh bookings
      const bookingsRef = collection(firestore, 'bookings');
      const q = query(bookingsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const bookingsData: Booking[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        let bookingDate: Date;
        let createdDate: Date = new Date();
        
        // Process creation date (when booking was made)
        try {
          if (data.createdAt && typeof data.createdAt.toDate === 'function') {
            createdDate = data.createdAt.toDate();
          } else if (data.createdAt) {
            createdDate = new Date(data.createdAt);
          }
          
          // Validate the created date
          if (isNaN(createdDate.getTime())) {
            createdDate = new Date();
          }
        } catch (error) {
          console.error(`Error parsing creation date for booking ${doc.id}:`, error);
          createdDate = new Date();
        }
        
        // Process service date (when the ride is scheduled)
        try {
          // First try to use pickupDateTime (new format)
          if (data.pickupDateTime) {
            if (typeof data.pickupDateTime.toDate === 'function') {
              bookingDate = data.pickupDateTime.toDate();
            } else if (typeof data.pickupDateTime === 'string') {
              bookingDate = new Date(data.pickupDateTime);
            } else {
              bookingDate = new Date();
            }
          }
          // Fall back to date field (old format)
          else if (data.date) {
            if (typeof data.date.toDate === 'function') {
              bookingDate = data.date.toDate();
            } else if (typeof data.date === 'string') {
              bookingDate = new Date(data.date);
            } else {
              bookingDate = new Date();
            }
          } else {
            bookingDate = new Date();
          }
          
          // Validate the date
          if (isNaN(bookingDate.getTime())) {
            console.warn(`Invalid date for booking ${doc.id}, using current date`);
            bookingDate = new Date();
          }
        } catch (error) {
          console.error(`Error parsing date for booking ${doc.id}:`, error);
          bookingDate = new Date();
        }
        
        bookingsData.push({
          id: doc.id,
          formattedId: data.formattedId,
          type: data.type || data.bookingType || 'Chauffeur',
          user: data.customerInfo?.name || 'Unknown User',
          driver: data.driverInfo?.name || 'Not Assigned',
          vehicle: data.vehicle?.name || data.vehicleType || 'Standard Vehicle',
          pickup: data.pickupLocation?.name || data.pickup || 'N/A',
          dropoff: data.dropoffLocation?.name || data.dropoff || 'N/A',
          date: bookingDate,
          status: data.status || 'initiated',
          amount: data.amount ? `AED ${parseFloat(data.amount).toFixed(2)}` : 'AED 0.00',
          userId: data.userId,
          driverId: data.driverId,
          customerInfo: data.customerInfo,
          driverInfo: data.driverInfo,
          createdAt: createdDate,
          cancellationReason: data.cancellationReason
        });
      });
      
      setBookings(bookingsData);
      setDialogOpen(false);
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error('Failed to update booking');
    }
  };
  
  // Add a function to run the booking ID update
  const handleUpdateAllBookingIds = async () => {
    try {
      setIsUpdatingIds(true);
      const count = await updateAllBookingIds();
      toast.success(`Updated ${count} booking IDs successfully`);
      
      // Refresh bookings by re-fetching them
      const bookingsRef = collection(firestore, 'bookings');
      const q = query(bookingsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const bookingsData: Booking[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        let bookingDate: Date;
        let createdDate: Date = new Date();
        
        // Process creation date (when booking was made)
        try {
          if (data.createdAt && typeof data.createdAt.toDate === 'function') {
            createdDate = data.createdAt.toDate();
          } else if (data.createdAt) {
            createdDate = new Date(data.createdAt);
          }
          
          // Validate the created date
          if (isNaN(createdDate.getTime())) {
            createdDate = new Date();
          }
        } catch (error) {
          console.error(`Error parsing creation date for booking ${doc.id}:`, error);
          createdDate = new Date();
        }
        
        // Process service date (when the ride is scheduled)
        try {
          // First try to use pickupDateTime (new format)
          if (data.pickupDateTime) {
            if (typeof data.pickupDateTime.toDate === 'function') {
              bookingDate = data.pickupDateTime.toDate();
            } else if (typeof data.pickupDateTime === 'string') {
              bookingDate = new Date(data.pickupDateTime);
            } else {
              bookingDate = new Date();
            }
          }
          // Fall back to date field (old format)
          else if (data.date) {
            if (typeof data.date.toDate === 'function') {
              bookingDate = data.date.toDate();
            } else if (typeof data.date === 'string') {
              bookingDate = new Date(data.date);
            } else {
              bookingDate = new Date();
            }
          } else {
            bookingDate = new Date();
          }
          
          // Validate the date
          if (isNaN(bookingDate.getTime())) {
            console.warn(`Invalid date for booking ${doc.id}, using current date`);
            bookingDate = new Date();
          }
        } catch (error) {
          console.error(`Error parsing date for booking ${doc.id}:`, error);
          bookingDate = new Date();
        }
        
        bookingsData.push({
          id: doc.id,
          formattedId: data.formattedId,
          type: data.type || data.bookingType || 'Chauffeur',
          user: data.customerInfo?.name || 'Unknown User',
          driver: data.driverInfo?.name || 'Not Assigned',
          vehicle: data.vehicle?.name || data.vehicleType || 'Standard Vehicle',
          pickup: data.pickupLocation?.name || data.pickup || 'N/A',
          dropoff: data.dropoffLocation?.name || data.dropoff || 'N/A',
          date: bookingDate,
          status: data.status || 'initiated',
          amount: data.amount ? `AED ${parseFloat(data.amount).toFixed(2)}` : 'AED 0.00',
          userId: data.userId,
          driverId: data.driverId,
          customerInfo: data.customerInfo,
          driverInfo: data.driverInfo,
          createdAt: createdDate,
          cancellationReason: data.cancellationReason
        });
      });
      
      setBookings(bookingsData);
    } catch (error) {
      console.error('Error updating booking IDs:', error);
      toast.error('Failed to update booking IDs');
    } finally {
      setIsUpdatingIds(false);
    }
  };
  
  // Add the export functions
  const exportToExcel = () => {
    try {
      setIsExporting(true);
      
      // Create a worksheet from the filtered bookings
      const data = [
        // Header row
        ['Booking ID', 'Type', 'Customer', 'Booking Date', 'Pickup Date', 'Amount', 'Status', 'Driver'],
        // Data rows
        ...filteredBookings.map(booking => [
          booking.formattedId || formatExistingBookingId(booking.id, booking.date),
          booking.type,
          booking.customerInfo?.name || booking.user,
          booking.createdAt ? safeFormatDate(booking.createdAt, 'MMM d, yyyy HH:mm') : 'N/A',
          safeFormatDate(booking.date, 'MMM d, yyyy HH:mm'),
          booking.amount,
          formatStatus(booking.status),
          booking.driver === 'Not Assigned' ? 'Not Assigned' : booking.driver
        ])
      ];
      
      // Create a worksheet with the data
      const ws = XLSX.utils.aoa_to_sheet(data);
      
      // Auto-size columns
      const colWidths = data[0].map((_, i) => ({
        wch: Math.max(...data.map(row => row[i] ? String(row[i]).length : 0))
      }));
      ws['!cols'] = colWidths;
      
      // Create a workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Bookings');
      
      // Generate filename
      const fileName = `bookings-export-${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Write and download the file
      XLSX.writeFile(wb, fileName);
      
      toast.success('Bookings exported successfully');
    } catch (error) {
      console.error('Error exporting bookings:', error);
      toast.error('Failed to export bookings');
    } finally {
      setIsExporting(false);
    }
  };

  // Filter reset function
  const resetFilters = () => {
    setStatusFilter(null);
    setDateFilter(null);
    setBookingIdFilter('');
    setFilterOpen(false);
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setSelectedTab(value);
  };
  
  return (
    <DashboardLayout userType="admin">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Booking Management</h1>
        
        <div className="flex gap-2">
          <Button 
            onClick={exportToExcel} 
            disabled={isExporting || filteredBookings.length === 0}
            variant="outline"
            className="flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <span className="animate-spin">⟳</span>
                Exporting...
              </>
            ) : (
              <>
                <FileSpreadsheet className="h-4 w-4" />
                Export CSV
              </>
            )}
          </Button>
          
          <Button 
            onClick={handleUpdateAllBookingIds} 
            disabled={isUpdatingIds}
            variant="outline"
            className="flex items-center gap-2"
          >
            {isUpdatingIds ? (
              <>
                <span className="animate-spin">⟳</span>
                Updating IDs...
              </>
            ) : (
              <>Update Booking IDs</>
            )}
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{bookings.length}</div>
            <p className="text-sm text-gray-500">Total Bookings</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{bookings.filter(b => b.status === 'confirmed' || b.status === 'pending' || b.status === 'initiated' || b.status === 'driver_assigned').length}</div>
            <p className="text-sm text-gray-500">Active Bookings</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{bookings.filter(b => b.status === 'completed').length}</div>
            <p className="text-sm text-gray-500">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {bookings.reduce((total, booking) => {
                const amount = parseAmount(booking.amount);
                return total + amount;
              }, 0).toFixed(2)} AED
            </div>
            <p className="text-sm text-gray-500">Total Revenue</p>
          </CardContent>
        </Card>
      </div>
      
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>Booking Overview</CardTitle>
            <div className="flex items-center gap-3">
              <Popover open={filterOpen} onOpenChange={setFilterOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    aria-label="Filter bookings"
                  >
                    <Filter className="h-4 w-4" />
                    {(statusFilter || dateFilter || bookingIdFilter) ? (
                      <span className="text-fleet-red font-medium">Filters Active</span>
                    ) : (
                      <span>Filter</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                    <h4 className="font-medium">Filter Bookings</h4>
                    
                    <div className="space-y-2">
                      <Label htmlFor="status-filter">Status</Label>
                      <Select 
                        value={statusFilter || 'all'} 
                        onValueChange={(value) => setStatusFilter(value === 'all' ? null : value)}
                      >
                        <SelectTrigger id="status-filter">
                          <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="initiated">Initiated</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="driver_assigned">Driver Assigned</SelectItem>
                          <SelectItem value="awaiting">Awaiting</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Pickup Date</Label>
                      <div className="flex items-center gap-2">
                        <CalendarComponent
                          mode="single"
                          selected={dateFilter || undefined}
                          onSelect={(date) => setDateFilter(date)}
                          className="border rounded-md p-3"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="booking-id-filter">Booking ID</Label>
                      <Input
                        id="booking-id-filter"
                        placeholder="Enter booking ID"
                        value={bookingIdFilter}
                        onChange={(e) => setBookingIdFilter(e.target.value)}
                      />
                    </div>
                    
                    <div className="flex justify-between">
                      <Button variant="outline" onClick={resetFilters}>
                        Reset
                      </Button>
                      <Button onClick={() => setFilterOpen(false)}>
                        Apply Filters
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              
              <div className="relative w-60 md:w-96">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                  type="search"
                  placeholder="Search by ID or customer name..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" onValueChange={handleTabChange}>
            <TabsList className="mb-6">
              <TabsTrigger value="all">All Bookings</TabsTrigger>
              <TabsTrigger value="chauffeur">Chauffeur Services</TabsTrigger>
              <TabsTrigger value="rental">Rentals</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              <div className="rounded-md border">
                <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="h-12 px-3 text-left font-medium text-gray-500">Booking ID</th>
                        <th className="h-12 px-3 text-left font-medium text-gray-500">Type</th>
                        <th className="h-12 px-3 text-left font-medium text-gray-500">Customer</th>
                        <th className="h-12 px-3 text-left font-medium text-gray-500">
                          <div className="flex items-center gap-1 cursor-pointer" onClick={() => {
                            setSortBy('createdAt');
                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                          }}>
                            Booking Date
                            <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </th>
                        <th className="h-12 px-3 text-left font-medium text-gray-500">
                          <div className="flex items-center gap-1 cursor-pointer" onClick={() => {
                            setSortBy('date');
                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                          }}>
                            Pickup Date
                            <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </th>
                        <th className="h-12 px-3 text-left font-medium text-gray-500">Amount</th>
                        <th className="h-12 px-3 text-left font-medium text-gray-500">Status</th>
                        <th className="h-12 px-3 text-right font-medium text-gray-500 w-32">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <tr>
                          <td colSpan={8} className="h-24 text-center text-gray-500">
                            Loading bookings...
                          </td>
                        </tr>
                      ) : filteredBookings.length > 0 ? (
                        filteredBookings.map((booking) => (
                          <tr key={booking.id} className="border-b">
                            <td className="p-3 font-medium">
                              {booking.formattedId || formatExistingBookingId(booking.id, booking.date)}
                            </td>
                            <td className="p-3">{booking.type}</td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-500" />
                                <span>{booking.customerInfo?.name || booking.user}</span>
                              </div>
                            </td>
                            <td className="p-3">
                              {booking.createdAt && (
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3 text-gray-500" />
                                    <span className="text-sm">{safeFormatDate(booking.createdAt, 'MMM d, yyyy')}</span>
                                  </div>
                                  <div className="flex items-center gap-1 mt-1">
                                    <Clock className="h-3 w-3 text-gray-500" />
                                    <span className="text-sm">{safeFormatDate(booking.createdAt, 'h:mm a')}</span>
                                  </div>
                                </div>
                              )}
                            </td>
                            <td className="p-3">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3 text-gray-500" />
                                  <span className="text-sm">{safeFormatDate(booking.date, 'MMM d, yyyy')}</span>
                                </div>
                                <div className="flex items-center gap-1 mt-1">
                                  <Clock className="h-3 w-3 text-gray-500" />
                                  <span className="text-sm">{safeFormatDate(booking.date, 'h:mm a')}</span>
                                </div>
                              </div>
                            </td>
                            <td className="p-3 font-medium">{booking.amount}</td>
                            <td className="p-3">
                              <Badge className={getStatusBadgeColor(booking.status)}>
                                {formatStatus(booking.status)}
                              </Badge>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => openDialog(booking, 'invoice')}
                                  title="Download Invoice"
                                  className="h-7 w-7"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                
                                {(booking.status === 'initiated' || booking.status === 'awaiting') && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openDialog(booking, 'confirm')}
                                    title="Confirm Booking"
                                    className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                )}
                                
                                {booking.status === 'confirmed' && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openDialog(booking, 'assign')}
                                    title="Assign Driver"
                                    className="h-7 w-7 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                                  >
                                    <UserCheck className="h-4 w-4" />
                                  </Button>
                                )}

                                {(booking.status === 'initiated' || booking.status === 'awaiting' || booking.status === 'confirmed' || booking.status === 'driver_assigned') && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openDialog(booking, 'cancel')}
                                    title="Cancel Booking"
                                    className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                                
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      title="View Details"
                                      className="h-7 w-7"
                                    >
                                      <FileText className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                  <DialogContent className="sm:max-w-[600px]">
                                  <DialogHeader>
                                      <DialogTitle>Booking Details</DialogTitle>
                                  </DialogHeader>
                                    <div className="grid gap-6 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                          <p className="text-sm text-gray-500">Booking ID</p>
                                          <p className="font-medium">
                                            {booking.formattedId || formatExistingBookingId(booking.id, booking.date)}
                                          </p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-gray-500">Status</p>
                                        <Badge className={getStatusBadgeColor(booking.status)}>
                                          {formatStatus(booking.status)}
                                        </Badge>
                                      </div>
                                    </div>
                                    
                                    <div>
                                        <p className="text-sm text-gray-500">Customer</p>
                                        <div className="flex items-center gap-2">
                                          <User className="h-4 w-4 text-gray-500" />
                                          <p className="font-medium">{booking.customerInfo?.name || booking.user}</p>
                                        </div>
                                        {booking.customerInfo?.phone && (
                                          <p className="text-sm text-gray-500 mt-1">{booking.customerInfo.phone}</p>
                                        )}
                                        {booking.customerInfo?.email && (
                                          <p className="text-sm text-gray-500 mt-1">{booking.customerInfo.email}</p>
                                        )}
                                    </div>
                                    
                                      {(booking.driverInfo?.name || booking.driver !== 'Not Assigned') && (
                                      <div>
                                        <p className="text-sm text-gray-500">Driver</p>
                                          <p className="font-medium">{booking.driverInfo?.name || booking.driver}</p>
                                          {booking.driverInfo?.phone && (
                                            <p className="text-sm text-gray-500 mt-1">{booking.driverInfo.phone}</p>
                                          )}
                                          {booking.driverInfo?.vehicleNumber && (
                                            <p className="text-sm text-gray-500 mt-1">Vehicle #: {booking.driverInfo.vehicleNumber}</p>
                                          )}
                                      </div>
                                    )}
                                    
                                    <div>
                                      <p className="text-sm text-gray-500">Vehicle</p>
                                      <div className="flex items-center gap-2">
                                        <Car className="h-4 w-4 text-gray-500" />
                                        <p className="font-medium">{booking.vehicle}</p>
                                      </div>
                                    </div>
                                    
                                    <div>
                                        <p className="text-sm text-gray-500">Booking Date</p>
                                        <p className="font-medium">
                                          {booking.createdAt ? safeFormatDate(booking.createdAt, 'MMMM d, yyyy') : 'N/A'} at {booking.createdAt ? safeFormatDate(booking.createdAt, 'h:mm a') : 'N/A'}
                                        </p>
                                      </div>
                                      
                                      <div>
                                        <p className="text-sm text-gray-500">Pickup Date</p>
                                      <p className="font-medium">
                                          {safeFormatDate(booking.date, 'MMMM d, yyyy')} at {safeFormatDate(booking.date, 'h:mm a')}
                                      </p>
                                    </div>
                                    
                                    <div>
                                      <p className="text-sm text-gray-500">Pickup Location</p>
                                      <div className="flex items-start gap-2">
                                        <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                                        <p className="font-medium">{booking.pickup}</p>
                                      </div>
                                    </div>
                                    
                                      <div>
                                        <p className="text-sm text-gray-500">Dropoff Location</p>
                                        <div className="flex items-start gap-2">
                                          <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                                          <p className="font-medium">{booking.dropoff}</p>
                                        </div>
                                      </div>
                                    
                                      <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <p className="text-sm text-gray-500">Amount</p>
                                          <p className="font-medium">{booking.amount}</p>
                                        </div>
                                        <div>
                                          <p className="text-sm text-gray-500">Payment Method</p>
                                          <p className="font-medium">Credit Card</p>
                                        </div>
                                      </div>
                                      
                                      {booking.cancellationReason && (
                                        <div>
                                          <p className="text-sm text-gray-500">Cancellation Reason</p>
                                          <p className="font-medium text-red-600">{booking.cancellationReason}</p>
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className="flex flex-wrap justify-between gap-2 mt-4">
                                      {(booking.status === 'initiated' || booking.status === 'awaiting') && (
                                        <Button 
                                          variant="default" 
                                          className="bg-blue-500 hover:bg-blue-600 text-white"
                                          onClick={() => openDialog(booking, 'confirm')}
                                        >
                                          <CheckCircle className="h-4 w-4 mr-2" />
                                          Confirm Booking
                                        </Button>
                                      )}
                                      
                                      {booking.status === 'confirmed' && (
                                        <Button 
                                          variant="default" 
                                          className="bg-indigo-500 hover:bg-indigo-600 text-white"
                                          onClick={() => openDialog(booking, 'assign')}
                                        >
                                          <UserCheck className="h-4 w-4 mr-2" />
                                          Assign Driver
                                        </Button>
                                      )}
                                      
                                      {(booking.status === 'initiated' || booking.status === 'awaiting' || booking.status === 'confirmed' || booking.status === 'driver_assigned') && (
                                        <Button 
                                          variant="destructive"
                                          onClick={() => openDialog(booking, 'cancel')}
                                        >
                                          <X className="h-4 w-4 mr-2" />
                                          Cancel Ride
                                        </Button>
                                      )}
                                      
                                      <Button 
                                        variant="outline" 
                                        className="flex items-center gap-2"
                                        onClick={() => openDialog(booking, 'invoice')}
                                      >
                                        <Download className="h-4 w-4" />
                                        Invoice
                                      </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="h-24 text-center text-gray-500">
                            No bookings found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
            
            {/* Similar content for chauffeur and rental tabs */}
            <TabsContent value="chauffeur">
              {/* Same table structure with filtered bookings */}
            </TabsContent>
            
            <TabsContent value="rental">
              {/* Same table structure with filtered bookings */}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Dialogs for booking actions */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogType === 'confirm' ? 'Confirm Booking' : 
               dialogType === 'assign' ? 'Assign Driver' : 
               dialogType === 'cancel' ? 'Cancel Booking' :
               'Generate Invoice'}
            </DialogTitle>
          </DialogHeader>
          
          {dialogType === 'confirm' && (
            <div className="py-4">
              <p>Are you sure you want to confirm this booking?</p>
              <p className="text-sm text-gray-500 mt-2">
                This will update the booking status to "Confirmed".
              </p>
            </div>
          )}
          
          {dialogType === 'assign' && (
            <div className="py-4">
              <Label htmlFor="driver-select" className="mb-2 block">Select Driver</Label>
              {isLoadingDrivers ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-600 mr-2" />
                  <span>Loading available drivers...</span>
                </div>
              ) : drivers.length === 0 ? (
                <div className="text-center py-4 text-red-500">
                  <p>No active drivers available for assignment</p>
                  <p className="text-sm mt-2">Please add drivers or change their status to active.</p>
                </div>
              ) : (
                <select
                  id="driver-select"
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={selectedDriver}
                  onChange={(e) => setSelectedDriver(e.target.value)}
                  required
                >
                  <option value="" disabled>Select a driver</option>
                  {drivers.map(driver => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name} - {driver.vehicle} {driver.rating > 0 && `(${driver.rating.toFixed(1)}★)`}
                    </option>
                  ))}
                </select>
              )}
              <p className="text-sm text-gray-500 mt-2">
                This will assign the selected driver to the booking and update its status.
              </p>
            </div>
          )}
          
          {dialogType === 'cancel' && (
            <div className="py-4">
              <p>Are you sure you want to cancel this booking?</p>
              
              <div className="mt-4 space-y-2">
                <Label htmlFor="cancellation-reason">Reason for cancellation</Label>
                <Textarea 
                  id="cancellation-reason" 
                  placeholder="Enter reason for cancellation"
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              
              <p className="text-sm text-gray-500 mt-4">
                This action cannot be undone. The booking status will be updated to "Cancelled".
              </p>
            </div>
          )}
          
          {dialogType === 'invoice' && selectedBooking && (
            <div className="py-4 max-h-[80vh] overflow-y-auto">
              <InvoiceGenerator 
                booking={selectedBooking}
                onSuccess={() => {
                  toast.success('Invoice generated successfully');
                  setDialogOpen(false);
                }}
                onError={(error) => {
                  toast.error(error || 'Failed to generate invoice');
                }}
              />
            </div>
          )}
          
          <DialogFooter>
            {dialogType !== 'invoice' && (
              <>
                <Button variant="outline" onClick={() => {
                  setDialogOpen(false);
                  setCancellationReason('');
                }}>
                  Cancel
                </Button>
                <Button 
                  onClick={updateBookingStatus}
                  disabled={
                    (dialogType === 'assign' && !selectedDriver) ||
                    (dialogType === 'cancel' && !cancellationReason.trim())
                  }
                  className={
                    dialogType === 'confirm' ? 'bg-blue-500 hover:bg-blue-600' :
                    dialogType === 'assign' ? 'bg-indigo-500 hover:bg-indigo-600' :
                    'bg-red-500 hover:bg-red-600'
                  }
                >
                  {dialogType === 'confirm' ? 'Confirm Booking' : 
                   dialogType === 'assign' ? 'Assign Driver' : 'Cancel Booking'}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminBookings;

