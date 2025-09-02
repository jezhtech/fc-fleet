import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { PlusCircle, Edit2, Trash2, DollarSign, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { FareRule } from "@/lib/firebaseModels";
import { fareRulesService } from "@/services/fareRulesService";

interface TaxiType {
  id: string;
  name: string;
  emoji: string;
  imageUrl?: string; // Added imageUrl to the interface
}

interface Zone {
  id: string;
  name: string;
}

interface FareRulesManagerProps {
  taxiTypes: TaxiType[];
  zones: Zone[];
}

const FareRulesManager = ({ taxiTypes, zones }: FareRulesManagerProps) => {
  const [fareRules, setFareRules] = useState<FareRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentFareRule, setCurrentFareRule] = useState<FareRule | null>(null);
  const [fareRuleToDelete, setFareRuleToDelete] = useState<FareRule | null>(
    null,
  );

  // Fetch fare rules from API
  useEffect(() => {
    const fetchFareRules = async () => {
      try {
        setIsLoading(true);
        const response = await fareRulesService.list();
        if (response.success && response.data) {
          setFareRules(response.data);
        } else {
          throw new Error(response.error || "Failed to fetch fare rules");
        }
      } catch (error) {
        console.error("Error fetching fare rules:", error);
        toast.error("Failed to load fare rules");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFareRules();
  }, []);

  const handleAddEdit = (fareRule: FareRule | null) => {
    if (fareRule) {
      setCurrentFareRule(fareRule);
    } else {
      setCurrentFareRule({
        id: null,
        name: "",
        description: "",
        basePrice: 0,
        perKmPrice: 0,
        perHourPrice: 0,
        minFare: 0,
        isDefault: false,
        surgeMultiplier: 1,
        applicableZoneIds: [],
        taxiTypeIds: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    setIsDialogOpen(true);
  };

  const confirmDelete = (fareRule: FareRule) => {
    setFareRuleToDelete(fareRule);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!fareRuleToDelete) return;

    setIsSubmitting(true);
    try {
      const response = await fareRulesService.remove(fareRuleToDelete.id);
      if (response.success) {
        setFareRules(
          fareRules.filter((rule) => rule.id !== fareRuleToDelete.id),
        );
        toast.success("Fare rule deleted successfully");
        setIsDeleteDialogOpen(false);
      } else {
        throw new Error(response.error || "Failed to delete fare rule");
      }
    } catch (error) {
      console.error("Error deleting fare rule:", error);
      toast.error("Failed to delete fare rule");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFareRule) return;

    setIsSubmitting(true);

    try {
      const { id, ...otherRuleData } = currentFareRule;

      const fareRuleData = {
        name: otherRuleData.name,
        description: otherRuleData.description,
        basePrice: otherRuleData.basePrice,
        perKmPrice: otherRuleData.perKmPrice,
        perHourPrice: otherRuleData.perHourPrice,
        minFare: otherRuleData.minFare,
        isDefault: otherRuleData.isDefault,
        surgeMultiplier: otherRuleData.surgeMultiplier,
        specialConditions: otherRuleData.specialConditions,
        applicableZoneIds: otherRuleData.applicableZoneIds,
        taxiTypeIds: otherRuleData.taxiTypeIds,
      };

      if (id) {
        // Update existing fare rule
        const response = await fareRulesService.update(id, {
          ...fareRuleData,
        });
        if (response.success && response.data) {
          // Update local state
          setFareRules(
            fareRules.map((rule) => (rule.id === id ? response.data! : rule)),
          );
          toast.success("Fare rule updated successfully");
        } else {
          throw new Error(response.error || "Failed to update fare rule");
        }
      } else {
        // Add new fare rule
        const response = await fareRulesService.create({
          ...fareRuleData,
        });

        if (response.success && response.data) {
          // Update local state
          setFareRules([...fareRules, response.data!]);
          toast.success("Fare rule added successfully");
        } else {
          throw new Error(response.error || "Failed to add fare rule");
        }
      }

      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error saving fare rule:", error);
      toast.error("Failed to save fare rule");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle taxi type selection
  const handleTaxiTypeChange = (taxiTypeId: string) => {
    if (!currentFareRule) return;

    const taxiTypeIds = [...(currentFareRule.taxiTypeIds || [])];
    const index = taxiTypeIds.indexOf(taxiTypeId);

    if (index > -1) {
      taxiTypeIds.splice(index, 1);
    } else {
      taxiTypeIds.push(taxiTypeId);
    }

    setCurrentFareRule({ ...currentFareRule, taxiTypeIds });
  };

  // Handle zone selection
  const handleZoneChange = (zoneId: string) => {
    if (!currentFareRule) return;

    const applicableZoneIds = [...(currentFareRule.applicableZoneIds || [])];
    const index = applicableZoneIds.indexOf(zoneId);

    if (index > -1) {
      applicableZoneIds.splice(index, 1);
    } else {
      applicableZoneIds.push(zoneId);
    }

    setCurrentFareRule({ ...currentFareRule, applicableZoneIds });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Fare Rules</h2>
        <Button
          onClick={() => handleAddEdit(null)}
          className="bg-fleet-red text-white hover:bg-fleet-red/90"
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Fare Rule
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <Loader2 className="h-8 w-8 text-fleet-red animate-spin mr-2" />
          <p>Loading fare rules...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fareRules.length === 0 ? (
            <p className="col-span-full text-center py-8 text-gray-500">
              No fare rules found. Click "Add New Fare Rule" to create one.
            </p>
          ) : (
            fareRules.map((rule) => (
              <Card key={rule.id} className="overflow-hidden h-full">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center">
                      <DollarSign className="h-5 w-5 mr-2 text-fleet-red" />
                      {rule.name}
                      {rule.isDefault && (
                        <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                          Default
                        </span>
                      )}
                    </CardTitle>
                    <div className="space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleAddEdit(rule)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => confirmDelete(rule)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  {rule.description && (
                    <p className="text-sm text-gray-600 mb-4">
                      {rule.description}
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div>Base Price:</div>
                    <div className="font-medium">
                      ${rule.basePrice.toFixed(2)}
                    </div>

                    <div>Per KM Price:</div>
                    <div className="font-medium">
                      ${rule.perKmPrice.toFixed(2)}
                    </div>

                    <div>Per Hour Price:</div>
                    <div className="font-medium">
                      ${rule.perHourPrice.toFixed(2)}
                    </div>

                    <div>Minimum Fare:</div>
                    <div className="font-medium">
                      ${rule.minFare.toFixed(2)}
                    </div>

                    <div>Surge Multiplier:</div>
                    <div className="font-medium">{rule.surgeMultiplier}x</div>
                  </div>

                  {rule.taxiTypeIds && rule.taxiTypeIds.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-1">
                        Applicable Taxi Types:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {rule.taxiTypeIds.map((id) => {
                          const taxiType = taxiTypes.find((t) => t.id === id);
                          return taxiType ? (
                            <span
                              key={id}
                              className="text-xs bg-gray-100 px-2 py-0.5 rounded-full flex items-center gap-1"
                            >
                              {taxiType.imageUrl ? (
                                <img
                                  src={taxiType.imageUrl}
                                  alt={taxiType.name}
                                  className="w-3 h-3 object-cover rounded"
                                />
                              ) : (
                                <span>🚗</span>
                              )}
                              {taxiType.name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}

                  {rule.applicableZoneIds &&
                    rule.applicableZoneIds.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium mb-1">
                          Applicable Zones:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {rule.applicableZoneIds.map((id) => {
                            const zone = zones.find((z) => z.id === id);
                            return zone ? (
                              <span
                                key={id}
                                className="text-xs bg-gray-100 px-2 py-0.5 rounded-full"
                              >
                                {zone.name}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Add/Edit Fare Rule Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {currentFareRule?.id ? "Edit" : "Add"} Fare Rule
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Rule Name</Label>
              <Input
                id="name"
                value={currentFareRule?.name || ""}
                onChange={(e) =>
                  setCurrentFareRule((curr) =>
                    curr ? { ...curr, name: e.target.value } : null,
                  )
                }
                placeholder="e.g. Standard Fare"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={currentFareRule?.description || ""}
                onChange={(e) =>
                  setCurrentFareRule((curr) =>
                    curr ? { ...curr, description: e.target.value } : null,
                  )
                }
                placeholder="Description (optional)"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="basePrice">Base Price ($)</Label>
                <Input
                  id="basePrice"
                  type="number"
                  step="0.01"
                  value={currentFareRule?.basePrice || 0}
                  onChange={(e) =>
                    setCurrentFareRule((curr) =>
                      curr
                        ? { ...curr, basePrice: parseFloat(e.target.value) }
                        : null,
                    )
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="perKmPrice">Per KM Price ($)</Label>
                <Input
                  id="perKmPrice"
                  type="number"
                  step="0.01"
                  value={currentFareRule?.perKmPrice || 0}
                  onChange={(e) =>
                    setCurrentFareRule((curr) =>
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
                <Label htmlFor="perHourPrice">Per Hour Price ($)</Label>
                <Input
                  id="perHourPrice"
                  type="number"
                  step="0.01"
                  value={currentFareRule?.perHourPrice || 0}
                  onChange={(e) =>
                    setCurrentFareRule((curr) =>
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
                <Label htmlFor="minFare">Minimum Fare ($)</Label>
                <Input
                  id="minFare"
                  type="number"
                  step="0.01"
                  value={currentFareRule?.minFare || 0}
                  onChange={(e) =>
                    setCurrentFareRule((curr) =>
                      curr
                        ? { ...curr, minFare: parseFloat(e.target.value) }
                        : null,
                    )
                  }
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="surgeMultiplier">Surge Multiplier</Label>
                <Input
                  id="surgeMultiplier"
                  type="number"
                  step="0.1"
                  min="1"
                  value={currentFareRule?.surgeMultiplier || 1}
                  onChange={(e) =>
                    setCurrentFareRule((curr) =>
                      curr
                        ? {
                            ...curr,
                            surgeMultiplier: parseFloat(e.target.value),
                          }
                        : null,
                    )
                  }
                  required
                />
              </div>
              <div className="space-y-2 flex items-center">
                <div className="flex items-center space-x-2 mt-5">
                  <Switch
                    id="isDefault"
                    checked={currentFareRule?.isDefault || false}
                    onCheckedChange={(checked) =>
                      setCurrentFareRule((curr) =>
                        curr ? { ...curr, isDefault: checked } : null,
                      )
                    }
                  />
                  <Label htmlFor="isDefault">Default Rule</Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Applicable Taxi Types</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {taxiTypes.map((type) => (
                  <div key={type.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`taxiType-${type.id}`}
                      checked={(currentFareRule?.taxiTypeIds || []).includes(
                        type.id,
                      )}
                      onChange={() => handleTaxiTypeChange(type.id)}
                      className="rounded"
                    />
                    <label htmlFor={`taxiType-${type.id}`} className="text-sm">
                      {type.emoji} {type.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Applicable Zones</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {zones.map((zone) => (
                  <div key={zone.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`zone-${zone.id}`}
                      checked={(
                        currentFareRule?.applicableZoneIds || []
                      ).includes(zone.id)}
                      onChange={() => handleZoneChange(zone.id)}
                      className="rounded"
                    />
                    <label htmlFor={`zone-${zone.id}`} className="text-sm">
                      {zone.name}
                    </label>
                  </div>
                ))}
              </div>
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
                className="bg-fleet-red text-white hover:bg-fleet-red/90"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  (currentFareRule?.id ? "Update" : "Add") + " Fare Rule"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Fare Rule</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{fareRuleToDelete?.name}"? This
              action cannot be undone.
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
    </div>
  );
};

export default FareRulesManager;
