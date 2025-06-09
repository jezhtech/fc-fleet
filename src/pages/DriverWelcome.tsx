import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Car, CheckCircle, Star, MapPin, DollarSign, MessageSquare, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { toast } from 'sonner';

const DriverWelcome = () => {
  const navigate = useNavigate();
  const { currentUser, refreshUserData } = useAuth();
  
  // Handle completion of onboarding
  const handleCompleteOnboarding = async () => {
    try {
      if (currentUser) {
        // Clear the temporary password in the user's record
        const userRef = doc(firestore, 'users', currentUser.uid);
        await updateDoc(userRef, {
          tempPassword: null,
          updatedAt: new Date().toISOString()
        });
        
        // Refresh user data
        await refreshUserData();
        
        // Navigate to dashboard
        navigate('/driver');
        
        toast.success('Welcome to your driver dashboard!');
      }
    } catch (error) {
      console.error('Error clearing temporary password:', error);
      // Navigate anyway even if there's an error
      navigate('/driver');
    }
  };
  
  return (
    <DashboardLayout userType="driver">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Welcome to First Class Fleet Driver Portal</h1>
        <p className="text-gray-600 mt-1">
          Thank you for joining our driver team. Here's a quick guide to get you started.
        </p>
      </div>
      
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl text-center">Getting Started as a Driver</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3 border-b pb-4">
              <div className="bg-blue-100 p-2 rounded-full">
                <Car className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium">1. Check Your Profile</h3>
                <p className="text-sm text-gray-600">
                  Review your driver profile to ensure all information is correct, including your vehicle details.
                </p>
                <Button 
                  variant="link" 
                  className="text-blue-600 p-0 h-auto mt-1"
                  onClick={() => navigate('/driver/profile')}
                >
                  Go to Profile
                </Button>
              </div>
            </div>
            
            <div className="flex items-start gap-3 border-b pb-4">
              <div className="bg-green-100 p-2 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium">2. Accept Ride Assignments</h3>
                <p className="text-sm text-gray-600">
                  When you're assigned to rides by the admin, you'll see them on your dashboard. Start the ride when you arrive at the pickup location.
                </p>
                <Button 
                  variant="link" 
                  className="text-blue-600 p-0 h-auto mt-1"
                  onClick={() => navigate('/driver')}
                >
                  View Dashboard
                </Button>
              </div>
            </div>
            
            <div className="flex items-start gap-3 border-b pb-4">
              <div className="bg-yellow-100 p-2 rounded-full">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-medium">3. Maintain Your Rating</h3>
                <p className="text-sm text-gray-600">
                  Provide excellent service to maintain a high rating. Your performance affects your eligibility for premium rides.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 border-b pb-4">
              <div className="bg-purple-100 p-2 rounded-full">
                <MapPin className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium">4. Track Your Rides</h3>
                <p className="text-sm text-gray-600">
                  View your ride history, earnings, and upcoming assignments in your driver dashboard.
                </p>
                <Button 
                  variant="link" 
                  className="text-blue-600 p-0 h-auto mt-1"
                  onClick={() => navigate('/driver/rides')}
                >
                  View Rides
                </Button>
              </div>
            </div>
            
            <div className="flex items-start gap-3 border-b pb-4">
              <div className="bg-red-100 p-2 rounded-full">
                <DollarSign className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-medium">5. Track Your Earnings</h3>
                <p className="text-sm text-gray-600">
                  Monitor your earnings and update your bank details for payments.
                </p>
                <Button 
                  variant="link" 
                  className="text-blue-600 p-0 h-auto mt-1"
                  onClick={() => navigate('/driver/earnings')}
                >
                  View Earnings
                </Button>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-indigo-100 p-2 rounded-full">
                <MessageSquare className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-medium">6. Get Support</h3>
                <p className="text-sm text-gray-600">
                  Need help? Contact our support team through the settings page.
                </p>
                <Button 
                  variant="link" 
                  className="text-blue-600 p-0 h-auto mt-1"
                  onClick={() => navigate('/driver/settings')}
                >
                  Go to Settings
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">Important Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-amber-600">
              <Clock className="h-5 w-5" />
              <p className="font-medium">Always arrive on time for pickups</p>
            </div>
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <p className="font-medium">Keep your vehicle clean and well-maintained</p>
            </div>
            <div className="flex items-center gap-2 text-red-600">
              <Car className="h-5 w-5" />
              <p className="font-medium">Report any vehicle issues immediately</p>
            </div>
            <div className="flex items-center gap-2 text-blue-600">
              <Star className="h-5 w-5" />
              <p className="font-medium">Professional appearance and behavior is required</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-center">
        <Button
          className="bg-fleet-red hover:bg-fleet-red/90"
          size="lg"
          onClick={handleCompleteOnboarding}
        >
          Go to Driver Dashboard
        </Button>
      </div>
    </DashboardLayout>
  );
};

export default DriverWelcome; 