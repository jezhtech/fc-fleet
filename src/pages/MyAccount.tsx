import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { logout } from '@/lib/authUtils';

const MyAccount = () => {
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  // Don't render anything if not authenticated
  if (!currentUser || !userData) {
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold">My Account</CardTitle>
            <CardDescription className="text-lg">
              Manage your First Class Fleet account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 rounded-full bg-red-100 text-red-800 flex items-center justify-center text-2xl font-medium">
                {userData.firstName.charAt(0)}{userData.lastName.charAt(0)}
              </div>
              <div>
                <h2 className="text-2xl font-semibold">{userData.firstName} {userData.lastName}</h2>
                <p className="text-gray-600">{userData.email}</p>
                <p className="text-gray-600">{userData.phoneNumber}</p>
        </div>
      </div>
      
            <div className="space-y-4">
              <div className="border-t pt-4">
                <h3 className="text-lg font-medium mb-2">Account Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p>{userData.firstName} {userData.lastName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p>{userData.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone Number</p>
                    <p>{userData.phoneNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Account Created</p>
                    <p>{new Date(userData.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
          </div>
          
              <div className="border-t pt-4">
                <h3 className="text-lg font-medium mb-2">Account Actions</h3>
                <div className="flex flex-col space-y-2">
                  <Button variant="outline" onClick={() => navigate('/my-bookings')}>
                    View My Bookings
                  </Button>
                  <Button variant="outline" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                    Update Account Information
                      </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
          <CardFooter className="flex justify-between border-t pt-4">
            <Button variant="outline" onClick={() => navigate('/')}>
              Back to Home
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600"
            >
              Logout
                      </Button>
          </CardFooter>
                </Card>
      </div>
    </Layout>
  );
};

export default MyAccount;
