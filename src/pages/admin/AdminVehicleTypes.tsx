import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlusCircle, Edit2, Trash2, Loader2, Upload, X, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { vehicleService } from '@/services/vehicleService';
import { transportService } from '@/services/transportService';
import { formatCurrency } from '@/utils/currency';
import type { Vehicle, VehicleWithTransport, CreateVehicleRequest, UpdateVehicleRequest, Transport } from '@/types';

// Local interface for display purposes
interface VehicleTypeDisplay extends Vehicle {
  taxiTypeId: string; // Add taxiTypeId for display purposes
  taxiTypeName?: string; // For display purposes
  images: string[]; // Convert imageUrl to images array for display
  perMinutePrice: number; // Add perMinutePrice for display purposes
}

const AdminVehicleTypes = () => {
  const { currentUser } = useAuth();
  const [vehicleTypes, setVehicleTypes] = useState<VehicleTypeDisplay[]>([]);
  const [taxiTypes, setTaxiTypes] = useState<Transport[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<VehicleTypeDisplay | null>(null);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentVehicle, setCurrentVehicle] = useState<VehicleTypeDisplay | null>(null);
  
  // For image upload
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Add state for image carousel
  const [activeImageIndex, setActiveImageIndex] = useState<{[key: string]: number}>({});
  
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
          throw new Error(taxiResponse.error || 'Failed to fetch taxi types');
        }
        
        // Fetch vehicle types using vehicle service
        const vehicleResponse = await vehicleService.getAllVehicles();
        if (vehicleResponse.success) {
          const fetchedVehicleTypes = vehicleResponse.data || [];
          
          // Convert VehicleWithTransport to VehicleTypeDisplay
          const vehiclesWithTaxiNames: VehicleTypeDisplay[] = fetchedVehicleTypes.map((vehicle: VehicleWithTransport) => {
            const taxiType = taxiTypes.find((taxi: Transport) => taxi.id === vehicle.transportId);
            return {
              ...vehicle,
              taxiTypeId: vehicle.transportId || '',
              taxiTypeName: taxiType?.name || 'Unknown',
              images: vehicle.imageUrl ? [vehicle.imageUrl] : [], // Convert single imageUrl to images array
              perMinutePrice: vehicle.perMinPrice, // Map perMinPrice to perMinutePrice for display
            };
          });
          
          setVehicleTypes(vehiclesWithTaxiNames);
        } else {
          throw new Error(vehicleResponse.error || 'Failed to fetch vehicle types');
        }
      } catch (error: any) {
        console.error('Error fetching data:', error);
        toast.error(error.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  
  const handleAddEdit = (vehicle: VehicleTypeDisplay | null) => {
    if (vehicle) {
      // When editing, set the current images as preview URLs
      setImagePreviewUrls(vehicle.images);
      setImageFiles([]);
    } else {
      // When adding, reset the images
      setImagePreviewUrls([]);
      setImageFiles([]);
    }
    
    setCurrentVehicle(vehicle || {
      id: '',
      taxiTypeId: '',
      name: '',
      description: '',
      basePrice: 0,
      perKmPrice: 0,
      perMinutePrice: 0,
      capacity: 4,
      images: [],
      imageUrl: '',
      perMinPrice: 0,
      createdAt: '',
      updatedAt: ''
    });
    
    setIsDialogOpen(true);
  };
  
  const confirmDelete = (vehicle: VehicleTypeDisplay) => {
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
        setVehicleTypes(vehicleTypes.filter(v => v.id !== vehicleToDelete.id));
        toast.success('Vehicle type deleted successfully');
        setIsDeleteDialogOpen(false);
      } else {
        throw new Error(response.error || 'Failed to delete vehicle type');
      }
    } catch (error: any) {
      console.error('Error deleting vehicle type:', error);
      toast.error(error.message || 'Failed to delete vehicle type');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const totalImages = imageFiles.length + imagePreviewUrls.length;
    
    // Check if adding these files would exceed the limit
    if (totalImages + files.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }
    
    const newFiles = Array.from(files);
    setImageFiles(prev => [...prev, ...newFiles]);
    
    // Create preview URLs for the new files
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviewUrls(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };
  
  const removeImage = (index: number) => {
    // If this is a file that's been added
    if (index < imageFiles.length) {
      setImageFiles(prev => prev.filter((_, i) => i !== index));
      setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
    } 
    // If this is an existing image URL
    else {
      const urlIndex = index - imageFiles.length;
      const newCurrentVehicle = {...currentVehicle};
      if (newCurrentVehicle && newCurrentVehicle.images) {
        newCurrentVehicle.images = newCurrentVehicle.images.filter((_, i) => i !== urlIndex);
        setCurrentVehicle(newCurrentVehicle);
      }
      setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
    }
  };
  
  // For now, we'll use base64 images. In production, you'd want to implement proper image upload
  const processImages = async (): Promise<string[]> => {
    if (imageFiles.length === 0) {
      // If no new images were added, return the existing ones
      return currentVehicle?.images || [];
    }
    
    // Convert files to base64 for demo purposes
    // In production, you'd upload to a CDN or storage service
    const imagePromises = imageFiles.map((file) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.readAsDataURL(file);
      });
    });
    
    const newImageUrls = await Promise.all(imagePromises);
    
    // Combine with existing images that weren't removed
    const existingImages = currentVehicle?.images || [];
    return [...existingImages, ...newImageUrls];
  };
  
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentVehicle) return;
    
    if (!currentVehicle.taxiTypeId) {
      toast.error('Please select a taxi type');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Process images first
      const imageUrls = await processImages();
      
      // Prepare vehicle data for backend API
      const vehicleData: CreateVehicleRequest | UpdateVehicleRequest = {
        name: currentVehicle.name,
        description: currentVehicle.description,
        basePrice: currentVehicle.basePrice,
        perKmPrice: currentVehicle.perKmPrice,
        perMinPrice: currentVehicle.perMinutePrice, // Map back to perMinPrice
        capacity: currentVehicle.capacity,
        imageUrl: imageUrls[0] || '', // Use first image as imageUrl for backend
        transportId: currentVehicle.taxiTypeId,
      };
      
      let savedVehicle: VehicleTypeDisplay;
      
      if (currentVehicle.id) {
        // Update existing vehicle type using vehicle service
        const response = await vehicleService.updateVehicle(currentVehicle.id, vehicleData);
        
        if (response.success) {
          // Get the taxi type name
          const taxiType = taxiTypes.find(taxi => taxi.id === currentVehicle.taxiTypeId);
          
          // Update local state
          savedVehicle = {
            ...response.data!,
            taxiTypeId: currentVehicle.taxiTypeId,
            taxiTypeName: taxiType?.name || 'Unknown',
            images: imageUrls,
            perMinutePrice: response.data!.perMinPrice, // Map perMinPrice to perMinutePrice for display
          };
          
          setVehicleTypes(vehicleTypes.map(vehicle => 
            vehicle.id === currentVehicle.id ? savedVehicle : vehicle
          ));
          
          toast.success('Vehicle type updated successfully');
        } else {
          throw new Error(response.error || 'Failed to update vehicle type');
        }
      } else {
        // Add new vehicle type using vehicle service
        const response = await vehicleService.createVehicle(vehicleData as CreateVehicleRequest);
        
        if (response.success) {
          // Get the taxi type name
          const taxiType = taxiTypes.find(taxi => taxi.id === currentVehicle.taxiTypeId);
          
          // Update local state with the new ID from backend
          savedVehicle = {
            ...response.data!,
            taxiTypeId: currentVehicle.taxiTypeId,
            taxiTypeName: taxiType?.name || 'Unknown',
            images: imageUrls,
            perMinutePrice: response.data!.perMinPrice, // Map perMinPrice to perMinutePrice for display
          };
          
          setVehicleTypes([...vehicleTypes, savedVehicle]);
          
          toast.success('Vehicle type added successfully');
        } else {
          throw new Error(response.error || 'Failed to create vehicle type');
        }
      }
      
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('Error saving vehicle type:', error);
      toast.error(error.message || 'Failed to save vehicle type');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const renderImagePreviews = () => {
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {imagePreviewUrls.map((url, index) => (
          <div key={index} className="relative w-16 h-16 border rounded">
            <img 
              src={url} 
              alt={`Preview ${index}`} 
              className="w-full h-full object-cover rounded"
            />
            <button 
              type="button"
              className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-0.5 transform translate-x-1/2 -translate-y-1/2"
              onClick={() => removeImage(index)}
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
    );
  };
  
  // Function to handle next image
  const handleNextImage = (vehicleId: string, imagesLength: number) => {
    setActiveImageIndex(prev => ({
      ...prev,
      [vehicleId]: (prev[vehicleId] + 1) % imagesLength
    }));
  };
  
  // Function to handle previous image
  const handlePrevImage = (vehicleId: string, imagesLength: number) => {
    setActiveImageIndex(prev => ({
      ...prev,
      [vehicleId]: (prev[vehicleId] - 1 + imagesLength) % imagesLength
    }));
  };
  
  // Initialize active image indices when vehicle types are loaded
  useEffect(() => {
    const initialIndices: {[key: string]: number} = {};
    vehicleTypes.forEach(vehicle => {
      initialIndices[vehicle.id] = 0;
    });
    setActiveImageIndex(initialIndices);
  }, [vehicleTypes]);
  
  return (
    <DashboardLayout userType="admin">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Vehicle Types</h1>
          <p className="text-gray-500">Manage vehicle types and their details</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleAddEdit(null)} className="bg-fleet-red text-white hover:bg-fleet-red/90">
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Vehicle Type
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>{currentVehicle?.id ? 'Edit' : 'Add'} Vehicle Type</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="taxiType">Taxi Type</Label>
                <Select
                  value={currentVehicle?.taxiTypeId || ''}
                  onValueChange={(value) => 
                    setCurrentVehicle(curr => curr ? {...curr, taxiTypeId: value} : null)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select taxi type" />
                  </SelectTrigger>
                  <SelectContent>
                    {taxiTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id} className='px-2'>
                        <div className="flex items-center">
                          <img src={type.imageUrl} alt={type.name} className='h-8 w-12 mr-2 object-contain'/>
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
                  value={currentVehicle?.name || ''}
                  onChange={(e) => setCurrentVehicle(curr => curr ? {...curr, name: e.target.value} : null)}
                  placeholder="e.g. Toyota Camry 2023"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={currentVehicle?.description || ''}
                  onChange={(e) => setCurrentVehicle(curr => curr ? {...curr, description: e.target.value} : null)}
                  placeholder="Vehicle description (optional)"
                  rows={2}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Vehicle Images (Max 5)</Label>
                <div className="flex items-center gap-2">
                  <Label 
                    htmlFor="images" 
                    className="flex items-center justify-center h-16 w-16 border-2 border-dashed rounded cursor-pointer hover:bg-gray-50"
                  >
                    <Upload size={20} className="text-gray-400" />
                    <span className="sr-only">Upload images</span>
                  </Label>
                  <Input 
                    id="images" 
                    type="file" 
                    accept="image/*" 
                    multiple 
                    className="hidden" 
                    onChange={handleImageUpload}
                    disabled={imagePreviewUrls.length >= 5}
                  />
                  {renderImagePreviews()}
                </div>
                <p className="text-xs text-gray-500">
                  {imagePreviewUrls.length}/5 images selected. Click + to add more.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="basePrice">Base Price (AED)</Label>
                  <Input
                    id="basePrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={currentVehicle?.basePrice || 0}
                    onChange={(e) => setCurrentVehicle(curr => curr ? {...curr, basePrice: parseFloat(e.target.value)} : null)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="perKmPrice">Per KM Price (AED)</Label>
                  <Input
                    id="perKmPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={currentVehicle?.perKmPrice || 0}
                    onChange={(e) => setCurrentVehicle(curr => curr ? {...curr, perKmPrice: parseFloat(e.target.value)} : null)}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="perMinutePrice">Per Minute Price (AED)</Label>
                  <Input
                    id="perMinutePrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={currentVehicle?.perMinutePrice || 0}
                    onChange={(e) => setCurrentVehicle(curr => curr ? {...curr, perMinutePrice: parseFloat(e.target.value)} : null)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={currentVehicle?.capacity || 4}
                    onChange={(e) => setCurrentVehicle(curr => curr ? {...curr, capacity: parseInt(e.target.value)} : null)}
                    required
                  />
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
                    (currentVehicle?.id ? 'Update' : 'Add') + ' Vehicle Type'
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
              Are you sure you want to delete "{vehicleToDelete?.name}"? 
              This action cannot be undone and will also delete all associated images.
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
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {loading ? (
        <div className="flex justify-center items-center min-h-[300px]">
          <Loader2 className="h-8 w-8 text-fleet-red animate-spin mr-2" />
          <p>Loading vehicle types...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicleTypes.length === 0 ? (
            <p className="col-span-full text-center py-8 text-gray-500">
              No vehicle types found. Click "Add New Vehicle Type" to create one.
            </p>
          ) : (
            vehicleTypes.map((vehicle) => (
              <Card key={vehicle.id} className="overflow-hidden">
                <div className="aspect-video w-full bg-gray-100 relative">
                  {vehicle.images && vehicle.images.length > 0 ? (
                    <>
                      <img 
                        src={vehicle.images[activeImageIndex[vehicle.id] || 0]} 
                        alt={vehicle.name}
                        className="w-full h-full object-cover transition-opacity duration-300"
                      />
                      
                      {/* Image navigation buttons */}
                      {vehicle.images.length > 1 && (
                        <>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePrevImage(vehicle.id, vehicle.images.length);
                            }}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors"
                          >
                            <ChevronLeft size={20} />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNextImage(vehicle.id, vehicle.images.length);
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors"
                          >
                            <ChevronRight size={20} />
                          </button>
                          
                          {/* Image indicators */}
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1">
                            {vehicle.images.map((_, index) => (
                              <button
                                key={index}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveImageIndex(prev => ({
                                    ...prev,
                                    [vehicle.id]: index
                                  }));
                                }}
                                className={`w-2 h-2 rounded-full ${
                                  index === (activeImageIndex[vehicle.id] || 0)
                                    ? 'bg-white'
                                    : 'bg-white/50'
                                }`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon size={48} className="text-gray-300" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2 bg-white/80 backdrop-blur-sm rounded px-2 py-1 text-xs font-medium flex items-center">
                    <span className="mr-1">{vehicle.taxiTypeName}</span>
                  </div>
                </div>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle>{vehicle.name}</CardTitle>
                    <div className="space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => handleAddEdit(vehicle)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => confirmDelete(vehicle)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  {vehicle.description && (
                    <p className="text-sm text-gray-600 mb-4">{vehicle.description}</p>
                  )}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div>Base Price:</div>
                    <div className="font-medium">{formatCurrency(vehicle.basePrice)}</div>
                    
                    <div>Per KM Price:</div>
                    <div className="font-medium">{formatCurrency(vehicle.perKmPrice)}</div>
                    
                    <div>Per Minute Price:</div>
                    <div className="font-medium">{formatCurrency(vehicle.perMinutePrice)}</div>
                    
                    <div>Capacity:</div>
                    <div className="font-medium">{vehicle.capacity} persons</div>
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
