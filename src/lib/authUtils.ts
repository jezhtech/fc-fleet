import { 
  signInWithPhoneNumber, 
  RecaptchaVerifier,
  ConfirmationResult,
  signOut
} from 'firebase/auth';
import { auth, firestore } from './firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// Initialize Recaptcha verifier
export const initializeRecaptcha = (elementId: string) => {
  try {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, elementId, {
      'size': 'invisible',
      'callback': () => {
        // reCAPTCHA solved, allow signInWithPhoneNumber.
      }
    });
    return window.recaptchaVerifier;
  } catch (error) {
    console.error('Error initializing recaptcha:', error);
    throw error;
  }
};

// Send OTP to phone number
export const sendOTP = async (phoneNumber: string): Promise<ConfirmationResult> => {
  try {
    if (!window.recaptchaVerifier) {
      throw new Error('Recaptcha verifier not initialized');
    }
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier);
    window.confirmationResult = confirmationResult;
    return confirmationResult;
  } catch (error) {
    console.error('Error sending OTP:', error);
    window.recaptchaVerifier.clear();
    window.recaptchaVerifier = null;
    throw error;
  }
};

// Verify OTP
export const verifyOTP = async (otp: string) => {
  try {
    if (!window.confirmationResult) {
      throw new Error('Confirmation result not found');
    }
    const result = await window.confirmationResult.confirm(otp);
    return result.user;
  } catch (error) {
    console.error('Error verifying OTP:', error);
    throw error;
  }
};

// Save user data to Firestore
export const saveUserData = async (userId: string, userData: any) => {
  try {
    await setDoc(doc(firestore, 'users', userId), {
      ...userData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('Error saving user data:', error);
    throw error;
  }
};

// Check if user exists
export const checkUserExists = async (userId: string) => {
  try {
    const userDoc = await getDoc(doc(firestore, 'users', userId));
    return userDoc.exists();
  } catch (error) {
    console.error('Error checking if user exists:', error);
    throw error;
  }
};

// Get user data from Firestore
export const getUserData = async (userId: string) => {
  try {
    const userDoc = await getDoc(doc(firestore, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data();
    }
    return null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

// Check if phone number is admin number
export const isAdminPhoneNumber = (phoneNumber: string) => {
  return phoneNumber === '+919385722102';
};

// Check if user is admin
export const isAdmin = async (userId: string): Promise<boolean> => {
  try {
    const userDoc = await getDoc(doc(firestore, 'users', userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return userData.isAdmin === true;
    }
    return false;
  } catch (error) {
    console.error('Error checking if user is admin:', error);
    return false;
  }
};

// Logout function
export const logout = async (): Promise<void> => {
  try {
    await signOut(auth);
    return;
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Declare global types for window object
declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier | null;
    confirmationResult: ConfirmationResult | null;
  }
} 