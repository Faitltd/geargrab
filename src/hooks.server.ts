// Enhanced hooks with authentication and security
import type { Handle, HandleServerError } from '@sveltejs/kit';
import { securityMiddleware } from '$lib/server/middleware/security';
import { sequence } from '@sveltejs/kit/hooks';

// Authentication middleware
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

  return resolve(event);
};

// Combine middlewares in sequence: security first, then auth
export const handle = sequence(securityMiddleware, authMiddleware);

// Simple error handler
export const handleError: HandleServerError = async ({ error, event }) => {
  console.error('Error:', error);
  return {
    message: 'An error occurred'
  };
};