import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, getClientAddress }) => {
  console.log('🔍 Version check endpoint called');
  
  return json({
    message: 'Debug version endpoint',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    version: 'v2.0-auth-disabled',
    endpoint: '/api/debug/version',
    clientAddress: getClientAddress(),
    url: url.toString(),
    authenticationStatus: 'COMPLETELY DISABLED FOR DEBUGGING',
    paymentEndpointStatus: 'MODIFIED TO ALWAYS RETURN SUCCESS',
    lastModified: '2024-01-29T12:00:00Z'
  }, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
};

export const POST: RequestHandler = async ({ request, url, getClientAddress }) => {
  console.log('🔍 Version check POST endpoint called');
  
  let body = {};
  try {
    body = await request.json();
  } catch (e) {
    console.log('No JSON body provided');
  }

  return json({
    message: 'Debug version endpoint POST',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    version: 'v2.0-auth-disabled',
    endpoint: '/api/debug/version',
    clientAddress: getClientAddress(),
    url: url.toString(),
    receivedBody: body,
    authenticationStatus: 'COMPLETELY DISABLED FOR DEBUGGING',
    paymentEndpointStatus: 'MODIFIED TO ALWAYS RETURN SUCCESS',
    lastModified: '2024-01-29T12:00:00Z'
  }, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
};