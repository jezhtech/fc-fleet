import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import CountryCodeSelect, { detectCountryCode } from '@/components/CountryCodeSelect';
import {
  initializeRecaptcha, 
  sendOTP, 
  verifyOTP,
  isAdminPhoneNumber,
  saveUserData,
  checkUserExists,
  getUserData
} from '@/lib/authUtils';
import { useAuth } from '@/contexts/AuthContext';
import { auth, firebaseInitialized, firebaseError } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { AlertTriangle } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { currentUser, refreshUserData, firebaseReady, hasFirebaseError } = useAuth();
  
  // State for phone number and OTP
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+971');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  
  // State for errors and loading
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  
  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      console.log('User already logged in, redirecting to home');
      navigate('/');
    }
  }, [currentUser, navigate]);
  
  // Initialize RecaptchaVerifier on component mount
  useEffect(() => {
    try {
      window.recaptchaVerifier = null;
      window.confirmationResult = null;
    } catch (error) {
      console.error('Error clearing recaptcha:', error);
    }
  }, []);

  // Auto-detect country code when phone number changes
  useEffect(() => {
    if (phoneNumber.startsWith('+')) {
      // If the user manually entered a plus, try to detect the country code
      const detected = detectCountryCode(phoneNumber);
      setCountryCode(detected);
    }
  }, [phoneNumber]);
  
  // Handle phone number change - strip out any country code
  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Remove only leading plus signs, not country codes
    value = value.replace(/^\+/, ''); 
    
    setPhoneNumber(value);
  };
  
  // Handle send verification code
  const handleSendVerificationCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if Firebase is properly initialized
    if (!firebaseInitialized) {
      setError('Firebase is not properly configured. Please set up Firebase to use authentication features.');
      return;
    }
    
    if (!phoneNumber) {
      setError('Please enter your phone number');
      return;
    }
    
    // Format phone number to E.164 format
    const formattedPhone = `${countryCode}${phoneNumber.replace(/^0+/, '')}`;
    
    setLoading(true);
    try {
      // Initialize recaptcha
      initializeRecaptcha('recaptcha-container');
      
      // Send OTP
      await sendOTP(formattedPhone);
      
      // Set OTP sent to true
      setOtpSent(true);
      setError(null);
      console.log('OTP sent successfully to:', formattedPhone);
    } catch (error: any) {
      console.error('Error sending verification code:', error);
      // Handle common Firebase auth errors more gracefully
      if (error.code === 'auth/invalid-api-key') {
        setError('Firebase API key is invalid. This application is not properly configured.');
      } else if (error.code === 'auth/network-request-failed') {
        setError('Network error. Please check your internet connection and try again.');
      } else {
        setError(error.message || 'Error sending verification code. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Handle verify OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if Firebase is properly initialized
    if (!firebaseInitialized) {
      setError('Firebase is not properly configured. Please set up Firebase to use authentication features.');
      return;
    }
    
    if (!otp || otp.length < 6) {
      setError('Please enter a valid verification code');
      return;
    }
    
    const fullPhoneNumber = `${countryCode}${phoneNumber.replace(/^0+/, '')}`;
    
    setVerifying(true);
    try {
      // Verify OTP
      const userCredential = await verifyOTP(otp);
      console.log('OTP verified successfully, user:', userCredential.uid);
      
      // Check if the phone number is an admin number
      const isAdmin = isAdminPhoneNumber(fullPhoneNumber);
      console.log('Is admin phone number:', isAdmin);
      
      // Check if user exists in database
      const userExists = await checkUserExists(userCredential.uid);
      console.log('User exists in database:', userExists);
      
      // If user doesn't exist or is admin, create/update user data
      if (!userExists) {
        if (isAdmin) {
          // Create admin user
          await saveUserData(userCredential.uid, {
            firstName: 'Admin',
            lastName: 'JezX',
            email: 'admin@jezx.in',
            phoneNumber: fullPhoneNumber,
            isVerified: true,
            isAdmin: true,
            status: 'active'
          });
          console.log('Admin user created');
        } else {
          // For non-admin users, redirect to registration
          console.log('New user detected, redirecting to registration');
          navigate('/register', { state: { phoneNumber: fullPhoneNumber } });
          return;
        }
      } else {
        // User exists in Auth but check if their data is available
        const userData = await getUserData(userCredential.uid);
        
        if (!userData) {
          console.log('User exists in Auth but no data found in database');
          setError('Your account data is not available. Please contact customer care for assistance.');
          setVerifying(false);
          // Sign out immediately to prevent auto-login
          await signOut(auth);
          return;
        }
        
        // Update existing user as admin if admin phone is used
        if (isAdmin) {
          await saveUserData(userCredential.uid, {
            firstName: 'Admin',
            lastName: 'JezX',
            email: 'admin@jezx.in',
            phoneNumber: fullPhoneNumber,
            isVerified: true,
            isAdmin: true,
            status: 'active'
          });
          console.log('Admin user updated');
        }
        
        // Check if the existing user is blocked or inactive
        // First check explicit status field if it exists
        if (userData.status === 'blocked') {
          console.log('User is blocked, preventing login');
          setError('Your account has been blocked. Please contact customer care for further details.');
          setVerifying(false);
          // Sign out immediately to prevent auto-login
          await signOut(auth);
          return;
        }
        
        if (userData.status === 'inactive' || userData.isVerified === false) {
          console.log('User is inactive, preventing login');
          setError('Your account is inactive. Please contact customer care for assistance.');
          setVerifying(false);
          // Sign out immediately to prevent auto-login
          await signOut(auth);
          return;
        }
      }
      
      // Refresh user data to ensure we have the latest
      await refreshUserData();
      
      // Set login success state
      setLoginSuccess(true);
      
      // Wait a moment before redirecting
      setTimeout(() => {
        // Navigate to admin dashboard if admin, otherwise home page
        if (isAdmin) {
          console.log('Redirecting to admin dashboard');
        navigate('/admin');
        } else {
          console.log('Redirecting to home page');
        navigate('/');
        }
      }, 1000);
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      setError(error.message || 'Invalid verification code. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  // Don't render if user is already logged in
  if (currentUser) return null;

  return (
    <Layout>
      <div className="container mx-auto py-8 max-w-md">
          <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Log in</CardTitle>
            <CardDescription className="text-lg">
              Log in to your First Class Fleet account
              </CardDescription>
            </CardHeader>
            <CardContent>
            {hasFirebaseError && (
              <div className="mb-6 p-4 border border-amber-300 bg-amber-50 rounded-md flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-amber-800">Firebase Configuration Error</h4>
                  <p className="text-sm text-amber-700">
                    The application is not correctly configured with Firebase. Authentication features may not work properly.
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    Please follow the configuration instructions in the Firebase error banner at the top of the page.
                  </p>
                </div>
              </div>
            )}
            
            {error && (
              <Alert variant={error.includes('blocked') || error.includes('inactive') ? "default" : "destructive"} className={`mb-6 ${error.includes('blocked') || error.includes('inactive') ? "border-amber-500 bg-amber-50" : ""}`}>
                <AlertDescription>{error}</AlertDescription>
                {(error.includes('blocked') || error.includes('inactive')) && (
                  <div className="mt-2">
                    <p className="text-sm">
                      For assistance, please contact our customer care at:
                      <a href="tel:+919385722102" className="font-medium ml-1 hover:underline">
                        +91 9385 722102
                      </a>
                    </p>
                  </div>
                )}
              </Alert>
            )}
            
            {loginSuccess && (
              <Alert className="mb-6 bg-green-50 text-green-700 border-green-500">
                <AlertDescription>Login successful! Redirecting...</AlertDescription>
              </Alert>
            )}
            
            {!otpSent ? (
              <form onSubmit={handleSendVerificationCode}>
                <div className="space-y-2 mb-6">
                  <Label htmlFor="phoneNumber">Phone number</Label>
                  <div className="flex space-x-2">
                    <CountryCodeSelect 
                      value={countryCode} 
                      onChange={setCountryCode}
                    />
                    <Input
                      id="phoneNumber"
                      value={phoneNumber}
                      onChange={handlePhoneNumberChange}
                      placeholder="50 123 4567"
                      disabled={loading}
                      className="flex-1"
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    We'll send a verification code to this number
                  </p>
                </div>
                
                <div id="recaptcha-container"></div>
                
                <Button
                  type="submit"
                  className="w-full bg-red-500 hover:bg-red-600"
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send verification code'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP}>
                <div className="space-y-2 mb-6">
                  <Label htmlFor="otp">Verification code</Label>
                  <Input
                    id="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 6-digit code"
                    disabled={verifying || loginSuccess}
                  />
                  <p className="text-sm text-gray-500">
                    Enter the verification code sent to {countryCode} {phoneNumber}
                  </p>
                </div>
                
                <Button
                  type="submit"
                  className="w-full bg-red-500 hover:bg-red-600"
                  disabled={verifying || loginSuccess}
                >
                  {verifying ? 'Verifying...' : loginSuccess ? 'Logged In' : 'Log in'}
                </Button>
                
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full mt-2"
                  onClick={() => setOtpSent(false)}
                  disabled={verifying || loginSuccess}
                >
                  Change phone number
                </Button>
              </form>
            )}
            </CardContent>
            <CardFooter className="flex justify-center">
            <div className="text-center">
              Don't have an account?{' '}
              <Link to="/register" className="text-red-500 hover:underline">
                Create account
                </Link>
              </div>
            </CardFooter>
          </Card>
        </div>
    </Layout>
  );
};

export default Login;
