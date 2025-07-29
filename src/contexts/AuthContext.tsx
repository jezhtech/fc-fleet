import React, { createContext, useContext, useState, useEffect } from "react";
import { User, onAuthStateChanged, signOut } from "firebase/auth";
import {
  auth,
  firestore,
  firebaseInitialized,
  firebaseError,
} from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import FirebaseErrorBanner from "@/components/FirebaseErrorBanner";

// Types
export type UserData = {
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  phoneNumber?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  status: string;
  role?: "customer" | "driver" | "admin";
  isDriver?: boolean;
  isAdmin?: boolean;
  driverId?: string;
  vehicleInfo?: {
    vehicleTypeId: string;
    vehicleNumber: string;
  };
};

type AuthContextType = {
  currentUser: User | null;
  userData: UserData | null;
  loading: boolean;
  refreshUserData: () => Promise<void>;
  firebaseReady: boolean;
  hasFirebaseError: boolean;
  userRole: "customer" | "driver" | "admin" | null;
  isDriver: boolean;
  isAdmin: boolean;
};

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFirebaseError, setShowFirebaseError] = useState(!!firebaseError);
  const [userRole, setUserRole] = useState<
    "customer" | "driver" | "admin" | null
  >(null);
  const [isDriver, setIsDriver] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Fetch user data from Firestore
  const fetchUserData = async (user: User) => {
    if (!firebaseInitialized) {
      console.warn("Firebase not properly initialized, cannot fetch user data");
      return;
    }

    try {
      const userDocRef = doc(firestore, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const data = userDoc.data() as UserData;

        // Check if user is blocked or inactive
        if (
          data.status === "blocked" ||
          data.status === "inactive" ||
          data.isVerified === false
        ) {
          await signOut(auth);
          setUserData(null);
          return;
        }

        // Determine user role
        let role = data.role || "customer";
        let isDriverUser = !!data.isDriver;
        let isAdminUser = !!data.isAdmin;

        // If role is not explicitly set, fall back to isDriver/isAdmin properties
        if (!data.role) {
          if (data.isAdmin) {
            role = "admin";
          } else if (data.isDriver) {
            role = "driver";
          } else {
            role = "customer";
          }
        }

        setUserData(data);
        setUserRole(role as "customer" | "driver" | "admin");
        setIsDriver(isDriverUser);
        setIsAdmin(isAdminUser);
      } else {
        // Sign user out if their data doesn't exist in Firestore
        await signOut(auth);
        setUserData(null);
        setUserRole(null);
        setIsDriver(false);
        setIsAdmin(false);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setUserData(null);
      setUserRole(null);
      setIsDriver(false);
      setIsAdmin(false);
    }
  };

  // Function to refresh user data
  const refreshUserData = async () => {
    if (currentUser) {
      await fetchUserData(currentUser);
    }
  };

  // Listen to auth state changes
  useEffect(() => {
    // Skip auth listener if Firebase is not initialized
    if (!firebaseInitialized) {
      console.warn("Firebase not properly initialized, skipping auth listener");
      setLoading(false);
      return () => {};
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setCurrentUser(user);

        if (user) {
          await fetchUserData(user);
        } else {
          setUserData(null);
          setUserRole(null);
          setIsDriver(false);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Error in auth state change handler:", error);
        setCurrentUser(null);
        setUserData(null);
        setUserRole(null);
        setIsDriver(false);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Context value
  const value: AuthContextType = {
    currentUser,
    userData,
    loading,
    refreshUserData,
    firebaseReady: firebaseInitialized,
    hasFirebaseError: !!firebaseError,
    userRole,
    isDriver,
    isAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {showFirebaseError && (
        <FirebaseErrorBanner onClose={() => setShowFirebaseError(false)} />
      )}
      {!loading ? (
        children
      ) : (
        <div className="flex justify-center items-center min-h-screen">
          Loading authentication...
        </div>
      )}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
