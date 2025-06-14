import type { Handle } from '@sveltejs/kit';
import { SecurityMiddleware } from '$lib/security/middleware';
import { isFirebaseAdminAvailable } from '$lib/firebase/server';

export const handle: Handle = async ({ event, resolve }) => {
  // Initialize locals
  event.locals.user = null;
  event.locals.userId = null;

  const start = Date.now();

  // Check if Firebase Admin is available
  if (await isFirebaseAdminAvailable()) {
    // Authenticate user if Firebase Admin is available
    const auth = await SecurityMiddleware.authenticateUser(event);
    if (auth) {
      event.locals.userId = auth.userId;
      event.locals.user = {
        uid: auth.userId,
        email: '', // TODO: Get from user document
        emailVerified: false, // TODO: Get from user document
        isAdmin: auth.isAdmin
      };
    }
  } else {
    console.log('⚠️ Firebase Admin not available, skipping authentication');
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

  console.log('Request processed', logData);

  return response;
};

export function handleError({ error, event }: { error: any, event: any }) {
  const errorReport = {
    message: error?.message || 'Unknown error',
    stack: error?.stack || 'No stack trace',
    path: event.url.pathname,
    method: event.request.method,
    timestamp: new Date().toISOString()
  };

  console.error(JSON.stringify(errorReport));

  return {
    message: 'An unexpected error occurred'
  };
}
