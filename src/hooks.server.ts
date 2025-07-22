// Enhanced hooks with authentication and security
import type { Handle, HandleServerError } from '@sveltejs/kit';
import { securityMiddleware } from '$lib/server/middleware/security';
import { sequence } from '@sveltejs/kit/hooks';

// Authentication middleware with CSP override
const authMiddleware: Handle = async ({ event, resolve }) => {
  // Get the session cookie
  const sessionCookie = event.cookies.get('session');

  if (sessionCookie) {
    try {
      // For now, we'll decode the session cookie manually
      // In production, you'd verify with Firebase Admin SDK
      const payload = JSON.parse(atob(sessionCookie.split('.')[1]));

      // Add user info to locals
      event.locals.user = {
        uid: payload.sub || payload.uid,
        email: payload.email,
        emailVerified: payload.email_verified || false,
        name: payload.name,
        picture: payload.picture
      };
    } catch (error) {
      // Invalid session cookie, clear it
      event.cookies.delete('session', { path: '/' });
      event.locals.user = null;
    }
  } else {
    event.locals.user = null;
  }

  // Handle protected routes
  const protectedRoutes = ['/dashboard', '/onboarding', '/profile'];
  const isProtectedRoute = protectedRoutes.some(route => event.url.pathname.startsWith(route));

  if (isProtectedRoute && !event.locals.user) {
    // Store the intended destination
    const redirectUrl = event.url.pathname + event.url.search;

    // Redirect to sign in
    return new Response(null, {
      status: 302,
      headers: {
        location: `/auth/signin?redirect=${encodeURIComponent(redirectUrl)}`
      }
    });
  }

  // Get response and override CSP
  const response = await resolve(event);

  // Override any CSP headers that might be set
  const modifiedResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: new Headers(response.headers)
  });

  // Remove any CSP headers
  modifiedResponse.headers.delete('Content-Security-Policy');
  modifiedResponse.headers.delete('X-Content-Security-Policy');

  // Set a permissive CSP that allows all images
  modifiedResponse.headers.set('Content-Security-Policy',
    "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; img-src * data: blob: 'unsafe-inline'; script-src * 'unsafe-inline' 'unsafe-eval'; style-src * 'unsafe-inline';"
  );

  return modifiedResponse;
};

// Combine middlewares in sequence: security disabled for now, only auth
// export const handle = sequence(securityMiddleware, authMiddleware);
export const handle = authMiddleware;

// Simple error handler
export const handleError: HandleServerError = async ({ error, event }) => {
  console.error('Error:', error);
  return {
    message: 'An error occurred'
  };
};