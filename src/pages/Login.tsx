import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import CountryCodeSelect, {
  detectCountryCode,
} from "@/components/CountryCodeSelect";
import {
  sendOTP,
  verifyOTP,
  isAdminPhoneNumber,
  saveUserData,
  checkUserExists,
  getUserData,
  checkAndLinkDriverAccount,
  checkPhoneNumberRegistered,
} from "@/lib/authUtils";
import { useAuth } from "@/contexts/AuthContext";
import { auth, firebaseError } from "@/lib/firebase";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signOut,
} from "firebase/auth";
import { AlertTriangle, RefreshCw } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, refreshUserData, hasFirebaseError, needsRegistration } =
    useAuth();

  // Get the intended destination from location state
  const from = (location.state as any)?.from?.pathname || "/";

  // State for phone number and OTP
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+971");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  // State for errors and loading
  const [error, setError] = useState<string | null>(null);
  const [showRegistrationPrompt, setShowRegistrationPrompt] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  // Redirect if already logged in and has complete data
  useEffect(() => {
    if (currentUser && !needsRegistration) {
      navigate(from, { replace: true });
    }
  }, [currentUser, needsRegistration, navigate, from]);

  useEffect(() => {
    window.recaptchaVerifier = null;
  }, []);

  // Redirect to registration if user needs to complete profile
  useEffect(() => {
    if (currentUser && needsRegistration) {
      const fullPhoneNumber = `${countryCode}${phoneNumber.replace(/^0+/, "")}`;
      navigate("/register", { state: { phoneNumber: fullPhoneNumber } });
    }
  }, [currentUser, needsRegistration, navigate, countryCode, phoneNumber]);

  // Auto-detect country code when phone number changes
  useEffect(() => {
    if (phoneNumber.startsWith("+")) {
      // If the user manually entered a plus, try to detect the country code
      const detected = detectCountryCode(phoneNumber);
      setCountryCode(detected);
    }
  }, [phoneNumber]);

  // Handle phone number change - strip out any country code
  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    // Remove only leading plus signs, not country codes and it should accept empty
    const regex = /^[0-9]+$|^$/;
    if(!regex.test(value)) {
      return;
    }

    setPhoneNumber(value);
    
    // Clear registration prompt when phone number changes
    if (showRegistrationPrompt) {
      setShowRegistrationPrompt(false);
      setError(null);
    }
  };

  // Reset form and clear errors
  const resetForm = useCallback(() => {
    setPhoneNumber("");
    setOtp("");
    setOtpSent(false);
    setError(null);
    setShowRegistrationPrompt(false);
    setLoginSuccess(false);
    setLoading(false);
    setVerifying(false);
  }, []);

  // Handle send verification code
  const handleSendVerificationCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneNumber || phoneNumber.trim().length < 8) {
      setError("Please enter a valid phone number");
      return;
    }

    // Format phone number to E.164 format
    const formattedPhone = `${countryCode}${phoneNumber.replace(/^0+/, "")}`;

    setLoading(true);
    setError(null);

    try {
      // Check if phone number is registered (except for admin numbers)
      const isAdmin = isAdminPhoneNumber(formattedPhone);
      if (!isAdmin) {
        const isRegistered = await checkPhoneNumberRegistered(formattedPhone);
        if (!isRegistered) {
          setError("This phone number is not registered.");
          setShowRegistrationPrompt(true);
          setLoading(false);
          return;
        }
      }

      // Create new recaptcha verifier
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = await new RecaptchaVerifier(
          auth,
          "recaptcha-container",
          {
            size: "invisible",
          }
        );
      }
      await sendOTP(formattedPhone);
      // Set OTP sent to true
      setOtpSent(true);
    } catch (error: any) {
      console.error("Error sending verification code:", error);

      // Handle common Firebase auth errors more gracefully
      if (error.code === "auth/invalid-api-key") {
        setError(
          "Firebase API key is invalid. This application is not properly configured."
        );
      } else if (error.code === "auth/network-request-failed") {
        setError(
          "Network error. Please check your internet connection and try again."
        );
      } else if (error.code === "auth/invalid-phone-number") {
        setError(
          "Invalid phone number format. Please check your phone number and try again."
        );
      } else if (error.code === "auth/too-many-requests") {
        setError(
          "Too many attempts. Please wait a few minutes before trying again."
        );
      } else if (error.code === "auth/quota-exceeded") {
        setError("SMS quota exceeded. Please try again later.");
      } else if (error.code === "auth/captcha-check-failed") {
        setError(
          "reCAPTCHA verification failed. Please refresh the page and try again."
        );
      } else {
        setError(
          error.message || "Error sending verification code. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle verify OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp || otp.length < 6) {
      setError("Please enter a valid 6-digit verification code");
      return;
    }

    const fullPhoneNumber = `${countryCode}${phoneNumber.replace(/^0+/, "")}`;

    setVerifying(true);
    setError(null);

    try {
      // Verify OTP
      const userCredential = await verifyOTP(otp);

      // Check if the phone number is an admin number
      const isAdmin = isAdminPhoneNumber(fullPhoneNumber);

      // Check if this phone number belongs to a driver
      const driverCheck = await checkAndLinkDriverAccount(
        fullPhoneNumber,
        userCredential.uid
      );

      // Check if user exists in database
      const userExists = await checkUserExists(userCredential.uid);

      // If user doesn't exist or is admin, create/update user data
      if (!userExists) {
        if (isAdmin) {
          // Create admin user
          await saveUserData(userCredential.uid, {
            firstName: "Admin",
            lastName: "JezX",
            email: "admin@jezx.in",
            phoneNumber: fullPhoneNumber,
            isVerified: true,
            isAdmin: true,
            status: "active",
            role: "admin",
          });
        }
      } else {
        // User exists in Auth but check if their data is available
        const userData = await getUserData(userCredential.uid);

        if (!userData) {
          setError(
            "Your account data is not available. Please contact customer care for assistance."
          );
          setVerifying(false);
          // Sign out immediately to prevent auto-login
          await signOut(auth);
          return;
        }

        // Update existing user as admin if admin phone is used
        if (isAdmin) {
          await saveUserData(userCredential.uid, {
            firstName: "Admin",
            lastName: "JezX",
            email: "admin@jezx.in",
            phoneNumber: fullPhoneNumber,
            isVerified: true,
            isAdmin: true,
            status: "active",
            role: "admin",
          });
        }

        // Check if the existing user is blocked or inactive
        if (userData.status === "blocked") {
          setError(
            "Your account has been blocked. Please contact customer care for further details."
          );
          setVerifying(false);
          // Sign out immediately to prevent auto-login
          await signOut(auth);
          return;
        }

        if (userData.status === "inactive" || userData.isVerified === false) {
          setError(
            "Your account is inactive. Please contact customer care for assistance."
          );
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
    } catch (error: any) {
      console.error("Error verifying OTP:", error);

      // Handle specific OTP verification errors
      if (error.code === "auth/invalid-verification-code") {
        setError(
          "Invalid verification code. Please check the code and try again."
        );
      } else if (error.code === "auth/invalid-verification-id") {
        setError("Verification session expired. Please request a new code.");
        setOtpSent(false);
      } else if (error.code === "auth/code-expired") {
        setError("Verification code has expired. Please request a new code.");
        setOtpSent(false);
      } else {
        setError(
          error.message || "Invalid verification code. Please try again."
        );
      }
    } finally {
      setVerifying(false);
    }
  };

  // Handle resend OTP
  const handleResendOTP = async () => {
    if (loading) return;

    setError(null);
    await handleSendVerificationCode(new Event("submit") as any);
  };

  // Don't render if user is already logged in
  if (currentUser && !needsRegistration) return null;

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
                  <h4 className="font-medium text-amber-800">
                    Firebase Configuration Error
                  </h4>
                  <p className="text-sm text-amber-700">
                    The application is not correctly configured with Firebase.
                    Authentication features may not work properly.
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    Please follow the configuration instructions in the Firebase
                    error banner at the top of the page.
                  </p>
                </div>
              </div>
            )}

            {error && (
              <Alert
                variant={
                  error.includes("blocked") || error.includes("inactive")
                    ? "default"
                    : "destructive"
                }
                className={`mb-6 ${
                  error.includes("blocked") || error.includes("inactive")
                    ? "border-amber-500 bg-amber-50"
                    : ""
                }`}
              >
                <AlertDescription>{error}</AlertDescription>
                {(error.includes("blocked") || error.includes("inactive")) && (
                  <div className="mt-2">
                    <p className="text-sm">
                      For assistance, please contact our customer care at:
                      <a
                        href="tel:+919385722102"
                        className="font-medium ml-1 hover:underline"
                      >
                        +91 9385 722102
                      </a>
                    </p>
                  </div>
                )}
              </Alert>
            )}

            {showRegistrationPrompt && (
              <Alert className="mb-6 border-blue-500 bg-blue-50">
                <AlertDescription>
                  <div className="flex flex-col space-y-2">
                    <p>Don't have an account? Register now to get started.</p>
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => navigate("/register")}
                        className="text-blue-600 border-blue-600 hover:bg-blue-100"
                      >
                        Register Now
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowRegistrationPrompt(false);
                          setError(null);
                        }}
                        className="text-gray-600 border-gray-600 hover:bg-gray-100"
                      >
                        Try Different Number
                      </Button>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {loginSuccess && (
              <Alert className="mb-6 bg-green-50 text-green-700 border-green-500">
                <AlertDescription>
                  Login successful! Redirecting...
                </AlertDescription>
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
                      maxLength={10}
                      className="flex-1"
                      type="tel"
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
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send verification code"
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP}>
                <div className="space-y-2 mb-6">
                  <Label htmlFor="otp">Verification code</Label>
                  <Input
                    id="otp"
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="Enter 6-digit code"
                    disabled={verifying || loginSuccess}
                    className="text-center text-lg tracking-widest"
                    maxLength={6}
                    type="text"
                    inputMode="numeric"
                  />
                  <p className="text-sm text-gray-500">
                    Enter the verification code sent to {countryCode}{" "}
                    {phoneNumber}
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-red-500 hover:bg-red-600"
                  disabled={verifying || loginSuccess}
                >
                  {verifying ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : loginSuccess ? (
                    "Logged In"
                  ) : (
                    "Log in"
                  )}
                </Button>

                <div className="flex space-x-2 mt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="flex-1"
                    onClick={() => setOtpSent(false)}
                    disabled={verifying || loginSuccess}
                  >
                    Change phone number
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={handleResendOTP}
                    disabled={loading || verifying || loginSuccess}
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Resend code"
                    )}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex justify-center">
            <div className="text-center">
              Don't have an account?{" "}
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
