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
import { firestore, storage } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc,
  query,
  where 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { formatCurrency } from '@/utils/currency';

interface TaxiType {
  id: string;
  name: string;
  description: string;
  emoji: string;
}

interface VehicleType {
  id: string;
  taxiTypeId: string;
  taxiTypeName?: string; // For display purposes
  name: string;
  description: string;
  basePrice: number;
  perKmPrice: number;
  perMinutePrice: number;
  capacity: number;
  images: string[];
}

const AdminVehicleTypes = () => {
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [taxiTypes, setTaxiTypes] = useState<TaxiType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<VehicleType | null>(null);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentVehicle, setCurrentVehicle] = useState<VehicleType | null>(null);
  
  // For image upload
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Add state for image carousel
  const [activeImageIndex, setActiveImageIndex] = useState<{[key: string]: number}>({});
  
  // Fetch taxi types and vehicle types from Firestore
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch taxi types
        const taxiTypesRef = collection(firestore, 'taxiTypes');
        const taxiSnapshot = await getDocs(taxiTypesRef);
        
        const fetchedTaxiTypes = taxiSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as TaxiType[];
        
        setTaxiTypes(fetchedTaxiTypes);
        
        // Fetch vehicle types
        const vehicleTypesRef = collection(firestore, 'vehicleTypes');
        const vehicleSnapshot = await getDocs(vehicleTypesRef);
        
        const fetchedVehicleTypes = vehicleSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as VehicleType[];
        
        // Add taxi type name for display
        const vehiclesWithTaxiNames = await Promise.all(
          fetchedVehicleTypes.map(async vehicle => {
            const taxiType = fetchedTaxiTypes.find(taxi => taxi.id === vehicle.taxiTypeId);
            return {
              ...vehicle,
              taxiTypeName: taxiType?.name || 'Unknown'
            };
          })
        );
        
        setVehicleTypes(vehiclesWithTaxiNames);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);
  
  const handleAddEdit = (vehicle: VehicleType | null) => {
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
      images: []
    });
    
    setIsDialogOpen(true);
  };
  
  const confirmDelete = (vehicle: VehicleType) => {
    setVehicleToDelete(vehicle);
    setIsDeleteDialogOpen(true);
  };
  
  const handleDelete = async () => {
    if (!vehicleToDelete) return;
    
    setIsSubmitting(true);
    try {
      // Delete images from storage
      for (const imageUrl of vehicleToDelete.images) {
        try {
          // Extract the file path from the URL
          const urlParts = imageUrl.split('?')[0].split('/o/')[1];
          if (urlParts) {
            const filePath = decodeURIComponent(urlParts);
            const imageRef = ref(storage, filePath);
            await deleteObject(imageRef);
          }
        } catch (error) {
          console.error('Error deleting image:', error);
          // Continue even if one image fails to delete
        }
      }
      
      // Delete from Firestore
      await deleteDoc(doc(firestore, 'vehicleTypes', vehicleToDelete.id));
      
      // Update local state
      setVehicleTypes(vehicleTypes.filter(v => v.id !== vehicleToDelete.id));
      toast.success('Vehicle type deleted successfully');
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting vehicle type:', error);
      toast.error('Failed to delete vehicle type');
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
  
  const uploadImages = async (): Promise<string[]> => {
    if (imageFiles.length === 0) {
      // If no new images were added, return the existing ones
      return currentVehicle?.images || [];
    }
    
    const uploadPromises = imageFiles.map(async (file) => {
      const fileId = uuidv4();
      const fileExtension = file.name.split('.').pop();
      const filePath = `vehicle-images/${fileId}.${fileExtension}`;
      const storageRef = ref(storage, filePath);
      
      await uploadBytes(storageRef, file);
      return getDownloadURL(storageRef);
    });
    
    const newImageUrls = await Promise.all(uploadPromises);
    
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
      // Upload images first
      const imageUrls = await uploadImages();
      
      // Prepare vehicle data with image URLs
      const vehicleData = {
        ...currentVehicle,
        images: imageUrls
      };
      
      let savedVehicle: VehicleType;
      
      if (currentVehicle.id) {
        // Update existing vehicle type
        const vehicleRef = doc(firestore, 'vehicleTypes', currentVehicle.id);
        const { id, taxiTypeName, ...vehicleDataWithoutId } = vehicleData;
        
        await updateDoc(vehicleRef, vehicleDataWithoutId);
        
        // Get the taxi type name
        const taxiType = taxiTypes.find(taxi => taxi.id === vehicleData.taxiTypeId);
        
        // Update local state
        savedVehicle = {
          ...vehicleData,
          taxiTypeName: taxiType?.name || 'Unknown'
        };
        
        setVehicleTypes(vehicleTypes.map(vehicle => 
          vehicle.id === currentVehicle.id ? savedVehicle : vehicle
        ));
        
        toast.success('Vehicle type updated successfully');
      } else {
        // Add new vehicle type
        const { id, taxiTypeName, ...vehicleDataWithoutId } = vehicleData;
        
        const docRef = await addDoc(collection(firestore, 'vehicleTypes'), vehicleDataWithoutId);
        
        // Get the taxi type name
        const taxiType = taxiTypes.find(taxi => taxi.id === vehicleData.taxiTypeId);
        
        // Update local state with the new ID from Firestore
        savedVehicle = {
          ...vehicleData,
          id: docRef.id,
          taxiTypeName: taxiType?.name || 'Unknown'
        };
        
        setVehicleTypes([...vehicleTypes, savedVehicle]);
        
        toast.success('Vehicle type added successfully');
      }
      
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving vehicle type:', error);
      toast.error('Failed to save vehicle type');
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
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex items-center">
                          <span className="mr-2">{type.emoji}</span>
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
      
      {isLoading ? (
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
