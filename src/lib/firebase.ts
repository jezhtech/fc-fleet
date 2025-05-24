// Import Firebase modules
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getDatabase, Database } from 'firebase/database';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAMWkWQlQmjL06LQDsKFm9DFg4iS05AQCs",
  authDomain: "first-class-fleet.firebaseapp.com",
  projectId: "first-class-fleet",
  storageBucket: "first-class-fleet.firebasestorage.app",
  messagingSenderId: "322179874418",
  appId: "1:322179874418:web:07ce2a6d211ac7e719cceb",
  measurementId: "G-YE2EWF3135",
  databaseURL: "https://first-class-fleet-default-rtdb.firebaseio.com" // Added standard databaseURL based on project ID
};

// Initialize empty services to guarantee they're always defined
let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;
let database: Database;
let storage: FirebaseStorage;
let firebaseInitialized = false;
let firebaseError: string | null = null;

try {
  // Initialize Firebase with the provided configuration
  app = initializeApp(firebaseConfig);
  
  // Initialize services
  auth = getAuth(app);
  firestore = getFirestore(app);
  database = getDatabase(app);
  storage = getStorage(app);
  
  // Initialize analytics in browser environment
  if (typeof window !== 'undefined') {
    try {
      const analytics = getAnalytics(app);
      console.log('Firebase Analytics initialized');
    } catch (analyticsError) {
      console.warn('Firebase Analytics initialization error:', analyticsError);
      // Analytics failure shouldn't prevent the app from working
    }
  }
  
  console.log('Firebase initialized successfully');
  firebaseInitialized = true;
} catch (error) {
  console.error("Firebase initialization error:", error);
  
  // Fallback config in case the main configuration fails
  const DEMO_CONFIG = {
    apiKey: "AIzaSyD_demo_key_for_development_only",
    authDomain: "demo-project.firebaseapp.com",
    projectId: "demo-project",
    storageBucket: "demo-project.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:demo1234567890",
    databaseURL: "https://demo-project-default-rtdb.firebaseio.com"
  };
  
  // Initialize with demo config as fallback
  app = initializeApp(DEMO_CONFIG);
  auth = getAuth(app);
  firestore = getFirestore(app);
  database = getDatabase(app);
  storage = getStorage(app);
  
  firebaseInitialized = false;
  firebaseError = error instanceof Error ? error.message : "Unknown Firebase initialization error";
}

// Export the services and initialization status
export { 
  app, 
  auth, 
  firestore, 
  database, 
  storage, 
  firebaseInitialized,
  firebaseError
};