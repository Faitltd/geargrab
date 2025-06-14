import type { Handle } from '@sveltejs/kit';
import { SecurityMiddleware } from '$lib/security/middleware';
import { isFirebaseAdminAvailable } from '$lib/firebase/server';

export const handle: Handle = async ({ event, resolve }) => {
  // Initialize locals
  event.locals.user = null;
  event.locals.userId = null;

  const start = Date.now();

  // Temporarily disable authentication for debugging payment issues
  try {
    console.log('🔧 Authentication temporarily disabled for debugging');
    // Set a mock user for testing
    event.locals.userId = 'debug_user_' + Date.now();
    event.locals.user = {
      uid: event.locals.userId,
      isAdmin: false
    };
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
