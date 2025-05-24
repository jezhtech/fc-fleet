
import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, UserPlus, Mail, Phone, Star, Car, Edit, Trash } from 'lucide-react';
import { toast } from 'sonner';

// Sample driver data
const drivers = [
  { 
    id: 1, 
    name: 'Michael Chen', 
    email: 'michael@example.com', 
    phone: '+1 555-111-2222', 
    status: 'active', 
    vehicle: 'Toyota Camry', 
    rating: 4.8,
    rides: 145,
    earnings: '$3,250.75',
    joined: '2023-06-15' 
  },
  { 
    id: 2, 
    name: 'Sarah Johnson', 
    email: 'sarah@example.com', 
    phone: '+1 555-222-3333', 
    status: 'active', 
    vehicle: 'Honda Accord', 
    rating: 4.6,
    rides: 98,
    earnings: '$2,145.50',
    joined: '2023-07-22' 
  },
  { 
    id: 3, 
    name: 'David Lee', 
    email: 'david@example.com', 
    phone: '+1 555-333-4444', 
    status: 'inactive', 
    vehicle: 'Hyundai Sonata', 
    rating: 4.5,
    rides: 67,
    earnings: '$1,430.25',
    joined: '2023-08-10' 
  },
  { 
    id: 4, 
    name: 'Maria Rodriguez', 
    email: 'maria@example.com', 
    phone: '+1 555-444-5555', 
    status: 'active', 
    vehicle: 'Toyota Corolla', 
    rating: 4.9,
    rides: 212,
    earnings: '$4,760.00',
    joined: '2023-05-03' 
  },
  { 
    id: 5, 
    name: 'James Wilson', 
    email: 'james@example.com', 
    phone: '+1 555-555-6666', 
    status: 'suspended', 
    vehicle: 'Nissan Altima', 
    rating: 3.8,
    rides: 42,
    earnings: '$890.50',
    joined: '2023-09-14' 
  }
];

const AdminDrivers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredDrivers = drivers.filter(driver =>
    driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleDeleteDriver = (id: number) => {
    toast.success(`Driver ${id} has been deleted`);
  };
  
  return (
    <DashboardLayout userType="admin">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Driver Management</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-fleet-red hover:bg-fleet-red/90">
              <UserPlus className="mr-2 h-4 w-4" />
              Add Driver
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Driver</DialogTitle>
            </DialogHeader>
            <form className="space-y-4 pt-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">Full Name</label>
                <Input id="name" placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">Email</label>
                <Input id="email" type="email" placeholder="john@example.com" />
              </div>
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium">Phone Number</label>
                <Input id="phone" placeholder="+1 555-123-4567" />
              </div>
              <div className="space-y-2">
                <label htmlFor="vehicle" className="text-sm font-medium">Vehicle</label>
                <Input id="vehicle" placeholder="Toyota Camry" />
              </div>
              <Button type="submit" className="w-full bg-fleet-red hover:bg-fleet-red/90">
                Add Driver
              </Button>
            </form>
          </DialogContent>
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
              {(drivers.reduce((acc, d) => acc + d.rating, 0) / drivers.length).toFixed(1)}
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
          <Tabs defaultValue="all">
            <TabsList className="mb-6">
              <TabsTrigger value="all">All Drivers</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="inactive">Inactive</TabsTrigger>
              <TabsTrigger value="suspended">Suspended</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
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
                      {filteredDrivers.length > 0 ? (
                        filteredDrivers.map((driver) => (
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
                                <span>{driver.vehicle}</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center">
                                <Star className="h-4 w-4 text-yellow-400 mr-1" />
                                <span>{driver.rating}</span>
                              </div>
                            </td>
                            <td className="p-4">{driver.rides}</td>
                            <td className="p-4">{driver.earnings}</td>
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
                              <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleDeleteDriver(driver.id)}
                              >
                                <Trash className="h-4 w-4 text-red-500" />
                              </Button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="h-24 text-center text-gray-500">
                            No drivers found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
            
            {/* Similar content for active, inactive, and suspended tabs */}
            <TabsContent value="active">
              {/* Same table structure with filtered drivers */}
            </TabsContent>
            
            <TabsContent value="inactive">
              {/* Same table structure with filtered drivers */}
            </TabsContent>
            
            <TabsContent value="suspended">
              {/* Same table structure with filtered drivers */}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default AdminDrivers;
