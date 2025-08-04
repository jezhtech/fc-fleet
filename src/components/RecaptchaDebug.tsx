import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { initializeRecaptcha, sendOTP } from '@/lib/authUtils';
import { auth, firebaseInitialized } from '@/lib/firebase';

const RecaptchaDebug: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [testPhone, setTestPhone] = useState('+971501234567');

  const addDebugInfo = (info: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${info}`]);
  };

  const testRecaptcha = async () => {
    setLoading(true);
    setDebugInfo([]);
    
    try {
      addDebugInfo('Starting reCAPTCHA test...');
      addDebugInfo(`Firebase initialized: ${firebaseInitialized}`);
      addDebugInfo(`Current domain: ${window.location.hostname}`);
      addDebugInfo(`Firebase auth domain: ${auth.config.authDomain}`);
      addDebugInfo(`Test phone: ${testPhone}`);
      
      // Test reCAPTCHA initialization
      addDebugInfo('Initializing reCAPTCHA...');
      await initializeRecaptcha('recaptcha-debug-container');
      addDebugInfo('reCAPTCHA initialized successfully');
      
      // Test OTP sending
      addDebugInfo('Sending test OTP...');
      await sendOTP(testPhone);
      addDebugInfo('OTP sent successfully!');
      
    } catch (error: any) {
      addDebugInfo(`ERROR: ${error.message}`);
      addDebugInfo(`Error code: ${error.code}`);
      console.error('Debug test error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>reCAPTCHA Debug Tool</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={testPhone}
            onChange={(e) => setTestPhone(e.target.value)}
            placeholder="Test phone number"
            className="flex-1 px-3 py-2 border rounded"
          />
          <Button 
            onClick={testRecaptcha} 
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600"
          >
            {loading ? 'Testing...' : 'Test reCAPTCHA'}
          </Button>
        </div>
        
        <div id="recaptcha-debug-container"></div>
        
        <div className="bg-gray-100 p-4 rounded max-h-64 overflow-y-auto">
          <h4 className="font-semibold mb-2">Debug Log:</h4>
          {debugInfo.length === 0 ? (
            <p className="text-gray-500">Click "Test reCAPTCHA" to start debugging</p>
          ) : (
            debugInfo.map((info, index) => (
              <div key={index} className="text-sm font-mono mb-1">
                {info}
              </div>
            ))
          )}
        </div>
        
        <div className="bg-yellow-50 p-4 rounded">
          <h4 className="font-semibold text-yellow-800 mb-2">Troubleshooting Steps:</h4>
          <ol className="text-sm text-yellow-700 space-y-1">
            <li>1. Check Firebase Console → Authentication → Settings → reCAPTCHA Enterprise</li>
            <li>2. Add your domain to authorized domains: {window.location.hostname}</li>
            <li>3. Ensure Phone authentication is enabled in Sign-in methods</li>
            <li>4. Check if reCAPTCHA Enterprise is properly configured</li>
            <li>5. Try disabling reCAPTCHA Enterprise and use standard reCAPTCHA v2</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecaptchaDebug; 