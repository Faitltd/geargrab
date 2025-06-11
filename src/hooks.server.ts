import type { Handle } from '@sveltejs/kit';
import { SecurityMiddleware } from '$lib/security/middleware';
import { isFirebaseAdminAvailable } from '$lib/firebase/server';

export const handle: Handle = async ({ event, resolve }) => {
  // Initialize locals
  event.locals.user = null;
  event.locals.userId = null;

  const start = Date.now();

  // Try to authenticate user from session cookie or Authorization header
  try {
    // Only attempt authentication if Firebase Admin is available
    if (isFirebaseAdminAvailable()) {
      const auth = await SecurityMiddleware.authenticateUser(event);
      if (auth) {
        event.locals.userId = auth.userId;
        event.locals.user = {
          uid: auth.userId,
          isAdmin: auth.isAdmin
        };
      }
    } else {
      // In development or when Firebase Admin is not available,
      // check for a development mode flag or mock authentication
      const isDevelopment = process.env.NODE_ENV !== 'production';
      if (isDevelopment) {
        // For development, we can set a mock user if needed
        // This allows payment testing without full authentication setup
        console.log('Firebase Admin not available - running in development mode');
      }
    }
  } catch (error) {
    // Authentication failed, but continue with null user
    console.log('Authentication failed:', error.message);
  }

  const response = await resolve(event);

  const duration = Date.now() - start;
  const logData = {
    path: event.url.pathname,
    method: event.request.method,
    status: response.status,
    duration,
    userId: event.locals.userId || 'anonymous'
  };

  if (response.status >= 400) {
    console.error('Request error', logData);
  } else {
    console.log('Request processed', logData);
  }

  return response;
};

export function handleError({ error, event }) {
  const errorReport = {
    message: error.message,
    stack: error.stack,
    path: event.url.pathname,
    method: event.request.method,
    timestamp: new Date().toISOString()
  };

  console.error(JSON.stringify(errorReport));

  return {
    message: 'An unexpected error occurred',
    code: error.code || 'UNKNOWN'
  };
}
