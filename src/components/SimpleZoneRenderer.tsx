import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import { AlertTriangle } from "lucide-react";
import { Zone } from "@/types";
import { useGoogleMapsToken } from "@/hooks/useGoogleMapsToken";
import { googleMapsService } from "@/services/googleMapsService";

interface ZoneMapEditorProps {
  zoneCoordinates: Zone["coordinates"] | null | undefined;
  zoneColor: Zone["color"] | null | undefined;
  onPolygonComplete: (polygon: GeoJSON.Feature<GeoJSON.Polygon>) => void;
  isDrawing: boolean;
}

const ZoneMapEditor: React.FC<ZoneMapEditorProps> = ({
  zoneCoordinates,
  zoneColor,
  onPolygonComplete,
  isDrawing,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const drawingManager = useRef<google.maps.drawing.DrawingManager | null>(
    null,
  );
  const polygons = useRef<google.maps.Polygon[]>([]);
  const isInitializing = useRef(false);

  const { token, isInitialized, error: tokenError } = useGoogleMapsToken();

  useEffect(() => {
    if (tokenError) {
      setError(`Google Maps token error: ${tokenError}`);
    }
  }, [tokenError]);

  const cleanup = useCallback(() => {
    // Clean up existing polygons
    polygons.current.forEach((polygon) => {
      if (polygon) {
        polygon.setMap(null);
      }
    });
    polygons.current = [];

    // Clean up drawing manager
    if (drawingManager.current) {
      google.maps.event.clearInstanceListeners(drawingManager.current);
      drawingManager.current.setMap(null);
      drawingManager.current = null;
    }

    // Clean up map
    if (map.current) {
      google.maps.event.clearInstanceListeners(map.current);
      map.current = null;
    }

    setIsMapReady(false);
  }, []);

  const initializeMap = useCallback(async () => {
    if (
      !mapContainer.current ||
      !token ||
      !isInitialized ||
      isInitializing.current
    ) {
      return;
    }

    isInitializing.current = true;
    setError(null);

    try {
      // Clean up any existing instances first
      cleanup();

      // Initialize Google Maps service with drawing library
      // Note: If already initialized without drawing library, we'll get a warning but continue
      await googleMapsService.initialize({
        apiKey: token,
        libraries: ["drawing", "geometry"], // Include both drawing and geometry libraries
      });

      // Get the Google Maps instance
      const google = googleMapsService.getGoogle();
      if (!google) {
        throw new Error("Google Maps not available");
      }

      // Verify that the drawing library is loaded
      if (!google.maps.drawing) {
        console.error(
          "Loaded libraries:",
          googleMapsService.getLoadedLibraries(),
        );
        throw new Error("Google Maps drawing library not loaded");
      }

      // Create map using the service
      const newMap = await googleMapsService.createMap(mapContainer.current, {
        center: { lat: 25.2048, lng: 55.2708 }, // Dubai center
        zoom: 10,
        mapTypeId: "roadmap",
      });

      map.current = newMap;

      // Wait for map to be ready
      await new Promise<void>((resolve) => {
        const checkMapReady = () => {
          if (newMap.getDiv() && newMap.getDiv().offsetWidth > 0) {
            resolve();
          } else {
            setTimeout(checkMapReady, 100);
          }
        };
        checkMapReady();
      });

      // Initialize drawing manager
      drawingManager.current = new google.maps.drawing.DrawingManager({
        drawingMode: isDrawing ? google.maps.drawing.OverlayType.POLYGON : null,
        drawingControl: isDrawing,
        drawingControlOptions: {
          position: google.maps.ControlPosition.TOP_CENTER,
          drawingModes: [google.maps.drawing.OverlayType.POLYGON],
        },
        polygonOptions: {
          fillColor: "#ff385c",
          fillOpacity: 0.3,
          strokeWeight: 2,
          strokeColor: "#ff385c",
          clickable: false,
          editable: true,
          zIndex: 1,
        },
      });

      drawingManager.current.setMap(newMap);

      // Add overlay complete listener
      google.maps.event.addListener(
        drawingManager.current,
        "overlaycomplete",
        (event: google.maps.drawing.OverlayCompleteEvent) => {
          if (
            event.type === google.maps.drawing.OverlayType.POLYGON &&
            event.overlay
          ) {
            const newPolygon = event.overlay as google.maps.Polygon;
            const path = newPolygon
              .getPath()
              .getArray()
              .map((p) => [p.lng(), p.lat()]);

            // Ensure polygon is closed
            if (
              path.length > 0 &&
              (path[0][0] !== path[path.length - 1][0] ||
                path[0][1] !== path[path.length - 1][1])
            ) {
              path.push(path[0]);
            }

            const geoJsonFeature: GeoJSON.Feature<GeoJSON.Polygon> = {
              type: "Feature",
              properties: {},
              geometry: {
                type: "Polygon",
                coordinates: [path],
              },
            };

            onPolygonComplete(geoJsonFeature);

            // Reset drawing mode and remove the temporary polygon
            drawingManager.current?.setDrawingMode(null);
            newPolygon.setMap(null);
          }
        },
      );

      setIsMapReady(true);
    } catch (err) {
      console.error("Map initialization error:", err);
      setError(err instanceof Error ? err.message : "Failed to load map");
    } finally {
      isInitializing.current = false;
    }
  }, [token, isInitialized, isDrawing, onPolygonComplete, cleanup]);

  // Initialize map when dependencies change
  useEffect(() => {
    initializeMap();
  }, [initializeMap]);

  // Update drawing mode when isDrawing changes
  useEffect(() => {
    if (drawingManager.current && isMapReady) {
      drawingManager.current.setDrawingMode(
        isDrawing ? google.maps.drawing.OverlayType.POLYGON : null,
      );
      drawingManager.current.setOptions({
        drawingControl: isDrawing,
      });
    }
  }, [isDrawing, isMapReady]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Render existing zone polygons
  useEffect(() => {
    if (!map.current || !isMapReady) return;

    // Clear existing polygons
    polygons.current.forEach((p) => p.setMap(null));
    polygons.current = [];

    if (zoneCoordinates && zoneCoordinates.coordinates.length > 0) {
      const google = googleMapsService.getGoogle();
      if (!google) return;

      const bounds = new google.maps.LatLngBounds();
      const paths = zoneCoordinates.coordinates[0].map((p) => ({
        lat: p[1],
        lng: p[0],
      }));

      paths.forEach((p) => bounds.extend(p));

      const polygon = new google.maps.Polygon({
        paths: paths,
        strokeColor: zoneColor || "#FF0000",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: zoneColor || "#FF0000",
        fillOpacity: 0.35,
        map: map.current,
        clickable: false,
        editable: false,
      });

      polygons.current.push(polygon);

      // Fit bounds to show the zone
      if (!bounds.isEmpty()) {
        map.current.fitBounds(bounds);
      }
    }
  }, [zoneCoordinates, zoneColor, isMapReady]);

  if (error) {
    return (
      <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-primary mx-auto mb-2" />
          <p className="text-primary">{error}</p>
        </div>
      </div>
    );
  }

  return <div ref={mapContainer} className="w-full h-full rounded-lg" />;
};

export default memo(ZoneMapEditor);
