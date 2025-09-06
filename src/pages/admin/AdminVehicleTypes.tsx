import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusCircle, Edit2, Trash2, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { vehicleService } from "@/services/vehicleService";
import { transportService } from "@/services/transportService";
import { formatCurrency } from "@/utils/currency";
import type {
  Vehicle,
  CreateVehicleRequest,
  UpdateVehicleRequest,
  Transport,
} from "@/types";
import config from "@/config";

const AdminVehicleTypes = () => {
  const [vehicleTypes, setVehicleTypes] = useState<Vehicle[]>([]);
  const [taxiTypes, setTaxiTypes] = useState<Transport[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentVehicle, setCurrentVehicle] = useState<Vehicle | null>(null);

  // Fetch taxi types and vehicle types using the services
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch taxi types using transport service
        const taxiResponse = await transportService.getAllTransports();
        if (taxiResponse.success) {
          setTaxiTypes(taxiResponse.data || []);
        } else {
          throw new Error(taxiResponse.error || "Failed to fetch taxi types");
        }

        // Fetch vehicle types using vehicle service
        const vehicleResponse = await vehicleService.getAllVehicles();
        if (vehicleResponse.success) {
          const fetchedVehicleTypes = vehicleResponse.data || [];
          setVehicleTypes(fetchedVehicleTypes);
        } else {
          throw new Error(
            vehicleResponse.error || "Failed to fetch vehicle types",
          );
        }
      } catch (error: any) {
        console.error("Error fetching data:", error);
        toast.error(error.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddEdit = (vehicle: Vehicle | null) => {
    setCurrentVehicle(
      vehicle || {
        id: "",
        transportId: "",
        name: "",
        description: "",
        basePrice: 0,
        perKmPrice: 0,
        perHourPrice: 0,
        capacity: 4,
        imageUrl: "",
        createdAt: "",
        updatedAt: "",
      },
    );

    setIsDialogOpen(true);
  };

  const confirmDelete = (vehicle: Vehicle) => {
    setVehicleToDelete(vehicle);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!vehicleToDelete) return;

    setIsSubmitting(true);
    try {
      // Delete using vehicle service
      const response = await vehicleService.deleteVehicle(vehicleToDelete.id);

      if (response.success) {
        // Update local state
        setVehicleTypes(
          vehicleTypes.filter((v) => v.id !== vehicleToDelete.id),
        );
        toast.success("Vehicle type deleted successfully");
        setIsDeleteDialogOpen(false);
      } else {
        throw new Error(response.error || "Failed to delete vehicle type");
      }
    } catch (error: any) {
      console.error("Error deleting vehicle type:", error);
      toast.error(error.message || "Failed to delete vehicle type");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setCurrentVehicle((curr) =>
          curr ? { ...curr, imageUrl: reader.result as string } : null,
        );
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentVehicle) return;

    if (!currentVehicle.transportId) {
      toast.error("Please select a taxi type");
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare vehicle data for backend API
      const vehicleData: CreateVehicleRequest | UpdateVehicleRequest = {
        name: currentVehicle.name,
        description: currentVehicle.description,
        basePrice: currentVehicle.basePrice,
        perKmPrice: currentVehicle.perKmPrice,
        perHourPrice: currentVehicle.perHourPrice, // Map back to perHourPrice
        capacity: currentVehicle.capacity,
        imageUrl: currentVehicle.imageUrl,
        transportId: currentVehicle.transportId,
      };

      let savedVehicle: Vehicle;

      if (currentVehicle.id) {
        // Update existing vehicle type using vehicle service
        const response = await vehicleService.updateVehicle(
          currentVehicle.id,
          vehicleData,
        );

        if (response.success) {
          // Update local state
          savedVehicle = {
            ...response?.data,
            transportId: currentVehicle.transportId,
            perHourPrice: response?.data.perHourPrice, // Map perHourPrice to perHourPrice for display
          };

          setVehicleTypes(
            vehicleTypes.map((vehicle) =>
              vehicle.id === currentVehicle.id ? savedVehicle : vehicle,
            ),
          );

          toast.success("Vehicle type updated successfully");
        } else {
          throw new Error(response.error || "Failed to update vehicle type");
        }
      } else {
        // Add new vehicle type using vehicle service
        const response = await vehicleService.createVehicle(
          vehicleData as CreateVehicleRequest,
        );

        if (response.success) {
          // Update local state with the new ID from backend
          savedVehicle = {
            ...response?.data,
          };

          setVehicleTypes([...vehicleTypes, savedVehicle]);

          toast.success("Vehicle type added successfully");
        } else {
          throw new Error(response.error || "Failed to create vehicle type");
        }
      }

      setIsDialogOpen(false);
    } catch (error: any) {
      console.error("Error saving vehicle type:", error);
      toast.error(error.message || "Failed to save vehicle type");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout userType="admin">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Vehicle Types</h1>
          <p className="text-gray-500">
            Manage vehicle types and their details
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => handleAddEdit(null)}
              className="bg-primary text-white hover:bg-primary/90"
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Vehicle Type
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>
                {currentVehicle?.id ? "Edit" : "Add"} Vehicle Type
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="taxiType">Taxi Type</Label>
                <Select
                  value={currentVehicle?.transportId || ""}
                  onValueChange={(value) =>
                    setCurrentVehicle((curr) =>
                      curr ? { ...curr, transportId: value } : null,
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select taxi type" />
                  </SelectTrigger>
                  <SelectContent>
                    {taxiTypes.map((type) => (
                      <SelectItem
                        key={type.id}
                        value={type.id}
                        className="px-2"
                      >
                        <div className="flex items-center">
                          <span className="h-full w-fit mr-2 object-contain">
                            {type.emoji}
                          </span>
                          {type.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Vehicle Name</Label>
                <Input
                  id="name"
                  value={currentVehicle?.name || ""}
                  onChange={(e) =>
                    setCurrentVehicle((curr) =>
                      curr ? { ...curr, name: e.target.value } : null,
                    )
                  }
                  placeholder="e.g. Toyota Camry 2023"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={currentVehicle?.description || ""}
                  onChange={(e) =>
                    setCurrentVehicle((curr) =>
                      curr ? { ...curr, description: e.target.value } : null,
                    )
                  }
                  placeholder="Vehicle description (optional)"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="basePrice">
                    Base Price ({config.currency})
                  </Label>
                  <Input
                    id="basePrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={currentVehicle?.basePrice || 0}
                    onChange={(e) =>
                      setCurrentVehicle((curr) =>
                        curr
                          ? { ...curr, basePrice: parseFloat(e.target.value) }
                          : null,
                      )
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="perKmPrice">
                    Per KM Price ({config.currency})
                  </Label>
                  <Input
                    id="perKmPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={currentVehicle?.perKmPrice || 0}
                    onChange={(e) =>
                      setCurrentVehicle((curr) =>
                        curr
                          ? { ...curr, perKmPrice: parseFloat(e.target.value) }
                          : null,
                      )
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="perHourPrice">
                    Per Hour Price ({config.currency})
                  </Label>
                  <Input
                    id="perHourPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={currentVehicle?.perHourPrice || 0}
                    onChange={(e) =>
                      setCurrentVehicle((curr) =>
                        curr
                          ? {
                              ...curr,
                              perHourPrice: parseFloat(e.target.value),
                            }
                          : null,
                      )
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={currentVehicle?.capacity || 4}
                    onChange={(e) =>
                      setCurrentVehicle((curr) =>
                        curr
                          ? { ...curr, capacity: parseInt(e.target.value) }
                          : null,
                      )
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageUrl">Vehicle Image</Label>
                {currentVehicle?.imageUrl ? (
                  <div className="relative">
                    <img
                      src={currentVehicle.imageUrl}
                      alt="Vehicle"
                      className="w-full h-32 object-contain border rounded-md"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6"
                      onClick={() =>
                        setCurrentVehicle((curr) =>
                          curr ? { ...curr, imageUrl: "" } : null,
                        )
                      }
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Input
                    id="imageUrl"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                )}
              </div>

              <DialogFooter className="pt-4">
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
                    (currentVehicle?.id ? "Update" : "Add") + " Vehicle Type"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Vehicle Type</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{vehicleToDelete?.name}"? This
              action cannot be undone and will also delete all associated
              images.
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
      </Dialog>

      {loading ? (
        <div className="flex justify-center items-center min-h-[300px]">
          <Loader2 className="h-8 w-8 text-primary animate-spin mr-2" />
          <p>Loading vehicle types...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicleTypes.length === 0 ? (
            <p className="col-span-full text-center py-8 text-gray-500">
              No vehicle types found. Click "Add New Vehicle Type" to create
              one.
            </p>
          ) : (
            vehicleTypes.map((vehicle) => (
              <Card key={vehicle.id} className="overflow-hidden">
                <div className="aspect-video w-full bg-gray-100 relative">
                  <img
                    src={vehicle.imageUrl}
                    alt={vehicle.name}
                    className="w-full h-full object-contain transition-opacity duration-300"
                  />
                  <div className="absolute top-2 left-2 bg-white/80 backdrop-blur-sm rounded px-2 py-1 text-xs font-medium flex items-center">
                    <span className="mr-1">
                      {taxiTypes.find((t) => t.id === vehicle.transportId)
                        ?.name || "Unknown"}
                    </span>
                  </div>
                </div>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle>{vehicle.name}</CardTitle>
                    <div className="space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleAddEdit(vehicle)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => confirmDelete(vehicle)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  {vehicle.description && (
                    <p className="text-sm text-gray-600 mb-4">
                      {vehicle.description}
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div>Base Price:</div>
                    <div className="font-medium">
                      {formatCurrency(vehicle.basePrice)}
                    </div>

                    <div>Per KM Price:</div>
                    <div className="font-medium">
                      {formatCurrency(vehicle.perKmPrice)}
                    </div>

                    <div>Per Hour Price:</div>
                    <div className="font-medium">
                      {formatCurrency(vehicle.perHourPrice)}
                    </div>

                    <div>Capacity:</div>
                    <div className="font-medium">
                      {vehicle.capacity} persons
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminVehicleTypes;
