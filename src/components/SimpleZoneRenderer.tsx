import React, { useState, useEffect, useRef } from "react";
import { AlertTriangle } from "lucide-react";
import { Zone } from "@/types";
import { useGoogleMapsToken } from "@/hooks/useGoogleMapsToken";
import { googleMapsService } from "@/services/googleMapsService";

interface ZoneMapEditorProps {
  zoneData: Zone | null;
  onPolygonComplete: (polygon: GeoJSON.Feature<GeoJSON.Polygon>) => void;
  isDrawing: boolean;
}

const ZoneMapEditor: React.FC<ZoneMapEditorProps> = ({
  zoneData,
  onPolygonComplete,
  isDrawing,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const drawingManager = useRef<google.maps.drawing.DrawingManager | null>(
    null,
  );
  const polygons = useRef<google.maps.Polygon[]>([]);

  const { token, isInitialized, error: tokenError } = useGoogleMapsToken();

  useEffect(() => {
    if (tokenError) {
      setError(`Google Maps token error: ${tokenError}`);
    }
  }, [tokenError]);

  const initializeMap = async () => {
    if (!mapContainer.current || !token || !isInitialized) return;

    try {
      await googleMapsService.initialize({
        apiKey: token,
        libraries: ["drawing"],
      });

      const newMap = await googleMapsService.createMap(mapContainer.current!, {
        center: { lat: 25.2048, lng: 55.2708 }, // Dubai center
        zoom: 10,
        mapTypeId: "roadmap",
      });
      map.current = newMap;

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

      drawingManager.current.setMap(map.current);

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

            drawingManager.current?.setDrawingMode(null);
            newPolygon.setMap(null);
          }
        },
      );

      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load map");
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeMap();
  }, [token, isInitialized]);

  useEffect(() => {
    if (drawingManager.current) {
      drawingManager.current.setDrawingMode(
        isDrawing ? google.maps.drawing.OverlayType.POLYGON : null,
      );
    }
  }, [isDrawing]);

  useEffect(() => {
    polygons.current.forEach((p) => p.setMap(null));
    polygons.current = [];

    if (map.current) {
      const bounds = new google.maps.LatLngBounds();

      if (zoneData.coordinates && zoneData.coordinates.coordinates.length > 0) {
        const paths = zoneData.coordinates.coordinates[0].map((p) => ({
          lat: p[1],
          lng: p[0],
        }));
        paths.forEach((p) => bounds.extend(p));

        const polygon = new google.maps.Polygon({
          paths: paths,
          strokeColor: zoneData.color || "#FF0000",
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: zoneData.color || "#FF0000",
          fillOpacity: 0.35,
          map: map.current,
        });
        polygons.current.push(polygon);
      }

      if (!bounds.isEmpty()) {
        map.current.fitBounds(bounds);
      }
    }
  }, [zoneData, map.current]);

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

export default ZoneMapEditor;
