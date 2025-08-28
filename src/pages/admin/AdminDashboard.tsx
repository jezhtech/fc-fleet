import React, { useEffect, useState, useMemo, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  BarChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Bar,
} from "recharts";
import { formatCurrency } from "@/utils/currency";
import CurrencyNotice from "@/components/CurrencyNotice";
import { adminService, bookingService, userService } from "@/services";
import type { User, BookingWithRelations, UserWithDriverDetail } from "@/types";

// Combined interface for recent bookings with user info

interface DashboardStats {
  totalBookings: number;
  totalRevenue: number;
  totalUsers: number;
  activeDrivers: number;
  monthlyBookings: number;
  monthlyRevenue: number;
  recentBookings: BookingWithRelations[];
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    totalRevenue: 0,
    totalUsers: 0,
    activeDrivers: 0,
    monthlyBookings: 0,
    monthlyRevenue: 0,
    recentBookings: [],
  });
  const [loading, setLoading] = useState(true);
  const [allBookings, setAllBookings] = useState<BookingWithRelations[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allDrivers, setAllDrivers] = useState<UserWithDriverDetail[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<
    "today" | "yesterday" | "7days" | "30days" | "6months"
  >("7days");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch bookings, users, and drivers in parallel
      const [bookingsRes, usersRes, driversRes] = await Promise.all([
        bookingService.getAllBookingsWithRelations(),
        userService.getAllUsers(),
        userService.getAllDrivers(),
      ]);

      if (!bookingsRes.success || !usersRes.success || !driversRes.success) {
        throw new Error(
          bookingsRes.error ||
            usersRes.error ||
            driversRes.error ||
            "Failed to fetch data",
        );
      }

      const fetchedBookings = bookingsRes.data || [];
      const fetchedUsers = usersRes.data || [];
      const fetchedDrivers = driversRes.data || [];

      console.log("User: ", fetchedUsers);

      setAllBookings(fetchedBookings);
      setAllUsers(fetchedUsers);
      setAllDrivers(fetchedDrivers);

      // Calculate dashboard statistics
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Calculate total bookings and revenue
      const totalBookings = fetchedBookings.length;
      const totalRevenue = fetchedBookings.reduce(
        (sum, booking) => sum + (booking.paymentInfo.amount || 0),
        0,
      );

      // Calculate monthly stats
      const monthlyBookings = fetchedBookings.filter((booking) => {
        const createdAt = new Date(booking.createdAt || new Date());
        return createdAt >= startOfMonth && createdAt <= endOfMonth;
      }).length;

      const monthlyRevenue = fetchedBookings
        .filter((booking) => {
          const createdAt = new Date(booking.createdAt || new Date());
          return createdAt >= startOfMonth && createdAt <= endOfMonth;
        })
        .reduce((sum, booking) => sum + (booking.paymentInfo.amount || 0), 0);

      // Get recent bookings (last 5) with user information
      const recentBookings: BookingWithRelations[] = fetchedBookings
        .sort((a, b) => {
          const dateA = new Date(a.createdAt || new Date());
          const dateB = new Date(b.createdAt || new Date());
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 5);

      // Calculate total users (excluding drivers)
      const totalUsers = fetchedUsers;

      setStats({
        totalBookings,
        totalRevenue,
        totalUsers: fetchedUsers.length,
        activeDrivers: fetchedDrivers.length,
        monthlyBookings,
        monthlyRevenue,
        recentBookings,
      });
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Get date range based on selection
  const getDateRange = useCallback((range: string) => {
    const now = new Date();
    const start = new Date();

    switch (range) {
      case "today":
        start.setHours(0, 0, 0, 0);
        return { start, end: now };
      case "yesterday":
        start.setDate(start.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        const endYesterday = new Date(start);
        endYesterday.setHours(23, 59, 59, 999);
        return { start, end: endYesterday };
      case "7days":
        start.setDate(start.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        return { start, end: now };
      case "30days":
        start.setDate(start.getDate() - 30);
        start.setHours(0, 0, 0, 0);
        return { start, end: now };
      case "6months":
        start.setMonth(start.getMonth() - 6);
        start.setHours(0, 0, 0, 0);
        return { start, end: now };
      default:
        start.setDate(start.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        return { start, end: now };
    }
  }, []);

  // Prepare chart data based on selected date range - memoized to prevent unnecessary recalculations
  const chartData = useMemo(() => {
    const { start, end } = getDateRange(dateRange);
    const data = [];

    if (dateRange === "today" || dateRange === "yesterday") {
      // For today/yesterday, show hourly data
      const hours = [];
      for (let i = 0; i < 24; i++) {
        const hour = new Date(start);
        hour.setHours(i, 0, 0, 0);
        const nextHour = new Date(hour);
        nextHour.setHours(i + 1, 0, 0, 0);

        const hourBookings = allBookings.filter((booking) => {
          const createdAt = new Date(booking.createdAt || new Date());
          return createdAt >= hour && createdAt < nextHour;
        }).length;

        const hourRevenue = allBookings
          .filter((booking) => {
            const createdAt = new Date(booking.createdAt || new Date());
            return createdAt >= hour && createdAt < nextHour;
          })
          .reduce((sum, booking) => sum + (booking.paymentInfo.amount || 0), 0);

        hours.push({
          name: `${hour.getHours()}:00`,
          bookings: hourBookings,
          revenue: hourRevenue,
        });
      }
      return hours;
    } else if (dateRange === "7days") {
      // For 7 days, show daily data
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const dayBookings = allBookings.filter((booking) => {
          const createdAt = new Date(booking.createdAt || new Date());
          return createdAt >= date && createdAt < nextDate;
        }).length;

        const dayRevenue = allBookings
          .filter((booking) => {
            const createdAt = new Date(booking.createdAt || new Date());
            return createdAt >= date && createdAt < nextDate;
          })
          .reduce((sum, booking) => sum + (booking.paymentInfo.amount || 0), 0);

        data.push({
          name: date.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          }),
          bookings: dayBookings,
          revenue: dayRevenue,
        });
      }
      return data;
    } else if (dateRange === "30days") {
      // For 30 days, show weekly data
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - i * 7);
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const weekBookings = allBookings.filter((booking) => {
          const createdAt = new Date(booking.createdAt || new Date());
          return createdAt >= weekStart && createdAt < weekEnd;
        }).length;

        const weekRevenue = allBookings
          .filter((booking) => {
            const createdAt = new Date(booking.createdAt || new Date());
            return createdAt >= weekStart && createdAt < weekEnd;
          })
          .reduce((sum, booking) => sum + (booking.paymentInfo.amount || 0), 0);

        data.push({
          name: `Week ${4 - i}`,
          bookings: weekBookings,
          revenue: weekRevenue,
        });
      }
      return data;
    } else {
      // For 6 months, show monthly data
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        date.setDate(1);
        date.setHours(0, 0, 0, 0);
        const nextMonth = new Date(date);
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        const monthBookings = allBookings.filter((booking) => {
          const createdAt = new Date(booking.createdAt || new Date());
          return createdAt >= date && createdAt < nextMonth;
        }).length;

        const monthRevenue = allBookings
          .filter((booking) => {
            const createdAt = new Date(booking.createdAt || new Date());
            return createdAt >= date && createdAt < nextMonth;
          })
          .reduce((sum, booking) => sum + (booking.paymentInfo.amount || 0), 0);

        data.push({
          name: date.toLocaleDateString("en-US", { month: "short" }),
          bookings: monthBookings,
          revenue: monthRevenue,
        });
      }
      return data;
    }
  }, [allBookings, dateRange, getDateRange]);

  // Custom formatter for chart tooltip - memoized to prevent recreation on every render
  const currencyFormatter = useCallback(
    (value: number) => formatCurrency(value),
    [],
  );

  if (loading) {
    return (
      <DashboardLayout userType="admin">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading dashboard data...</div>
        </div>
      </DashboardLayout>
    );
  }

  // Show error message if data fetching failed
  if (error) {
    return (
      <DashboardLayout userType="admin">
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
        <CurrencyNotice className="mb-6" />
        <div className="text-center py-12">
          <div className="text-lg text-red-500 mb-4">
            Error loading dashboard data
          </div>
          <div className="text-sm text-gray-400">{error}</div>
        </div>
      </DashboardLayout>
    );
  }

  // Show message if no data is available
  if (
    allBookings.length === 0 &&
    allUsers.length === 0 &&
    allDrivers.length === 0
  ) {
    return (
      <DashboardLayout userType="admin">
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
        <CurrencyNotice className="mb-6" />
        <div className="text-center py-12">
          <div className="text-lg text-gray-500 mb-4">No data available</div>
          <div className="text-sm text-gray-400">
            Start by creating some bookings, users, or drivers to see dashboard
            statistics.
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const handleRefresh = () => {
    fetchData();
  };

  return (
    <DashboardLayout userType="admin">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <Button
          onClick={handleRefresh}
          disabled={loading}
          variant="outline"
          size="sm"
        >
          {loading ? "Refreshing..." : "Refresh Data"}
        </Button>
      </div>

      <CurrencyNotice className="mb-6" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalBookings.toLocaleString()}
            </div>
            <p className="text-xs text-green-600 flex items-center">
              <span>↑</span> {stats.monthlyBookings} this month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalRevenue)}
            </div>
            <p className="text-xs text-green-600 flex items-center">
              <span>↑</span> {formatCurrency(stats.monthlyRevenue)} this month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalUsers.toLocaleString()}
            </div>
            <p className="text-xs text-green-600 flex items-center">
              <span>↑</span> Active users
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Active Drivers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeDrivers}</div>
            <p className="text-xs text-green-600 flex items-center">
              <span>↑</span> Available for bookings
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Chart Data Range</h2>
          <Select
            value={dateRange}
            onValueChange={(value: any) => setDateRange(value)}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary cards for selected date range */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-gray-500">Bookings in Range</div>
              <div className="text-xl font-bold">
                {chartData.reduce((sum, item) => sum + item.bookings, 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-gray-500">Revenue in Range</div>
              <div className="text-xl font-bold">
                {formatCurrency(
                  chartData.reduce((sum, item) => sum + item.revenue, 0),
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-gray-500">
                Average per{" "}
                {dateRange === "today" || dateRange === "yesterday"
                  ? "Hour"
                  : dateRange === "7days"
                    ? "Day"
                    : dateRange === "30days"
                      ? "Week"
                      : "Month"}
              </div>
              <div className="text-xl font-bold">
                {formatCurrency(
                  chartData.length > 0
                    ? chartData.reduce((sum, item) => sum + item.revenue, 0) /
                        chartData.length
                    : 0,
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>
              Revenue Overview -{" "}
              {dateRange === "today"
                ? "Today"
                : dateRange === "yesterday"
                  ? "Yesterday"
                  : dateRange === "7days"
                    ? "Last 7 Days"
                    : dateRange === "30days"
                      ? "Last 30 Days"
                      : "Last 6 Months"}
            </CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
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
            <CardTitle>
              Booking Stats -{" "}
              {dateRange === "today"
                ? "Today"
                : dateRange === "yesterday"
                  ? "Yesterday"
                  : dateRange === "7days"
                    ? "Last 7 Days"
                    : dateRange === "30days"
                      ? "Last 30 Days"
                      : "Last 6 Months"}
            </CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
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
                      <th className="h-12 px-4 text-left font-medium text-gray-500">
                        ID
                      </th>
                      <th className="h-12 px-4 text-left font-medium text-gray-500">
                        User
                      </th>
                      <th className="h-12 px-4 text-left font-medium text-gray-500">
                        Service Type
                      </th>
                      <th className="h-12 px-4 text-left font-medium text-gray-500">
                        Status
                      </th>
                      <th className="h-12 px-4 text-left font-medium text-gray-500">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentBookings.length > 0 ? (
                      stats.recentBookings.map((booking) => (
                        <tr key={booking.id} className="border-b">
                          <td className="p-4">{booking.id}</td>
                          <td className="p-4">
                            {booking.user?.email || "Unknown User"}
                          </td>
                          <td className="p-4">
                            {booking.user?.driverDetails.vehicleNumber}
                          </td>
                          <td className="p-4">
                            <span
                              className={`inline-block px-2 py-1 text-xs rounded-full ${
                                booking.status === "completed"
                                  ? "bg-green-100 text-green-800"
                                  : booking.paymentInfo.status === "paid"
                                    ? "bg-blue-100 text-blue-800"
                                    : booking.paymentInfo.status === "pending"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-red-100 text-red-800"
                              }`}
                            >
                              {booking.status.charAt(0).toUpperCase() +
                                booking.status.slice(1)}
                            </span>
                          </td>
                          <td className="p-4">
                            {formatCurrency(booking.paymentInfo.amount || 0)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={5}
                          className="p-4 text-center text-gray-500"
                        >
                          No recent bookings found
                        </td>
                      </tr>
                    )}
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
