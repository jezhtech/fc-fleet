import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlusCircle, Edit2, Trash2, MapPin, Map, Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Zone, FareRule } from '@/lib/firebaseModels';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs,
  query,
  where,
  setDoc
} from 'firebase/firestore';
import { firestore } from '@/lib/firebase';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import * as turf from '@turf/turf';
import { validateAndFixPolygon, createTestZone, logZoneInfo } from '@/lib/mapUtils';
import SimpleZoneRenderer from './SimpleZoneRenderer';

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
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [drawingMode, setDrawingMode] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const dialogMapContainerRef = useRef<HTMLDivElement>(null);
  
  // Fetch zones when component mounts
  useEffect(() => {
    fetchZonesFromFirestore();
  }, []);
  
  // Helper function to log detailed error information
  const logError = (error: unknown, context: string) => {
    console.error(`Error in ${context}:`, error);
    
    // Extract and log detailed information if available
    if (error instanceof Error) {
      console.error(`Error details (${context}):`, {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // Check for Firebase specific error codes
      const firebaseError = error as { code?: string, details?: string, customData?: any, serverResponse?: string };
      if (firebaseError.code) {
        console.error(`Firebase error code: ${firebaseError.code}`);
        console.error('Firebase error details:', {
          details: firebaseError.details,
          customData: firebaseError.customData,
          serverResponse: firebaseError.serverResponse
        });
      }
      
      // For document reference errors specifically
      if (error.message.includes('Document references must have') || 
          error.message.includes('Invalid document reference')) {
        console.error('DOCUMENT REFERENCE ERROR DETECTED. This is likely due to an invalid Firestore path.');
      }
      
      return error.message;
    } else if (typeof error === 'string') {
      return error;
    }
    
    return 'Unknown error occurred';
  };
  
  // Improve the error handling in convertCoordinatesToFirestore function
  const convertCoordinatesToFirestore = (polygon: GeoJSON.Polygon): any => {
    try {
      if (!polygon || !polygon.coordinates || !Array.isArray(polygon.coordinates)) {
        console.error('Invalid polygon structure for conversion:', polygon);
        return null;
      }
      
      console.log('Converting polygon to Firestore format:', {
        type: polygon.type,
        coordinatesLength: polygon.coordinates.length,
        innerArraysLength: polygon.coordinates.map(arr => Array.isArray(arr) ? arr.length : 0)
      });
      
      // Convert the nested arrays to an object-based format with no arrays
      const firestoreFormat: Record<string, any> = {
        type: polygon.type,
        // Store as flat object with no arrays
        coordinateRings: {}
      };
      
      // Convert the coordinates array to an object with no nested arrays
      if (Array.isArray(polygon.coordinates) && polygon.coordinates.length > 0) {
        polygon.coordinates.forEach((ring, ringIndex) => {
          if (Array.isArray(ring)) {
            firestoreFormat.coordinateRings[`ring_${ringIndex}`] = {};
            
            ring.forEach((point, pointIndex) => {
              if (Array.isArray(point) && point.length >= 2) {
                // Store each coordinate as separate lng/lat fields
                firestoreFormat.coordinateRings[`ring_${ringIndex}`][`point_${pointIndex}`] = {
                  lng: point[0],
                  lat: point[1]
                };
              }
            });
            
            // Store ring size for easier reconstruction
            firestoreFormat.coordinateRings[`ring_${ringIndex}`].pointCount = ring.length;
          }
        });
        
        // Store total ring count for easier reconstruction
        firestoreFormat.ringCount = polygon.coordinates.length;
      }
      
      // Log the result size to check if it's reasonable
      const resultStr = JSON.stringify(firestoreFormat);
      console.log(`Converted format size: ${resultStr.length} bytes`);
      
      return firestoreFormat;
    } catch (error) {
      console.error('Error converting coordinates to Firestore format:', error);
      // Return a valid empty object rather than null to avoid errors
      return { type: 'Polygon', coordinateRings: {}, ringCount: 0 };
    }
  };

  // Restore GeoJSON from Firestore format
  const restoreCoordinatesFromFirestore = (firestoreData: any): GeoJSON.Polygon => {
    try {
      if (!firestoreData) {
        console.error('Invalid Firestore data format (null or undefined)');
        return {
          type: 'Polygon',
          coordinates: [[]]
        };
      }
      
      // Check which format we're dealing with (old or new)
      const isNewFormat = firestoreData.coordinateRings && firestoreData.ringCount !== undefined;
      const isOldFormat = firestoreData.coordinatesObject;
      
      console.log(`Restoring coordinates from Firestore (format: ${isNewFormat ? 'new' : isOldFormat ? 'old' : 'unknown'})`);
      
      const coordinates: number[][][] = [];
      
      if (isNewFormat) {
        // New format (no nested arrays)
        const ringCount = firestoreData.ringCount || 0;
        
        for (let ringIndex = 0; ringIndex < ringCount; ringIndex++) {
          const ringKey = `ring_${ringIndex}`;
          const ringData = firestoreData.coordinateRings[ringKey];
          
          if (ringData) {
            const ring: number[][] = [];
            const pointCount = ringData.pointCount || 0;
            
            for (let pointIndex = 0; pointIndex < pointCount; pointIndex++) {
              const pointKey = `point_${pointIndex}`;
              const point = ringData[pointKey];
              
              if (point && typeof point.lng === 'number' && typeof point.lat === 'number') {
                ring.push([point.lng, point.lat]);
              }
            }
            
            if (ring.length > 0) {
              coordinates.push(ring);
            }
          }
        }
      } else if (isOldFormat) {
        // Old format
        // Rebuild the coordinates array from the object
        const ringKeys = Object.keys(firestoreData.coordinatesObject)
          .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
        
        ringKeys.forEach(ringKey => {
          const ring: number[][] = [];
          const points = firestoreData.coordinatesObject[ringKey];
          
          const pointKeys = Object.keys(points)
            .filter(key => key.startsWith('point_'))
            .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
          
          pointKeys.forEach(pointKey => {
            const point = points[pointKey];
            if (point && typeof point.lng === 'number' && typeof point.lat === 'number') {
              ring.push([point.lng, point.lat]);
            }
          });
          
          if (ring.length > 0) {
            coordinates.push(ring);
          }
        });
      }
      
      // If no valid coordinates were found, create a minimal valid polygon
      if (coordinates.length === 0) {
        console.warn('No valid rings found in Firestore data, creating default polygon');
        coordinates.push([[0, 0], [0, 1], [1, 1], [0, 0]]);
      } else {
        // Ensure each ring is closed (first and last points match)
        coordinates.forEach(ring => {
          if (ring.length >= 3) {
            const firstPoint = ring[0];
            const lastPoint = ring[ring.length - 1];
            
            if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
              // Close the ring
              ring.push([...firstPoint]);
            }
          }
        });
      }
      
      return {
        type: 'Polygon',
        coordinates
      };
    } catch (error) {
      console.error('Error restoring coordinates from Firestore:', error);
      return {
        type: 'Polygon',
        coordinates: [[]]
      };
    }
  };
  
  // Fetch zones from Firestore
  const fetchZonesFromFirestore = async () => {
    try {
      setIsLoading(true);
      const zonesRef = collection(firestore, 'zones');
      const snapshot = await getDocs(zonesRef);
      
      const fetchedZones = snapshot.docs.map(doc => {
        const data = doc.data();
        
        // Restore coordinates from various possible formats
        let coordinates: GeoJSON.Polygon | null = null;
        let loadMethod = 'unknown';
        
        try {
          // First try the string formats (most reliable)
          if (data.coordinatesData) {
            try {
              // New simplified string format (primary)
              console.log(`Loading zone ${doc.id} from coordinatesData (string format)`);
              coordinates = JSON.parse(data.coordinatesData);
              loadMethod = 'coordinatesData';
            } catch (parseErr) {
              console.error(`Failed to parse coordinatesData for zone ${doc.id}:`, parseErr);
            }
          }
          
          // If that fails, try the JSON backup
          if (!coordinates && data.coordinatesJSON) {
            try {
              console.log(`Loading zone ${doc.id} from coordinatesJSON (backup string)`);
              coordinates = JSON.parse(data.coordinatesJSON);
              loadMethod = 'coordinatesJSON';
            } catch (jsonErr) {
              console.error(`Failed to parse coordinatesJSON for zone ${doc.id}:`, jsonErr);
            }
          }
          
          // If string formats fail, try object format (new version first)
          if (!coordinates && data.coordinatesFirestore) {
            console.log(`Loading zone ${doc.id} from coordinatesFirestore (object format)`);
            coordinates = restoreCoordinatesFromFirestore(data.coordinatesFirestore);
            loadMethod = 'coordinatesFirestore';
          }
          
          // Last resort - try legacy format (direct coordinates)
          if (!coordinates && data.coordinates) {
            console.log(`Loading zone ${doc.id} from legacy coordinates format`);
            // Direct coordinates may be a GeoJSON object or could be a raw object needing conversion
            if (data.coordinates.type === 'Polygon' && Array.isArray(data.coordinates.coordinates)) {
              coordinates = data.coordinates as GeoJSON.Polygon;
              loadMethod = 'direct';
            }
          }
          
          if (!coordinates) {
            // No valid coordinates found, create a default empty polygon
            console.error(`No valid coordinates found for zone ${doc.id}, using default`);
            coordinates = { 
              type: 'Polygon', 
              coordinates: [[[0, 0], [0, 1], [1, 1], [0, 0]]] 
            };
            loadMethod = 'default';
          }
          
          // Make sure the polygon is valid
          // Ensure the polygon is closed (first and last points are the same)
          if (coordinates.coordinates && coordinates.coordinates.length > 0) {
            coordinates.coordinates.forEach(ring => {
              if (ring.length >= 3) {
                const firstPoint = ring[0];
                const lastPoint = ring[ring.length - 1];
                
                if (JSON.stringify(firstPoint) !== JSON.stringify(lastPoint)) {
                  ring.push([...firstPoint]); // Close the ring by adding a copy of the first point
                  console.log(`Closed ring for zone ${doc.id}`);
                }
              }
            });
          }
          
          console.log(`Successfully loaded zone ${doc.id} using method: ${loadMethod}`);
        } catch (coordErr) {
          console.error(`Error processing coordinates for zone ${doc.id}:`, coordErr);
          coordinates = { 
            type: 'Polygon', 
            coordinates: [[[0, 0], [0, 1], [1, 1], [0, 0]]] 
          };
        }
        
        // Return the zone with restored coordinates
        return {
          id: doc.id,
          ...data,
          coordinates,
          coordinatesData: data.coordinatesData,
          coordinatesJSON: data.coordinatesJSON,
          coordinatesFirestore: data.coordinatesFirestore
        } as Zone;
      });
      
      setZones(fetchedZones);
      console.log(`Loaded ${fetchedZones.length} zones from Firestore`);
    } catch (error) {
      const errorMessage = logError(error, 'fetchZonesFromFirestore');
      toast.error(`Error loading zones: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddEdit = (zone: Zone | null) => {
    if (zone) {
      // Edit existing zone
      console.log('Editing existing zone:', zone.id);
      setCurrentZone(zone);
    } else {
      // Create a new zone with default values and a temporary ID
      console.log('Creating new zone');
      setCurrentZone({
        id: 'new', // Temporary ID that will be replaced when saved
        name: '',
        description: '',
        coordinates: {
          type: 'Polygon',
          coordinates: []
        },
        color: '#' + Math.floor(Math.random()*16777215).toString(16), // Random color
        fareRuleId: fareRules.length > 0 ? fareRules[0].id : '',
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now()
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
      await deleteDoc(doc(firestore, 'zones', zoneToDelete.id));
      
      setZones(zones.filter(z => z.id !== zoneToDelete.id));
      toast.success('Zone deleted successfully');
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting zone:', error);
      toast.error('Failed to delete zone');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Create an adapter function to convert from GeoJSON.Feature to zoneId for SimpleZoneRenderer
  const handleGeoJSONFeatureToZoneId = (feature: GeoJSON.Feature) => {
    if (feature && feature.properties && feature.properties.user_zoneId) {
      const zoneId = feature.properties.user_zoneId as string;
      setSelectedZoneId(zoneId);
    } else {
      console.warn('Selected feature has no user_zoneId property:', feature);
    }
  };

  // Use the adapter function for the SimpleZoneRenderer
  const handleZoneIdSelect = (zoneId: string) => {
    setSelectedZoneId(zoneId);
  };

  // Process polygon drawn on the map
  const handlePolygonComplete = (feature: GeoJSON.Feature<GeoJSON.Polygon>) => {
    if (!currentZone) return;
    
    try {
      // Validate the feature before using it
      if (!feature || !feature.geometry || feature.geometry.type !== 'Polygon') {
        console.error('Invalid feature received from drawing tool');
        toast.error('The drawn zone is invalid. Please try again.');
        return;
      }
      
      // Ensure the coordinates array is valid
      const coords = feature.geometry.coordinates;
      if (!Array.isArray(coords) || coords.length === 0 || !Array.isArray(coords[0])) {
        console.error('Invalid coordinates structure:', coords);
        toast.error('The drawn zone has invalid coordinates. Please try again.');
        return;
      }
      
      // Ensure the polygon is closed (first and last points are the same)
      const ring = coords[0];
      if (ring.length >= 3) {
        const firstPoint = ring[0];
        const lastPoint = ring[ring.length - 1];
        
        if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
          // Close the polygon automatically
          ring.push([...firstPoint]);
          console.log('Closed polygon automatically');
        }
      } else {
        console.error('Polygon has fewer than 3 points:', ring);
        toast.error('Please draw a valid polygon with at least 3 points.');
        return;
      }
      
      // Validate with turf if available
      try {
        const isValid = turf.booleanValid(feature.geometry);
        if (!isValid) {
          console.error('Invalid polygon according to turf validation');
          // Still continue, but log the warning
        }
      } catch (turfErr) {
        console.warn('Error during turf validation:', turfErr);
        // Continue anyway
      }

      // Calculate area in square kilometers
      const area = turf.area(feature);
      const areaKm2 = area / 1000000;
      
      // Limit decimal places in area to avoid floating point issues
      const roundedAreaKm2 = parseFloat(areaKm2.toFixed(4));
      
      // Update the current zone with the validated polygon coordinates and area
      setCurrentZone({
        ...currentZone,
        coordinates: feature.geometry,
        areaKm2: roundedAreaKm2
      });
      
      // Log the full coordinates for debugging
      console.log('Polygon coordinates:', JSON.stringify(feature.geometry.coordinates));
      
      toast.success(`Zone drawn successfully (${roundedAreaKm2.toFixed(2)} km²)`);
    } catch (error) {
      console.error('Error processing polygon:', error);
      toast.error('Failed to process the drawn zone. Please try again or use a simpler shape.');
    }
  };
  
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentZone) return;
    
    try {
      setIsSubmitting(true);
      console.log('Starting zone save process...');
      
      // Validate zone data
      if (!currentZone.name.trim()) {
        toast.error('Zone name is required');
        setIsSubmitting(false);
        return;
      }
      
      // For the coordinates, we'll save in multiple formats for better resilience
      const zoneToSave = { ...currentZone };
      console.log('Zone to save:', { 
        id: zoneToSave.id,
        name: zoneToSave.name,
        hasCoordinates: Boolean(zoneToSave.coordinates),
        coordinatesType: zoneToSave.coordinates?.type
      });
      
      // Calculate area if possible and coordinates are valid
      try {
        if (zoneToSave.coordinates && 
            zoneToSave.coordinates.type === 'Polygon' && 
            zoneToSave.coordinates.coordinates && 
            zoneToSave.coordinates.coordinates.length > 0) {
          
          // Create a turf polygon to calculate area
          const turfPolygon = turf.polygon(zoneToSave.coordinates.coordinates);
          const area = turf.area(turfPolygon);
          zoneToSave.areaKm2 = Math.round(area / 1000000 * 100) / 100; // Convert m² to km² and round to 2 decimal places
          console.log(`Calculated area for zone ${zoneToSave.name}: ${zoneToSave.areaKm2} km²`);
          
          // Save coordinates in string format (most reliable for Firestore)
          zoneToSave.coordinatesData = JSON.stringify(zoneToSave.coordinates);
          
          // Save in object format for backwards compatibility
          zoneToSave.coordinatesFirestore = convertCoordinatesToFirestore(zoneToSave.coordinates);
          
          // Save as JSON string backup
          zoneToSave.coordinatesJSON = JSON.stringify(zoneToSave.coordinates);
        } else {
          console.error('Invalid coordinates found:', zoneToSave.coordinates);
          toast.error('Invalid zone shape. Please draw a valid polygon.');
          setIsSubmitting(false);
          return;
        }
      } catch (areaError) {
        console.error('Error calculating area:', areaError);
        // Continue with save despite area calculation error
      }
      
      // Now save to Firestore
      if (!zoneToSave.id || zoneToSave.id === 'new') {
        // Create a new zone
        if (zoneToSave.id) delete zoneToSave.id;
        zoneToSave.createdAt = Date.now();
        zoneToSave.updatedAt = Date.now();
        
        try {
          // Generate a custom ID for the document
          const customId = `zone_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
          
          // Create a Firestore-safe version of the zone data
          const firestoreSafeZone = {
            name: zoneToSave.name,
            description: zoneToSave.description,
            // Don't include the coordinates object directly (it has nested arrays)
            coordinatesData: zoneToSave.coordinatesData, // string format is safe
            coordinatesJSON: zoneToSave.coordinatesJSON, // string format is safe
            coordinatesFirestore: zoneToSave.coordinatesFirestore, // already converted to Firestore-safe format
            color: zoneToSave.color,
            fareRuleId: zoneToSave.fareRuleId,
            isActive: zoneToSave.isActive,
            createdAt: zoneToSave.createdAt,
            updatedAt: zoneToSave.updatedAt,
            areaKm2: zoneToSave.areaKm2
          };
          
          console.log('Saving zone with Firestore-safe data structure');
          
          // Use the doc function with both collection reference and ID
          const newDocRef = doc(firestore, 'zones', customId);
          
          // Then set the document with the safe data
          await setDoc(newDocRef, firestoreSafeZone);
          
          toast.success('Zone created successfully');
          console.log('New zone created with ID:', customId);
          
          // Fetch updated zones
          setIsDialogOpen(false);
          setCurrentZone(null);
          fetchZonesFromFirestore();
        } catch (error) {
          console.error('Error creating zone:', error);
          const errorMessage = logError(error, 'handleFormSubmit - document creation');
          toast.error(`Failed to save zone: ${errorMessage}`);
          setIsSubmitting(false);
        }
      } else {
        // Update existing zone
        zoneToSave.updatedAt = Date.now();
        
        const zoneRef = doc(firestore, 'zones', zoneToSave.id);
        
        // Create a Firestore-safe version for update
        const firestoreSafeUpdate = {
          name: zoneToSave.name,
          description: zoneToSave.description,
          // Skip the direct coordinates object (has nested arrays)
          coordinatesData: zoneToSave.coordinatesData,
          coordinatesFirestore: zoneToSave.coordinatesFirestore,
          coordinatesJSON: zoneToSave.coordinatesJSON,
          color: zoneToSave.color,
          fareRuleId: zoneToSave.fareRuleId,
          isActive: zoneToSave.isActive,
          updatedAt: zoneToSave.updatedAt,
          areaKm2: zoneToSave.areaKm2
        };
        
        await updateDoc(zoneRef, firestoreSafeUpdate);
        
        toast.success('Zone updated successfully');
        console.log('Zone updated:', zoneToSave.id);
        
        // Fetch updated zones
        setIsDialogOpen(false);
        setCurrentZone(null);
        fetchZonesFromFirestore();
      }
    } catch (error) {
      const errorMessage = logError(error, 'handleFormSubmit');
      toast.error(`Error saving zone: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Add function to handle dialog close with confirmation if in drawing mode
  const handleDialogClose = (open: boolean) => {
    if (!open && drawingMode && currentZone?.coordinates) {
      // If we're closing with an unsaved zone, ask for confirmation
      if (window.confirm('Are you sure you want to cancel? Your drawn zone will be lost.')) {
        setIsDialogOpen(false);
        setDrawingMode(false);
      } else {
        // User canceled, keep dialog open
        return;
      }
    } else {
      setIsDialogOpen(open);
      if (!open) {
        setDrawingMode(false);
      }
    }
  };
  
  // Debug function to inspect a zone's coordinates
  const inspectZoneCoordinates = (zone: Zone) => {
    if (!zone || !zone.coordinates) {
      console.error(`Zone ${zone?.id} has no coordinates`);
      return;
    }
    
    try {
      const coords = zone.coordinates.coordinates;
      if (!Array.isArray(coords) || coords.length === 0) {
        console.error(`Zone ${zone.id} has invalid coordinates structure`);
        return;
      }
      
      const outerRing = coords[0];
      if (!Array.isArray(outerRing) || outerRing.length < 3) {
        console.error(`Zone ${zone.id} has invalid outer ring: ${JSON.stringify(outerRing)}`);
        return;
      }
      
      console.log(`Zone ${zone.id} (${zone.name}) coordinates details:`, {
        type: zone.coordinates.type,
        rings: coords.length,
        points: outerRing.length,
        firstPoint: outerRing[0],
        lastPoint: outerRing[outerRing.length - 1],
        isClosed: JSON.stringify(outerRing[0]) === JSON.stringify(outerRing[outerRing.length - 1])
      });
      
      // Verify the points are valid numbers
      let hasInvalidPoints = false;
      outerRing.forEach((point, idx) => {
        if (!Array.isArray(point) || point.length < 2 || 
            typeof point[0] !== 'number' || typeof point[1] !== 'number' ||
            isNaN(point[0]) || isNaN(point[1])) {
          console.error(`Zone ${zone.id} has invalid point at index ${idx}: ${JSON.stringify(point)}`);
          hasInvalidPoints = true;
        }
      });
      
      if (hasInvalidPoints) {
        console.error(`Zone ${zone.id} has invalid points and may not display correctly`);
      }
    } catch (err) {
      console.error(`Error inspecting zone ${zone?.id} coordinates:`, err);
    }
  };

  // Convert zones to GeoJSON FeatureCollection
  const zonesAsGeoJSON = (): GeoJSON.FeatureCollection => {
    try {
      // Log current zones for debugging
      console.log(`Converting ${zones.length} zones to GeoJSON...`);
      
      const features: GeoJSON.Feature[] = zones
        .filter(zone => {
          // Filter out invalid zones
          if (!zone || !zone.id) {
            console.warn('Invalid zone found (missing ID), skipping');
            return false;
          }
          
          // Check coordinates - if missing, log but still include (might have id reference)
          if (!zone.coordinates || 
             (zone.coordinates.type !== 'Polygon' && !zone.coordinatesData && !zone.coordinatesJSON)) {
            console.warn(`Zone ${zone.id} (${zone.name}) has missing/invalid coordinates`);
          }
          
          return true;
        })
        .map(zone => {
          // Determine the coordinates source
          let coordinates: GeoJSON.Polygon | null = null;
          let coordSource = 'unknown';
          
          try {
            // Try different data sources for coordinates
            if (zone.coordinatesData) {
              // Parse from string format (most reliable)
              const parsed = JSON.parse(zone.coordinatesData);
              if (parsed && parsed.type === 'Polygon' && Array.isArray(parsed.coordinates)) {
                coordinates = parsed;
                coordSource = 'coordinatesData';
              }
            } 
            
            if (!coordinates && zone.coordinatesJSON) {
              // Try the JSON backup
              const parsed = JSON.parse(zone.coordinatesJSON);
              if (parsed && parsed.type === 'Polygon' && Array.isArray(parsed.coordinates)) {
                coordinates = parsed;
                coordSource = 'coordinatesJSON';
              }
            }
            
            if (!coordinates && zone.coordinates && zone.coordinates.type === 'Polygon') {
              // Use direct coordinates if available
              coordinates = zone.coordinates as GeoJSON.Polygon;
              coordSource = 'coordinates';
            }
            
            // Last resort - create empty polygon
            if (!coordinates) {
              console.warn(`No valid coordinates found for zone ${zone.id} (${zone.name}), creating empty polygon`);
              coordinates = {
                type: 'Polygon',
                coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]]
              };
              coordSource = 'fallback';
            }
            
            // Validate coordinates structure
            if (!Array.isArray(coordinates.coordinates) || coordinates.coordinates.length === 0) {
              console.warn(`Invalid coordinates array for zone ${zone.id}, fixing...`);
              coordinates.coordinates = [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]];
            }
            
            // Ensure the polygon is closed
            for (let i = 0; i < coordinates.coordinates.length; i++) {
              const ring = coordinates.coordinates[i];
              if (Array.isArray(ring) && ring.length >= 3) {
                const firstPoint = ring[0];
                const lastPoint = ring[ring.length - 1];
                
                // If first and last points don't match, close the polygon
                if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
                  console.log(`Closing ring for zone ${zone.id}`);
                  ring.push([...firstPoint]); // Add copy of first point to close
                }
              } else if (!Array.isArray(ring) || ring.length < 3) {
                console.warn(`Ring ${i} for zone ${zone.id} has too few points, replacing with default`);
                coordinates.coordinates[i] = [[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]];
              }
            }
            
            // Log success
            console.log(`Zone ${zone.id} (${zone.name}) using coordinates from ${coordSource}`);
          } catch (error) {
            console.error(`Error processing coordinates for zone ${zone.id}:`, error);
            coordinates = {
              type: 'Polygon',
              coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]]
            };
          }
          
          // Create the GeoJSON feature
          const feature: GeoJSON.Feature = {
            type: 'Feature',
            id: zone.id,
            geometry: coordinates!,
            properties: {
              name: zone.name || 'Unnamed Zone',
              description: zone.description || '',
              isActive: zone.isActive || false,
              color: zone.color || '#ff385c',
              fareRuleId: zone.fareRuleId || null,
              user_zoneId: zone.id // Important for mapping back to the zone
            }
          };
          
          return feature;
        });
      
      return {
        type: 'FeatureCollection',
        features
      };
    } catch (error) {
      console.error('Error creating GeoJSON from zones:', error);
      // Return empty feature collection on error
      return {
        type: 'FeatureCollection',
        features: []
      };
    }
  };
  
  // Add a standalone function to handle the Reload Map button click
  const handleReloadMap = () => {
    try {
      // Clear local storage caches that might be causing issues
      for (const key in localStorage) {
        if (key.startsWith('mapbox') || key.includes('map')) {
          localStorage.removeItem(key);
        }
      }
      
      // Reset errors
      setMapError(null);
      
      // Force reload with a cache-busting parameter
      const timestamp = Date.now();
      window.location.href = `/admin/fare-settings?tab=zones&reload=${timestamp}`;
    } catch (error) {
      console.error('Error reloading page:', error);
      window.location.reload(); // Fallback to regular reload
    }
  };
  
  // Also add a simple debug function to log the structure of data being saved
  const logObjectStructure = (obj: any, label: string, maxDepth = 3) => {
    const helper = (o: any, depth = 0): any => {
      if (depth > maxDepth) return '[Max Depth]';
      if (o === null) return 'null';
      if (o === undefined) return 'undefined';
      
      const type = typeof o;
      if (type !== 'object') return type;
      
      if (Array.isArray(o)) {
        return `Array(${o.length}): [${o.length > 0 ? helper(o[0], depth + 1) + ', ...' : ''}]`;
      }
      
      return `Object: {${Object.keys(o).slice(0, 3).map(k => `${k}: ${helper(o[k], depth + 1)}`).join(', ')}${
        Object.keys(o).length > 3 ? ', ...' : ''
      }}`;
    };
    
    console.log(`${label} Structure:`, helper(obj));
  };
  
  // Create a default zone with preset shape
  const createDefaultZone = () => {
    // If there's already a current zone but no coordinates
    if (!currentZone?.coordinates || 
        !currentZone.coordinates.coordinates || 
        currentZone.coordinates.coordinates.length === 0) {
      
      // Create a square centered around Dubai
      const centerLng = 55.2708;
      const centerLat = 25.2048;
      const kilometers = 2; // 2km square
      
      // Convert km to coordinates (approximate)
      const distanceLat = kilometers / 111.2; // rough conversion
      const distanceLng = kilometers / (111.2 * Math.cos(centerLat * Math.PI / 180));
      
      // Create the coordinates for a square
      const coords = [
        [centerLng - distanceLng, centerLat - distanceLat],
        [centerLng + distanceLng, centerLat - distanceLat],
        [centerLng + distanceLng, centerLat + distanceLat],
        [centerLng - distanceLng, centerLat + distanceLat],
        [centerLng - distanceLng, centerLat - distanceLat] // Close the polygon
      ];
      
      // Create the polygon structure
      const polygon: GeoJSON.Polygon = {
        type: 'Polygon',
        coordinates: [coords]
      };
      
      // Calculate area in square kilometers
      const areaKm2 = 4; // Simple approximation or could calculate with turf
      
      // Update the current zone with this default shape
      setCurrentZone(prev => {
        if (!prev) return null;
        return {
          ...prev,
          coordinates: polygon,
          areaKm2
        };
      });
      
      // Show success message
      toast.success("Default zone created! You can customize the details.");
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Zones & Geofencing</h2>
      </div>
      
      <Tabs defaultValue="map-view">
        <TabsList className="mb-6">
          <TabsTrigger value="map-view">Map View</TabsTrigger>
          <TabsTrigger value="list-view">List View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="map-view">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Interactive Map</CardTitle>
                <div className="flex items-center space-x-2">
                  {drawingMode ? (
                    <Button 
                      variant="outline" 
                      onClick={() => setDrawingMode(false)}
                    >
                      Cancel Drawing
                    </Button>
                  ) : (
                    <Button 
                      className="bg-fleet-red text-white hover:bg-fleet-red/90"
                      onClick={() => {
                        handleAddEdit(null);
                        setDrawingMode(true);
                      }}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" /> Draw New Zone
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {mapError ? (
                <div className="bg-red-50 border border-red-200 rounded-md p-8 text-center">
                  <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-red-700 mb-2">Map Error</h3>
                  <p className="mb-6 text-red-600">{mapError}</p>
                  <div className="space-y-3">
                    <Button 
                      onClick={handleReloadMap}
                      className="bg-red-500 hover:bg-red-600 text-white"
                    >
                      Reload Map
                    </Button>
                    <div className="pt-6 border-t border-red-200 mt-4">
                      <h4 className="font-medium text-gray-700 mb-3">Continue With Simplified View</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        You can continue working with zones using our simplified view below.
                        All functionality will work, but without the interactive map.
                      </p>
                      <SimpleZoneRenderer 
                        zones={zones}
                        selectedZoneId={selectedZoneId}
                        onSelectZone={handleZoneIdSelect}
                        onCreateZone={() => handleAddEdit(null)}
                        onEditZone={(id) => {
                          const zone = zones.find(z => z.id === id);
                          if (zone) handleAddEdit(zone);
                        }}
                        onDeleteZone={(id) => {
                          const zone = zones.find(z => z.id === id);
                          if (zone) confirmDelete(zone);
                        }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <SimpleZoneRenderer
                    zones={zones}
                    onSelectZone={handleZoneIdSelect}
                    onEditZone={(zoneId) => handleAddEdit(zones.find(z => z.id === zoneId) || null)}
                    onDeleteZone={(zoneId) => confirmDelete(zones.find(z => z.id === zoneId)!)}
                    onCreateZone={() => handleAddEdit(null)}
                    selectedZoneId={selectedZoneId}
                  />
                  

                  

                </div>
              )}
            </CardContent>
          </Card>
          
          {selectedZoneId && (
            <div className="mt-6 p-4 bg-gray-50 rounded-md">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Selected Zone: {zones.find(z => z.id === selectedZoneId)?.name}</h3>
                <div className="space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      const zone = zones.find(z => z.id === selectedZoneId);
                      if (zone) {
                        handleAddEdit(zone);
                      }
                    }}
                  >
                    <Edit2 className="h-4 w-4 mr-2" /> Edit Zone
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-red-500 border-red-200 hover:bg-red-50"
                    onClick={() => {
                      const zone = zones.find(z => z.id === selectedZoneId);
                      if (zone) {
                        confirmDelete(zone);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Delete Zone
                  </Button>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="list-view">
          <div className="flex justify-end mb-4">
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
                <div className="rounded-md border">
                  <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="h-12 px-4 text-left font-medium text-gray-500">Name</th>
                          <th className="h-12 px-4 text-left font-medium text-gray-500">Description</th>
                          <th className="h-12 px-4 text-left font-medium text-gray-500">Area</th>
                          <th className="h-12 px-4 text-left font-medium text-gray-500">Fare Rule</th>
                          <th className="h-12 px-4 text-left font-medium text-gray-500">Status</th>
                          <th className="h-12 px-4 text-left font-medium text-gray-500">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {zones.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-gray-500">
                              No zones found. Click "Add New Zone" to create one.
                            </td>
                          </tr>
                        ) : (
                          zones.map((zone) => {
                            const fareRule = fareRules.find(rule => rule.id === zone.fareRuleId);
                            return (
                              <tr key={zone.id} className="border-b">
                                <td className="p-4 font-medium">{zone.name}</td>
                                <td className="p-4 max-w-[200px] truncate">{zone.description}</td>
                                <td className="p-4">{zone.areaKm2?.toFixed(2) || '-'} km²</td>
                                <td className="p-4">{fareRule?.name || '-'}</td>
                                <td className="p-4">
                                  <div className={`flex items-center gap-1 ${
                                    zone.isActive ? 'text-green-600' : 'text-red-500'
                                  }`}>
                                    {zone.isActive ? (
                                      <CheckCircle className="h-4 w-4" />
                                    ) : (
                                      <XCircle className="h-4 w-4" />
                                    )}
                                    <span className="capitalize">{zone.isActive ? 'Active' : 'Inactive'}</span>
                                  </div>
                                </td>
                                <td className="p-4">
                                  <div className="flex gap-2">
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      onClick={() => handleAddEdit(zone)}
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="text-red-500 border-red-200 hover:bg-red-50"
                                      onClick={() => confirmDelete(zone)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Add/Edit Zone Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className={drawingMode ? "sm:max-w-5xl" : "sm:max-w-xl"}>
          <DialogHeader>
            <DialogTitle>{currentZone?.id ? 'Edit' : 'Add'} Zone</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Zone Name</Label>
                  <Input
                    id="name"
                    value={currentZone?.name || ''}
                    onChange={(e) => setCurrentZone(curr => curr ? {...curr, name: e.target.value} : null)}
                    placeholder="e.g. Downtown"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={currentZone?.description || ''}
                    onChange={(e) => setCurrentZone(curr => curr ? {...curr, description: e.target.value} : null)}
                    placeholder="Description (optional)"
                    rows={2}
                  />
                </div>
                
                <div>
                  <Label htmlFor="fareRule">Applicable Fare Rule</Label>
                  <Select
                    value={currentZone?.fareRuleId || ''}
                    onValueChange={(value) => setCurrentZone(curr => curr ? {...curr, fareRuleId: value} : null)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select fare rule" />
                    </SelectTrigger>
                    <SelectContent>
                      {fareRules.map((rule) => (
                        <SelectItem key={rule.id} value={rule.id}>
                          {rule.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="color">Zone Color</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="color"
                      type="color"
                      value={currentZone?.color || '#ff385c'}
                      onChange={(e) => setCurrentZone(curr => curr ? {...curr, color: e.target.value} : null)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={currentZone?.color || '#ff385c'}
                      onChange={(e) => setCurrentZone(curr => curr ? {...curr, color: e.target.value} : null)}
                      placeholder="#ff385c"
                      className="flex-1"
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={currentZone?.isActive || false}
                    onCheckedChange={(checked) => setCurrentZone(curr => curr ? {...curr, isActive: checked} : null)}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
                
                {currentZone?.areaKm2 && (
                  <div className="p-4 bg-gray-50 rounded-md">
                    <p className="text-sm font-medium">Zone Area</p>
                    <p className="text-xl font-bold">{currentZone.areaKm2.toFixed(2)} km²</p>
                  </div>
                )}
                
                {drawingMode && (
                  <div className="space-y-3">
                    <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200 text-yellow-800 text-sm mt-4">
                      <p className="font-medium">Drawing Mode Active</p>
                      <ol className="list-decimal pl-5 mt-2 space-y-1">
                        <li>Click on the map to add points (minimum 3 points needed)</li>
                        <li>Click near the first point to close the polygon</li>
                        <li>Or press Enter key to finish drawing</li>
                      </ol>
                      
                      <div className="mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={createDefaultZone}
                          className="w-full border-yellow-300 bg-yellow-100 hover:bg-yellow-200 text-yellow-800"
                        >
                          Create Default Square Zone
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {drawingMode && (
                <div className="h-[400px]">
                  <Label className="mb-2 block">Draw Zone on Map</Label>
                  <div className="relative h-full flex items-center justify-center bg-gray-50 rounded-md">
                    <div className="text-center p-6">
                      <Map className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Drawing Mode</h3>
                      <p className="text-gray-600 mb-4">
                        Zone drawing functionality is being updated to use Google Maps.
                      </p>
                      <p className="text-sm text-gray-500">
                        For now, please use the "Create Default Square Zone" option or manually enter coordinates.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsDialogOpen(false);
                  setDrawingMode(false);
                }}
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
                  (currentZone?.id ? 'Update' : 'Add') + ' Zone'
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
            <DialogTitle>Delete Zone</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{zoneToDelete?.name}"? This action cannot be undone.
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
    </div>
  );
};

export default ZonesManager; 