import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  PlusCircle,
  Edit2,
  Trash2,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Zone, FareRule } from "@/lib/firebaseModels";
import { zonesService } from "@/services/zonesService";
import * as turf from "@turf/turf";
import ZoneMapEditor from "./SimpleZoneRenderer";

interface ZonesManagerProps {
  fareRules: FareRule[];
}

const ZonesManager = ({ fareRules }: ZonesManagerProps) => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentZone, setCurrentZone] = useState<Zone | null>(null);
  const [zoneToDelete, setZoneToDelete] = useState<Zone | null>(null);

  const fetchZones = async () => {
    try {
      setIsLoading(true);
      const response = await zonesService.list();
      if (response.success && response.data) {
        const validZones: Zone[] = response.data.map((zone) => {
          if (zone.coordinates && zone.coordinates.coordinates) {
            return zone;
          }
          return {
            ...zone,
            coordinates: { type: "Polygon", coordinates: [] },
          };
        });
        setZones(validZones);
      } else {
        throw new Error(response.error || "Failed to fetch zones");
      }
    } catch (error) {
      console.error("Error fetching zones:", error);
      toast.error(
        `Failed to load zones: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  const handleAddEdit = (zone: Zone | null) => {
    if (zone) {
      setCurrentZone(zone);
    } else {
      setCurrentZone({
        id: null,
        name: "",
        description: "",
        coordinates: { type: "Polygon", coordinates: [] },
        color: "#" + Math.floor(Math.random() * 16777215).toString(16),
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    setIsDialogOpen(true);
  };

  const confirmDelete = (zone: Zone) => {
    setZoneToDelete(zone);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!zoneToDelete) return;
    setIsSubmitting(true);
    try {
      const response = await zonesService.remove(zoneToDelete.id);
      if (response.success) {
        setZones(zones.filter((z) => z.id !== zoneToDelete.id));
        toast.success("Zone deleted successfully");
        setIsDeleteDialogOpen(false);
        setZoneToDelete(null);
      } else {
        throw new Error(response.error || "Failed to delete zone");
      }
    } catch (error) {
      console.error("Error deleting zone:", error);
      toast.error("Failed to delete zone");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePolygonComplete = (feature: GeoJSON.Feature<GeoJSON.Polygon>) => {
    if (!currentZone) return;

    const area = turf.area(feature);
    const areaKm2 = parseFloat((area / 1000000).toFixed(4));
    setCurrentZone((prev) => ({
      ...prev,
      coordinates: feature.geometry,
      areaKm2: areaKm2,
    }));

    toast.success(`Zone drawn successfully (${areaKm2.toFixed(2)} km²)`);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentZone) return;

    setIsSubmitting(true);
    try {
      if (!currentZone.name.trim()) {
        toast.error("Zone name is required");
        setIsSubmitting(false);
        return;
      }
      if (
        !currentZone.coordinates ||
        currentZone.coordinates.coordinates.length === 0
      ) {
        toast.error(
          "Zone must have a valid shape. Please draw one on the map.",
        );
        setIsSubmitting(false);
        return;
      }

      const zoneToSave: Partial<Zone> = {
        id: currentZone.id || "new",
        name: currentZone.name,
        description: currentZone.description,
        coordinates: currentZone.coordinates,
        color: "#" + Math.floor(Math.random() * 16777215).toString(16),
        isActive: true,
        areaKm2: currentZone.areaKm2,
      };

      if (zoneToSave.id && zoneToSave.id !== "new") {
        const { id, ...dataToUpdate } = zoneToSave;
        const response = await zonesService.update(id!, dataToUpdate);
        if (response.success && response.data) {
          toast.success("Zone updated successfully");
          setZones(
            zones.map((z) =>
              z.id === id
                ? ({ ...zoneToSave, id: response.data.id } as Zone)
                : z,
            ),
          );
        } else {
          throw new Error(response.error || "Failed to update zone");
        }
      } else {
        delete zoneToSave.id;
        const response = await zonesService.create(zoneToSave);
        if (response.success && response.data) {
          toast.success("Zone created successfully");
          setZones([...zones, { ...zoneToSave, id: response.data.id } as Zone]);
        } else {
          throw new Error(response.error || "Failed to create zone");
        }
      }
      setIsDialogOpen(false);
      setCurrentZone({
        id: null,
        name: "",
        description: "",
        color: "",
        isActive: true,
        coordinates: {
          type: "Polygon",
          coordinates: [],
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error saving zone:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save zone",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Zones & Geofencing</h2>
        <Button
          className="bg-fleet-red text-white hover:bg-fleet-red/90"
          onClick={() => handleAddEdit(null)}
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Zone
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <Loader2 className="h-8 w-8 text-fleet-red animate-spin mr-2" />
          <p>Loading zones...</p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="px-4 py-2 text-left font-medium">Name</th>
                    <th className="px-4 py-2 text-left font-medium">
                      Area (km²)
                    </th>
                    <th className="px-4 py-2 text-left font-medium">Status</th>
                    <th className="px-4 py-2 text-right font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {zones.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-8 text-center text-gray-500"
                      >
                        No zones found.
                      </td>
                    </tr>
                  ) : (
                    zones.map((zone) => (
                      <tr key={zone.id} className="border-b">
                        <td className="p-4 font-medium">{zone.name}</td>
                        <td className="p-4">
                          {zone.areaKm2?.toFixed(2) || "-"}
                        </td>
                        <td className="p-4">
                          <div
                            className={`flex items-center gap-1 ${zone.isActive ? "text-green-600" : "text-red-500"}`}
                          >
                            {zone.isActive ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <XCircle className="h-4 w-4" />
                            )}
                            {zone.isActive ? "Active" : "Inactive"}
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAddEdit(zone)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => confirmDelete(zone)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{currentZone?.id ? "Edit" : "Add"} Zone</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleFormSubmit}
            className="grid md:grid-cols-2 gap-6"
          >
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Zone Name</Label>
                <Input
                  id="name"
                  value={currentZone?.name || ""}
                  placeholder="Enter name"
                  onChange={(e) =>
                    setCurrentZone((curr) =>
                      curr ? { ...curr, name: e.target.value } : null,
                    )
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={currentZone?.description || ""}
                  placeholder="Enter description"
                  onChange={(e) =>
                    setCurrentZone((curr) =>
                      curr ? { ...curr, description: e.target.value } : null,
                    )
                  }
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={currentZone?.isActive || false}
                  onCheckedChange={(checked) =>
                    setCurrentZone((curr) =>
                      curr ? { ...curr, isActive: checked } : null,
                    )
                  }
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            </div>
            <div className="h-[400px] rounded-lg overflow-hidden">
              <ZoneMapEditor
                zoneData={currentZone}
                isDrawing={true}
                onPolygonComplete={handlePolygonComplete}
              />
            </div>
            <DialogFooter className="md:col-span-2">
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
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  "Save Zone"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Zone</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{zoneToDelete?.name}"?
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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ZonesManager;
