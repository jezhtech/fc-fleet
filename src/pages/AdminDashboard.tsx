import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, BarChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Bar } from 'recharts';
import { formatCurrency } from '@/utils/currency';
import CurrencyNotice from '@/components/CurrencyNotice';

const data = [
  { name: 'Jan', bookings: 400, revenue: 2400 },
  { name: 'Feb', bookings: 300, revenue: 1398 },
  { name: 'Mar', bookings: 520, revenue: 3800 },
  { name: 'Apr', bookings: 480, revenue: 3908 },
  { name: 'May', bookings: 400, revenue: 4800 },
  { name: 'Jun', bookings: 380, revenue: 3800 },
  { name: 'Jul', bookings: 440, revenue: 4300 },
];

// Custom formatter for chart tooltip
const currencyFormatter = (value: number) => formatCurrency(value);

const AdminDashboard = () => {
  return (
    <DashboardLayout userType="admin">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      <CurrencyNotice className="mb-6" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,892</div>
            <p className="text-xs text-green-600 flex items-center">
              <span>↑</span> 12% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(42389)}</div>
            <p className="text-xs text-green-600 flex items-center">
              <span>↑</span> 8% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,483</div>
            <p className="text-xs text-green-600 flex items-center">
              <span>↑</span> 5% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Active Drivers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">48</div>
            <p className="text-xs text-green-600 flex items-center">
              <span>↑</span> 2 new this month
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={currencyFormatter} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#ea384c" 
                  strokeWidth={2}
                  activeDot={{ r: 8 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Booking Stats</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="bookings" fill="#ea384c" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="h-12 px-4 text-left font-medium text-gray-500">ID</th>
                      <th className="h-12 px-4 text-left font-medium text-gray-500">User</th>
                      <th className="h-12 px-4 text-left font-medium text-gray-500">Service Type</th>
                      <th className="h-12 px-4 text-left font-medium text-gray-500">Status</th>
                      <th className="h-12 px-4 text-left font-medium text-gray-500">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { id: 'BK-1001', user: 'John Doe', type: 'Taxi', status: 'Completed', amount: 24.50 },
                      { id: 'BK-1002', user: 'Jane Smith', type: 'Rental', status: 'Active', amount: 135.00 },
                      { id: 'BK-1003', user: 'Mike Johnson', type: 'Taxi', status: 'Cancelled', amount: 0.00 },
                      { id: 'BK-1004', user: 'Sarah Williams', type: 'Rental', status: 'Pending', amount: 78.50 },
                      { id: 'BK-1005', user: 'Robert Brown', type: 'Taxi', status: 'Completed', amount: 32.75 },
                    ].map((booking) => (
                      <tr key={booking.id} className="border-b">
                        <td className="p-4">{booking.id}</td>
                        <td className="p-4">{booking.user}</td>
                        <td className="p-4">{booking.type}</td>
                        <td className="p-4">
                          <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                            booking.status === 'Completed' ? 'bg-green-100 text-green-800' :
                            booking.status === 'Active' ? 'bg-blue-100 text-blue-800' :
                            booking.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="p-4">{formatCurrency(booking.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;