// Common types used across booking form components

export interface Location {
  name: string;
  longitude: number;
  latitude: number;
  address?: string;
  placeId?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface TransportType {
  id: string;
  name: string;
  description: string;
  emoji: string;
}

export interface Vehicle {
  id: string;
  taxiTypeId: string;
  name: string;
  description: string;
  basePrice: number;
  perKmPrice: number;
  perMinutePrice: number;
  capacity: number;
  images: string[];
}

export interface BookingDetails {
  pickup: string;
  dropoff: string;
  time: string;
  cardNumber: string;
  cardName: string;
  cardExpiry: string;
  cardCVC: string;
}

export const DEFAULT_MAP_CENTER = {
  longitude: 55.2708,
  latitude: 25.2048,
  zoom: 10
};

export const bookingStatuses = [
  { id: 'initiated', label: 'Booking Initiated', completed: true },
  { id: 'awaiting', label: 'Awaiting Confirmation', completed: false },
  { id: 'assigned', label: 'Driver Assigned', completed: false },
  { id: 'pickup', label: 'Pickup Done', completed: false },
  { id: 'dropped', label: 'Dropped at Location', completed: false }
]; 