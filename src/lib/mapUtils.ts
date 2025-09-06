import { Zone } from "@/types";
import * as turf from "@turf/turf";

/**
 * Validate and fix GeoJSON polygon data
 * This can help debug and fix common issues with polygon data
 */
export const validateAndFixPolygon = (polygon: any): GeoJSON.Polygon | null => {
  try {
    // Check basic structure
    if (!polygon || typeof polygon !== "object") {
      console.error("Polygon is not an object");
      return null;
    }

    // Check if it has a type property and it's a Polygon
    if (!polygon.type || polygon.type !== "Polygon") {
      console.error("Polygon missing type or not a Polygon:", polygon.type);
      return null;
    }

    // Check if it has coordinates
    if (!polygon.coordinates || !Array.isArray(polygon.coordinates)) {
      console.error("Polygon missing coordinates or not an array");
      return null;
    }

    // Check if coordinates is not empty
    if (polygon.coordinates.length === 0) {
      console.error("Polygon coordinates is empty");
      return null;
    }

    // For a Polygon, the first element should be an array of coordinates
    if (!Array.isArray(polygon.coordinates[0])) {
      console.error("First element of polygon coordinates is not an array");
      return null;
    }

    // Check if there are at least 3 points for a valid polygon
    if (polygon.coordinates[0].length < 3) {
      console.error(
        "Polygon needs at least 3 points, has:",
        polygon.coordinates[0].length,
      );
      return null;
    }

    // Check if first and last point are the same (closed polygon)
    const firstPoint = polygon.coordinates[0][0];
    const lastPoint = polygon.coordinates[0][polygon.coordinates[0].length - 1];

    if (!firstPoint || !lastPoint) {
      console.error("First or last point is missing");
      return null;
    }

    const sameFirstLast =
      Array.isArray(firstPoint) &&
      Array.isArray(lastPoint) &&
      firstPoint[0] === lastPoint[0] &&
      firstPoint[1] === lastPoint[1];

    if (!sameFirstLast) {
      console.warn(
        "Polygon is not closed, first and last point are different. Fixing...",
      );
      // Fix by adding first point at the end
      polygon.coordinates[0].push([...polygon.coordinates[0][0]]);
    }

    // Validate with turf.js to ensure it's a valid polygon
    try {
      const valid = turf.booleanValid(polygon);
      if (!valid) {
        console.error("Polygon is not valid according to turf.js");
        return null;
      }
    } catch (err) {
      console.error("Error validating polygon with turf.js:", err);
      return null;
    }

    return polygon as GeoJSON.Polygon;
  } catch (err) {
    console.error("Error validating polygon:", err);
    return null;
  }
};

/**
 * Create a minimal valid zone for testing
 */
export const createTestZone = (): Zone => {
  // Create a simple triangle in Dubai
  const coordinates: GeoJSON.Polygon = {
    type: "Polygon",
    coordinates: [
      [
        [55.2708, 25.2048], // Dubai point 1
        [55.3708, 25.2548], // Dubai point 2
        [55.2908, 25.2648], // Dubai point 3
        [55.2708, 25.2048], // Close the polygon
      ],
    ],
  };

  return {
    id: "test-zone",
    name: "Test Zone",
    description: "A test zone for debugging",
    coordinates,
    color: "#ff385c",
    isActive: true,
    createdAt: Date.now().toString(),
    updatedAt: Date.now().toString(),
    areaKm2: 10, // Approximate
  };
};

/**
 * Checks if a given point (latitude and longitude) lies within a GeoJSON polygon.
 *
 * @param polygon The GeoJSON Polygon object.
 * @param point An object with latitude and longitude ({ lat: number, lng: number }).
 * @returns True if the point is inside the polygon, false otherwise.
 */
export const isPointInPolygon = (
  polygon: GeoJSON.Polygon,
  point: { lat: number; lng: number },
): boolean => {
  if (!polygon || !point) {
    console.error("Invalid input: polygon or point is missing.");
    return false;
  }

  try {
    // Turf.js expects coordinates in [longitude, latitude] format.
    const turfPoint = turf.point([point.lng, point.lat]);

    // The polygon is already a GeoJSON Polygon object, which turf can use.
    return turf.booleanPointInPolygon(turfPoint, polygon);
  } catch (error) {
    console.error("Error checking if point is in polygon:", error);
    return false;
  }
};
