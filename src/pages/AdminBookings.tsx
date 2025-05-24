
import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, FileText, Calendar, Clock, User, Car, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

// Sample booking data
const bookings = [
  {
    id: 'BK-1001',
    type: 'Chauffeur',
    user: 'John Doe',
    driver: 'Michael Chen',
    vehicle: 'Toyota Camry',
    pickup: '123 Main St, New York',
    dropoff: 'JFK Airport, Terminal 4',
    date: new Date(2025, 5, 15, 9, 30),
    status: 'confirmed',
    amount: '$78.50',
  },
  {
    id: 'BK-1002',
    type: 'Rental',
    user: 'Jane Smith',
    driver: 'N/A',
    vehicle: 'BMW 3 Series',
    pickup: '456 Park Ave, New York',
    dropoff: 'N/A (Rental)',
    date: new Date(2025, 5, 20, 10, 0),
    status: 'pending',
    amount: '$145.00',
  },
  {
    id: 'BK-1003',
    type: 'Chauffeur',
    user: 'Robert Brown',
    driver: 'Sarah Johnson',
    vehicle: 'Mercedes E-Class',
    pickup: '789 Broadway, New York',
    dropoff: 'Newark Airport, Terminal C',
    date: new Date(2025, 5, 16, 14, 15),
    status: 'completed',
    amount: '$92.75',
  },
  {
    id: 'BK-1004',
    type: 'Chauffeur',
    user: 'Emily Davis',
    driver: 'David Lee',
    vehicle: 'Honda Accord',
    pickup: '555 5th Ave, New York',
    dropoff: 'LaGuardia Airport, Terminal B',
    date: new Date(2025, 5, 18, 11, 45),
    status: 'in_progress',
    amount: '$65.25',
  },
  {
    id: 'BK-1005',
    type: 'Rental',
    user: 'Michael Wilson',
    driver: 'N/A',
    vehicle: 'Hyundai Elantra',
    pickup: '123 Main St, New York',
    dropoff: 'N/A (Rental)',
    date: new Date(2025, 5, 22, 9, 0),
    status: 'pending',
    amount: '$110.25',
  },
  {
    id: 'BK-1006',
    type: 'Chauffeur',
    user: 'Sarah Taylor',
    driver: 'James Wilson',
    vehicle: 'Toyota Corolla',
    pickup: '888 Broadway, New York',
    dropoff: 'JFK Airport, Terminal 8',
    date: new Date(2025, 5, 17, 16, 30),
    status: 'cancelled',
    amount: '$0.00',
  },
];

const AdminBookings = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredBookings = bookings.filter(booking =>
    booking.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.user.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const formatStatus = (status: string) => {
    return status.replace('_', ' ').split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };
  
  return (
    <DashboardLayout userType="admin">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Booking Management</h1>
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
            <div className="text-2xl font-bold">{bookings.filter(b => b.status === 'confirmed' || b.status === 'pending').length}</div>
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
              ${bookings.reduce((total, booking) => {
                const amount = parseFloat(booking.amount.replace('$', ''));
                return total + (isNaN(amount) ? 0 : amount);
              }, 0).toFixed(2)}
            </div>
            <p className="text-sm text-gray-500">Total Revenue</p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle>Bookings</CardTitle>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search bookings..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="mb-6">
              <TabsTrigger value="all">All Bookings</TabsTrigger>
              <TabsTrigger value="chauffeur">Chauffeur</TabsTrigger>
              <TabsTrigger value="rental">Rental</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              <div className="rounded-md border">
                <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="h-12 px-4 text-left font-medium text-gray-500">Booking ID</th>
                        <th className="h-12 px-4 text-left font-medium text-gray-500">Type</th>
                        <th className="h-12 px-4 text-left font-medium text-gray-500">User</th>
                        <th className="h-12 px-4 text-left font-medium text-gray-500">Date & Time</th>
                        <th className="h-12 px-4 text-left font-medium text-gray-500">Amount</th>
                        <th className="h-12 px-4 text-left font-medium text-gray-500">Status</th>
                        <th className="h-12 px-4 text-right font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBookings.length > 0 ? (
                        filteredBookings.map((booking) => (
                          <tr key={booking.id} className="border-b">
                            <td className="p-4 font-medium">{booking.id}</td>
                            <td className="p-4">{booking.type}</td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-500" />
                                <span>{booking.user}</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3 text-gray-500" />
                                  <span className="text-sm">{format(booking.date, 'MMM d, yyyy')}</span>
                                </div>
                                <div className="flex items-center gap-1 mt-1">
                                  <Clock className="h-3 w-3 text-gray-500" />
                                  <span className="text-sm">{format(booking.date, 'h:mm a')}</span>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 font-medium">{booking.amount}</td>
                            <td className="p-4">
                              <Badge className={getStatusBadgeColor(booking.status)}>
                                {formatStatus(booking.status)}
                              </Badge>
                            </td>
                            <td className="p-4 text-right">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <FileText className="h-4 w-4 mr-2" />
                                    View
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md">
                                  <DialogHeader>
                                    <DialogTitle>Booking Details - {booking.id}</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4 pt-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <p className="text-sm text-gray-500">Type</p>
                                        <p className="font-medium">{booking.type}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-gray-500">Status</p>
                                        <Badge className={getStatusBadgeColor(booking.status)}>
                                          {formatStatus(booking.status)}
                                        </Badge>
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <p className="text-sm text-gray-500">User</p>
                                      <p className="font-medium">{booking.user}</p>
                                    </div>
                                    
                                    {booking.driver !== 'N/A' && (
                                      <div>
                                        <p className="text-sm text-gray-500">Driver</p>
                                        <p className="font-medium">{booking.driver}</p>
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
                                      <p className="text-sm text-gray-500">Date & Time</p>
                                      <p className="font-medium">
                                        {format(booking.date, 'MMMM d, yyyy')} at {format(booking.date, 'h:mm a')}
                                      </p>
                                    </div>
                                    
                                    <div>
                                      <p className="text-sm text-gray-500">Pickup Location</p>
                                      <div className="flex items-start gap-2">
                                        <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                                        <p className="font-medium">{booking.pickup}</p>
                                      </div>
                                    </div>
                                    
                                    {booking.type === 'Chauffeur' && (
                                      <div>
                                        <p className="text-sm text-gray-500">Dropoff Location</p>
                                        <div className="flex items-start gap-2">
                                          <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                                          <p className="font-medium">{booking.dropoff}</p>
                                        </div>
                                      </div>
                                    )}
                                    
                                    <div>
                                      <p className="text-sm text-gray-500">Amount</p>
                                      <p className="text-xl font-bold">{booking.amount}</p>
                                    </div>
                                    
                                    {booking.status === 'confirmed' || booking.status === 'pending' ? (
                                      <div className="flex gap-2 pt-2">
                                        <Button variant="outline" className="flex-1">Cancel Booking</Button>
                                        <Button className="flex-1 bg-fleet-red hover:bg-fleet-red/90">
                                          {booking.status === 'pending' ? 'Confirm Booking' : 'Mark as Completed'}
                                        </Button>
                                      </div>
                                    ) : null}
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="h-24 text-center text-gray-500">
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
    </DashboardLayout>
  );
};

export default AdminBookings;
