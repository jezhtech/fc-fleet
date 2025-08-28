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
import { PlusCircle, Edit2, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { transportService } from "@/services/transportService";
import type {
  Transport,
  CreateTransportRequest,
  UpdateTransportRequest,
} from "@/types";
import EmojiPicker from "@/components/EmojiPicker";

const AdminTaxiTypes = () => {
  const [taxiTypes, setTaxiTypes] = useState<Transport[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [taxiTypeToDelete, setTaxiTypeToDelete] = useState<Transport | null>(
    null,
  );

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentTaxiType, setCurrentTaxiType] = useState<Transport | null>(
    null,
  );

  // Fetch taxi types using the transport service
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const response = await transportService.getAllTransports();
        if (response.success) {
          setTaxiTypes(response.data || []);
        } else {
          throw new Error(response.error || "Failed to fetch taxi types");
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

  const handleAddEdit = (taxiType: Transport | null) => {
    setCurrentTaxiType(
      taxiType || {
        id: "",
        name: "",
        description: "",
        emoji: "",
        createdAt: "",
        updatedAt: "",
      },
    );

    setIsDialogOpen(true);
  };

  const confirmDelete = (taxiType: Transport) => {
    setTaxiTypeToDelete(taxiType);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!taxiTypeToDelete) return;

    setIsSubmitting(true);
    try {
      // Delete using transport service
      const response = await transportService.deleteTransport(
        taxiTypeToDelete.id,
      );

      if (response.success) {
        // Update local state
        setTaxiTypes(taxiTypes.filter((t) => t.id !== taxiTypeToDelete.id));
        toast.success("Taxi type deleted successfully");
        setIsDeleteDialogOpen(false);
      } else {
        throw new Error(response.error || "Failed to delete taxi type");
      }
    } catch (error: any) {
      console.error("Error deleting taxi type:", error);
      toast.error(error.message || "Failed to delete taxi type");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTaxiType) return;

    if (!currentTaxiType.name || !currentTaxiType.emoji) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      let savedTaxiType: Transport;

      if (currentTaxiType.id) {
        // Update existing taxi type using transport service
        const updateData: UpdateTransportRequest = {
          name: currentTaxiType.name,
          description: currentTaxiType.description,
          emoji: currentTaxiType.emoji,
        };

        const response = await transportService.updateTransport(
          currentTaxiType.id,
          updateData,
        );

        if (response.success) {
          // Update local state
          savedTaxiType = response.data!;
          setTaxiTypes(
            taxiTypes.map((taxi) =>
              taxi.id === currentTaxiType.id ? savedTaxiType : taxi,
            ),
          );

          toast.success("Taxi type updated successfully");
        } else {
          throw new Error(response.error || "Failed to update taxi type");
        }
      } else {
        // Add new taxi type using transport service
        const createData: CreateTransportRequest = {
          name: currentTaxiType.name,
          description: currentTaxiType.description,
          emoji: currentTaxiType.emoji,
        };

        const response = await transportService.createTransport(createData);

        if (response.success) {
          // Update local state with the new ID from backend
          savedTaxiType = response.data!;
          setTaxiTypes([...taxiTypes, savedTaxiType]);

          toast.success("Taxi type added successfully");
        } else {
          throw new Error(response.error || "Failed to create taxi type");
        }
      }

      setIsDialogOpen(false);
    } catch (error: any) {
      console.error("Error saving taxi type:", error);
      toast.error(error.message || "Failed to save taxi type");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout userType="admin">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Taxi Types</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => handleAddEdit(null)}
              className="bg-fleet-red text-white hover:bg-fleet-red/90"
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Taxi Type
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {currentTaxiType?.id ? "Edit" : "Add"} Taxi Type
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label
                    htmlFor="name"
                    className="text-sm font-medium mb-1 block"
                  >
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={currentTaxiType?.name || ""}
                    onChange={(e) =>
                      setCurrentTaxiType((curr) =>
                        curr ? { ...curr, name: e.target.value } : null,
                      )
                    }
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="emoji"
                    className="text-sm font-medium mb-1 block"
                  >
                    Emoji
                  </label>
                  <EmojiPicker
                    selectedEmoji={currentTaxiType?.emoji || "🚗"}
                    onEmojiSelect={(emoji) =>
                      setCurrentTaxiType((curr) =>
                        curr ? { ...curr, emoji } : null,
                      )
                    }
                  />
                </div>
              </div>

              <div>
                <Label
                  htmlFor="description"
                  className="text-sm font-medium mb-1 block"
                >
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={currentTaxiType?.description || ""}
                  onChange={(e) =>
                    setCurrentTaxiType((curr) =>
                      curr ? { ...curr, description: e.target.value } : null,
                    )
                  }
                  rows={3}
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
                  className="bg-fleet-red text-white hover:bg-fleet-red/90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    (currentTaxiType?.id ? "Update" : "Add") + " Taxi Type"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Taxi Type</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the "{taxiTypeToDelete?.name}"
              taxi type? This action cannot be undone.
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
          <Loader2 className="h-8 w-8 text-fleet-red animate-spin mr-2" />
          <p>Loading taxi types...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {taxiTypes.length === 0 ? (
            <p className="col-span-full text-center py-8 text-gray-500">
              No taxi types found. Click "Add New Taxi Type" to create one.
            </p>
          ) : (
            taxiTypes.map((taxiType) => (
              <Card key={taxiType.id} className="overflow-hidden">
                <CardHeader className="bg-gray-50 pb-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {taxiType.imageUrl ? (
                        <img
                          src={taxiType.imageUrl}
                          alt={taxiType.name}
                          className="w-8 h-8 object-cover rounded"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-gray-500 text-sm">
                          🚗
                        </div>
                      )}
                      <CardTitle>{taxiType.name}</CardTitle>
                    </div>
                    <div className="space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleAddEdit(taxiType)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => confirmDelete(taxiType)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600">
                    {taxiType.description}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminTaxiTypes;
