import { useState, useEffect } from 'react';
import { RecaptchaVerifier } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export const useRecaptcha = (elementId: string) => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initRecaptcha = async () => {
      try {
        // Clear existing
        if (window.recaptchaVerifier) {
          try {
            window.recaptchaVerifier.clear();
          } catch (e) {
            // Ignore
          }
          window.recaptchaVerifier = null;
        }

        // Create new
        window.recaptchaVerifier = new RecaptchaVerifier(auth, elementId, {
          size: 'invisible'
        });

        await window.recaptchaVerifier.render();
        setIsReady(true);
        setError(null);
      } catch (err: any) {
        setError(err.message);
        setIsReady(false);
      }
    };

    initRecaptcha();

    // Cleanup
    return () => {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {
          // Ignore
        }
        window.recaptchaVerifier = null;
      }
    };
  }, [elementId]);

  return { isReady, error };
};

// Declare global types
declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier | null;
    confirmationResult: any;
  }
} 