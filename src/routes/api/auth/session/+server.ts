import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminAuth, adminFirestore } from '$firebase/server';
import { createSecureHandler, ValidationSchemas } from '$lib/security/middleware';
import { auditLog } from '$lib/security/audit';
import { serverTimestamp } from 'firebase-admin/firestore';

// Enhanced session creation with security features
export const POST: RequestHandler = createSecureHandler(
  async ({ request, cookies, getClientAddress }, { body }) => {
    const { idToken, expiresIn = 60 * 60 * 24 * 5 * 1000, deviceInfo } = body;

    try {
      // Verify the ID token with additional checks
      const decodedToken = await adminAuth.verifyIdToken(idToken, true);

      // Check if user account is active
      const userRecord = await adminAuth.getUser(decodedToken.uid);
      if (userRecord.disabled) {
        await auditLog.logSecurityEvent({
          type: 'unauthorized_access_attempt',
          userId: decodedToken.uid,
          ip: getClientAddress(),
          userAgent: request.headers.get('User-Agent') || 'unknown',
          path: '/api/auth/session',
          timestamp: new Date(),
          details: { reason: 'disabled_account' },
          severity: 'high'
        });

        return json({ success: false, error: 'Account is disabled' }, { status: 403 });
      }

      // Create a session cookie
      const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

      // Generate session ID for tracking
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

      // Store session information
      await adminFirestore.collection('userSessions').doc(sessionId).set({
        userId: decodedToken.uid,
        email: decodedToken.email,
        ip: getClientAddress(),
        userAgent: request.headers.get('User-Agent') || 'unknown',
        deviceInfo: deviceInfo || {},
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + expiresIn),
        isActive: true,
        lastActivity: serverTimestamp()
      });

      // Set secure session cookie
      cookies.set('__session', sessionCookie, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: expiresIn / 1000 // Convert to seconds
      });

      // Set session tracking cookie
      cookies.set('__session_id', sessionId, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: expiresIn / 1000
      });

      // Log successful login
      await auditLog.logUserActivity({
        userId: decodedToken.uid,
        action: 'login',
        timestamp: new Date(),
        ip: getClientAddress(),
        userAgent: request.headers.get('User-Agent') || 'unknown',
        success: true,
        details: { sessionId, deviceInfo }
      });

      return json({
        success: true,
        sessionId,
        expiresAt: new Date(Date.now() + expiresIn).toISOString()
      });

    } catch (error) {
      console.error('Error creating session:', error);

      await auditLog.logSecurityEvent({
        type: 'user_login',
        ip: getClientAddress(),
        userAgent: request.headers.get('User-Agent') || 'unknown',
        path: '/api/auth/session',
        timestamp: new Date(),
        details: { error: error.message },
        severity: 'medium'
      });

      return json({ success: false, error: 'Failed to create session' }, { status: 401 });
    }
  },
  {
    rateLimit: 'auth',
    validateCSRF: true,
    inputSchema: {
      idToken: { required: true, type: 'string' as const, minLength: 10 },
      expiresIn: { required: false, type: 'number' as const, min: 60000, max: 7 * 24 * 60 * 60 * 1000 },
      deviceInfo: { required: false, type: 'string' as const }
    }
  }
);

// Enhanced session deletion with cleanup
export const DELETE: RequestHandler = createSecureHandler(
  async ({ cookies, getClientAddress }) => {
    const sessionId = cookies.get('__session_id');
    const sessionCookie = cookies.get('__session');

    try {
      // Verify and get user info from session
      let userId: string | undefined;
      if (sessionCookie) {
        try {
          const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
          userId = decodedClaims.uid;
        } catch (error) {
          // Session already invalid, continue with cleanup
        }
      }

      // Mark session as inactive in database
      if (sessionId) {
        await adminFirestore.collection('userSessions').doc(sessionId).update({
          isActive: false,
          loggedOutAt: serverTimestamp(),
          logoutIp: getClientAddress()
        });
      }

      // Delete cookies
      cookies.delete('__session', { path: '/' });
      cookies.delete('__session_id', { path: '/' });

      // Log logout
      if (userId) {
        await auditLog.logUserActivity({
          userId,
          action: 'logout',
          timestamp: new Date(),
          ip: getClientAddress(),
          success: true,
          details: { sessionId }
        });
      }

      return json({ success: true });

    } catch (error) {
      console.error('Error during logout:', error);

      // Still delete cookies even if logging fails
      cookies.delete('__session', { path: '/' });
      cookies.delete('__session_id', { path: '/' });

      return json({ success: true }); // Don't expose internal errors
    }
  },
  {
    rateLimit: 'auth'
  }
);

// Get current session info
export const GET: RequestHandler = createSecureHandler(
  async ({ cookies }, { auth }) => {
    if (!auth) {
      return json({ authenticated: false }, { status: 401 });
    }

    const sessionId = cookies.get('__session_id');
    let sessionInfo = null;

    if (sessionId) {
      try {
        const sessionDoc = await adminFirestore.collection('userSessions').doc(sessionId).get();
        if (sessionDoc.exists) {
          const data = sessionDoc.data();
          sessionInfo = {
            sessionId,
            createdAt: data?.createdAt?.toDate?.()?.toISOString(),
            lastActivity: data?.lastActivity?.toDate?.()?.toISOString(),
            expiresAt: data?.expiresAt?.toISOString(),
            deviceInfo: data?.deviceInfo
          };

          // Update last activity
          await sessionDoc.ref.update({
            lastActivity: serverTimestamp()
          });
        }
      } catch (error) {
        console.error('Error getting session info:', error);
      }
    }

    return json({
      authenticated: true,
      userId: auth.userId,
      isAdmin: auth.isAdmin,
      session: sessionInfo
    });
  },
  {
    requireAuth: true,
    rateLimit: 'api'
  }
);
