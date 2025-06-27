import type { Handle } from '@sveltejs/kit';
import { adminAuth, isFirebaseAdminAvailable } from '$lib/firebase/server';
import { dev } from '$app/environment';

export const handle: Handle = async ({ event, resolve }) => {
  const start = Date.now();
  // Initialize locals
  event.locals.user = null;
  event.locals.userId = null;

  // Extract session cookies
  const sessionCookie = event.cookies.get('__session');
  const testSessionCookie = event.cookies.get('__session_test');

  // Check if Firebase Admin is available
  if (isFirebaseAdminAvailable()) {
    // Try regular session cookie first
    if (sessionCookie) {
      try {
        // Verify the session cookie
        const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);

        // Set user information in locals
        event.locals.userId = decodedClaims.uid;
        event.locals.user = {
          uid: decodedClaims.uid,
          email: decodedClaims.email,
          emailVerified: decodedClaims.email_verified,
          displayName: decodedClaims.name,
          photoURL: decodedClaims.picture
        };

        console.log(`✅ Authenticated user: ${decodedClaims.email} (${decodedClaims.uid})`);

      } catch (error) {
        // Invalid session cookie - clear it
        if (!dev) {
          console.warn('Invalid session cookie:', error.message);
        }
        event.cookies.delete('__session', { path: '/' });
      }
    }

    // Try test session cookie if regular session failed
    if (!event.locals.userId && testSessionCookie) {
      try {
        const sessionData = JSON.parse(testSessionCookie);

        // Check if session is still valid
        if (sessionData.exp > Math.floor(Date.now() / 1000)) {
          event.locals.userId = sessionData.uid;
          event.locals.user = {
            uid: sessionData.uid,
            email: sessionData.email,
            emailVerified: true,
            displayName: 'Admin User (Test)',
            photoURL: null
          };

          console.log(`✅ Test authenticated user: ${sessionData.email} (${sessionData.uid})`);
        } else {
          // Expired test session
          event.cookies.delete('__session_test', { path: '/' });
        }
      } catch (error) {
        console.warn('Invalid test session cookie:', error.message);
        event.cookies.delete('__session_test', { path: '/' });
      }
    }
  } else {
    console.log('⚠️ Firebase Admin not available, skipping authentication');
  }

  const response = await resolve(event);

  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');

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
  } else if (!dev) {
    console.log('Request processed', logData);
  }

  return response;
};

export function handleError({ error, event }: { error: any, event: any }) {
  console.error('Server error:', {
    message: error?.message || 'Unknown error',
    path: event.url.pathname,
    method: event.request.method
  });

  return {
    message: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR'
  };
}
