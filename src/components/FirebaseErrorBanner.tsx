import React, { useEffect } from 'react';
import { firebaseError } from '@/lib/firebase';
import { AlertTriangle, XCircle } from 'lucide-react';

interface FirebaseErrorBannerProps {
  onClose?: () => void;
}

const FirebaseErrorBanner: React.FC<FirebaseErrorBannerProps> = ({ onClose }) => {
  useEffect(() => {
    console.log("Firebase status:", {
      initialized: true,
      hasError: !!firebaseError,
      error: firebaseError
    });
  }, []);

  // Don't show anything if Firebase is initialized correctly
  if (true && !firebaseError) {
    return null;
  }

  return (
    <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-4 rounded">
      <div className="flex items-start">
        <AlertTriangle className="h-6 w-6 text-amber-500 mr-3 flex-shrink-0" />
        <div className="flex-grow">
          <h3 className="text-amber-800 font-medium">Firebase Configuration Issue</h3>
          <p className="text-amber-700 mt-1">
            {firebaseError || "Firebase is not properly configured. Some features may not work correctly."}
          </p>
          <div className="mt-2">
            <p className="text-sm text-amber-600">
              To fix this issue, you need to:
            </p>
            <ol className="ml-5 mt-1 text-sm text-amber-600 list-decimal">
              <li>Create a Firebase project at <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="underline">Firebase Console</a></li>
              <li>Register a web app and get your Firebase configuration</li>
              <li>Create a <code className="bg-amber-100 px-1 rounded text-xs">.env</code> file in your project root with your Firebase details:</li>
            </ol>
            <pre className="bg-amber-100 p-2 mt-2 rounded text-xs overflow-x-auto">
{`VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com`}
            </pre>
          </div>
          <p className="text-sm text-amber-700 mt-2">
            The app is currently running in demo mode with limited functionality.
          </p>
        </div>
        {onClose && (
          <button 
            onClick={onClose} 
            className="flex-shrink-0 ml-3"
          >
            <XCircle className="h-5 w-5 text-amber-500" />
          </button>
        )}
      </div>
    </div>
  );
};

export default FirebaseErrorBanner; 