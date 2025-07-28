import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LocationSelector } from '@/components/home/booking-form';
import GoogleMap from '@/components/GoogleMap';
import RouteMap from '@/components/home/booking-form/RouteMap';
import { Location } from '@/components/home/booking-form/types';
import { useGoogleMapsToken } from '@/hooks/useGoogleMapsToken';

const GoogleMapsTest: React.FC = () => {
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [pickupLocation, setPickupLocation] = useState<Location | undefined>(undefined);
  const [dropoffLocation, setDropoffLocation] = useState<Location | undefined>(undefined);
  
  const { token, isInitialized, error } = useGoogleMapsToken();

  const handlePickupSelect = (location: Location) => {
    setPickupLocation(location);
    console.log('Pickup location selected:', location);
  };

  const handleDropoffSelect = (location: Location) => {
    setDropoffLocation(location);
    console.log('Dropoff location selected:', location);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Google Maps Integration Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="api-status">API Status</Label>
              <div className="text-sm">
                {isInitialized ? (
                  <span className="text-green-600">✓ Google Maps API Initialized</span>
                ) : (
                  <span className="text-yellow-600">⏳ Initializing...</span>
                )}
              </div>
              {error && (
                <div className="text-sm text-red-600">
                  Error: {error}
                </div>
              )}
              {token && (
                <div className="text-xs text-gray-500">
                  API Key: {token.substring(0, 10)}...
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Location Search Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <LocationSelector
                id="test-pickup"
                label="Pickup Location"
                value={pickup}
                onChange={setPickup}
                onLocationSelect={handlePickupSelect}
                placeholder="Search for pickup location..."
              />
            </div>
            
            <div className="space-y-2">
              <LocationSelector
                id="test-dropoff"
                label="Dropoff Location"
                value={dropoff}
                onChange={setDropoff}
                onLocationSelect={handleDropoffSelect}
                placeholder="Search for dropoff location..."
              />
            </div>

            {pickupLocation && (
              <div className="p-3 bg-green-50 rounded-md">
                <h4 className="font-medium text-green-800">Pickup Location:</h4>
                <p className="text-sm text-green-700">{pickupLocation.name}</p>
                <p className="text-xs text-green-600">
                  {pickupLocation.latitude}, {pickupLocation.longitude}
                </p>
              </div>
            )}

            {dropoffLocation && (
              <div className="p-3 bg-blue-50 rounded-md">
                <h4 className="font-medium text-blue-800">Dropoff Location:</h4>
                <p className="text-sm text-blue-700">{dropoffLocation.name}</p>
                <p className="text-xs text-blue-600">
                  {dropoffLocation.latitude}, {dropoffLocation.longitude}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Route Map Test</CardTitle>
          </CardHeader>
          <CardContent>
            <RouteMap
              pickupLocation={pickupLocation}
              dropoffLocation={dropoffLocation}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Google Map Test</CardTitle>
        </CardHeader>
        <CardContent>
          <GoogleMap
            initialCoordinates={[55.2708, 25.2048]}
            initialZoom={10}
            height="400px"
            onMapLoaded={(map) => console.log('Google Map loaded successfully')}
            onMapClick={(e) => console.log('Map clicked at:', e.latLng?.toJSON())}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>1. <strong>API Status:</strong> Check that Google Maps API is properly initialized</p>
          <p>2. <strong>Location Search:</strong> Try searching for locations in Dubai (e.g., "Burj Khalifa", "Dubai Mall")</p>
          <p>3. <strong>Route Display:</strong> Select both pickup and dropoff locations to see the route</p>
          <p>4. <strong>Map Interaction:</strong> Test the interactive Google Map component</p>
          <p>5. <strong>Console Logs:</strong> Check browser console for detailed logs and any errors</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default GoogleMapsTest; 