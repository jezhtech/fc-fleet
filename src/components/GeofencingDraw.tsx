import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { Button } from '@/components/ui/button';
import { 
  Circle, 
  Square, 
  Trash, 
  Redo, 
  Undo, 
  Hand, 
  Edit, 
  Map as MapIcon,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import MapboxMap from './MapboxMap';
import * as turf from '@turf/turf';
import SimpleZoneRenderer from './SimpleZoneRenderer';
import { Zone } from '@/lib/firebaseModels';
import { toast } from '@/components/ui/use-toast';

interface GeofencingDrawProps {
  existingZones?: GeoJSON.FeatureCollection;
  onZoneCreate?: (feature: GeoJSON.Feature) => void;
  onZoneUpdate?: (feature: GeoJSON.Feature) => void;
  onZoneDelete?: (feature: GeoJSON.Feature) => void;
  onZoneSelect?: (feature: GeoJSON.Feature) => void;
  readOnly?: boolean;
  isDialog?: boolean;
  userHasPermissions: boolean;
  initialCenter: [number, number];
  initialZoom: number;
  mapContainerRef: React.RefObject<HTMLDivElement>;
  drawStyles: any[];
  fetchZones: () => Promise<GeoJSON.FeatureCollection>;
}

// Core drawing styles - enhanced for better visibility
const BASIC_DRAW_STYLES = [
  // Base fill - added more opacity for better visibility
  {
    'id': 'gl-draw-polygon-fill',
    'type': 'fill',
    'filter': ['all', ['==', '$type', 'Polygon']],
    'paint': {
      'fill-color': ['get', 'color'],
      'fill-outline-color': ['get', 'color'],
      'fill-opacity': 0.3
    }
  },
  // Stroke - made thicker
  {
    'id': 'gl-draw-polygon-stroke',
    'type': 'line',
    'filter': ['all', ['==', '$type', 'Polygon']],
    'layout': {
      'line-cap': 'round',
      'line-join': 'round'
    },
    'paint': {
      'line-color': ['get', 'color'],
      'line-width': 2.5,
      'line-opacity': 0.8
    }
  },
  // Selected fill
  {
    'id': 'gl-draw-polygon-fill-active',
    'type': 'fill',
    'filter': ['all', ['==', '$type', 'Polygon'], ['==', 'active', 'true']],
    'paint': {
      'fill-color': '#0080ff',
      'fill-outline-color': '#0080ff',
      'fill-opacity': 0.4
    }
  },
  // Selected stroke
  {
    'id': 'gl-draw-polygon-stroke-active',
    'type': 'line',
    'filter': ['all', ['==', '$type', 'Polygon'], ['==', 'active', 'true']],
    'layout': {
      'line-cap': 'round',
      'line-join': 'round'
    },
    'paint': {
      'line-color': '#0080ff',
      'line-dasharray': [0.2, 2],
      'line-width': 3
    }
  },
  // Vertex points
  {
    'id': 'gl-draw-point',
    'type': 'circle',
    'filter': ['all', ['==', '$type', 'Point'], ['==', 'meta', 'vertex']],
    'paint': {
      'circle-radius': 5,
      'circle-color': '#ffffff',
      'circle-stroke-color': '#0080ff',
      'circle-stroke-width': 2
    }
  }
];

export default function GeofencingDraw({
  existingZones,
  onZoneCreate,
  onZoneUpdate,
  onZoneDelete,
  onZoneSelect,
  readOnly = false,
  isDialog = false,
  userHasPermissions,
  initialCenter,
  initialZoom,
  mapContainerRef,
  drawStyles,
  fetchZones
}: GeofencingDrawProps) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const drawRef = useRef<MapboxDraw | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [initializationAttempts, setInitializationAttempts] = useState(0);
  const [mapFullyLoaded, setMapFullyLoaded] = useState(false);
  const [zonesAddedToMap, setZonesAddedToMap] = useState(0);
  const [showRefreshPrompt, setShowRefreshPrompt] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const [zones, setZones] = useState<GeoJSON.FeatureCollection | undefined>(existingZones);
  const [drawMode, setDrawMode] = useState<string | null>(null);

  // Function to handle draw creation
  const handleDrawCreate = (e: { features: GeoJSON.Feature[] }) => {
    console.log('Draw create event triggered:', e);
    
    if (e.features.length > 0) {
      const createdFeature = e.features[0];
      console.log('Created feature:', createdFeature);
      
      if (onZoneCreate) {
        onZoneCreate(createdFeature);
        
        // Reset the drawing mode after creating a feature
        if (drawRef.current && isDialog) {
          setTimeout(() => {
            drawRef.current?.changeMode('simple_select');
            setDrawMode('simple_select');
            
            // Show success toast
            toast({
              title: "Polygon Created",
              description: "Zone shape drawn successfully! You can now customize its properties.",
              duration: 3000,
            });
          }, 100);
        }
      }
    }
  };
  
  // Add missing event handlers
  const handleDrawUpdate = (e: { features: GeoJSON.Feature[] }) => {
    console.log('Draw update event triggered:', e);
    
    if (e.features.length > 0) {
      const updatedFeature = e.features[0];
      console.log('Updated feature:', updatedFeature);
      
      if (onZoneUpdate && updatedFeature.id) {
        onZoneUpdate(updatedFeature);
      }
    }
  };
  
  const handleDrawDelete = (e: { features: GeoJSON.Feature[] }) => {
    console.log('Draw delete event triggered:', e);
    
    if (e.features.length > 0) {
      const deletedFeature = e.features[0];
      console.log('Deleted feature:', deletedFeature);
      
      if (onZoneDelete && deletedFeature.id) {
        onZoneDelete(deletedFeature);
      }
    }
  };
  
  const handleSelectionChange = (e: { features: GeoJSON.Feature[] }) => {
    console.log('Selection change:', e);
    
    if (e.features.length > 0) {
      const selectedFeature = e.features[0];
      
      if (onZoneSelect) {
        onZoneSelect(selectedFeature);
      }
    }
  };

  // Update the loadExistingZones function to be more reliable
  const loadExistingZones = () => {
    if (!mapRef.current || !drawRef.current || !zones) {
      console.warn('Cannot load zones - prerequisites not met:', {
        hasMap: Boolean(mapRef.current),
        hasDrawTool: Boolean(drawRef.current),
        hasZones: Boolean(zones),
        mapFullyLoaded,
        featureCount: zones?.features?.length || 0
      });
      setShowRefreshPrompt(true);
      return;
    }
    
    try {
      console.log('Loading existing zones to map...');
      
      // Skip if no features
      if (!zones.features || !zones.features.length) {
        console.log('No zones to load on map');
        return;
      }
      
      console.log(`Attempting to load ${zones.features.length} zones to map`);
      
      // First check if zones are already loaded
      try {
        const existingFeatures = drawRef.current.getAll();
        if (existingFeatures.features.length > 0) {
          console.log(`Map already has ${existingFeatures.features.length} features, clearing first`);
        }
        
        // Always clear existing features to avoid duplicates
        drawRef.current.deleteAll();
      } catch (err) {
        console.warn('Error checking or clearing existing features:', err);
      }
      
      // Ensure sufficient delay before adding features
      setTimeout(() => {
        try {
          let addedCount = 0;
          
          // Add features individually for better error isolation
          zones.features.forEach((feature, idx) => {
            try {
              if (feature && feature.geometry) {
                // Create a clean feature object to avoid reference issues
                const cleanFeature: GeoJSON.Feature = {
                  type: 'Feature',
                  id: feature.id || `feature-${idx}`,
                  properties: { 
                    ...feature.properties,
                    color: feature.properties?.color || '#ff385c',
                    user_zoneId: feature.properties?.user_zoneId || feature.id || `zone-${idx}`
                  },
                  geometry: {
                    type: 'Polygon',
                    coordinates: feature.geometry.type === 'Polygon' && 
                      'coordinates' in feature.geometry ? 
                      JSON.parse(JSON.stringify(feature.geometry.coordinates)) : 
                      [[]]
                  } as GeoJSON.Polygon
                };
                
                // Ensure valid ID
                if (!cleanFeature.id) {
                  cleanFeature.id = `zone-${idx}-${Date.now()}`;
                }
                
                // Ensure geometry is properly formatted
                if (cleanFeature.geometry.type !== 'Polygon') {
                  console.warn(`Feature ${idx} has invalid geometry type: ${cleanFeature.geometry.type}, skipping...`);
                  return;
                }
                
                // Ensure valid coordinates structure
                const polygon = cleanFeature.geometry as GeoJSON.Polygon;
                if (!polygon.coordinates || !Array.isArray(polygon.coordinates) || polygon.coordinates.length === 0) {
                  console.warn(`Feature ${idx} has invalid coordinates structure, skipping...`);
                  return;
                }
                
                // Use the MapboxDraw add method directly
                const result = drawRef.current.add(cleanFeature);
                
                if (result && result.length > 0) {
                  console.log(`Successfully added feature ${idx} to map`);
                  addedCount++;
                } else {
                  console.warn(`Failed to add feature ${idx} to map:`, cleanFeature);
                }
              }
            } catch (featureErr) {
              console.error(`Error adding feature ${idx} to map:`, featureErr);
            }
          });
          
          console.log(`Successfully added ${addedCount} of ${zones.features.length} zones to map`);
          setZonesAddedToMap(addedCount);
          
          if (addedCount === 0 && zones.features.length > 0) {
            setError('Failed to display zones on map. Try refreshing the map.');
            setShowRefreshPrompt(true);
          }
        } catch (drawErr) {
          console.error('Error adding features to draw:', drawErr);
          setError(`Failed to display zones: ${drawErr instanceof Error ? drawErr.message : String(drawErr)}`);
          setShowRefreshPrompt(true);
        }
      }, 500); // Added delay to ensure map is ready
    } catch (err) {
      console.error('Error in loadExistingZones:', err);
      setError(`Error loading zones: ${err instanceof Error ? err.message : String(err)}`);
      setShowRefreshPrompt(true);
    }
  };
  
  // Update when existingZones prop changes
  useEffect(() => {
    if (existingZones !== zones) {
      console.log('Zones prop updated, setting new zones');
      setZones(existingZones);
    }
  }, [existingZones, zones]);
  
  // Update the reloadZones function for more robust reloading
  const reloadZones = useCallback(() => {
    console.log('Reloading zones...');
    setIsLoading(true);
    setError('');
    setShowRefreshPrompt(false);
    
    // Clear any existing zones from the map
    if (drawRef.current) {
      try {
        drawRef.current.deleteAll();
        console.log('Cleared existing zones from map');
      } catch (err) {
        console.warn('Error clearing zones:', err);
      }
    }
    
    // Reset zones state
    setZonesAddedToMap(0);
    
    // Fetch fresh zones data
    fetchZones().then((freshZones) => {
      console.log('Fetched fresh zones data:', freshZones);
      setZones(freshZones);
      
      // Add a delay to ensure the map is ready
      setTimeout(() => {
        loadExistingZones();
        setIsLoading(false);
      }, 1000);
    }).catch((err) => {
      console.error('Error fetching zones:', err);
      setError('Failed to reload zones');
      setIsLoading(false);
      setShowRefreshPrompt(true);
    });
  }, [fetchZones]);
  
  // Update the refreshZones function to provide immediate user feedback
  const refreshZones = () => {
    setShowRefreshPrompt(false);
    setIsLoading(true);
    
    // Show a toast to indicate zones are being refreshed
    toast({
      title: "Refreshing zones...",
      description: "Please wait while zones are being loaded on the map.",
      duration: 3000,
    });
    
    setTimeout(() => {
      reloadZones();
    }, 500);
  };

  // Set up event listeners and initialize drawing tools when the map loads
  useEffect(() => {
    if (!mapRef.current || !mapFullyLoaded) return;
    
    console.log('Map fully loaded, setting up zones and draw tools');
    
    // Set up drawing tools
    if (!drawRef.current) {
      try {
        drawRef.current = new MapboxDraw({
          displayControlsDefault: false,
          controls: {
            polygon: true,
            trash: true
          },
          defaultMode: 'draw_polygon',
          styles: drawStyles.length > 0 ? drawStyles : BASIC_DRAW_STYLES,
          userProperties: true,
          // Make it easier to close polygons by increasing click buffer
          clickBuffer: 8,  // Increase click buffer for easier point selection
          touchBuffer: 8   // Increase touch buffer for mobile
        });
        
        mapRef.current.addControl(drawRef.current, 'top-left');
        console.log('Added draw control to map');
      } catch (err) {
        console.error('Error setting up draw tools:', err);
        setError('Failed to initialize drawing tools');
        return;
      }
    }
    
    try {
      // Set up event handlers
      mapRef.current.on('draw.create', handleDrawCreate);
      mapRef.current.on('draw.update', handleDrawUpdate);
      mapRef.current.on('draw.delete', handleDrawDelete);
      mapRef.current.on('draw.selectionchange', handleSelectionChange);
      
      console.log('Set up draw event handlers');
      
      // Load the zones after a delay
      setTimeout(() => {
        if (zones) {
          loadExistingZones();
        } else if (fetchZones) {
          refreshZones();
        }
      }, 500);
      
      // Set up an interval to retry loading zones if none were added initially
      const zoneCheckInterval = setInterval(() => {
        if (drawRef.current) {
          const currentFeatures = drawRef.current.getAll();
          if (currentFeatures.features.length === 0 && zones && zones.features && zones.features.length > 0) {
            console.log('No zones visible, attempting to reload...');
            loadExistingZones();
          } else if (currentFeatures.features.length > 0) {
            console.log(`${currentFeatures.features.length} zones loaded successfully, clearing interval`);
            clearInterval(zoneCheckInterval);
          }
        }
      }, 2000);
      
      // Clean up the interval after 20 seconds (10 attempts)
      setTimeout(() => {
        clearInterval(zoneCheckInterval);
      }, 20000);
      
      // Clean up event handlers on unmount
      return () => {
        if (mapRef.current) {
          mapRef.current.off('draw.create', handleDrawCreate);
          mapRef.current.off('draw.update', handleDrawUpdate);
          mapRef.current.off('draw.delete', handleDrawDelete);
          mapRef.current.off('draw.selectionchange', handleSelectionChange);
        }
        clearInterval(zoneCheckInterval);
      };
    } catch (err) {
      console.error('Error setting up map events:', err);
      setError('Failed to initialize map events');
    }
  }, [mapFullyLoaded, zones]);

  // Handle MapboxMap load event
  const handleMapLoaded = (map: mapboxgl.Map) => {
    console.log('Map loaded callback triggered');
    mapRef.current = map;
    setMapFullyLoaded(true);
    
    try {
      // Create a very basic MapboxDraw instance with minimal configuration
      const draw = new MapboxDraw({
        // Use minimal configuration for reliability
        displayControlsDefault: false, // Don't show default controls
        controls: {
          polygon: true,  // Enable polygon drawing tool
          trash: true     // Enable delete tool
        },
        // Don't set default mode here - we'll set it explicitly later
        
        // Use consistent styling for better visibility
        styles: [
          // Polygon fill when drawing or editing
          {
            'id': 'gl-draw-polygon-fill',
            'type': 'fill',
            'filter': ['all', ['==', '$type', 'Polygon']],
            'paint': {
              'fill-color': '#ff385c',
              'fill-outline-color': '#ff385c',
              'fill-opacity': 0.3
            }
          },
          // Polygon outline when drawing or editing
          {
            'id': 'gl-draw-polygon-stroke',
            'type': 'line',
            'filter': ['all', ['==', '$type', 'Polygon']],
            'paint': {
              'line-color': '#ff385c',
              'line-width': 3,
              'line-opacity': 0.7
            }
          },
          // Vertex points - make these very visible
          {
            'id': 'gl-draw-point',
            'type': 'circle',
            'filter': ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point']],
            'paint': {
              'circle-radius': 6,
              'circle-color': '#fff',
              'circle-stroke-color': '#ff385c',
              'circle-stroke-width': 2
            }
          },
          // Highlight first point to help close polygon
          {
            'id': 'gl-draw-point-first',
            'type': 'circle',
            'filter': ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point'], ['==', 'point_index', 0]],
            'paint': {
              'circle-radius': 8,
              'circle-color': '#ff385c',
              'circle-stroke-color': '#fff',
              'circle-stroke-width': 2
            }
          },
          // Mid-points for editing existing shapes
          {
            'id': 'gl-draw-point-mid',
            'type': 'circle',
            'filter': ['all', ['==', 'meta', 'midpoint'], ['==', '$type', 'Point']],
            'paint': {
              'circle-radius': 4,
              'circle-color': '#fff',
              'circle-stroke-color': '#ff385c',
              'circle-stroke-width': 1
            }
          },
          // Style for polygon while actively drawing
          {
            'id': 'gl-draw-polygon-fill-active',
            'type': 'fill',
            'filter': ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
            'paint': {
              'fill-color': '#ff385c',
              'fill-outline-color': '#ff385c',
              'fill-opacity': 0.3
            }
          },
          // Style for polygon outline while actively drawing
          {
            'id': 'gl-draw-polygon-stroke-active',
            'type': 'line',
            'filter': ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
            'layout': {
              'line-cap': 'round',
              'line-join': 'round'
            },
            'paint': {
              'line-color': '#ff385c',
              'line-width': 4,
              'line-opacity': 0.9
            }
          }
        ]
      });

      // Add the drawing controls to the map
      map.addControl(draw, 'top-left');
      drawRef.current = draw;
      console.log('Draw control initialized successfully');
      
      // Set up event handlers - keep these simple
      map.on('draw.create', handleDrawCreate);
      map.on('draw.update', handleDrawUpdate);
      map.on('draw.delete', handleDrawDelete);
      map.on('draw.selectionchange', handleSelectionChange);
      map.on('draw.modechange', (e: any) => {
        console.log('Draw mode changed:', e.mode);
        setDrawMode(e.mode);
      });
      
      // Explicitly start in draw_polygon mode if this is a dialog
      if (isDialog && !readOnly) {
        setTimeout(() => {
          console.log('Setting draw mode to draw_polygon');
          draw.changeMode('draw_polygon');
          setDrawMode('draw_polygon');
          
          // We don't need this toast as we have instructions in the UI
          // toast({
          //   title: "Drawing Mode Active",
          //   description: "Click at least 3 points on the map. Click the first point again to complete.",
          //   duration: 5000,
          // });
        }, 500);
      }
      
      // Attempt to load zones after a short delay
      setTimeout(() => {
        if (zones && zones.features && zones.features.length > 0) {
          loadExistingZones();
        } else if (fetchZones) {
          refreshZones();
        }
      }, 500);
    } catch (err) {
      console.error('Error initializing draw control:', err);
      setError('Failed to initialize drawing tools');
    }
  };

  // Update changeMode function to provide better feedback
  const changeMode = (mode: string) => {
    try {
      if (!drawRef.current || !mapRef.current || readOnly) return;
      
      console.log('Changing drawing mode to:', mode);
      drawRef.current.changeMode(mode);
      setDrawMode(mode);
      
      // We don't need this toast as we have instructions in the UI
      // if (mode === 'draw_polygon' && mapRef.current) {
      //   toast({
      //     title: "Drawing Mode Active",
      //     description: "Click to add at least 3 points. If you can't place the 3rd point, try using the 'Create Default Zone' button.",
      //     duration: 5000,
      //   });
      // }
    } catch (err) {
      console.error('Error changing drawing mode:', err);
      setError('Failed to change drawing mode');
    }
  };
  
  // Add the missing deleteSelected function
  const deleteSelected = () => {
    try {
      if (!drawRef.current || !mapRef.current || readOnly) return;
      
      console.log('Deleting selected features');
      
      const selectedIds = drawRef.current.getSelectedIds();
      if (selectedIds.length > 0) {
        console.log(`Deleting ${selectedIds.length} selected features:`, selectedIds);
        
        // Store features before deletion for potential callbacks
        const selectedFeatures = selectedIds.map(id => {
          const feature = drawRef.current?.get(id);
          return feature;
        }).filter(Boolean);
        
        // Delete features
        selectedIds.forEach(id => {
          drawRef.current?.delete(id);
        });
        
        // Notify about deleted features
        if (onZoneDelete && selectedFeatures.length > 0) {
          selectedFeatures.forEach(feature => {
            if (feature) {
              onZoneDelete(feature);
            }
          });
        }
        
        console.log('Features deleted successfully');
      } else {
        console.log('No features selected for deletion');
      }
    } catch (err) {
      console.error('Error deleting selected features:', err);
      setError('Failed to delete selected features');
    }
  };
  
  // Improve useEffect for zone loading with a more robust approach
  useEffect(() => {
    // Only attempt to load zones when both the map is ready and we have zones to display
    if (mapFullyLoaded && existingZones && existingZones.features && existingZones.features.length > 0) {
      console.log('Map is loaded and zones are available, loading zones to map...');
      
      // Use a slightly longer delay to ensure the map is fully initialized
      const loadTimer = setTimeout(() => {
        loadExistingZones();
        
        // Set up a verification check to ensure zones were actually added
        setTimeout(() => {
          try {
            if (drawRef.current) {
              const currentFeatures = drawRef.current.getAll();
              console.log(`Verification check: Map has ${currentFeatures.features.length} features`);
              
              // If no features were added but we expected some, try one more time
              if (currentFeatures.features.length === 0 && existingZones.features.length > 0) {
                console.warn('Zones not visible after initial load, attempting one more time...');
                loadExistingZones();
              }
            }
          } catch (err) {
            console.error('Error in verification check:', err);
          }
        }, 1000);
      }, 1200); // Increased delay for more reliable loading
      
      return () => clearTimeout(loadTimer);
    }
  }, [mapFullyLoaded, existingZones]);
  
  // Function to activate fallback renderer
  const activateFallback = () => {
    console.log('Activating fallback zone renderer');
    setUseFallback(true);
  };
  
  // Reset error state
  const handleResetError = () => {
    setError(null);
    window.location.reload();
  };
  
  // Show fallback after timeout if map hasn't loaded
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      if (!mapFullyLoaded) {
        console.warn('Map taking too long to load, activating fallback');
        setError('Map taking too long to load');
        activateFallback();
      }
    }, 10000);
    
    return () => clearTimeout(fallbackTimer);
  }, [mapFullyLoaded]);
  
  // Add function to check map state
  const checkAndDebugMapState = () => {
    console.log("Checking map state...");
    console.log("Map reference exists:", Boolean(mapRef.current));
    console.log("Draw reference exists:", Boolean(drawRef.current));
    console.log("Map fully loaded:", mapFullyLoaded);
    console.log("Zones data available:", Boolean(zones && zones.features && zones.features.length > 0));
    
    if (!mapRef.current) {
      console.error("Map reference is null - map was not initialized properly");
      setError("Map failed to initialize properly. Please try reloading the page.");
      return false;
    }
    
    if (!drawRef.current) {
      console.error("Draw reference is null - drawing tools were not initialized");
      setError("Drawing tools failed to initialize. Please try reloading the page.");
      return false;
    }
    
    return true;
  };
  
  // Add a useEffect to check map status after component mounts
  useEffect(() => {
    // Check map status after a delay
    const checkTimer = setTimeout(() => {
      if (!mapFullyLoaded && !useFallback) {
        console.warn("Map not loaded after timeout, checking state...");
        if (checkAndDebugMapState() === false) {
          console.error("Map failed to initialize properly, activating fallback");
          setUseFallback(true);
        }
      }
    }, 5000);
    
    return () => clearTimeout(checkTimer);
  }, [mapFullyLoaded, useFallback]);
  
  // Use this to monitor for mapbox errors
  useEffect(() => {
    const handleGlobalMapErrors = (event: ErrorEvent) => {
      if (event.message && (
        event.message.includes('mapbox') || 
        event.message.includes('map') || 
        event.message.includes('gl')
      )) {
        console.error("Caught Mapbox-related error:", event);
        setError(`Map error: ${event.message}`);
      }
    };
    
    window.addEventListener('error', handleGlobalMapErrors);
    
    return () => {
      window.removeEventListener('error', handleGlobalMapErrors);
    };
  }, []);
  
  // Add a function to help users complete their polygon
  const tryCompletePolygon = () => {
    if (!drawRef.current || !mapRef.current) return;
    
    try {
      // Get the current feature being drawn
      const currentFeatures = drawRef.current.getAll().features;
      
      // Find any feature in drawing mode
      const incompleteFeatures = currentFeatures.filter(f => 
        f.properties && f.properties.mode === 'draw_polygon'
      );
      
      if (incompleteFeatures.length > 0) {
        // Try to close the polygon
        drawRef.current.changeMode('simple_select');
        console.log('Attempting to complete polygon drawing');
        
        toast({
          title: "Drawing Completed",
          description: "We've completed your polygon. You can still edit it if needed.",
          duration: 3000,
        });
      } else {
        console.log('No incomplete polygons found to complete');
      }
    } catch (err) {
      console.error('Error completing polygon:', err);
    }
  };
  
  // Create a simple square zone as a fallback if drawing fails
  const createSimpleZone = () => {
    if (!drawRef.current || !mapRef.current) return;
    
    try {
      // Get the center of the current map view
      const center = mapRef.current.getCenter();
      
      // Create a square around the center point
      const kilometers = 1; // 1km square
      const distanceLat = kilometers / 111.2; // rough conversion
      const distanceLng = kilometers / (111.2 * Math.cos(center.lat * Math.PI / 180));
      
      // Create the coordinates for a square
      const coords = [
        [center.lng - distanceLng, center.lat - distanceLat],
        [center.lng + distanceLng, center.lat - distanceLat],
        [center.lng + distanceLng, center.lat + distanceLat],
        [center.lng - distanceLng, center.lat + distanceLat],
        [center.lng - distanceLng, center.lat - distanceLat] // Close the polygon
      ];
      
      // Create a polygon feature
      const feature = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [coords]
        }
      } as GeoJSON.Feature;
      
      // Add the feature to the map
      if (drawRef.current) {
        drawRef.current.add(feature);
        
        // Trigger the zone create callback
        if (onZoneCreate) {
          onZoneCreate(feature as GeoJSON.Feature<GeoJSON.Polygon>);
          
          toast({
            title: "Default Zone Created",
            description: "We've created a default square zone. You can edit its shape if needed.",
            duration: 3000,
          });
        }
      }
    } catch (err) {
      console.error('Error creating simple zone:', err);
    }
  };
  
  // Main render
  if (useFallback || error) {
    // Render SimpleZoneRenderer as fallback
    return (
      <div className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-800">Map Error</h3>
                <p className="text-red-600 text-sm mt-1">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => window.location.reload()}
                >
                  Reload Map
                </Button>
              </div>
            </div>
          </div>
        )}
        
        <SimpleZoneRenderer 
          zones={(zones?.features || []).map(feature => ({
            id: String(feature.id || feature.properties?.user_zoneId || `zone-${Math.random().toString(36).substr(2, 9)}`),
            name: feature.properties?.name || 'Unnamed Zone',
            description: feature.properties?.description || '',
            color: feature.properties?.color || '#ff385c',
            isActive: feature.properties?.isActive || true,
            coordinates: feature.geometry as GeoJSON.Polygon,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            fareRuleId: feature.properties?.fareRuleId || ''
          }))}
          selectedZoneId={String(zones?.features.find(f => f.properties?.isActive)?.id || '')}
          onSelectZone={(zoneId) => {
            if (onZoneSelect && zoneId) {
              // Find the feature by ID and pass it to onZoneSelect
              const feature = zones?.features.find(f => 
                String(f.id) === zoneId || 
                String(f.properties?.user_zoneId) === zoneId
              );
              if (feature) {
                onZoneSelect(feature);
              }
            }
          }}
          onCreateZone={() => {
            if (onZoneCreate) {
              // Create a default polygon as fallback
              const center = [55.2708, 25.2048]; // Default to Dubai
              const radius = 1; // 1km radius
              const options = { units: 'kilometers' as const, steps: 64 };
              
              const circle = turf.circle(center, radius, options);
              
              onZoneCreate({
                type: 'Feature',
                properties: {},
                geometry: circle.geometry
              } as GeoJSON.Feature);
            }
          }}
        />
      </div>
    );
  }
  
  return (
    <div className="geofencing-draw-container">
      {/* Error display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md mb-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-red-700 font-medium">{error}</p>
          </div>
          {showRefreshPrompt && (
            <div className="mt-2 flex justify-end">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={refreshZones}
                className="mr-2"
              >
                Retry Loading Zones
              </Button>
              <Button 
                size="sm"
                variant="destructive"
                onClick={handleResetError}
              >
                Refresh Map
              </Button>
            </div>
          )}
        </div>
      )}
      
      {/* Drawing help panel */}
      {isDialog && !readOnly && !error && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md mb-3">
          <div className="flex justify-between items-start">
            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 p-1 rounded-full mt-1">
                <MapIcon className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <span className="text-sm font-medium text-blue-800 block mb-1">
                  Drawing Instructions:
                </span>
                <ol className="text-xs text-blue-700 pl-4 list-decimal">
                  <li className="mb-0.5">Click multiple places on the map (minimum 3 points)</li>
                  <li className="mb-0.5">Look for the larger highlighted first point</li>
                  <li className="mb-0.5">Click near the first point to close and complete your shape</li>
                </ol>
              </div>
            </div>
            <div>
              <Button 
                size="sm" 
                variant="outline" 
                className={`${drawMode === 'draw_polygon' ? 'bg-blue-100 border-blue-300' : 'bg-white'}`}
                onClick={() => changeMode('draw_polygon')}
              >
                <Square className="h-3 w-3 mr-1" />
                {drawMode === 'draw_polygon' ? 'Drawing Active' : 'Start Drawing'}
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Map container */}
      <div className="relative">
        <MapboxMap
          initialCoordinates={initialCenter}
          initialZoom={initialZoom}
          height={isDialog ? "400px" : "600px"}
          width="100%"
          onMapLoaded={handleMapLoaded}
          className="rounded-md overflow-hidden border"
        />
        
        {/* Draw controls overlay - positioned at top-right */}
        {!readOnly && mapFullyLoaded && (
          <div className="absolute top-2 right-2 bg-white p-2 rounded-md shadow-md flex flex-col space-y-2 z-10">
            <Button 
              size="icon" 
              variant="outline" 
              className={`h-8 w-8 ${drawMode === 'draw_polygon' ? 'bg-blue-100 border-blue-300' : ''}`}
              onClick={() => changeMode('draw_polygon')}
              title="Draw Polygon"
            >
              <Square className="h-4 w-4" />
            </Button>
            <Button 
              size="icon" 
              variant="outline" 
              className={`h-8 w-8 ${drawMode === 'simple_select' ? 'bg-blue-100' : ''}`}
              onClick={() => changeMode('simple_select')}
              title="Select Mode"
            >
              <Hand className="h-4 w-4" />
            </Button>
            <Button 
              size="icon" 
              variant="outline" 
              className={`h-8 w-8 ${drawMode === 'direct_select' ? 'bg-blue-100' : ''}`}
              onClick={() => changeMode('direct_select')}
              title="Edit Mode"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              size="icon" 
              variant="outline" 
              className="h-8 w-8 text-red-500"
              onClick={deleteSelected}
              title="Delete Selected"
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        {/* Drawing point counter - positioned at top-center */}
        {drawMode === 'draw_polygon' && (
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-white px-3 py-1 rounded-full shadow-md z-10 text-sm font-medium border border-gray-200">
            Drawing Zone: Click to add points (min 3)
          </div>
        )}
        
        {/* Control buttons - position at the bottom of the map with proper spacing */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-between px-4 z-10">
          {/* Create Default Zone button - left side */}
          {isDialog && drawMode === 'draw_polygon' && (
            <Button
              variant="secondary"
              className="bg-white shadow-md border border-gray-200 hover:bg-yellow-50"
              onClick={createSimpleZone}
            >
              <Square className="h-4 w-4 mr-2 text-yellow-500" />
              <span>Create Default Square</span>
            </Button>
          )}
          
          {/* Empty div for spacing when only one button is showing */}
          {!(isDialog && drawMode === 'draw_polygon') && <div></div>}
          
          {/* Complete drawing button - right side */}
          {drawMode === 'draw_polygon' && (
            <Button
              variant="secondary"
              className="bg-white shadow-md border border-gray-200 hover:bg-green-50"
              onClick={tryCompletePolygon}
            >
              <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
              <span>Complete Drawing</span>
            </Button>
          )}
        </div>
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-20">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-fleet-red"></div>
              <p className="mt-2 text-gray-600">Loading zones...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}