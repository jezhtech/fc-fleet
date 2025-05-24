
import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Car, Star, Phone, Mail, MapPin, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const DriverProfile = () => {
  const handleSave = () => {
    toast.success('Profile updated successfully');
  };
  
  return (
    <DashboardLayout userType="driver">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-bold">My Profile</h1>
        <Badge className="bg-green-100 text-green-800 mt-2 md:mt-0">Active</Badge>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                  <User className="h-16 w-16 text-gray-600" />
                </div>
                <h2 className="text-xl font-bold">Michael Chen</h2>
                <p className="text-gray-500">Driver ID: DRV-5678</p>
                
                <div className="flex items-center mt-2">
                  <Star className="h-5 w-5 text-yellow-400" />
                  <span className="ml-1 font-medium">4.8</span>
                  <span className="text-gray-500 ml-1">(145 rides)</span>
                </div>
                
                <div className="mt-6 w-full">
                  <Button 
                    className="w-full bg-fleet-red hover:bg-fleet-red/90"
                    onClick={() => toast.success('Profile photo updated')}
                  >
                    Update Photo
                  </Button>
                </div>
              </div>
              
              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-3">
                  <Car className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Vehicle</p>
                    <p className="font-medium">Toyota Camry</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Member Since</p>
                    <p className="font-medium">June 15, 2023</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">+1 (555) 123-4567</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">michael@example.com</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium">New York, NY</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-2">
          <Tabs defaultValue="personal">
            <TabsList className="mb-6">
              <TabsTrigger value="personal">Personal Info</TabsTrigger>
              <TabsTrigger value="vehicle">Vehicle</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>
            
            <TabsContent value="personal">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="firstName" className="text-sm font-medium">First Name</label>
                        <Input id="firstName" defaultValue="Michael" />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="lastName" className="text-sm font-medium">Last Name</label>
                        <Input id="lastName" defaultValue="Chen" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium">Email Address</label>
                      <Input id="email" type="email" defaultValue="michael@example.com" />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="phone" className="text-sm font-medium">Phone Number</label>
                      <Input id="phone" defaultValue="+1 (555) 123-4567" />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="address" className="text-sm font-medium">Address</label>
                      <Input id="address" defaultValue="123 Main St" />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="city" className="text-sm font-medium">City</label>
                        <Input id="city" defaultValue="New York" />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="state" className="text-sm font-medium">State</label>
                        <Input id="state" defaultValue="NY" />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="zipCode" className="text-sm font-medium">Zip Code</label>
                        <Input id="zipCode" defaultValue="10001" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="emergencyContact" className="text-sm font-medium">Emergency Contact</label>
                      <Input id="emergencyContact" defaultValue="Lisa Chen" />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="emergencyPhone" className="text-sm font-medium">Emergency Contact Phone</label>
                      <Input id="emergencyPhone" defaultValue="+1 (555) 987-6543" />
                    </div>
                    
                    <Button 
                      type="button" 
                      className="bg-fleet-red hover:bg-fleet-red/90"
                      onClick={handleSave}
                    >
                      Save Changes
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="vehicle">
              <Card>
                <CardHeader>
                  <CardTitle>Vehicle Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="make" className="text-sm font-medium">Vehicle Make</label>
                        <Input id="make" defaultValue="Toyota" />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="model" className="text-sm font-medium">Vehicle Model</label>
                        <Input id="model" defaultValue="Camry" />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="year" className="text-sm font-medium">Year</label>
                        <Input id="year" defaultValue="2020" />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="color" className="text-sm font-medium">Color</label>
                        <Input id="color" defaultValue="Silver" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="licensePlate" className="text-sm font-medium">License Plate Number</label>
                      <Input id="licensePlate" defaultValue="ABC-1234" />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="registrationNumber" className="text-sm font-medium">Registration Number</label>
                      <Input id="registrationNumber" defaultValue="REG-5678901" />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="insurance" className="text-sm font-medium">Insurance Provider</label>
                      <Input id="insurance" defaultValue="SafeDrive Insurance" />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="policyNumber" className="text-sm font-medium">Policy Number</label>
                      <Input id="policyNumber" defaultValue="POL-987654321" />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="expiryDate" className="text-sm font-medium">Insurance Expiry Date</label>
                      <Input id="expiryDate" type="date" defaultValue="2025-12-31" />
                    </div>
                    
                    <Button 
                      type="button" 
                      className="bg-fleet-red hover:bg-fleet-red/90"
                      onClick={handleSave}
                    >
                      Save Changes
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="documents">
              <Card>
                <CardHeader>
                  <CardTitle>Required Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border rounded-md p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium">Driver's License</h3>
                          <p className="text-sm text-green-600">Verified</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">View</Button>
                          <Button variant="outline" size="sm">Update</Button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">Expires: December 15, 2025</p>
                    </div>
                    
                    <div className="border rounded-md p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium">Vehicle Registration</h3>
                          <p className="text-sm text-green-600">Verified</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">View</Button>
                          <Button variant="outline" size="sm">Update</Button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">Expires: March 10, 2026</p>
                    </div>
                    
                    <div className="border rounded-md p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium">Insurance Certificate</h3>
                          <p className="text-sm text-green-600">Verified</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">View</Button>
                          <Button variant="outline" size="sm">Update</Button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">Expires: December 31, 2025</p>
                    </div>
                    
                    <div className="border rounded-md p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium">Background Check Certificate</h3>
                          <p className="text-sm text-green-600">Verified</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">View</Button>
                          <Button variant="outline" size="sm">Update</Button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">Completed: June 10, 2023</p>
                    </div>
                    
                    <div className="border rounded-md p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium">Profile Photo</h3>
                          <p className="text-sm text-green-600">Verified</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">View</Button>
                          <Button variant="outline" size="sm">Update</Button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">Last updated: August 5, 2023</p>
                    </div>
                    
                    <Button 
                      className="bg-fleet-red hover:bg-fleet-red/90"
                      onClick={() => toast.success('All documents are up to date')}
                    >
                      Upload New Document
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DriverProfile;
