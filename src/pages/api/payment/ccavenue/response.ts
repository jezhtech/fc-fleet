import { processCCavenueResponse } from '@/services/paymentService';

/**
 * POST handler for CCAvenue payment response
 */
export async function handleCCavenueResponse(req: any, res: any) {
  try {
    const { encResp } = req.body;
    
    if (!encResp) {
      return { success: false, error: 'Missing encrypted response' };
    }
    
    const result = await processCCavenueResponse(encResp);
    return result;
  } catch (error) {
    console.error('Error in POST /api/payment/ccavenue/response:', error);
    return { success: false, error: 'Internal server error' };
  }
}

// Mock Express-like middleware for handling requests
export default async function handler(req: any, res: any) {
  if (req.method === 'POST') {
    return handleCCavenueResponse(req, res);
  }
  return { success: false, error: 'Method not allowed' };
} 
 