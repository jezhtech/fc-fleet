import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { User, onAuthStateChanged, signOut } from "firebase/auth";
import { auth, firestore, firebaseError } from "@/lib/firebase";
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
  tempPassword?: string; // Add this for driver onboarding
};

type AuthContextType = {
  currentUser: User | null;
  userData: UserData | null;
  loading: boolean;
  refreshUserData: () => Promise<void>;
  hasFirebaseError: boolean;
  userRole: "customer" | "driver" | "admin" | null;
  isDriver: boolean;
  isAdmin: boolean;
  needsRegistration: boolean;
  logout: () => Promise<void>; // Add logout function
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
  const [needsRegistration, setNeedsRegistration] = useState(false);

  // Memoized logout function
  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      // Clear all state
      setCurrentUser(null);
      setUserData(null);
      setUserRole(null);
      setIsDriver(false);
      setIsAdmin(false);
      setNeedsRegistration(false);
    } catch (error) {
      console.error("Error during logout:", error);
    }
  }, []);

  // Fetch user data from Firestore
  const fetchUserData = useCallback(
    async (user: User) => {
      

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
            
            await logout();
            return;
          }

          // Determine user role with proper fallback logic
          let role: "customer" | "driver" | "admin" = "customer";

          const driverDocRef = doc(firestore, "drivers", user.uid);
          const driverDoc = await getDoc(driverDocRef);
          

          let isDriverUser = false;
          let isAdminUser = false;

          if (driverDoc.exists()) {
            const driverData = driverDoc.data();
            
            role = "driver";
            isDriverUser = true;
            isAdminUser = false;
          } else {
            role = "customer";
            isDriverUser = false;
            isAdminUser = false;
          }

          // Check explicit role first
          if (data.role) {
            role = data.role;
            isDriverUser = role === "driver";
            isAdminUser = role === "admin";
          } else {
            // Fall back to boolean flags
            isDriverUser = !!data.isDriver;
            isAdminUser = !!data.isAdmin;

            if (isAdminUser) {
              role = "admin";
            } else if (isDriverUser) {
              role = "driver";
            } else {
              role = "customer";
            }
          }

          setUserData(data);
          setUserRole(role);
          setIsDriver(isDriverUser);
          setIsAdmin(isAdminUser);
          setNeedsRegistration(false);
        } else {
            // User exists in Auth but not in Firestore - they need to complete registration
            
          setUserData(null);
          setUserRole(null);
          setIsDriver(false);
          setIsAdmin(false);
          setNeedsRegistration(true);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        // Don't sign out on error, just clear user data
        setUserData(null);
        setUserRole(null);
        setIsDriver(false);
        setIsAdmin(false);
        setNeedsRegistration(false);
      }
    },
    [logout]
  );

  // Function to refresh user data
  const refreshUserData = useCallback(async () => {
    if (currentUser) {
      await fetchUserData(currentUser);
    }
  }, [currentUser, fetchUserData]);

  // Listen to auth state changes
  useEffect(() => {
    

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
          setNeedsRegistration(false);
        }
      } catch (error) {
        console.error("Error in auth state change handler:", error);
        setCurrentUser(null);
        setUserData(null);
        setUserRole(null);
        setIsDriver(false);
        setIsAdmin(false);
        setNeedsRegistration(false);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      
      unsubscribe();
    };
  }, [fetchUserData]); // Add fetchUserData as dependency

  // Memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      currentUser,
      userData,
      loading,
      refreshUserData,
      hasFirebaseError: !!firebaseError,
      userRole,
      isDriver,
      isAdmin,
      needsRegistration,
      logout,
    }),
    [
      currentUser,
      userData,
      loading,
      refreshUserData,
      firebaseError,
      userRole,
      isDriver,
      isAdmin,
      needsRegistration,
      logout,
    ]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {showFirebaseError && (
        <FirebaseErrorBanner onClose={() => setShowFirebaseError(false)} />
      )}
      {!loading ? (
        children
      ) : (
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-t-red-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading authentication...</p>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
