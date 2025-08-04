// Import Firebase modules
import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getDatabase, Database } from "firebase/database";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";
import { config } from "@/constants/config";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: config.firebaseConfig.apiKey,
  authDomain: config.firebaseConfig.authDomain,
  projectId: config.firebaseConfig.projectId,
  storageBucket: config.firebaseConfig.storageBucket,
  messagingSenderId: config.firebaseConfig.messagingSenderId,
  appId: config.firebaseConfig.appId,
  measurementId: config.firebaseConfig.measurementId,
  databaseURL: config.firebaseConfig.databaseURL,
};

// Initialize empty services to guarantee they're always defined
let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;
let database: Database;
let storage: FirebaseStorage;
let firebaseInitialized = false;
let firebaseError: string | null = null;

app = initializeApp(firebaseConfig);

// Initialize services
auth = getAuth(app);
firestore = getFirestore(app);
database = getDatabase(app);
storage = getStorage(app);

// Initialize analytics in browser environment
if (typeof window !== "undefined") {
  try {
    const analytics = getAnalytics(app);
  } catch (analyticsError) {
    console.warn("Firebase Analytics initialization error:", analyticsError);
    // Analytics failure shouldn't prevent the app from working
  }
}

// Export the services and initialization status
export { app, auth, firestore, database, storage, firebaseError };
