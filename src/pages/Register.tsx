import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
  saveUserData, 
  isAdminPhoneNumber 
} from '@/lib/authUtils';
import { useAuth } from '@/contexts/AuthContext';

// User data type
type UserData = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
};

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  
  // State for user data
  const [userData, setUserData] = useState<UserData>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: ''
  });
  
  // State for country code
  const [countryCode, setCountryCode] = useState('+971');
  
  // State for OTP verification
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  
  // State for errors and loading
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Check if phone number was passed from login page
  useEffect(() => {
    if (location.state?.phoneNumber) {
      const phoneFromLogin = location.state.phoneNumber;
      // Detect country code from the passed phone number
      const detectedCode = detectCountryCode(phoneFromLogin);
      setCountryCode(detectedCode);
      
      // Extract phone number without country code
      let numberWithoutCode = phoneFromLogin;
      // Remove the detected country code only if the phone number starts with '+'
      if (phoneFromLogin.startsWith('+')) {
        numberWithoutCode = phoneFromLogin.substring(detectedCode.length);
      }
      
      setUserData(prev => ({
        ...prev,
        phoneNumber: numberWithoutCode
      }));
    }
  }, [location.state]);
  
  // If user is already logged in, redirect to home page
  useEffect(() => {
    if (currentUser) {
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
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear any previous errors
    setError(null);
  };

  // Handle phone number change - only remove leading plus
  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Remove only leading plus signs, not country codes
    value = value.replace(/^\+/, '');
    
    setUserData(prev => ({
      ...prev,
      phoneNumber: value
    }));
    
    // Clear any previous errors
    setError(null);
  };
  
  // Handle send verification code
  const handleSendVerificationCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form fields
    if (!userData.firstName || !userData.lastName || !userData.email || !userData.phoneNumber) {
      setError('All fields are required');
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    // Format full phone number with country code
    const fullPhoneNumber = `${countryCode}${userData.phoneNumber.replace(/^0+/, '')}`;
    
    // Check if the phone number is the admin number
    if (isAdminPhoneNumber(fullPhoneNumber)) {
      setError('This phone number cannot be used for registration');
      return;
    }
    
    setLoading(true);
    try {
      // Initialize recaptcha
      const recaptchaVerifier = initializeRecaptcha('recaptcha-container');
      
      // Send OTP
      await sendOTP(fullPhoneNumber);
      
      // Set OTP sent to true
      setOtpSent(true);
      setError(null);
    } catch (error: any) {
      console.error('Error sending verification code:', error);
      setError(error.message || 'Error sending verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle verify OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp || otp.length < 6) {
      setError('Please enter a valid verification code');
      return;
    }
    
    const fullPhoneNumber = `${countryCode}${userData.phoneNumber.replace(/^0+/, '')}`;
    
    setVerifying(true);
    try {
      // Verify OTP
      const userCredential = await verifyOTP(otp);
      
      // Save user data to Firestore
      await saveUserData(userCredential.uid, {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        phoneNumber: fullPhoneNumber,
        isVerified: true,
        status: 'active'
      });
      
      // Navigate to home page
      navigate('/');
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      setError(error.message || 'Error verifying code. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  // If user is already logged in, don't render the form
  if (currentUser) {
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto py-8 max-w-md">
          <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Create an account</CardTitle>
            <CardDescription className="text-lg">
                Enter your details to create your First Class Fleet account
              </CardDescription>
            </CardHeader>
            <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {!otpSent ? (
              <form onSubmit={handleSendVerificationCode}>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={userData.firstName}
                      onChange={handleInputChange}
                      placeholder="John"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={userData.lastName}
                      onChange={handleInputChange}
                      placeholder="Doe"
                    />
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={userData.email}
                    onChange={handleInputChange}
                    placeholder="john.doe@example.com"
                  />
                </div>
                <div className="space-y-2 mb-6">
                  <Label htmlFor="phoneNumber">Phone number</Label>
                  <div className="flex space-x-2">
                    <CountryCodeSelect 
                      value={countryCode} 
                      onChange={setCountryCode}
                    />
                  <Input
                      id="phoneNumber"
                      name="phoneNumber"
                      value={userData.phoneNumber}
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
                    disabled={verifying}
                  />
                  <p className="text-sm text-gray-500">
                    Enter the verification code sent to {countryCode} {userData.phoneNumber}
                  </p>
                </div>
                
                <Button
                  type="submit"
                  className="w-full bg-red-500 hover:bg-red-600"
                  disabled={verifying}
                >
                  {verifying ? 'Verifying...' : 'Create account'}
                </Button>
                
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full mt-2"
                  onClick={() => setOtpSent(false)}
                  disabled={verifying}
                >
                  Change information
                </Button>
              </form>
            )}
            </CardContent>
          <CardFooter className="flex justify-center">
            <div className="text-center">
              Already have an account?{' '}
              <Link to="/login" className="text-red-500 hover:underline">
                  Log in
                </Link>
              </div>
            </CardFooter>
          </Card>
        </div>
    </Layout>
  );
};

export default Register;
