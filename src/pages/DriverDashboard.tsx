
import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Line, BarChart, Bar } from 'recharts';
import { toast } from 'sonner';
import { Star, Users, Clock, Calendar, ChartBar } from 'lucide-react';

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
  const [isOnline, setIsOnline] = React.useState(false);
  
  const toggleStatus = () => {
    const newStatus = !isOnline;
    setIsOnline(newStatus);
    toast.success(newStatus ? "You are now online and can receive ride requests!" : "You are now offline.");
  };
  
  return (
    <DashboardLayout userType="driver">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Welcome, David!</h1>
        <p className="text-gray-600">Here's your activity summary for today.</p>
      </div>
      
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-booba-yellow flex items-center justify-center text-booba-dark font-bold text-2xl">
                D
              </div>
              <div>
                <h2 className="text-xl font-semibold">David Johnson</h2>
                <div className="flex items-center gap-2">
                  <Badge variant={isOnline ? "default" : "outline"} className={isOnline ? "bg-green-500" : ""}>
                    {isOnline ? "Online" : "Offline"}
                  </Badge>
                  <span className="text-sm text-gray-500">4.8 ★</span>
                </div>
              </div>
            </div>
            <Button 
              onClick={toggleStatus}
              className={isOnline ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"}
            >
              Go {isOnline ? "Offline" : "Online"}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Today's Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$132.50</div>
            <p className="text-xs text-green-600 flex items-center">
              <span>↑</span> 12% from yesterday
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Today's Rides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-green-600 flex items-center">
              <span>↑</span> 2 more than yesterday
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Online Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6.5</div>
            <p className="text-xs text-gray-500 flex items-center">
              Today's hours
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Weekly Earnings</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={earningsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="earnings" stroke="#FFDA29" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Upcoming Rides</CardTitle>
            <CardDescription>Your scheduled pickups</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isOnline ? (
                <>
                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">John D.</span>
                      <Badge>5 mins away</Badge>
                    </div>
                    <p className="text-sm mb-2">123 Main St to Airport</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Standard Sedan</span>
                      <span className="font-medium">$24.50</span>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant="outline" className="w-1/2">Reject</Button>
                      <Button size="sm" className="w-1/2 bg-booba-yellow text-booba-dark hover:bg-booba-yellow/90">Accept</Button>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">Sarah M.</span>
                      <Badge variant="outline">2:30 PM</Badge>
                    </div>
                    <p className="text-sm mb-2">45 Park Ave to Downtown</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Premium SUV</span>
                      <span className="font-medium">$35.00</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <p>Go online to receive ride requests</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Performance Metrics Section */}
      <h2 className="text-xl font-bold mb-4">Performance Metrics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Performance</CardTitle>
            <CardDescription>Rides completed and rating trend</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" orientation="left" />
                <YAxis yAxisId="right" orientation="right" domain={[3, 5]} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="rides" fill="#333333" name="Rides Completed" />
                <Line yAxisId="right" type="monotone" dataKey="rating" stroke="#FFDA29" name="Rating" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="mr-4 bg-booba-yellow/10 p-3 rounded-md">
                    <Star className="h-8 w-8 text-booba-yellow" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold">4.8</div>
                    <div className="text-sm text-gray-500">Out of 5</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Based on</div>
                  <div className="text-lg font-medium">385 rides</div>
                </div>
              </div>
              
              <div className="space-y-2 mt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-booba-yellow mr-1" />
                    <span className="text-sm">5</span>
                  </div>
                  <div className="w-full mx-4 bg-gray-200 rounded-full h-2.5">
                    <div className="bg-booba-yellow h-2.5 rounded-full" style={{ width: '70%' }}></div>
                  </div>
                  <span className="text-sm font-medium">70%</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-booba-yellow mr-1" />
                    <span className="text-sm">4</span>
                  </div>
                  <div className="w-full mx-4 bg-gray-200 rounded-full h-2.5">
                    <div className="bg-booba-yellow h-2.5 rounded-full" style={{ width: '20%' }}></div>
                  </div>
                  <span className="text-sm font-medium">20%</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-booba-yellow mr-1" />
                    <span className="text-sm">3</span>
                  </div>
                  <div className="w-full mx-4 bg-gray-200 rounded-full h-2.5">
                    <div className="bg-booba-yellow h-2.5 rounded-full" style={{ width: '8%' }}></div>
                  </div>
                  <span className="text-sm font-medium">8%</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-booba-yellow mr-1" />
                    <span className="text-sm">2</span>
                  </div>
                  <div className="w-full mx-4 bg-gray-200 rounded-full h-2.5">
                    <div className="bg-booba-yellow h-2.5 rounded-full" style={{ width: '2%' }}></div>
                  </div>
                  <span className="text-sm font-medium">2%</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-booba-yellow mr-1" />
                    <span className="text-sm">1</span>
                  </div>
                  <div className="w-full mx-4 bg-gray-200 rounded-full h-2.5">
                    <div className="bg-booba-yellow h-2.5 rounded-full" style={{ width: '0%' }}></div>
                  </div>
                  <span className="text-sm font-medium">0%</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center">
                  <div className="bg-gray-100 p-3 rounded-full mb-2">
                    <Users className="h-6 w-6 text-booba-yellow" />
                  </div>
                  <div className="text-2xl font-bold">137</div>
                  <div className="text-sm text-gray-500">Passengers This Month</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center">
                  <div className="bg-gray-100 p-3 rounded-full mb-2">
                    <Clock className="h-6 w-6 text-booba-yellow" />
                  </div>
                  <div className="text-2xl font-bold">98%</div>
                  <div className="text-sm text-gray-500">On-Time Rate</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Ride History</CardTitle>
          <CardDescription>Your recent completed rides</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="h-10 px-4 text-left font-medium text-gray-500">Date</th>
                    <th className="h-10 px-4 text-left font-medium text-gray-500">Passenger</th>
                    <th className="h-10 px-4 text-left font-medium text-gray-500">Route</th>
                    <th className="h-10 px-4 text-left font-medium text-gray-500">Vehicle Type</th>
                    <th className="h-10 px-4 text-left font-medium text-gray-500">Fare</th>
                    <th className="h-10 px-4 text-left font-medium text-gray-500">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { date: 'May 2, 2025', passenger: 'John D.', route: '123 Main St to Airport', type: 'Standard Sedan', fare: '$24.50', rating: 5 },
                    { date: 'May 2, 2025', passenger: 'Sarah M.', route: '45 Park Ave to Downtown', type: 'Premium SUV', fare: '$35.00', rating: 4 },
                    { date: 'May 1, 2025', passenger: 'Michael B.', route: 'Airport to 78 West St', type: 'Premium Sedan', fare: '$42.75', rating: 5 },
                    { date: 'May 1, 2025', passenger: 'Lisa K.', route: 'Downtown to Westfield Mall', type: 'Standard Sedan', fare: '$18.25', rating: 5 },
                    { date: 'Apr 30, 2025', passenger: 'Robert J.', route: '890 Ocean Ave to University', type: 'Standard SUV', fare: '$22.00', rating: 4 },
                  ].map((ride, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-3">{ride.date}</td>
                      <td className="p-3">{ride.passenger}</td>
                      <td className="p-3">{ride.route}</td>
                      <td className="p-3">{ride.type}</td>
                      <td className="p-3">{ride.fare}</td>
                      <td className="p-3">
                        <div className="flex">
                          {Array.from({ length: ride.rating }).map((_, i) => (
                            <Star key={i} className="h-4 w-4 text-booba-yellow fill-booba-yellow" />
                          ))}
                          {Array.from({ length: 5 - ride.rating }).map((_, i) => (
                            <Star key={i} className="h-4 w-4 text-gray-300" />
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex justify-center mt-4">
            <Button variant="outline">View All Rides</Button>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default DriverDashboard;
