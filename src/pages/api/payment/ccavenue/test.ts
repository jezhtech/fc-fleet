import { testCCavenueConnection } from '@/services/paymentService';

/**
 * POST handler for testing CCAvenue connection
 */
export async function handleTestCCavenueConnection(req: any, res: any) {
  try {
    const { merchantId, accessCode, workingKey, mode } = req;
    
    // Validate request body
    if (!merchantId || !accessCode || !workingKey) {
      return { success: false, error: 'Missing required fields' };
    }
    
    const result = await testCCavenueConnection({
      merchantId,
      accessCode,
      workingKey,
      mode: mode || 'test'
    });
    
    return result;
  } catch (error) {
    console.error('Error in POST /api/payment/ccavenue/test:', error);
    return { success: false, error: 'Internal server error' };
  }
}

// Mock Express-like middleware for handling requests
export default async function handler(req: any, res: any) {
  if (req.method === 'POST') {
    return handleTestCCavenueConnection(req.body, res);
  }
  return { success: false, error: 'Method not allowed' };
} 
 
 
 
 
 
 
 
 