import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, 
         DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { PlusCircle, Edit2, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { firestore } from '@/lib/firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import EmojiPicker from '@/components/EmojiPicker';

interface TaxiType {
  id: string;
  name: string;
  description: string;
  emoji: string;
}

const AdminTaxiTypes = () => {
  const [taxiTypes, setTaxiTypes] = useState<TaxiType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [taxiTypeToDelete, setTaxiTypeToDelete] = useState<TaxiType | null>(null);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentTaxiType, setCurrentTaxiType] = useState<TaxiType | null>(null);
  
  // Fetch taxi types from Firestore
  useEffect(() => {
    const fetchTaxiTypes = async () => {
      try {
        setIsLoading(true);
        const taxiTypesRef = collection(firestore, 'taxiTypes');
        const snapshot = await getDocs(taxiTypesRef);
        
        const fetchedTypes = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as TaxiType[];
        
        setTaxiTypes(fetchedTypes);
      } catch (error) {
        console.error('Error fetching taxi types:', error);
        toast.error('Failed to load taxi types');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTaxiTypes();
  }, []);
  
  const handleAddEdit = (taxiType: TaxiType | null) => {
    setCurrentTaxiType(taxiType || {
      id: '',
      name: '',
      description: '',
      emoji: '🚗'
    });
    setIsDialogOpen(true);
  };
  
  const confirmDelete = (taxiType: TaxiType) => {
    setTaxiTypeToDelete(taxiType);
    setIsDeleteDialogOpen(true);
  };
  
  const handleDelete = async () => {
    if (!taxiTypeToDelete) return;
    
    setIsSubmitting(true);
    try {
      // Delete from Firestore
      await deleteDoc(doc(firestore, 'taxiTypes', taxiTypeToDelete.id));
      
      // Update local state
      setTaxiTypes(taxiTypes.filter(type => type.id !== taxiTypeToDelete.id));
    toast.success('Taxi type deleted successfully');
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting taxi type:', error);
      toast.error('Failed to delete taxi type');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTaxiType) return;
    
    setIsSubmitting(true);
    
    try {
      if (currentTaxiType.id) {
        // Update existing taxi type
        const taxiTypeRef = doc(firestore, 'taxiTypes', currentTaxiType.id);
        const { id, ...taxiTypeData } = currentTaxiType;
        
        await updateDoc(taxiTypeRef, taxiTypeData);
        
        // Update local state
      setTaxiTypes(taxiTypes.map(type => 
        type.id === currentTaxiType.id ? currentTaxiType : type
      ));
        
      toast.success('Taxi type updated successfully');
    } else {
        // Add new taxi type
        const { id, ...taxiTypeData } = currentTaxiType;
        
        const docRef = await addDoc(collection(firestore, 'taxiTypes'), taxiTypeData);
        
        // Update local state with the new ID from Firestore
        const newTaxiType = { ...currentTaxiType, id: docRef.id };
        setTaxiTypes([...taxiTypes, newTaxiType]);
        
      toast.success('Taxi type added successfully');
    }
    
    setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving taxi type:', error);
      toast.error('Failed to save taxi type');
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
            <Button onClick={() => handleAddEdit(null)} className="bg-fleet-red text-white hover:bg-fleet-red/90">
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Taxi Type
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{currentTaxiType?.id ? 'Edit' : 'Add'} Taxi Type</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="text-sm font-medium mb-1 block">Name</label>
                  <Input
                    id="name"
                    value={currentTaxiType?.name || ''}
                    onChange={(e) => setCurrentTaxiType(curr => curr ? {...curr, name: e.target.value} : null)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="emoji" className="text-sm font-medium mb-1 block">Emoji</label>
                  <EmojiPicker
                    selectedEmoji={currentTaxiType?.emoji || '🚗'}
                    onEmojiSelect={(emoji) => setCurrentTaxiType(curr => curr ? {...curr, emoji} : null)}
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="description" className="text-sm font-medium mb-1 block">Description</label>
                <Textarea
                  id="description"
                  value={currentTaxiType?.description || ''}
                  onChange={(e) => setCurrentTaxiType(curr => curr ? {...curr, description: e.target.value} : null)}
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
                    (currentTaxiType?.id ? 'Update' : 'Add') + ' Taxi Type'
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
              Are you sure you want to delete the "{taxiTypeToDelete?.name}" taxi type? 
              This action cannot be undone.
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
                  <span className="text-2xl">{taxiType.emoji}</span>
                  <CardTitle>{taxiType.name}</CardTitle>
                </div>
                <div className="space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => handleAddEdit(taxiType)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                      <Button variant="ghost" size="icon" onClick={() => confirmDelete(taxiType)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
                  <p className="text-sm text-gray-600">{taxiType.description}</p>
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
