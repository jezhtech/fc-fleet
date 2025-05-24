
import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, BarChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Bar } from 'recharts';
import { format } from 'date-fns';
import { Calendar } from 'lucide-react';

// Sample earnings data
const weeklyData = [
  { name: 'Mon', rides: 12, earnings: 240 },
  { name: 'Tue', rides: 10, earnings: 200 },
  { name: 'Wed', rides: 14, earnings: 280 },
  { name: 'Thu', rides: 15, earnings: 300 },
  { name: 'Fri', rides: 18, earnings: 360 },
  { name: 'Sat', rides: 20, earnings: 400 },
  { name: 'Sun', rides: 16, earnings: 320 },
];

const monthlyData = [
  { name: 'Jan', rides: 220, earnings: 4400 },
  { name: 'Feb', rides: 200, earnings: 4000 },
  { name: 'Mar', rides: 240, earnings: 4800 },
  { name: 'Apr', rides: 260, earnings: 5200 },
  { name: 'May', rides: 280, earnings: 5600 },
  { name: 'Jun', rides: 300, earnings: 6000 },
];

const recentPayments = [
  { id: 'PMT-1001', date: new Date(2025, 5, 14), amount: '$980.25', status: 'completed' },
  { id: 'PMT-1002', date: new Date(2025, 5, 7), amount: '$1,045.50', status: 'completed' },
  { id: 'PMT-1003', date: new Date(2025, 4, 30), amount: '$1,120.75', status: 'completed' },
  { id: 'PMT-1004', date: new Date(2025, 4, 23), amount: '$975.50', status: 'completed' },
  { id: 'PMT-1005', date: new Date(2025, 4, 16), amount: '$1,050.00', status: 'completed' },
];

const DriverEarnings = () => {
  return (
    <DashboardLayout userType="driver">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Earnings</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Today's Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$150.75</div>
            <p className="text-xs text-green-600 flex items-center">
              <span>↑</span> 8% from yesterday
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$1,125.50</div>
            <p className="text-xs text-green-600 flex items-center">
              <span>↑</span> 5% from last week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$4,320.75</div>
            <p className="text-xs text-green-600 flex items-center">
              <span>↑</span> 12% from last month
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="mb-6">
        <Tabs defaultValue="weekly">
          <TabsList className="mb-6">
            <TabsTrigger value="weekly">Weekly Overview</TabsTrigger>
            <TabsTrigger value="monthly">Monthly Overview</TabsTrigger>
          </TabsList>
          
          <TabsContent value="weekly">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Earnings Overview</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="earnings" fill="#ea384c" />
                    <Bar dataKey="rides" fill="#333333" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="monthly">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Earnings Overview</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="earnings" stroke="#ea384c" strokeWidth={2} />
                    <Line type="monotone" dataKey="rides" stroke="#333333" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="h-12 px-4 text-left font-medium text-gray-500">Payment ID</th>
                        <th className="h-12 px-4 text-left font-medium text-gray-500">Date</th>
                        <th className="h-12 px-4 text-left font-medium text-gray-500">Amount</th>
                        <th className="h-12 px-4 text-left font-medium text-gray-500">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentPayments.map((payment) => (
                        <tr key={payment.id} className="border-b">
                          <td className="p-4 font-medium">{payment.id}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4 text-gray-500" />
                              <span>{format(payment.date, 'MMM d, yyyy')}</span>
                            </div>
                          </td>
                          <td className="p-4 font-medium">{payment.amount}</td>
                          <td className="p-4">
                            <span className="inline-block px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                              {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Payment Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-b pb-4">
                  <p className="text-sm text-gray-500">Next Payment</p>
                  <p className="font-bold text-lg">June 21, 2025</p>
                  <p className="text-sm text-gray-500 mt-1">Estimated: $980 - $1,100</p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-medium">Payment Information</h3>
                  <div className="flex justify-between text-sm">
                    <span>Payment Method:</span>
                    <span className="font-medium">Direct Deposit</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Bank Account:</span>
                    <span className="font-medium">**** 5678</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Payment Cycle:</span>
                    <span className="font-medium">Weekly</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Processing Day:</span>
                    <span className="font-medium">Thursday</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DriverEarnings;
