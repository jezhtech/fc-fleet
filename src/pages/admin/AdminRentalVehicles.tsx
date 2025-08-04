import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { PlusCircle, Edit2, Trash2 } from 'lucide-react';
import { formatCurrency, CURRENCY } from '@/utils/currency';

interface RentalVehicle {
  id: string;
  name: string;
  type: string;
  model: string;
  year: string;
  rate: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  seats: number;
  features: string[];
  image: string;
  status: 'available' | 'booked' | 'maintenance';
}

const AdminRentalVehicles = () => {
  const [vehicles, setVehicles] = useState<RentalVehicle[]>([
    {
      id: "1",
      name: "Toyota Camry",
      type: "Sedan",
      model: "Camry LE",
      year: "2023",
      rate: {
        daily: 59.99,
        weekly: 349.99,
        monthly: 1299.99
      },
      seats: 5,
      features: ["Bluetooth", "Backup Camera", "Cruise Control", "Navigation"],
      image: "/placeholder.svg",
      status: "available"
    },
    {
      id: "2",
      name: "Honda CR-V",
      type: "SUV",
      model: "CR-V EX",
      year: "2022",
      rate: {
        daily: 69.99,
        weekly: 399.99,
        monthly: 1499.99
      },
      seats: 5,
      features: ["Bluetooth", "Backup Camera", "Cruise Control", "Navigation", "Sunroof"],
      image: "/placeholder.svg",
      status: "booked"
    },
    {
      id: "3",
      name: "Ford F-150",
      type: "Truck",
      model: "F-150 XLT",
      year: "2023",
      rate: {
        daily: 89.99,
        weekly: 499.99,
        monthly: 1899.99
      },
      seats: 5,
      features: ["Bluetooth", "Backup Camera", "Cruise Control", "Navigation", "Towing Package"],
      image: "/placeholder.svg",
      status: "maintenance"
    }
  ]);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<RentalVehicle | null>(null);
  
  const handleAddEdit = () => {
    setDialogOpen(false);
    
    if (editingVehicle) {
      toast.success(`Vehicle "${editingVehicle.name}" updated successfully!`);
    } else {
      toast.success("New vehicle added successfully!");
    }
    
    setEditingVehicle(null);
  };
  
  const handleDelete = (id: string, name: string) => {
    setVehicles(vehicles.filter(vehicle => vehicle.id !== id));
    toast.success(`"${name}" deleted successfully!`);
  };
  
  const openEditDialog = (vehicle: RentalVehicle) => {
    setEditingVehicle(vehicle);
    setDialogOpen(true);
  };
  
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'booked':
        return 'bg-blue-100 text-blue-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DashboardLayout userType="admin">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Rental Vehicles Management</h1>
          <p className="text-gray-500">Manage your rental fleet inventory and pricing</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-booba-yellow text-booba-dark hover:bg-booba-yellow/90">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Vehicle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingVehicle ? `Edit ${editingVehicle.name}` : "Add New Rental Vehicle"}
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">Vehicle Name</label>
                <Input 
                  id="name" 
                  placeholder="e.g. Toyota Camry"
                  defaultValue={editingVehicle?.name}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="type" className="text-sm font-medium">Vehicle Type</label>
                <Input 
                  id="type" 
                  placeholder="e.g. Sedan, SUV, Truck"
                  defaultValue={editingVehicle?.type}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="model" className="text-sm font-medium">Model</label>
                <Input 
                  id="model" 
                  placeholder="e.g. Camry LE"
                  defaultValue={editingVehicle?.model}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="year" className="text-sm font-medium">Year</label>
                <Input 
                  id="year" 
                  placeholder="e.g. 2023"
                  defaultValue={editingVehicle?.year}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="daily" className="text-sm font-medium">Daily Rate ({CURRENCY.symbol})</label>
                <Input 
                  id="daily" 
                  type="number"
                  placeholder="e.g. 59.99"
                  defaultValue={editingVehicle?.rate.daily.toString()}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="weekly" className="text-sm font-medium">Weekly Rate ({CURRENCY.symbol})</label>
                <Input 
                  id="weekly" 
                  type="number"
                  placeholder="e.g. 349.99"
                  defaultValue={editingVehicle?.rate.weekly.toString()}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="monthly" className="text-sm font-medium">Monthly Rate ({CURRENCY.symbol})</label>
                <Input 
                  id="monthly" 
                  type="number"
                  placeholder="e.g. 1299.99"
                  defaultValue={editingVehicle?.rate.monthly.toString()}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="seats" className="text-sm font-medium">Number of Seats</label>
                <Input 
                  id="seats" 
                  type="number"
                  placeholder="e.g. 5"
                  defaultValue={editingVehicle?.seats.toString()}
                />
              </div>
              
              <div className="space-y-2 col-span-2">
                <label htmlFor="features" className="text-sm font-medium">Features (comma separated)</label>
                <Input 
                  id="features" 
                  placeholder="e.g. Bluetooth, Backup Camera, Cruise Control"
                  defaultValue={editingVehicle?.features.join(", ")}
                />
              </div>
              
              <div className="space-y-2 col-span-2">
                <label htmlFor="status" className="text-sm font-medium">Status</label>
                <select 
                  id="status" 
                  className="w-full border border-input bg-background p-2 rounded-md"
                  defaultValue={editingVehicle?.status}
                >
                  <option value="available">Available</option>
                  <option value="booked">Booked</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
              
              <div className="space-y-2 col-span-2">
                <label htmlFor="image" className="text-sm font-medium">Image Upload</label>
                <Input id="image" type="file" />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button className="bg-booba-yellow text-booba-dark hover:bg-booba-yellow/90" onClick={handleAddEdit}>
                {editingVehicle ? "Update Vehicle" : "Add Vehicle"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card className="mb-8">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Model / Year</TableHead>
                <TableHead>Daily Rate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.map((vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-gray-200 rounded flex-shrink-0"></div>
                    <span className="font-medium">{vehicle.name}</span>
                  </TableCell>
                  <TableCell>{vehicle.type}</TableCell>
                  <TableCell>
                    {vehicle.model} / {vehicle.year}
                  </TableCell>
                  <TableCell>{formatCurrency(vehicle.rate.daily)}</TableCell>
                  <TableCell>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(vehicle.status)}`}>
                      {vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => openEditDialog(vehicle)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDelete(vehicle.id, vehicle.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default AdminRentalVehicles;
