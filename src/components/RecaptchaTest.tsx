import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { initializeRecaptcha, sendOTP } from '@/lib/authUtils';

const RecaptchaTest: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string>('');

  const testRecaptcha = async () => {
    setIsLoading(true);
    setStatus('Testing reCAPTCHA...');
    
    try {
      // Test reCAPTCHA initialization
      setStatus('Initializing reCAPTCHA...');
      await initializeRecaptcha('recaptcha-test-container');
      setStatus('reCAPTCHA initialized successfully!');
      
      // Test OTP sending (with a test phone number)
      setStatus('Testing OTP sending...');
      await sendOTP('+971501234567');
      setStatus('OTP sent successfully! reCAPTCHA is working.');
      
    } catch (error: any) {
      console.error('reCAPTCHA test error:', error);
      setStatus(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>reCAPTCHA Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div id="recaptcha-test-container"></div>
        
        <Button 
          onClick={testRecaptcha} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Testing...' : 'Test reCAPTCHA'}
        </Button>
        
        {status && (
          <div className={`p-3 rounded text-sm ${
            status.includes('Error') ? 'bg-red-50 text-red-700' : 
            status.includes('successfully') ? 'bg-green-50 text-green-700' : 
            'bg-blue-50 text-blue-700'
          }`}>
            {status}
          </div>
        )}
        
        <div className="text-xs text-gray-500">
          <p>This test will:</p>
          <ol className="list-decimal list-inside mt-1">
            <li>Initialize reCAPTCHA</li>
            <li>Try to send an OTP</li>
            <li>Show if reCAPTCHA is working</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecaptchaTest; 