import { FareRule, Zone } from './firebaseModels';
import * as turf from '@turf/turf';

/**
 * Calculate the fare for a ride based on distance, duration, zones, and applicable fare rules
 * 
 * @param distanceKm - Distance of the ride in kilometers
 * @param durationMinutes - Duration of the ride in minutes
 * @param pickupCoordinates - Coordinates of the pickup location [longitude, latitude]
 * @param dropoffCoordinates - Coordinates of the dropoff location [longitude, latitude]
 * @param taxiTypeId - ID of the taxi type
 * @param fareRules - Array of all fare rules from the database
 * @param zones - Array of all zones from the database
 * @param isNightTime - Whether the ride is during night hours (optional)
 * @param isPeakHour - Whether the ride is during peak hours (optional)
 * @returns Object containing the calculated fare and breakdown
 */
export const calculateFare = (
  distanceKm: number,
  durationMinutes: number,
  pickupCoordinates: [number, number],
  dropoffCoordinates: [number, number],
  taxiTypeId: string,
  fareRules: FareRule[],
  zones: Zone[],
  isNightTime = false,
  isPeakHour = false
) => {
  // Create GeoJSON Point for pickup and dropoff
  const pickupPoint = turf.point(pickupCoordinates);
  const dropoffPoint = turf.point(dropoffCoordinates);
  
  // Find the zones containing pickup and dropoff points
  const pickupZone = findZoneForPoint(pickupPoint, zones);
  const dropoffZone = findZoneForPoint(dropoffPoint, zones);
  
  // Find applicable fare rule
  const applicableFareRule = findApplicableFareRule(
    taxiTypeId,
    pickupZone?.id,
    dropoffZone?.id,
    fareRules
  );
  
  if (!applicableFareRule) {
    throw new Error('No applicable fare rule found for this ride');
  }
  
  // Calculate base fare
  let totalFare = applicableFareRule.basePrice;
  
  // Add distance-based fare
  const distanceFare = distanceKm * applicableFareRule.perKmPrice;
  totalFare += distanceFare;
  
  // Add time-based fare
  const timeFare = durationMinutes * applicableFareRule.perMinutePrice;
  totalFare += timeFare;
  
  // Apply surge multiplier if peak hour
  let appliedMultiplier = 1;
  if (isPeakHour) {
    appliedMultiplier = applicableFareRule.surgeMultiplier;
    totalFare *= appliedMultiplier;
  }
  
  // Ensure minimum fare
  if (totalFare < applicableFareRule.minFare) {
    totalFare = applicableFareRule.minFare;
  }
  
  // Round to 2 decimal places
  totalFare = Math.round(totalFare * 100) / 100;
  
  return {
    totalFare,
    breakdown: {
      baseFare: applicableFareRule.basePrice,
      distanceFare,
      timeFare,
      surgeMultiplier: appliedMultiplier,
      minimumFare: applicableFareRule.minFare,
      appliedRule: applicableFareRule.name,
      pickupZone: pickupZone?.name || 'Unknown',
      dropoffZone: dropoffZone?.name || 'Unknown',
    }
  };
};

/**
 * Find which zone contains a given point
 */
export const findZoneForPoint = (
  point: GeoJSON.Feature<GeoJSON.Point>,
  zones: Zone[]
): Zone | null => {
  for (const zone of zones) {
    if (zone.isActive && zone.coordinates) {
      const poly = turf.polygon(zone.coordinates.coordinates);
      if (turf.booleanPointInPolygon(point, poly)) {
        return zone;
      }
    }
  }
  
  return null;
};

/**
 * Find the applicable fare rule based on taxi type and zones
 */
export const findApplicableFareRule = (
  taxiTypeId: string,
  pickupZoneId: string | undefined,
  dropoffZoneId: string | undefined,
  fareRules: FareRule[]
): FareRule | null => {
  // First, try to find a rule that matches both taxi type and both zones
  if (pickupZoneId && dropoffZoneId) {
    const specificRule = fareRules.find(rule => 
      rule.taxiTypeIds.includes(taxiTypeId) &&
      rule.applicableZoneIds.includes(pickupZoneId) &&
      rule.applicableZoneIds.includes(dropoffZoneId)
    );
    
    if (specificRule) return specificRule;
  }
  
  // Next, try to find a rule for this taxi type with at least one matching zone
  if (pickupZoneId || dropoffZoneId) {
    const zoneId = pickupZoneId || dropoffZoneId;
    const zoneRule = fareRules.find(rule => 
      rule.taxiTypeIds.includes(taxiTypeId) &&
      rule.applicableZoneIds.includes(zoneId!)
    );
    
    if (zoneRule) return zoneRule;
  }
  
  // Finally, fall back to a default rule for this taxi type
  const defaultRule = fareRules.find(rule => 
    rule.taxiTypeIds.includes(taxiTypeId) && rule.isDefault
  );
  
  if (defaultRule) return defaultRule;
  
  // If all else fails, return any default rule
  return fareRules.find(rule => rule.isDefault) || null;
}; 