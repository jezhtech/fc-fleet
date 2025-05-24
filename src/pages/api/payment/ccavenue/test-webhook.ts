import { processCCavenueResponse } from '@/services/paymentService';

/**
 * POST handler for testing CCAvenue payment responses
 * This is only for test environment usage, not for production
 */
export async function handleTestWebhook(req: any, res: any) {
  try {
    const { encResp } = req.body;
    
    if (!encResp) {
      return { success: false, error: 'Missing encrypted response' };
    }
    
    console.log('Processing test webhook with payload:', encResp);
    
    // Process the test response - this will go through our processing logic
    // that's already set up to handle test mode payloads
    const result = await processCCavenueResponse(encResp);
    
    console.log('Test webhook result:', result);
    
    // Return result to the caller
    return result;
  } catch (error) {
    console.error('Error in test webhook:', error);
    return { success: false, error: 'Error processing test webhook' };
  }
}

// Mock Express-like middleware for handling requests
export default async function handler(req: any, res: any) {
  if (req.method === 'POST') {
    const result = await handleTestWebhook(req, res);
    return result;
  }
  return { success: false, error: 'Method not allowed' };
} 