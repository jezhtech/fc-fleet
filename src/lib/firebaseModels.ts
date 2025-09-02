// Firebase data models for the application

// Fare rule model
export interface FareRule {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  perKmPrice: number;
  perHourPrice: number;
  minFare: number;
  isDefault: boolean;
  surgeMultiplier: number;
  createdAt: number;
  updatedAt: number;
  specialConditions?: {
    timeOfDay?: {
      start: string;
      end: string;
      multiplier: number;
    }[];
    daysOfWeek?: {
      days: number[];
      multiplier: number;
    }[];
    holidays?: {
      date: string;
      multiplier: number;
    }[];
  };
  applicableZoneIds: string[]; // IDs of zones this rule applies to
  taxiTypeIds: string[]; // IDs of taxi types this rule applies to
}

// Zone model for geofencing
export interface Zone {
  id: string;
  name: string;
  description: string;
  coordinates: GeoJSON.Polygon;
  color: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  areaKm2?: number; // Area in square kilometers
}

// Special time period for fare rules (e.g., peak hours)
export interface TimePeriod {
  id: string;
  name: string;
  startTime: string; // Format: "HH:MM"
  endTime: string; // Format: "HH:MM"
  days: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  multiplier: number;
  isActive: boolean;
}

// Generic conversion helpers
export const fromFirestore = <T>(id: string, data: any): T => {
  return { id, ...data } as T;
};

export const toFirestore = <T>(data: T): Omit<T, "id"> => {
  const { id, ...rest } = data as any;
  return rest;
};
