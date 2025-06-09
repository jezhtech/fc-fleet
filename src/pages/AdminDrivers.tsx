import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, UserPlus, Mail, Phone, Star, Car, Edit, Trash, Eye, UserCheck, Loader2, UserX } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { collection, addDoc, getDocs, doc, updateDoc, getDoc, deleteDoc, where, query, orderBy, Timestamp } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { createDriverUserAccount } from '@/lib/authUtils';

interface TaxiType {
  id: string;
  name: string;
  description: string;
  emoji: string;
}

interface VehicleType {
  id: string;
  taxiTypeId: string;
  taxiTypeName?: string;
  name: string;
  description: string;
  basePrice: number;
  perKmPrice: number;
  perMinutePrice: number;
  capacity: number;
  images: string[];
}

interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'suspended';
  taxiTypeId: string;
  vehicleTypeId: string;
  vehicleNumber: string;
  rating: number;
  rides: number;
  earnings: number;
  joined: string;
  userId?: string;
  feedback?: DriverFeedback[];
}

interface DriverFeedback {
  id: string;
  bookingId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

const AdminDrivers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [driverToDelete, setDriverToDelete] = useState<Driver | null>(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [driverToUpdateStatus, setDriverToUpdateStatus] = useState<Driver | null>(null);
  const [newStatus, setNewStatus] = useState<'active' | 'inactive' | 'suspended'>('active');
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentDriver, setCurrentDriver] = useState<Partial<Driver> | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [driverToView, setDriverToView] = useState<Driver | null>(null);
  
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [taxiTypes, setTaxiTypes] = useState<TaxiType[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [filteredVehicleTypes, setFilteredVehicleTypes] = useState<VehicleType[]>([]);
  
  const filteredDrivers = drivers.filter(driver =>
    (driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     driver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
     driver.phone.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (selectedTab === 'all' || driver.status === selectedTab)
  );
  
  const handleDeleteDriver = (id: number) => {
    toast.success(`Driver ${id} has been deleted`);
  };
  
  // Fetch drivers, taxi types, and vehicle types from Firestore
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch taxi types
        const taxiTypesRef = collection(firestore, 'taxiTypes');
        const taxiSnapshot = await getDocs(taxiTypesRef);
        
        const fetchedTaxiTypes = taxiSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as TaxiType[];
        
        console.log('Fetched taxi types:', fetchedTaxiTypes);
        setTaxiTypes(fetchedTaxiTypes);
        
        // Fetch vehicle types
        const vehicleTypesRef = collection(firestore, 'vehicleTypes');
        const vehicleSnapshot = await getDocs(vehicleTypesRef);
        
        const fetchedVehicleTypes = vehicleSnapshot.docs.map(doc => {
          const data = doc.data();
          // Find the associated taxi type name
          const taxiType = fetchedTaxiTypes.find(taxi => taxi.id === data.taxiTypeId);
          return {
            id: doc.id,
            ...data,
            taxiTypeName: taxiType?.name || 'Unknown'
          } as VehicleType;
        });
        
        console.log('Fetched vehicle types:', fetchedVehicleTypes);
        setVehicleTypes(fetchedVehicleTypes);
        
        // Fetch drivers
        const driversRef = collection(firestore, 'drivers');
        const driversQuery = query(driversRef, orderBy('name'));
        const driversSnapshot = await getDocs(driversQuery);
        
        const fetchedDrivers = driversSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            email: data.email,
            phone: data.phone,
            status: data.status,
            taxiTypeId: data.taxiTypeId,
            vehicleTypeId: data.vehicleTypeId,
            vehicleNumber: data.vehicleNumber,
            rating: data.rating || 0,
            rides: data.rides || 0,
            earnings: data.earnings || 0,
            joined: data.joined || new Date().toISOString().split('T')[0],
            userId: data.userId,
            feedback: data.feedback || []
          } as Driver;
        });
        setDrivers(fetchedDrivers);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);
  
  // Function to handle taxi type selection and filter vehicle types
  const handleTaxiTypeChange = (taxiTypeId: string) => {
    if (!currentDriver) return;
    
    console.log('Taxi type selected:', taxiTypeId);
    
    setCurrentDriver({
      ...currentDriver,
      taxiTypeId,
      vehicleTypeId: '' // Reset vehicle type when taxi type changes
    });
    
    // Filter vehicle types based on selected taxi type
    const filteredTypes = vehicleTypes.filter(
      vehicle => vehicle.taxiTypeId === taxiTypeId
    );
    console.log('Filtered vehicle types:', filteredTypes);
    setFilteredVehicleTypes(filteredTypes);
  };
  
  // Handle adding or editing a driver
  const handleAddEdit = (driver: Driver | null) => {
    if (driver) {
      // Edit existing driver
      setCurrentDriver({...driver});
      
      console.log('Editing driver with taxiTypeId:', driver.taxiTypeId);
      console.log('Available taxi types:', taxiTypes);
      
      // Set filtered vehicle types
      const filteredTypes = vehicleTypes.filter(
        vehicle => vehicle.taxiTypeId === driver.taxiTypeId
      );
      console.log('Filtered vehicle types for edit:', filteredTypes);
      setFilteredVehicleTypes(filteredTypes);
    } else {
      // Add new driver
      const defaultTaxiType = taxiTypes.length > 0 ? taxiTypes[0].id : '';
      const defaultVehicleTypes = vehicleTypes.filter(
        vehicle => vehicle.taxiTypeId === defaultTaxiType
      );
      
      console.log('Adding new driver, default taxi type:', defaultTaxiType);
      console.log('Available taxi types:', taxiTypes);
      console.log('Default filtered vehicle types:', defaultVehicleTypes);
      
      setCurrentDriver({
        name: '',
        email: '',
        phone: '',
        status: 'active',
        taxiTypeId: defaultTaxiType,
        vehicleTypeId: '',
        vehicleNumber: '',
        rating: 0,
        rides: 0,
        earnings: 0,
        joined: new Date().toISOString().split('T')[0]
      });
      
      // Set filtered vehicle types for the default taxi type
      setFilteredVehicleTypes(defaultVehicleTypes);
    }
    
    setIsDialogOpen(true);
  };
  
  // Handle changing driver status
  const openStatusDialog = (driver: Driver) => {
    setDriverToUpdateStatus(driver);
    setNewStatus(driver.status);
    setIsStatusDialogOpen(true);
  };
  
  // Function to update driver status
  const updateDriverStatus = async () => {
    if (!driverToUpdateStatus) return;
    
    setIsSubmitting(true);
    try {
      const driverRef = doc(firestore, 'drivers', driverToUpdateStatus.id);
      await updateDoc(driverRef, { 
        status: newStatus,
        updatedAt: new Date()
      });
      
      // Update local state
      setDrivers(drivers.map(driver => 
        driver.id === driverToUpdateStatus.id 
          ? {...driver, status: newStatus} 
          : driver
      ));
      
      toast.success('Driver status updated successfully');
      setIsStatusDialogOpen(false);
    } catch (error) {
      console.error('Error updating driver status:', error);
      toast.error('Failed to update driver status');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // View driver details
  const handleViewDriver = (driver: Driver) => {
    setDriverToView(driver);
    setIsViewDialogOpen(true);
  };
  
  // Handle deleting a driver
  const confirmDelete = (driver: Driver) => {
    setDriverToDelete(driver);
    setIsDeleteDialogOpen(true);
  };
  
  const handleDelete = async () => {
    if (!driverToDelete) return;
    
    setIsSubmitting(true);
    try {
      // Delete from Firestore
      await deleteDoc(doc(firestore, 'drivers', driverToDelete.id));
      
      // Update local state
      setDrivers(drivers.filter(driver => driver.id !== driverToDelete.id));
      toast.success('Driver deleted successfully');
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting driver:', error);
      toast.error('Failed to delete driver');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle form submission for adding/editing driver
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentDriver) return;
    
    // Validate form
    if (!currentDriver.name || !currentDriver.phone || !currentDriver.taxiTypeId || 
        !currentDriver.vehicleTypeId || !currentDriver.vehicleNumber) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Generate email if not provided
      if (!currentDriver.email) {
        currentDriver.email = `${currentDriver.name.toLowerCase().replace(/\s+/g, '.')}@booba-rides.com`;
      }
      
      if (currentDriver.id) {
        // Update existing driver
        const driverRef = doc(firestore, 'drivers', currentDriver.id);
        const { id, ...driverData } = currentDriver;
        
        await updateDoc(driverRef, {
          ...driverData,
          updatedAt: new Date()
        });
        
        // Update local state
        setDrivers(drivers.map(driver => 
          driver.id === currentDriver.id ? { ...driver, ...currentDriver } : driver
        ));
        
        toast.success('Driver updated successfully');
      } else {
        // Add new driver
        const { id, ...driverData } = currentDriver;
        
        try {
          // Create a Firestore document for the driver
          const docRef = await addDoc(collection(firestore, 'drivers'), {
            ...driverData,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          
          // Create a user account for the driver
          const userId = await createDriverUserAccount(docRef.id, driverData);
          
          // Update the driver document with the userId
          await updateDoc(doc(firestore, 'drivers', docRef.id), {
            userId: userId
          });
          
          // Update local state with new driver
          const newDriver = { 
            id: docRef.id, 
            userId,
            name: driverData.name || '',
            email: driverData.email || '',
            phone: driverData.phone || '',
            status: driverData.status || 'active',
            taxiTypeId: driverData.taxiTypeId || '',
            vehicleTypeId: driverData.vehicleTypeId || '',
            vehicleNumber: driverData.vehicleNumber || '',
            rating: driverData.rating || 0,
            rides: driverData.rides || 0,
            earnings: driverData.earnings || 0,
            joined: driverData.joined || new Date().toISOString().split('T')[0],
            feedback: driverData.feedback || []
          } as Driver;
          
          setDrivers([...drivers, newDriver]);
          toast.success('Driver added successfully with a driver account');
        } catch (error) {
          console.error('Error creating driver account:', error);
          toast.error('Failed to create driver account');
          throw error;
        }
      }
      
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving driver:', error);
      toast.error('Failed to save driver');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <DashboardLayout userType="admin">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Driver Management</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-fleet-red hover:bg-fleet-red/90" onClick={() => handleAddEdit(null)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Driver
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{drivers.length}</div>
            <p className="text-sm text-gray-500">Total Drivers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{drivers.filter(d => d.status === 'active').length}</div>
            <p className="text-sm text-gray-500">Active Drivers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{drivers.filter(d => d.status === 'inactive').length}</div>
            <p className="text-sm text-gray-500">Inactive Drivers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {drivers.length > 0 
                ? (drivers.reduce((acc, d) => acc + d.rating, 0) / drivers.length).toFixed(1) 
                : '0.0'}
            </div>
            <p className="text-sm text-gray-500">Average Rating</p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle>Drivers</CardTitle>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search drivers..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" onValueChange={setSelectedTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="all">All Drivers</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="inactive">Inactive</TabsTrigger>
              <TabsTrigger value="suspended">Suspended</TabsTrigger>
            </TabsList>
            
            <div className="rounded-md border">
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="h-12 px-4 text-left font-medium text-gray-500">Name</th>
                      <th className="h-12 px-4 text-left font-medium text-gray-500">Contact</th>
                      <th className="h-12 px-4 text-left font-medium text-gray-500">Vehicle</th>
                      <th className="h-12 px-4 text-left font-medium text-gray-500">Rating</th>
                      <th className="h-12 px-4 text-left font-medium text-gray-500">Rides</th>
                      <th className="h-12 px-4 text-left font-medium text-gray-500">Earnings</th>
                      <th className="h-12 px-4 text-left font-medium text-gray-500">Status</th>
                      <th className="h-12 px-4 text-right font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={8} className="h-24 text-center text-gray-500">
                          <div className="flex justify-center items-center">
                            <Loader2 className="h-8 w-8 text-fleet-red animate-spin mr-2" />
                            <p>Loading drivers...</p>
                          </div>
                        </td>
                      </tr>
                    ) : filteredDrivers.length > 0 ? (
                      filteredDrivers.map((driver) => {
                        // Find vehicle type name
                        const vehicleType = vehicleTypes.find(v => v.id === driver.vehicleTypeId);
                        const vehicleName = vehicleType?.name || 'Unknown Vehicle';
                        
                        return (
                          <tr key={driver.id} className="border-b">
                            <td className="p-4 font-medium">{driver.name}</td>
                            <td className="p-4">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-1">
                                  <Mail className="h-3 w-3 text-gray-500" />
                                  <span className="text-sm">{driver.email}</span>
                                </div>
                                <div className="flex items-center gap-1 mt-1">
                                  <Phone className="h-3 w-3 text-gray-500" />
                                  <span className="text-sm">{driver.phone}</span>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-1">
                                <Car className="h-4 w-4 text-gray-500" />
                                <span>{vehicleName} ({driver.vehicleNumber})</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center">
                                <Star className="h-4 w-4 text-yellow-400 mr-1" />
                                <span>{driver.rating.toFixed(1)}</span>
                              </div>
                            </td>
                            <td className="p-4">{driver.rides}</td>
                            <td className="p-4">AED {driver.earnings.toFixed(2)}</td>
                            <td className="p-4">
                              <Badge className={`
                                ${driver.status === 'active' ? 'bg-green-100 text-green-800' : 
                                  driver.status === 'inactive' ? 'bg-yellow-100 text-yellow-800' : 
                                  'bg-red-100 text-red-800'}
                              `}>
                                {driver.status.charAt(0).toUpperCase() + driver.status.slice(1)}
                              </Badge>
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleViewDriver(driver)}
                                  title="View Driver Details"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleAddEdit(driver)}
                                  title="Edit Driver"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => openStatusDialog(driver)}
                                  title="Change Status"
                                >
                                  {driver.status === 'active' ? (
                                    <UserCheck className="h-4 w-4 text-green-600" />
                                  ) : driver.status === 'inactive' ? (
                                    <UserX className="h-4 w-4 text-yellow-600" />
                                  ) : (
                                    <UserX className="h-4 w-4 text-red-600" />
                                  )}
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => confirmDelete(driver)}
                                  title="Delete Driver"
                                >
                                  <Trash className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} className="h-24 text-center text-gray-500">
                          No drivers found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Add/Edit Driver Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{currentDriver?.id ? 'Edit' : 'Add'} Driver</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Driver Name</Label>
              <Input
                id="name"
                placeholder="Full Name"
                value={currentDriver?.name || ''}
                onChange={(e) => setCurrentDriver(curr => curr ? {...curr, name: e.target.value} : null)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="+971 5X XXX XXXX"
                value={currentDriver?.phone || ''}
                onChange={(e) => setCurrentDriver(curr => curr ? {...curr, phone: e.target.value} : null)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email (Optional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="driver@example.com"
                value={currentDriver?.email || ''}
                onChange={(e) => setCurrentDriver(curr => curr ? {...curr, email: e.target.value} : null)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="taxi-type">Taxi Type</Label>
              <select 
                id="taxi-type"
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={currentDriver?.taxiTypeId || ''}
                onChange={(e) => handleTaxiTypeChange(e.target.value)}
                required
              >
                <option value="" disabled>Select a taxi type</option>
                {taxiTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.emoji} {type.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="vehicle-type">Vehicle Type</Label>
              <select 
                id="vehicle-type"
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={currentDriver?.vehicleTypeId || ''}
                onChange={(e) => setCurrentDriver(curr => curr ? {...curr, vehicleTypeId: e.target.value} : null)}
                disabled={!currentDriver?.taxiTypeId}
                required
              >
                <option value="" disabled>
                  {currentDriver?.taxiTypeId ? "Select a vehicle type" : "Select a taxi type first"}
                </option>
                {filteredVehicleTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
              {currentDriver?.taxiTypeId && filteredVehicleTypes.length === 0 && (
                <p className="text-xs text-red-500 mt-1">No vehicles available for this taxi type</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="vehicle-number">Vehicle Number</Label>
              <Input
                id="vehicle-number"
                placeholder="ABC123"
                value={currentDriver?.vehicleNumber || ''}
                onChange={(e) => setCurrentDriver(curr => curr ? {...curr, vehicleNumber: e.target.value} : null)}
                required
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-fleet-red text-white hover:bg-fleet-red/90"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  (currentDriver?.id ? 'Update' : 'Add') + ' Driver'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Status Update Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Driver Status</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="status">Status</Label>
            <Select value={newStatus} onValueChange={(value: 'active' | 'inactive' | 'suspended') => setNewStatus(value)}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="mt-4">
              <p className="text-sm text-gray-500">
                {newStatus === 'active' 
                  ? 'Driver will be active and available for bookings.' 
                  : newStatus === 'inactive'
                  ? 'Driver will be inactive and not available for bookings.'
                  : 'Driver will be suspended and not allowed to log in.'}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsStatusDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={updateDriverStatus} 
              className={`
                ${newStatus === 'active' ? 'bg-green-600 hover:bg-green-700' : 
                  newStatus === 'inactive' ? 'bg-yellow-600 hover:bg-yellow-700' : 
                  'bg-red-600 hover:bg-red-700'} text-white
              `}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Status'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* View Driver Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Driver Details</DialogTitle>
          </DialogHeader>
          
          {driverToView && (
            <div className="py-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{driverToView.name}</h3>
                <Badge className={`
                  ${driverToView.status === 'active' ? 'bg-green-100 text-green-800' : 
                    driverToView.status === 'inactive' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-red-100 text-red-800'}
                `}>
                  {driverToView.status.charAt(0).toUpperCase() + driverToView.status.slice(1)}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Contact</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Phone className="h-3 w-3 text-gray-500" />
                    <p>{driverToView.phone}</p>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <Mail className="h-3 w-3 text-gray-500" />
                    <p>{driverToView.email}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Vehicle</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Car className="h-3 w-3 text-gray-500" />
                    <p>
                      {vehicleTypes.find(v => v.id === driverToView.vehicleTypeId)?.name || 'Unknown'} 
                      ({driverToView.vehicleNumber})
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 bg-gray-50 p-3 rounded-md">
                <div className="text-center">
                  <p className="text-sm text-gray-500">Rating</p>
                  <div className="flex items-center justify-center mt-1">
                    <Star className="h-4 w-4 text-yellow-400 mr-1" />
                    <p className="font-medium">{driverToView.rating.toFixed(1)}</p>
                  </div>
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-gray-500">Rides</p>
                  <p className="font-medium mt-1">{driverToView.rides}</p>
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-gray-500">Earnings</p>
                  <p className="font-medium mt-1">AED {driverToView.earnings.toFixed(2)}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Joined</p>
                <p className="mt-1">{driverToView.joined}</p>
              </div>
              
              {driverToView.feedback && driverToView.feedback.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Recent Feedback</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {driverToView.feedback.map((feedback, index) => (
                      <div key={index} className="bg-gray-50 p-2 rounded-md">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Star className="h-3 w-3 text-yellow-400 mr-1" />
                            <p className="text-sm font-medium">{feedback.rating.toFixed(1)}</p>
                          </div>
                          <p className="text-xs text-gray-500">
                            {feedback.createdAt instanceof Date 
                              ? feedback.createdAt.toLocaleDateString() 
                              : new Date(feedback.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <p className="text-sm mt-1">{feedback.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Driver</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this driver? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDelete} 
              variant="destructive"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminDrivers;
