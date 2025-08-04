import { 
  signInWithPhoneNumber, 
  RecaptchaVerifier,
  ConfirmationResult,
  signOut,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth, firestore } from './firebase';
import { doc, setDoc, getDoc, deleteDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';

// Use standard reCAPTCHA v2 (no Enterprise setup required)
const BYPASS_RECAPTCHA = false; // Set to false to use standard reCAPTCHA

// Simple reCAPTCHA initialization
export const initializeRecaptcha = async (elementId: string): Promise<RecaptchaVerifier> => {
  try {
    console.log('Initializing reCAPTCHA for element:', elementId);
    
    // Clear any existing verifier
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (e) {
        // Ignore clear errors
      }
      window.recaptchaVerifier = null;
    }
    
    // Create new verifier with proper configuration
    window.recaptchaVerifier = new RecaptchaVerifier(auth, elementId, {
      'size': 'invisible',
      'callback': (response: any) => {
        console.log('reCAPTCHA solved successfully:', response);
      },
      'expired-callback': () => {
        console.log('reCAPTCHA expired');
        window.recaptchaVerifier = null;
      },
      'error-callback': (error: any) => {
        console.error('reCAPTCHA error:', error);
        window.recaptchaVerifier = null;
      }
    });
    
    // IMPORTANT: Render the reCAPTCHA verifier
    console.log('Rendering reCAPTCHA verifier...');
    await window.recaptchaVerifier.render();
    console.log('reCAPTCHA rendered successfully');
    
    return window.recaptchaVerifier;
  } catch (error) {
    console.error('Error initializing reCAPTCHA:', error);
    throw error;
  }
};

// Simple OTP sending
export const sendOTP = async (phoneNumber: string): Promise<ConfirmationResult> => {
  try {
    console.log('Sending OTP to:', phoneNumber);

    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier);
    window.confirmationResult = confirmationResult;
    
    console.log('OTP sent successfully');
    return confirmationResult;
  } catch (error: any) {
    console.error('Error sending OTP:', error);
    
    // Simple error messages
    if (error.code === 'auth/invalid-app-credential') {
      throw new Error('reCAPTCHA not configured. Please check Firebase Console settings.');
    } else if (error.code === 'auth/invalid-phone-number') {
      throw new Error('Invalid phone number format.');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many attempts. Please try again later.');
    } else if (error.code === 'auth/captcha-check-failed') {
      throw new Error('reCAPTCHA verification failed. Please try again.');
    }
    
    throw error;
  }
};

// Verify OTP
export const verifyOTP = async (otp: string) => {
  try {
    console.log('Checking confirmation result...');
    if (!window.confirmationResult) {
      throw new Error('Confirmation result not found. Please request a new verification code.');
    }
    
    console.log('Verifying OTP...');
    const result = await window.confirmationResult.confirm(otp);
    
    // Clear confirmation result after successful verification
    window.confirmationResult = null;
    
    console.log('OTP verified successfully');
    return result.user;
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    
    // Clear confirmation result on error
    window.confirmationResult = null;
    
    // Provide more specific error messages
    if (error.code === 'auth/invalid-verification-code') {
      throw new Error('Invalid verification code. Please check and try again.');
    } else if (error.code === 'auth/code-expired') {
      throw new Error('Verification code has expired. Please request a new one.');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many attempts. Please try again later.');
    }
    
    throw error;
  }
};

// Save user data to Firestore
export const saveUserData = async (userId: string, userData: any) => {
  try {
    console.log('Saving user data for:', userId);
    const userDocRef = doc(firestore, 'users', userId);
    await setDoc(userDocRef, {
      ...userData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    console.log('User data saved successfully for:', userId);
    return true;
  } catch (error) {
    console.error('Error saving user data:', error);
    throw error;
  }
};

// Create a driver user account with Firebase Authentication
export const createDriverUserAccount = async (driverId: string, driverData: any) => {
  try {
    console.log('Creating driver user account for:', driverData.name);
    
    // Generate a temporary password
    const tempPassword = generateDriverPassword();
    
    // Create a unique email for the driver (since Firebase Auth requires email)
    const driverEmail = `${driverData.name.toLowerCase().replace(/\s+/g, '.')}@booba-rides.com`;
    
    // Create Firebase Authentication user account
    let authUser;
    try {
      // Create user with email and temporary password
      const userCredential = await createUserWithEmailAndPassword(auth, driverEmail, tempPassword);
      authUser = userCredential.user;
      
      // Update the user's display name
      await updateProfile(authUser, {
        displayName: driverData.name
      });
      
      console.log('Firebase Authentication user created:', authUser.uid);
    } catch (authError: any) {
      console.error('Error creating Firebase Auth user:', authError);
      
      // If user already exists, try to get the existing user
      if (authError.code === 'auth/email-already-in-use') {
        // Generate a unique email by adding timestamp
        const uniqueEmail = `${driverData.name.toLowerCase().replace(/\s+/g, '.')}.${Date.now()}@booba-rides.com`;
        const userCredential = await createUserWithEmailAndPassword(auth, uniqueEmail, tempPassword);
        authUser = userCredential.user;
        
        await updateProfile(authUser, {
          displayName: driverData.name
        });
        
        console.log('Firebase Authentication user created with unique email:', authUser.uid);
      } else {
        throw authError;
      }
    }
    
    // Create user data in Firestore
    const userData = {
      name: driverData.name,
      firstName: driverData.name.split(' ')[0],
      lastName: driverData.name.split(' ').slice(1).join(' '),
      email: driverEmail,
      phone: driverData.phone,
      phoneNumber: driverData.phone, // Add phoneNumber for compatibility
      role: 'driver',
      isDriver: true,
      isAdmin: false,
      driverId: driverId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      vehicleInfo: {
        vehicleTypeId: driverData.vehicleTypeId,
        vehicleNumber: driverData.vehicleNumber
      },
      status: driverData.status || 'active',
      isVerified: true, // Mark as verified so they can log in immediately
      tempPassword: tempPassword, // Store temporary password for first login
      // Add authentication UID
      authUid: authUser.uid
    };
    
    // Save to Firestore using the Firebase Auth UID
    await setDoc(doc(firestore, 'users', authUser.uid), userData);
    
    console.log(`Created driver user account with Auth UID: ${authUser.uid}`);
    
    // Send password reset email so driver can set their own password
    try {
      await sendPasswordResetEmail(auth, driverEmail);
      console.log('Password reset email sent to driver');
    } catch (emailError) {
      console.warn('Could not send password reset email:', emailError);
    }
    
    return authUser.uid;
  } catch (error) {
    console.error('Error creating driver user account:', error);
    throw error;
  }
};

// Create a driver user account with phone number authentication
export const createDriverAccountWithPhone = async (driverId: string, driverData: {
  name: string;
  email: string;
  phone: string;
  taxiTypeId: string;
  vehicleTypeId: string;
  vehicleNumber: string;
  rating: number;
  rides: number;
  earnings: number;
  joined: string;
  status: 'active' | 'inactive' | 'suspended';
}) => {
  try {
    console.log('Creating driver account with phone authentication for:', driverData.name);
    
    // Format phone number to E.164 format if not already
    let phoneNumber = driverData.phone;
    if (!phoneNumber.startsWith('+')) {
      // Assume UAE number if no country code
      phoneNumber = `+971${phoneNumber.replace(/^0+/, '')}`;
    }
    
    // Create user data in Firestore first (we'll update it with auth UID later)
    const userData = {
      name: driverData.name,
      firstName: driverData.name.split(' ')[0],
      lastName: driverData.name.split(' ').slice(1).join(' '),
      email: driverData.email,
      phoneNumber: phoneNumber,
      role: 'driver',
      isDriver: true,
      isAdmin: false,
      driverId: driverId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      vehicleInfo: {
        vehicleTypeId: driverData.vehicleTypeId,
        vehicleNumber: driverData.vehicleNumber
      },
      status: driverData.status || 'active',
      isVerified: true,
      // We'll add authUid after phone verification
      pendingPhoneVerification: true
    };
    
    // Create a temporary document ID
    const tempUserId = `temp_${driverId}_${Date.now()}`;
    
    // Save to Firestore with temporary ID
    await setDoc(doc(firestore, 'users', tempUserId), userData);
    
    console.log(`Created temporary driver account with ID: ${tempUserId}`);
    console.log(`Driver can now log in with phone number: ${phoneNumber}`);
    console.log(`Temporary document ID: ${tempUserId}`);
    
    return {
      tempUserId,
      phoneNumber,
      message: `Driver account created. Driver can log in using phone number: ${phoneNumber}`
    };
  } catch (error) {
    console.error('Error creating driver account with phone:', error);
    throw error;
  }
};

// Function to link phone number to existing driver account
export const linkPhoneToDriverAccount = async (tempUserId: string, authUid: string) => {
  try {
    console.log('Linking phone number to driver account:', tempUserId, '->', authUid);
    
    // Get the temporary user data
    const tempUserDoc = await getDoc(doc(firestore, 'users', tempUserId));
    if (!tempUserDoc.exists()) {
      throw new Error('Temporary user document not found');
    }
    
    const userData = tempUserDoc.data();
    
    // Update user data with auth UID and remove pending flag
    const updatedUserData = {
      ...userData,
      authUid: authUid,
      pendingPhoneVerification: false,
      updatedAt: new Date().toISOString()
    };
    
    // Save to Firestore with the auth UID
    await setDoc(doc(firestore, 'users', authUid), updatedUserData);
    
    // Delete the temporary document
    await deleteDoc(doc(firestore, 'users', tempUserId));
    
    console.log('Successfully linked phone number to driver account');
    return authUid;
  } catch (error) {
    console.error('Error linking phone to driver account:', error);
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

// Generate temporary password for drivers
export const generateDriverPassword = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  
  // Add a random character from each group to ensure complexity
  password += chars.charAt(Math.floor(Math.random() * 26)); // Uppercase
  password += chars.charAt(26 + Math.floor(Math.random() * 26)); // Lowercase
  password += chars.charAt(52 + Math.floor(Math.random() * 10)); // Number
  
  // Add more random characters to reach 8 character length
  for (let i = 0; i < 5; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // Shuffle the password
  return password.split('').sort(() => 0.5 - Math.random()).join('');
};

// Check if phone number belongs to a driver and link account
export const checkAndLinkDriverAccount = async (phoneNumber: string, authUid: string) => {
  try {
    console.log('Checking if phone number belongs to a driver:', phoneNumber);
    
    // Format phone number to E.164 format if not already
    let formattedPhone = phoneNumber;
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = `+971${formattedPhone.replace(/^0+/, '')}`;
    }
    
    // Query drivers collection for this phone number
    const driversRef = collection(firestore, 'drivers');
    const q = query(driversRef, where('phone', '==', formattedPhone));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const driverDoc = querySnapshot.docs[0];
      const driverData = driverDoc.data();
      
      console.log('Found driver with phone number:', driverData);
      
      // Check if this driver has a tempUserId (pending phone verification)
      if (driverData.tempUserId) {
        console.log('Linking driver account with tempUserId:', driverData.tempUserId);
        
        // Link the phone number to the driver account
        await linkPhoneToDriverAccount(driverData.tempUserId, authUid);
        
        // Update the driver document to remove tempUserId and add authUid
        await updateDoc(doc(firestore, 'drivers', driverDoc.id), {
          authUid: authUid,
          tempUserId: null,
          updatedAt: new Date()
        });
        
        console.log('Successfully linked driver account');
        return {
          isDriver: true,
          driverId: driverDoc.id,
          message: 'Driver account linked successfully'
        };
      }
    }
    
    return { isDriver: false };
  } catch (error) {
    console.error('Error checking/linking driver account:', error);
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