
import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Calendar, Clock, User, MapPin, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

// Sample ride data
const rides = [
  {
    id: 'RIDE-1001',
    user: 'John Doe',
    pickup: '123 Main St, New York',
    dropoff: 'JFK Airport, Terminal 4',
    date: new Date(2025, 5, 15, 9, 30),
    status: 'completed',
    amount: '$78.50',
    rating: 5,
  },
  {
    id: 'RIDE-1002',
    user: 'Jane Smith',
    pickup: '456 Park Ave, New York',
    dropoff: 'Grand Central Terminal',
    date: new Date(2025, 5, 15, 11, 45),
    status: 'completed',
    amount: '$45.75',
    rating: 4,
  },
  {
    id: 'RIDE-1003',
    user: 'Robert Brown',
    pickup: '789 Broadway, New York',
    dropoff: 'Newark Airport, Terminal C',
    date: new Date(2025, 5, 16, 14, 15),
    status: 'in_progress',
    amount: '$92.75',
    rating: null,
  },
  {
    id: 'RIDE-1004',
    user: 'Emily Davis',
    pickup: '555 5th Ave, New York',
    dropoff: 'LaGuardia Airport, Terminal B',
    date: new Date(2025, 5, 18, 11, 45),
    status: 'scheduled',
    amount: '$65.25',
    rating: null,
  },
  {
    id: 'RIDE-1005',
    user: 'Sarah Taylor',
    pickup: '888 Broadway, New York',
    dropoff: 'JFK Airport, Terminal 8',
    date: new Date(2025, 5, 17, 16, 30),
    status: 'cancelled',
    amount: '$0.00',
    rating: null,
  },
];

const DriverRides = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredRides = rides.filter(ride =>
    ride.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ride.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ride.pickup.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ride.dropoff.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-purple-100 text-purple-800';
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
    <DashboardLayout userType="driver">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Rides</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{rides.length}</div>
            <p className="text-sm text-gray-500">Total Rides</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{rides.filter(r => r.status === 'completed').length}</div>
            <p className="text-sm text-gray-500">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {rides.filter(r => r.rating).reduce((acc, ride) => acc + (ride.rating || 0), 0) / 
              rides.filter(r => r.rating).length || 0}
            </div>
            <p className="text-sm text-gray-500">Average Rating</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              ${rides
                .filter(r => r.status === 'completed')
                .reduce((total, ride) => {
                  const amount = parseFloat(ride.amount.replace('$', ''));
                  return total + (isNaN(amount) ? 0 : amount);
                }, 0).toFixed(2)}
            </div>
            <p className="text-sm text-gray-500">Total Earnings</p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle>Rides</CardTitle>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search rides..."
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
              <TabsTrigger value="all">All Rides</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              <div className="rounded-md border">
                <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="h-12 px-4 text-left font-medium text-gray-500">Ride ID</th>
                        <th className="h-12 px-4 text-left font-medium text-gray-500">User</th>
                        <th className="h-12 px-4 text-left font-medium text-gray-500">Date & Time</th>
                        <th className="h-12 px-4 text-left font-medium text-gray-500">Amount</th>
                        <th className="h-12 px-4 text-left font-medium text-gray-500">Status</th>
                        <th className="h-12 px-4 text-right font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRides.length > 0 ? (
                        filteredRides.map((ride) => (
                          <tr key={ride.id} className="border-b">
                            <td className="p-4 font-medium">{ride.id}</td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-500" />
                                <span>{ride.user}</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3 text-gray-500" />
                                  <span className="text-sm">{format(ride.date, 'MMM d, yyyy')}</span>
                                </div>
                                <div className="flex items-center gap-1 mt-1">
                                  <Clock className="h-3 w-3 text-gray-500" />
                                  <span className="text-sm">{format(ride.date, 'h:mm a')}</span>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 font-medium">{ride.amount}</td>
                            <td className="p-4">
                              <Badge className={getStatusBadgeColor(ride.status)}>
                                {formatStatus(ride.status)}
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
                                    <DialogTitle>Ride Details - {ride.id}</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4 pt-4">
                                    <div className="flex items-center justify-between">
                                      <Badge className={getStatusBadgeColor(ride.status)}>
                                        {formatStatus(ride.status)}
                                      </Badge>
                                      {ride.rating && (
                                        <div className="flex items-center bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                                          <span className="mr-1">Rating:</span>
                                          <span>{ride.rating}/5</span>
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div>
                                      <p className="text-sm text-gray-500">User</p>
                                      <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-gray-500" />
                                        <p className="font-medium">{ride.user}</p>
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <p className="text-sm text-gray-500">Date & Time</p>
                                      <p className="font-medium">
                                        {format(ride.date, 'MMMM d, yyyy')} at {format(ride.date, 'h:mm a')}
                                      </p>
                                    </div>
                                    
                                    <div>
                                      <p className="text-sm text-gray-500">Pickup Location</p>
                                      <div className="flex items-start gap-2">
                                        <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                                        <p className="font-medium">{ride.pickup}</p>
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <p className="text-sm text-gray-500">Dropoff Location</p>
                                      <div className="flex items-start gap-2">
                                        <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                                        <p className="font-medium">{ride.dropoff}</p>
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <p className="text-sm text-gray-500">Amount</p>
                                      <p className="text-xl font-bold">{ride.amount}</p>
                                    </div>
                                    
                                    {ride.status === 'scheduled' && (
                                      <div className="flex gap-2 pt-2">
                                        <Button variant="outline" className="flex-1">Cancel Ride</Button>
                                        <Button className="flex-1 bg-fleet-red hover:bg-fleet-red/90">Start Ride</Button>
                                      </div>
                                    )}
                                    
                                    {ride.status === 'in_progress' && (
                                      <Button className="w-full bg-fleet-red hover:bg-fleet-red/90">Complete Ride</Button>
                                    )}
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="h-24 text-center text-gray-500">
                            No rides found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="completed">
              {/* Same table structure with rides filtered by completed status */}
            </TabsContent>
            
            <TabsContent value="upcoming">
              {/* Same table structure with rides filtered by scheduled status */}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default DriverRides;
