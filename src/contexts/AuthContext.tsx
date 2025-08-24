import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { User, onAuthStateChanged, signOut } from "firebase/auth";
import { auth, firebaseError } from "@/lib/firebase";
import { authService } from "@/services/authService";
import FirebaseErrorBanner from "@/components/FirebaseErrorBanner";

// Types
export type UserData = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: "customer" | "driver" | "admin";
  createdAt: string;
  updatedAt: string;
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
  logout: () => Promise<void>;
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
      // Clear localStorage
      localStorage.removeItem("firebaseToken");
      localStorage.removeItem("authToken");
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

  // Fetch user data from backend API
  const fetchUserData = useCallback(
    async (user: User) => {
      try {
        // Get the Firebase ID token
        const idToken = await user.getIdToken();
        
        // Store token in localStorage for API calls
        localStorage.setItem("firebaseToken", idToken);
        localStorage.setItem("authToken", idToken);

        // Fetch user profile from backend
        const response = await authService.getCurrentUser();
        
        if (response.success && response.data) {
          const data = response.data as UserData;
          
          // Determine user role
          const role = data.role || "customer";
          const isDriverUser = role === "driver";
          const isAdminUser = role === "admin";

          setUserData(data);
          setUserRole(role);
          setIsDriver(isDriverUser);
          setIsAdmin(isAdminUser);
          setNeedsRegistration(false);
        } else {
          // User exists in Auth but not in backend - they need to complete registration
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
    []
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
          // Clear localStorage on logout
          localStorage.removeItem("firebaseToken");
          localStorage.removeItem("authToken");
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
  }, [fetchUserData]);

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
