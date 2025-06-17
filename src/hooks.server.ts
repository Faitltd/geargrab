import type { Handle } from '@sveltejs/kit';
import { SecurityMiddleware } from '$lib/security/middleware';
import { isFirebaseAdminAvailable } from '$lib/firebase/server';

export const handle: Handle = async ({ event, resolve }) => {
  // Initialize locals
  event.locals.user = null;
  event.locals.userId = null;

  const start = Date.now();

  // Check if Firebase Admin is available
  if (isFirebaseAdminAvailable()) {
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

  // Apply security headers to all responses (not just API endpoints)
  // Skip COOP header for auth-related routes to prevent popup communication issues
  const isAuthRoute = event.url.pathname.includes('/auth') ||
                      event.url.pathname.includes('/login') ||
                      event.url.pathname.includes('/signup') ||
                      event.url.pathname.includes('/test-auth') ||
                      event.url.pathname.includes('/book') || // Booking pages may trigger auth
                      event.url.pathname.includes('/dashboard') || // Dashboard may trigger auth
                      event.url.pathname === '/' || // Homepage has auth components
                      event.url.searchParams.has('redirectTo'); // Any page with auth redirect

  console.log(`🔒 Security headers for ${event.url.pathname}: skipCOOP=${isAuthRoute}`);
  const secureResponse = SecurityMiddleware.setSecurityHeaders(response, isAuthRoute);

  return secureResponse;
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
