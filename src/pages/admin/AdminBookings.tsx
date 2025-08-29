import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Calendar as CalendarIcon,
  Clock,
  User,
  Car,
  MapPin,
  CheckCircle,
  X,
  UserCheck,
  Download,
  FileText,
  ArrowUpDown,
} from "lucide-react";
import { toast } from "sonner";
import { bookingService } from "@/services/bookingService";
import type {
  AdminBooking,
  BookingFilters,
  BookingWithRelations,
} from "@/types";

const AdminBookings = () => {
  const [bookings, setBookings] = useState<BookingWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filters, setFilters] = useState<BookingFilters>({});
  const [searchQuery, setSearchQuery] = useState("");

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [filterOpen, setFilterOpen] = useState(false);

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"confirm" | "assign" | "cancel">(
    "confirm",
  );
  const [selectedBooking, setSelectedBooking] = useState<AdminBooking | null>(
    null,
  );
  const [cancellationReason, setCancellationReason] = useState("");

  // Tab state
  const [selectedTab, setSelectedTab] = useState("all");

  // Fetch bookings using the booking service
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);

        const response = await bookingService.getAllBookings(filters);
        if (response.success) {
          // Convert BookingWithRelations to AdminBooking format
          const bookingsData = response.data;
          setBookings(bookingsData);
        } else {
          throw new Error(response.error || "Failed to fetch bookings");
        }
      } catch (error: any) {
        console.error("Error fetching bookings:", error);
        toast.error(error.message || "Failed to load bookings");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [filters]);

  const handleSearch = () => {
    setFilters((prev) => ({
      ...prev,
      search: searchQuery,
    }));
  };

  const handleFilterChange = (key: keyof BookingFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery("");
    setStatusFilter("all");
    setDateFilter(undefined);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "initiated":
        return "secondary";
      case "awaiting":
        return "default";
      case "assigned":
        return "outline";
      case "pickup":
        return "default";
      case "completed":
        return "default";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
    }).format(amount);
  };

  const openDialog = (
    booking: AdminBooking,
    type: "confirm" | "assign" | "cancel",
  ) => {
    setSelectedBooking(booking);
    setDialogType(type);
    setDialogOpen(true);
  };

  const handleConfirmBooking = async () => {
    if (!selectedBooking) return;

    setIsSubmitting(true);
    try {
      // Update booking status to confirmed
      const response = await bookingService.updateBookingStatus(
        selectedBooking.id,
        "awaiting",
      );

      if (response.success) {
        toast.success("Booking confirmed successfully");
        // Refresh bookings
        const refreshResponse = await bookingService.getAllBookings(filters);
        if (refreshResponse.success) {
          const bookingsData = refreshResponse.data;
          setBookings(bookingsData);
        }
        setDialogOpen(false);
      } else {
        throw new Error(response.error || "Failed to confirm booking");
      }
    } catch (error: any) {
      console.error("Error confirming booking:", error);
      toast.error(error.message || "Failed to confirm booking");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!selectedBooking || !cancellationReason.trim()) return;

    setIsSubmitting(true);
    try {
      // Update booking status to cancelled
      const response = await bookingService.updateBookingStatus(
        selectedBooking.id,
        "cancelled",
      );

      if (response.success) {
        toast.success("Booking cancelled successfully");
        // Refresh bookings
        const refreshResponse = await bookingService.getAllBookings(filters);
        if (refreshResponse.success) {
          const bookingsData = refreshResponse.data;
          setBookings(bookingsData);
        }
        setDialogOpen(false);
        setCancellationReason("");
      } else {
        throw new Error(response.error || "Failed to cancel booking");
      }
    } catch (error: any) {
      console.error("Error cancelling booking:", error);
      toast.error(error.message || "Failed to cancel booking");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter bookings based on selected tab and filters
  const filteredBookings = bookings.filter((booking) => {
    // Tab filter
    if (selectedTab === "chauffeur" && booking.bookingType !== "ride")
      return false;
    if (selectedTab === "rental" && booking.bookingType !== "rent")
      return false;

    // Status filter
    if (statusFilter !== "all" && booking.status !== statusFilter) return false;

    // Date filter
    if (dateFilter && booking.createdAt) {
      const bookingDate = new Date(booking.createdAt);
      const filterDate = new Date(dateFilter);
      if (bookingDate.toDateString() !== filterDate.toDateString())
        return false;
    }

    // Search filter
    if (
      searchQuery &&
      !booking.id.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;

    return true;
  });

  // Calculate statistics
  const totalBookings = bookings.length;
  const activeBookings = bookings.filter((b) =>
    ["initiated", "awaiting", "assigned"].includes(b.status),
  ).length;
  const completedBookings = bookings.filter(
    (b) => b.status === "completed",
  ).length;
  const totalRevenue = bookings.reduce((total, booking) => {
    const amount = booking.paymentInfo?.amount || 0;
    return total + amount;
  }, 0);

  return (
    <DashboardLayout userType="admin">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Booking Management</h1>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{totalBookings}</div>
            <p className="text-sm text-gray-500">Total Bookings</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{activeBookings}</div>
            <p className="text-sm text-gray-500">Active Bookings</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{completedBookings}</div>
            <p className="text-sm text-gray-500">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {formatCurrency(totalRevenue)}
            </div>
            <p className="text-sm text-gray-500">Total Revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>Booking Overview</CardTitle>
            <div className="flex items-center gap-3">
              {/* Filter Button */}
              <Popover open={filterOpen} onOpenChange={setFilterOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                    aria-label="Filter bookings"
                  >
                    <Filter className="h-4 w-4" />
                    {statusFilter !== "all" || dateFilter ? (
                      <span className="text-fleet-red font-medium">
                        Filters Active
                      </span>
                    ) : (
                      <span>Filter</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                    <h4 className="font-medium">Filter Bookings</h4>

                    <div className="space-y-2">
                      <Label htmlFor="status-filter">Status</Label>
                      <Select
                        value={statusFilter}
                        onValueChange={setStatusFilter}
                      >
                        <SelectTrigger id="status-filter">
                          <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="initiated">Initiated</SelectItem>
                          <SelectItem value="awaiting">Awaiting</SelectItem>
                          <SelectItem value="assigned">Assigned</SelectItem>
                          <SelectItem value="pickup">Pickup</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Created Date</Label>
                      <Calendar
                        mode="single"
                        selected={dateFilter}
                        onSelect={setDateFilter}
                        className="border rounded-md p-3"
                      />
                    </div>

                    <div className="flex justify-between">
                      <Button variant="outline" onClick={clearFilters}>
                        Reset
                      </Button>
                      <Button onClick={() => setFilterOpen(false)}>
                        Apply Filters
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Search */}
              <div className="relative w-60 md:w-96">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search by booking ID..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="all">All Bookings</TabsTrigger>
              <TabsTrigger value="chauffeur">Chauffeur Services</TabsTrigger>
              <TabsTrigger value="rental">Rentals</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <div className="rounded-md border">
                <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="h-12 px-3 text-left font-medium text-gray-500">
                          Order ID
                        </th>
                        <th className="h-12 px-3 text-left font-medium text-gray-500">
                          Type
                        </th>
                        <th className="h-12 px-3 text-left font-medium text-gray-500">
                          Customer
                        </th>
                        <th className="h-12 px-3 text-left font-medium text-gray-500">
                          Created Date
                        </th>
                        <th className="h-12 px-3 text-left font-medium text-gray-500">
                          Amount
                        </th>
                        <th className="h-12 px-3 text-left font-medium text-gray-500">
                          Status
                        </th>
                        <th className="h-12 px-3 text-right font-medium text-gray-500 w-32">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="h-24 text-center text-gray-500"
                          >
                            <div className="flex items-center justify-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Loading bookings...
                            </div>
                          </td>
                        </tr>
                      ) : filteredBookings.length > 0 ? (
                        filteredBookings.map((booking) => (
                          <tr key={booking.id} className="border-b">
                            <td className="p-3 font-medium">
                              {booking.orderId}
                            </td>
                            <td className="p-3 capitalize">
                              {booking.bookingType}
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-500" />
                                <span>
                                  {booking.user?.firstName}{" "}
                                  {booking.user?.lastName}
                                </span>
                              </div>
                            </td>
                            <td className="p-3">
                              {booking.createdAt && (
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-1">
                                    <CalendarIcon className="h-3 w-3 text-gray-500" />
                                    <span className="text-sm">
                                      {formatDate(booking.createdAt)}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </td>
                            <td className="p-3 font-medium">
                              {formatCurrency(booking.paymentInfo?.amount || 0)}
                            </td>
                            <td className="p-3">
                              <Badge
                                variant={getStatusBadgeVariant(booking.status)}
                              >
                                {booking.status}
                              </Badge>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {/* View Details */}
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      title="View Details"
                                      className="h-7 w-7"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="sm:max-w-[600px]">
                                    <DialogHeader>
                                      <DialogTitle>Booking Details</DialogTitle>
                                    </DialogHeader>
                                    <div className="grid gap-6 py-4">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <p className="text-sm text-gray-500">
                                            Booking ID
                                          </p>
                                          <p className="font-medium">
                                            {booking.id}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-sm text-gray-500">
                                            Status
                                          </p>
                                          <Badge
                                            variant={getStatusBadgeVariant(
                                              booking.status,
                                            )}
                                          >
                                            {booking.status}
                                          </Badge>
                                        </div>
                                      </div>

                                      <div>
                                        <p className="text-sm text-gray-500">
                                          Customer
                                        </p>
                                        <div className="flex items-center gap-2">
                                          <User className="h-4 w-4 text-gray-500" />
                                          <p className="font-medium">
                                            {booking.user?.firstName}{" "}
                                            {booking.user?.lastName}
                                          </p>
                                        </div>
                                        {booking.user?.phone && (
                                          <p className="text-sm text-gray-500 mt-1">
                                            {booking.user.phone}
                                          </p>
                                        )}
                                        {booking.user?.email && (
                                          <p className="text-sm text-gray-500 mt-1">
                                            {booking.user.email}
                                          </p>
                                        )}
                                      </div>

                                      <div>
                                        <p className="text-sm text-gray-500">
                                          Vehicle
                                        </p>
                                        <div className="flex items-center gap-2">
                                          <Car className="h-4 w-4 text-gray-500" />
                                          <p className="font-medium">
                                            {booking.vehicle?.name || "N/A"}
                                          </p>
                                        </div>
                                      </div>

                                      <div>
                                        <p className="text-sm text-gray-500">
                                          Created Date
                                        </p>
                                        <p className="font-medium">
                                          {booking.createdAt
                                            ? formatDate(booking.createdAt)
                                            : "N/A"}
                                        </p>
                                      </div>

                                      <div>
                                        <p className="text-sm text-gray-500">
                                          Pickup Location
                                        </p>
                                        <div className="flex items-start gap-2">
                                          <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                                          <p className="font-medium">
                                            {booking.pickupLocation?.name ||
                                              "N/A"}
                                          </p>
                                        </div>
                                      </div>

                                      {booking.dropoffLocation && (
                                        <div>
                                          <p className="text-sm text-gray-500">
                                            Dropoff Location
                                          </p>
                                          <div className="flex items-start gap-2">
                                            <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                                            <p className="font-medium">
                                              {booking.dropoffLocation.name}
                                            </p>
                                          </div>
                                        </div>
                                      )}

                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <p className="text-sm text-gray-500">
                                            Amount
                                          </p>
                                          <p className="font-medium">
                                            {formatCurrency(
                                              booking.paymentInfo?.amount || 0,
                                            )}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-sm text-gray-500">
                                            Payment Status
                                          </p>
                                          <p className="font-medium">
                                            {booking.paymentInfo?.status ||
                                              "N/A"}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>

                                {/* Action Buttons */}
                                {booking.status === "initiated" && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      openDialog(booking, "confirm")
                                    }
                                    title="Confirm Booking"
                                    className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                )}

                                {(booking.status === "initiated" ||
                                  booking.status === "awaiting") && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      openDialog(booking, "cancel")
                                    }
                                    title="Cancel Booking"
                                    className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={7}
                            className="h-24 text-center text-gray-500"
                          >
                            No bookings found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="chauffeur">
              {/* Same table structure with filtered bookings for chauffeur services */}
              <div className="rounded-md border">
                <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="h-12 px-3 text-left font-medium text-gray-500">
                          Booking ID
                        </th>
                        <th className="h-12 px-3 text-left font-medium text-gray-500">
                          Customer
                        </th>
                        <th className="h-12 px-3 text-left font-medium text-gray-500">
                          Created Date
                        </th>
                        <th className="h-12 px-3 text-left font-medium text-gray-500">
                          Amount
                        </th>
                        <th className="h-12 px-3 text-left font-medium text-gray-500">
                          Status
                        </th>
                        <th className="h-12 px-3 text-right font-medium text-gray-500 w-32">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBookings.length > 0 ? (
                        filteredBookings.map((booking) => (
                          <tr key={booking.id} className="border-b">
                            <td className="p-3 font-medium">{booking.id}</td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-500" />
                                <span>
                                  {booking.user?.firstName}{" "}
                                  {booking.user?.lastName}
                                </span>
                              </div>
                            </td>
                            <td className="p-3">
                              {booking.createdAt &&
                                formatDate(booking.createdAt)}
                            </td>
                            <td className="p-3 font-medium">
                              {formatCurrency(booking.paymentInfo?.amount || 0)}
                            </td>
                            <td className="p-3">
                              <Badge
                                variant={getStatusBadgeVariant(booking.status)}
                              >
                                {booking.status}
                              </Badge>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openDialog(booking, "confirm")}
                                  title="Confirm Booking"
                                  className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={6}
                            className="h-24 text-center text-gray-500"
                          >
                            No chauffeur bookings found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="rental">
              {/* Same table structure with filtered bookings for rentals */}
              <div className="rounded-md border">
                <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="h-12 px-3 text-left font-medium text-gray-500">
                          Booking ID
                        </th>
                        <th className="h-12 px-3 text-left font-medium text-gray-500">
                          Customer
                        </th>
                        <th className="h-12 px-3 text-left font-medium text-gray-500">
                          Created Date
                        </th>
                        <th className="h-12 px-3 text-left font-medium text-gray-500">
                          Amount
                        </th>
                        <th className="h-12 px-3 text-left font-medium text-gray-500">
                          Status
                        </th>
                        <th className="h-12 px-3 text-right font-medium text-gray-500 w-32">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBookings.length > 0 ? (
                        filteredBookings.map((booking) => (
                          <tr key={booking.id} className="border-b">
                            <td className="p-3 font-medium">{booking.id}</td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-500" />
                                <span>
                                  {booking.user?.firstName}{" "}
                                  {booking.user?.lastName}
                                </span>
                              </div>
                            </td>
                            <td className="p-3">
                              {booking.createdAt &&
                                formatDate(booking.createdAt)}
                            </td>
                            <td className="p-3 font-medium">
                              {formatCurrency(booking.paymentInfo?.amount || 0)}
                            </td>
                            <td className="p-3">
                              <Badge
                                variant={getStatusBadgeVariant(booking.status)}
                              >
                                {booking.status}
                              </Badge>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openDialog(booking, "confirm")}
                                  title="Confirm Booking"
                                  className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={6}
                            className="h-24 text-center text-gray-500"
                          >
                            No rental bookings found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Action Dialogs */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogType === "confirm"
                ? "Confirm Booking"
                : dialogType === "cancel"
                  ? "Cancel Booking"
                  : "Assign Driver"}
            </DialogTitle>
          </DialogHeader>

          {dialogType === "confirm" && (
            <div className="py-4">
              <p>Are you sure you want to confirm this booking?</p>
              <p className="text-sm text-gray-500 mt-2">
                This will update the booking status to "Awaiting".
              </p>
            </div>
          )}

          {dialogType === "cancel" && (
            <div className="py-4">
              <p>Are you sure you want to cancel this booking?</p>

              <div className="mt-4 space-y-2">
                <Label htmlFor="cancellation-reason">
                  Reason for cancellation
                </Label>
                <Textarea
                  id="cancellation-reason"
                  placeholder="Enter reason for cancellation"
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <p className="text-sm text-gray-500 mt-4">
                This action cannot be undone. The booking status will be updated
                to "Cancelled".
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                setCancellationReason("");
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={
                dialogType === "confirm"
                  ? handleConfirmBooking
                  : handleCancelBooking
              }
              disabled={
                isSubmitting ||
                (dialogType === "cancel" && !cancellationReason.trim())
              }
              className={
                dialogType === "confirm"
                  ? "bg-blue-500 hover:bg-blue-600"
                  : "bg-red-500 hover:bg-red-600"
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {dialogType === "confirm" ? "Confirming..." : "Cancelling..."}
                </>
              ) : (
                <>
                  {dialogType === "confirm"
                    ? "Confirm Booking"
                    : "Cancel Booking"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminBookings;
