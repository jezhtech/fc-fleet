import axios from 'axios';
import { handleGetCCavenueSettings, handleSaveCCavenueSettings } from '@/pages/api/payment/ccavenue/settings';
import { handleTestCCavenueConnection } from '@/pages/api/payment/ccavenue/test';
import { handleCCavenueResponse } from '@/pages/api/payment/ccavenue/response';
import { handleTestWebhook } from '@/pages/api/payment/ccavenue/test-webhook';

// Configuration for axios if needed
const apiClient = axios.create({
  baseURL: '/',
  headers: {
    'Content-Type': 'application/json',
  },
});

// This utility allows us to handle API calls without an actual backend
// It intercepts API calls and redirects them to our mock handlers
export const api = {
  get: async (url: string) => {
    // Mock API routes
    if (url === '/api/payment/ccavenue/settings') {
      return { data: await handleGetCCavenueSettings({}, {}) };
    }
    
    // Fall back to real HTTP request if no mock is found
    return apiClient.get(url);
  },
  
  post: async (url: string, data: any) => {
    // Mock API routes
    if (url === '/api/payment/ccavenue/settings') {
      return { data: await handleSaveCCavenueSettings(data, {}) };
    }
    
    if (url === '/api/payment/ccavenue/test') {
      return { data: await handleTestCCavenueConnection(data, {}) };
    }
    
    if (url === '/api/payment/ccavenue/response') {
      return { data: await handleCCavenueResponse(data, {}) };
    }
    
    if (url === '/api/payment/ccavenue/test-webhook') {
      return { data: await handleTestWebhook(data, {}) };
    }
    
    // Fall back to real HTTP request if no mock is found
    return apiClient.post(url, data);
  }
};

export default api; 
 
 
 
 
 
 
 
 