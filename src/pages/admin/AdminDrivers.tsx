import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";
import { userService } from "@/services/userService";
import { transportService } from "@/services/transportService";
import { vehicleService } from "@/services/vehicleService";
import type {
  DriverDetails,
  Vehicle,
  Transport,
  UserWithDriverDetail,
} from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Car,
  Edit,
  Eye,
  Loader2,
  Mail,
  Phone,
  Search,
  Star,
  Trash,
  UserCheck,
  UserPlus,
  UserX,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import config from "@/config";

const AdminDrivers = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [driverToDelete, setDriverToDelete] =
    useState<UserWithDriverDetail | null>(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [driverToUpdateStatus, setDriverToUpdateStatus] =
    useState<UserWithDriverDetail | null>(null);
  const [newStatus, setNewStatus] = useState<
    "active" | "inactive" | "suspended"
  >("active");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentDriver, setCurrentDriver] =
    useState<Partial<UserWithDriverDetail> | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [driverToView, setDriverToView] = useState<UserWithDriverDetail | null>(
    null,
  );

  const [drivers, setDrivers] = useState<UserWithDriverDetail[]>([]);
  const [taxiTypes, setTaxiTypes] = useState<Transport[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<Vehicle[]>([]);
  const [filteredVehicleTypes, setFilteredVehicleTypes] = useState<Vehicle[]>(
    [],
  );

  const filteredDrivers = drivers.filter(
    (driver) =>
      (`${driver.firstName} ${driver.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
        driver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.phone.includes(searchTerm)) &&
      (selectedTab === "all" || driver.driverDetails?.status === selectedTab),
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [driversRes, taxiTypesRes, vehicleTypesRes] = await Promise.all([
          userService.getAllDrivers(),
          transportService.getAllTransports(),
          vehicleService.getAllVehicles(),
        ]);

        if (driversRes.success && driversRes.data) {
          setDrivers(driversRes.data);
        } else {
          toast.error(driversRes.message || "Failed to load drivers");
        }

        if (taxiTypesRes.success && taxiTypesRes.data) {
          setTaxiTypes(taxiTypesRes.data);
        } else {
          toast.error(taxiTypesRes.message || "Failed to load taxi types");
        }

        if (vehicleTypesRes.success && vehicleTypesRes.data) {
          setVehicleTypes(vehicleTypesRes.data);
        } else {
          toast.error(
            vehicleTypesRes.message || "Failed to load vehicle types",
          );
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleTaxiTypeChange = (taxiTypeId: string) => {
    if (!currentDriver) return;

    setCurrentDriver({
      ...currentDriver,
      driverDetails: {
        ...(currentDriver.driverDetails as DriverDetails),
        taxiTypeId,
        vehicleTypeId: "",
      },
    });

    const filteredTypes = vehicleTypes.filter(
      (vehicle) => vehicle.transportId === taxiTypeId,
    );
    setFilteredVehicleTypes(filteredTypes);
  };

  const handleAddEdit = (driver: UserWithDriverDetail | null) => {
    if (driver) {
      setCurrentDriver({ ...driver });
      const filteredTypes = vehicleTypes.filter(
        (vehicle) => vehicle.transportId === driver.driverDetails?.taxiTypeId,
      );
      setFilteredVehicleTypes(filteredTypes);
    } else {
      const defaultTaxiType = taxiTypes.length > 0 ? taxiTypes[0].id : "";
      const defaultVehicleTypes = vehicleTypes.filter(
        (vehicle) => vehicle.transportId === defaultTaxiType,
      );
      setCurrentDriver({
        role: "driver",
        driverDetails: {
          id: "",
          userId: "",
          taxiTypeId: defaultTaxiType,
          vehicleTypeId: "",
          vehicleNumber: "",
          rating: 0,
          createdAt: "",
          updatedAt: "",
          status: "active",
        },
      });
      setFilteredVehicleTypes(defaultVehicleTypes);
    }
    setIsDialogOpen(true);
  };

  const openStatusDialog = (driver: UserWithDriverDetail) => {
    setDriverToUpdateStatus(driver);
    setNewStatus(driver.driverDetails?.status || "active");
    setIsStatusDialogOpen(true);
  };

  const handleUpdateDriverStatus = async () => {
    if (!driverToUpdateStatus?.id) return;

    setIsSubmitting(true);
    try {
      await userService.updateDriverStatus(driverToUpdateStatus.id, newStatus);
      setDrivers(
        drivers.map((driver) =>
          driver.id === driverToUpdateStatus.id
            ? {
                ...driver,
                driverDetails: {
                  ...(driver.driverDetails as DriverDetails),
                  status: newStatus,
                },
              }
            : driver,
        ),
      );
      toast.success("Driver status updated successfully");
      setIsStatusDialogOpen(false);
    } catch (error) {
      console.error("Error updating driver status:", error);
      toast.error("Failed to update driver status");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewDriver = (driver: UserWithDriverDetail) => {
    setDriverToView(driver);
    setIsViewDialogOpen(true);
  };

  const confirmDelete = (driver: UserWithDriverDetail) => {
    setDriverToDelete(driver);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!driverToDelete?.id) return;

    setIsSubmitting(true);
    try {
      await userService.deleteDriver(driverToDelete.id);
      setDrivers(drivers.filter((driver) => driver.id !== driverToDelete.id));
      toast.success("Driver deleted successfully");
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting driver:", error);
      toast.error("Failed to delete driver");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentDriver) return;

    if (
      !currentDriver.firstName ||
      !currentDriver.lastName ||
      !currentDriver.phone ||
      !currentDriver.email ||
      !currentDriver.driverDetails?.taxiTypeId ||
      !currentDriver.driverDetails?.vehicleTypeId ||
      !currentDriver.driverDetails?.vehicleNumber
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      if (currentDriver.id) {
        await userService.updateDriver(currentDriver.id, {
          ...currentDriver,
        });
        setDrivers(
          drivers.map((driver) =>
            driver.id === currentDriver.id
              ? ({ ...driver, ...currentDriver } as UserWithDriverDetail)
              : driver,
          ),
        );
        toast.success("Driver updated successfully");
      } else {
        const result = await userService.createDriver({
          firstName: currentDriver.firstName,
          lastName: currentDriver.lastName,
          phone: currentDriver.phone,
          email: currentDriver.email,
          status: "active",
          vehicleNumber: currentDriver.driverDetails.vehicleNumber,
          taxiTypeId: currentDriver.driverDetails.taxiTypeId,
          vehicleTypeId: currentDriver.driverDetails.vehicleTypeId,
        });
        if (result.success && result.data) {
          setDrivers([...drivers, result.data as UserWithDriverDetail]);
          toast.success("Driver added successfully");
        }
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error saving driver:", error);
      toast.error("Failed to save driver");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout userType="admin">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Driver Management</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button
              className="bg-primary hover:bg-primary/90"
              onClick={() => handleAddEdit(null)}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Add Driver
            </Button>
          </DialogTrigger>
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
            <div className="text-2xl font-bold">
              {
                drivers.filter((d) => d.driverDetails?.status === "active")
                  .length
              }
            </div>
            <p className="text-sm text-gray-500">Active Drivers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {
                drivers.filter((d) => d.driverDetails?.status === "inactive")
                  .length
              }
            </div>
            <p className="text-sm text-gray-500">Inactive Drivers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {drivers.length > 0
                ? (
                    drivers.reduce(
                      (acc, d) => acc + (d.driverDetails?.rating || 0),
                      0,
                    ) / drivers.length
                  ).toFixed(1)
                : "0.0"}
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
          <Tabs defaultValue="all" onValueChange={setSelectedTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="all">All Drivers</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="inactive">Inactive</TabsTrigger>
              <TabsTrigger value="suspended">Suspended</TabsTrigger>
            </TabsList>

            <div className="rounded-md border">
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="h-12 px-4 text-left font-medium text-gray-500">
                        Name
                      </th>
                      <th className="h-12 px-4 text-left font-medium text-gray-500">
                        Contact
                      </th>
                      <th className="h-12 px-4 text-left font-medium text-gray-500">
                        Vehicle
                      </th>
                      <th className="h-12 px-4 text-left font-medium text-gray-500">
                        Rating
                      </th>
                      <th className="h-12 px-4 text-left font-medium text-gray-500">
                        Rides
                      </th>
                      <th className="h-12 px-4 text-left font-medium text-gray-500">
                        Earnings
                      </th>
                      <th className="h-12 px-4 text-left font-medium text-gray-500">
                        Status
                      </th>
                      <th className="h-12 px-4 text-right font-medium text-gray-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="h-24 text-center text-gray-500"
                        >
                          <div className="flex justify-center items-center">
                            <Loader2 className="h-8 w-8 text-primary animate-spin mr-2" />
                            <p>Loading drivers...</p>
                          </div>
                        </td>
                      </tr>
                    ) : filteredDrivers.length > 0 ? (
                      filteredDrivers.map((driver) => {
                        const vehicleType = vehicleTypes.find(
                          (v) => v.id === driver.driverDetails?.vehicleTypeId,
                        );
                        const vehicleName =
                          vehicleType?.name || "Unknown Vehicle";

                        return (
                          <tr key={driver.id} className="border-b">
                            <td className="p-4 font-medium">{`${driver.firstName} ${driver.lastName}`}</td>
                            <td className="p-4">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-1">
                                  <Mail className="h-3 w-3 text-gray-500" />
                                  <span className="text-sm">
                                    {driver.email}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 mt-1">
                                  <Phone className="h-3 w-3 text-gray-500" />
                                  <span className="text-sm">
                                    {driver.phone}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-1">
                                <Car className="h-4 w-4 text-gray-500" />
                                <span>
                                  {vehicleName} (
                                  {driver.driverDetails?.vehicleNumber})
                                </span>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center">
                                <Star className="h-4 w-4 text-yellow-400 mr-1" />
                                <span>{driver.driverDetails?.rating}</span>
                              </div>
                            </td>
                            <td className="p-4">{0}</td>
                            <td className="p-4">
                              {0} {config.currency}
                            </td>
                            <td className="p-4">
                              <Badge
                                className={`
                                ${
                                  driver.driverDetails?.status === "active"
                                    ? "bg-green-100 text-green-800"
                                    : driver.driverDetails?.status ===
                                        "inactive"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-red-100 text-red-800"
                                }
                              `}
                              >
                                {driver.driverDetails?.status
                                  ?.charAt(0)
                                  .toUpperCase() +
                                  driver.driverDetails?.status?.slice(1)}
                              </Badge>
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleViewDriver(driver)}
                                  title="View Driver Details"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleAddEdit(driver)}
                                  title="Edit Driver"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openStatusDialog(driver)}
                                  title="Change Status"
                                >
                                  {driver.driverDetails?.status === "active" ? (
                                    <UserCheck className="h-4 w-4 text-green-600" />
                                  ) : driver.driverDetails?.status ===
                                    "inactive" ? (
                                    <UserX className="h-4 w-4 text-yellow-600" />
                                  ) : (
                                    <UserX className="h-4 w-4 text-red-600" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => confirmDelete(driver)}
                                  title="Delete Driver"
                                >
                                  <Trash className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan={8}
                          className="h-24 text-center text-gray-500"
                        >
                          No drivers found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Tabs>
        </CardContent>
      </Card>
      {/* Add/Edit Driver Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {currentDriver?.id ? "Edit" : "Add"} Driver
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                placeholder="First Name"
                value={currentDriver?.firstName || ""}
                onChange={(e) =>
                  setCurrentDriver((curr) =>
                    curr ? { ...curr, firstName: e.target.value } : null,
                  )
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                placeholder="Last Name"
                value={currentDriver?.lastName || ""}
                onChange={(e) =>
                  setCurrentDriver((curr) =>
                    curr ? { ...curr, lastName: e.target.value } : null,
                  )
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="+971 5X XXX XXXX"
                value={currentDriver?.phone || ""}
                onChange={(e) =>
                  setCurrentDriver((curr) =>
                    curr ? { ...curr, phone: e.target.value } : null,
                  )
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email (Optional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="driver@example.com"
                value={currentDriver?.email || ""}
                onChange={(e) =>
                  setCurrentDriver((curr) =>
                    curr ? { ...curr, email: e.target.value } : null,
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxi-type">Taxi Type</Label>
              <select
                id="taxi-type"
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={currentDriver?.driverDetails?.taxiTypeId || ""}
                onChange={(e) => handleTaxiTypeChange(e.target.value)}
                required
              >
                <option value="" disabled>
                  Select a taxi type
                </option>
                {taxiTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicle-type">Vehicle Type</Label>
              <select
                id="vehicle-type"
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={currentDriver?.driverDetails?.vehicleTypeId || ""}
                onChange={(e) =>
                  setCurrentDriver((curr) =>
                    curr
                      ? {
                          ...curr,
                          driverDetails: {
                            ...(curr.driverDetails as DriverDetails),
                            vehicleTypeId: e.target.value,
                          },
                        }
                      : null,
                  )
                }
                disabled={!currentDriver?.driverDetails?.taxiTypeId}
                required
              >
                <option value="" disabled>
                  {currentDriver?.driverDetails?.taxiTypeId
                    ? "Select a vehicle type"
                    : "Select a taxi type first"}
                </option>
                {filteredVehicleTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
              {currentDriver?.driverDetails?.taxiTypeId &&
                filteredVehicleTypes.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">
                    No vehicles available for this taxi type
                  </p>
                )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicle-number">Vehicle Number</Label>
              <Input
                id="vehicle-number"
                placeholder="ABC123"
                value={currentDriver?.driverDetails?.vehicleNumber || ""}
                onChange={(e) =>
                  setCurrentDriver((curr) =>
                    curr
                      ? {
                          ...curr,
                          driverDetails: {
                            ...(curr.driverDetails as DriverDetails),
                            vehicleNumber: e.target.value,
                          },
                        }
                      : null,
                  )
                }
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary text-white hover:bg-primary/90"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  (currentDriver?.id ? "Update" : "Add") + " Driver"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      {/* Status Update Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Driver Status</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="status">Status</Label>
            <Select
              value={newStatus}
              onValueChange={(value: "active" | "inactive" | "suspended") =>
                setNewStatus(value)
              }
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>

            <div className="mt-4">
              <p className="text-sm text-gray-500">
                {newStatus === "active"
                  ? "Driver will be active and available for bookings."
                  : newStatus === "inactive"
                    ? "Driver will be inactive and not available for bookings."
                    : "Driver will be suspended and not allowed to log in."}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsStatusDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateDriverStatus}
              className={`
                ${
                  newStatus === "active"
                    ? "bg-green-600 hover:bg-green-700"
                    : newStatus === "inactive"
                      ? "bg-yellow-600 hover:bg-yellow-700"
                      : "bg-red-600 hover:bg-red-700"
                } text-white
              `}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Status"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* View Driver Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Driver Details</DialogTitle>
          </DialogHeader>

          {driverToView && (
            <div className="py-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{`${driverToView.firstName} ${driverToView.lastName}`}</h3>
                <Badge
                  className={`
                  ${
                    driverToView.driverDetails?.status === "active"
                      ? "bg-green-100 text-green-800"
                      : driverToView.driverDetails?.status === "inactive"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                  }
                `}
                >
                  {driverToView.driverDetails?.status?.charAt(0).toUpperCase() +
                    driverToView.driverDetails?.status?.slice(1)}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Contact</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Phone className="h-3 w-3 text-gray-500" />
                    <p>{driverToView.phone}</p>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <Mail className="h-3 w-3 text-gray-500" />
                    <p>{driverToView.email}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Vehicle</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Car className="h-3 w-3 text-gray-500" />
                    <p>
                      {vehicleTypes.find(
                        (v) =>
                          v.id === driverToView.driverDetails?.vehicleTypeId,
                      )?.name || "Unknown"}
                      ({driverToView.driverDetails?.vehicleNumber})
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 bg-gray-50 p-3 rounded-md">
                <div className="text-center">
                  <p className="text-sm text-gray-500">Rating</p>
                  <div className="flex items-center justify-center mt-1">
                    <Star className="h-4 w-4 text-yellow-400 mr-1" />
                    <p className="font-medium">
                      {driverToView.driverDetails?.rating?.toFixed(1)}
                    </p>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-sm text-gray-500">Rides</p>
                  <p className="font-medium mt-1">{0}</p>
                </div>

                <div className="text-center">
                  <p className="text-sm text-gray-500">Earnings</p>
                  <p className="font-medium mt-1">
                    {0} {config.currency}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500">Joined</p>
                <p className="mt-1">
                  {new Date(driverToView.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Driver</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this driver? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              variant="destructive"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>{" "}
    </DashboardLayout>
  );
};

export default AdminDrivers;
