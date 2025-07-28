import React, { useState, useEffect } from "react";
import { Zone } from "@/lib/firebaseModels";
import { createTestZone } from "@/lib/mapUtils";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2 } from "lucide-react";

interface SimpleZoneRendererProps {
  zones: Zone[];
  onSelectZone?: (zoneId: string) => void;
  onCreateZone?: () => void;
  onEditZone?: (zoneId: string) => void;
  onDeleteZone?: (zoneId: string) => void;
  selectedZoneId?: string;
}

const SimpleZoneRenderer: React.FC<SimpleZoneRendererProps> = ({
  zones,
  onSelectZone,
  onCreateZone,
  onEditZone,
  onDeleteZone,
  selectedZoneId,
}) => {
  const [availableZones, setAvailableZones] = useState<Zone[]>([]);

  useEffect(() => {
    // Ensure we have at least the test zone if no zones are provided
    if (zones.length === 0) {
      setAvailableZones([createTestZone()]);
    } else {
      setAvailableZones(zones);
    }
  }, [zones]);

  // Create a simplified SVG map representation
  const renderSvgMap = () => {
    const svgWidth = 600;
    const svgHeight = 400;

    // Generate random positions for zones if no real coordinates
    const zoneElements = availableZones.map((zone, index) => {
      // Calculate a position in the SVG (this is just a visual representation)
      const x = 50 + (index % 3) * 200;
      const y = 50 + Math.floor(index / 3) * 100;
      const width = 150;
      const height = 80;

      // Polygon points for a simple rectangle
      const points = `${x},${y} ${x + width},${y} ${x + width},${
        y + height
      } ${x},${y + height}`;

      // Set color based on selection or use the zone's color if available
      const fillColor =
        selectedZoneId === zone.id ? "#3b82f6" : zone.color || "#ff385c";

      return (
        <g key={zone.id} onClick={() => onSelectZone && onSelectZone(zone.id)}>
          <polygon
            points={points}
            fill={fillColor}
            fillOpacity="0.2"
            stroke={fillColor}
            strokeWidth="2"
            className="cursor-pointer hover:fill-opacity-40 transition-all"
          />
          <text
            x={x + width / 2}
            y={y + height / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#000"
            fontSize="12"
            fontWeight={selectedZoneId === zone.id ? "bold" : "normal"}
          >
            {zone.name || "Unnamed Zone"}
          </text>
        </g>
      );
    });

    return (
      <svg width={svgWidth} height={svgHeight} className="border rounded-md">
        <rect x="0" y="0" width={svgWidth} height={svgHeight} fill="#f8f9fa" />
        {zoneElements}
        <text x="10" y="20" fontSize="12" fill="#666">
          Simple Zone Visualization (Google Maps Alternative)
        </text>
      </svg>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">
          Using simplified zone visualization due to map loading issues
        </p>
        <Button
          className="bg-fleet-red text-white hover:bg-fleet-red/90"
          onClick={onCreateZone}
        >
          <Plus className="h-4 w-4 mr-2" /> Add Zone
        </Button>
      </div>

      <div className="flex justify-center">{renderSvgMap()}</div>

      <div className="bg-gray-50 p-4 rounded-md">
        <h3 className="font-medium mb-2">Available Zones</h3>
        <div className="space-y-2">
          {availableZones.length === 0 ? (
            <p className="text-gray-500">
              No zones available. Create a new zone to get started.
            </p>
          ) : (
            availableZones.map((zone) => (
              <div
                key={zone.id}
                className={`flex justify-between items-center p-3 rounded-md border ${
                  selectedZoneId === zone.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200"
                }`}
                onClick={() => onSelectZone && onSelectZone(zone.id)}
              >
                <div>
                  <span
                    className="inline-block w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: zone.color || "#ff385c" }}
                  />
                  <span className="font-medium">
                    {zone.name || "Unnamed Zone"}
                  </span>
                  {zone.isActive && (
                    <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditZone && onEditZone(zone.id);
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteZone && onDeleteZone(zone.id);
                    }}
                    className="text-red-500 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> This is a simplified visualization for zone
          management. The actual zone coordinates will still be saved correctly
          even though they're displayed as simple shapes here.
        </p>
      </div>
    </div>
  );
};

export default SimpleZoneRenderer;
