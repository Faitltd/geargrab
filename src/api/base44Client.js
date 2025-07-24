import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "687f2f9ac100cd94531f5f50", 
  requiresAuth: true // Ensure authentication is required for all operations
});
