import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Button } from '@/components/ui/button';

const FirebaseTest = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collections, setCollections] = useState<string[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [showFullData, setShowFullData] = useState(false);

  const testFirestore = async () => {
    setLoading(true);
    setError(null);
    setCollections([]);
    setBookings([]);

    try {
      // Test getting all collections
      console.log("Testing Firestore connection...");
      
      // Try to get bookings
      console.log("Fetching bookings collection...");
      const bookingsRef = collection(firestore, 'bookings');
      const bookingsSnapshot = await getDocs(bookingsRef);
      
      console.log(`Found ${bookingsSnapshot.size} bookings`);
      
      const bookingsList: any[] = [];
      bookingsSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`Booking ${doc.id}:`, data);
        bookingsList.push({
          id: doc.id,
          ...data
        });
      });
      
      setBookings(bookingsList);
      
      // Try to get other collections
      const testCollections = ['users', 'vehicles', 'settings'];
      const foundCollections: string[] = [];
      
      for (const collName of testCollections) {
        try {
          const collRef = collection(firestore, collName);
          const snapshot = await getDocs(collRef);
          console.log(`Collection '${collName}' exists with ${snapshot.size} documents`);
          foundCollections.push(`${collName} (${snapshot.size} docs)`);
        } catch (err) {
          console.log(`Error accessing collection '${collName}':`, err);
        }
      }
      
      setCollections(foundCollections);
    } catch (err) {
      console.error("Error testing Firestore:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-md">
      <h2 className="text-xl font-bold mb-4">Firebase Test</h2>
      
      <div className="flex gap-2 mb-4">
        <Button 
          onClick={testFirestore} 
          disabled={loading}
        >
          {loading ? 'Testing...' : 'Test Firebase Connection'}
        </Button>

        <Button
          variant="outline"
          onClick={() => setShowFullData(!showFullData)}
        >
          {showFullData ? 'Show Less Data' : 'Show Full Data'}
        </Button>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 p-3 rounded mb-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      {collections.length > 0 && (
        <div className="mb-4">
          <h3 className="font-medium mb-2">Available Collections:</h3>
          <ul className="list-disc pl-5">
            {collections.map((coll, index) => (
              <li key={index}>{coll}</li>
            ))}
          </ul>
        </div>
      )}
      
      {bookings.length > 0 && (
        <div>
          <h3 className="font-medium mb-2">Bookings ({bookings.length}):</h3>
          <div className="max-h-96 overflow-y-auto border rounded p-2">
            {bookings.map(booking => (
              <div key={booking.id} className="mb-4 pb-4 border-b">
                <p><strong>ID:</strong> {booking.id}</p>
                <p><strong>Type:</strong> {booking.type || booking.bookingType || 'N/A'}</p>
                <p><strong>Status:</strong> {booking.status || 'N/A'}</p>
                
                {/* Customer Info */}
                <div className="mt-2">
                  <p className="font-medium">Customer Info:</p>
                  <div className="pl-3 border-l-2 border-gray-200">
                    {booking.customerInfo ? (
                      <>
                        <p><strong>Email:</strong> {booking.customerInfo.email || 'N/A'}</p>
                        <p><strong>Name:</strong> {booking.customerInfo.name || 'N/A'}</p>
                        <p><strong>Phone:</strong> {booking.customerInfo.phone || 'N/A'}</p>
                      </>
                    ) : (
                      <p>No customer info</p>
                    )}
                  </div>
                </div>
                
                {/* Direct Email Field */}
                <p className="mt-2"><strong>Direct Email:</strong> {booking.email || 'N/A'}</p>
                
                {/* Show full data if enabled */}
                {showFullData && (
                  <div className="mt-2">
                    <p className="font-medium">Full Data:</p>
                    <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                      {JSON.stringify(booking, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FirebaseTest; 