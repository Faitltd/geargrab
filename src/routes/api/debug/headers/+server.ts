import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request, url }) => {
  // Get all request headers
  const requestHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    requestHeaders[key] = value;
  });

  // Create a test response to see what headers our middleware adds
  const testResponse = new Response('test');
  
  // Get the current path to test route detection
  const testPath = url.searchParams.get('path') || '/test-auth';
  
  // Simulate our route detection logic
  const isAuthRoute = testPath.includes('/auth') || 
                      testPath.includes('/login') || 
                      testPath.includes('/signup') ||
                      testPath.includes('/test-auth') ||
                      testPath === '/';

  console.log(`🔍 Debug: Testing path "${testPath}", isAuthRoute: ${isAuthRoute}`);

  return json({
    timestamp: new Date().toISOString(),
    testPath,
    isAuthRoute,
    requestHeaders,
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      isDevelopment: process.env.NODE_ENV === 'development'
    },
    message: 'Headers debug information'
  });
};
