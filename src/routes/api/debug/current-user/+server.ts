import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminFirestore, isFirebaseAdminAvailable } from '$lib/firebase/server';

export const GET: RequestHandler = async ({ locals, cookies }) => {
  try {
    const sessionCookie = cookies.get('__session');
    const testSessionCookie = cookies.get('__session_test');

    // Get current user info from locals (set by hooks.server.ts)
    const currentUser = {
      userId: locals.userId,
      user: locals.user,
      email: locals.user?.email,
      uid: locals.user?.uid
    };

    // Check admin status in Firestore
    let adminCheck = null;
    if (locals.userId && isFirebaseAdminAvailable()) {
      try {
        const adminDoc = await adminFirestore.collection('adminUsers').doc(locals.userId).get();
        adminCheck = {
          exists: adminDoc.exists,
          data: adminDoc.exists ? adminDoc.data() : null
        };
      } catch (error) {
        adminCheck = {
          error: error.message
        };
      }
    }

    // Check if email is in admin emails list
    const ADMIN_EMAILS = [
      '126212038+Faitltd@users.noreply.github.com',
      'faitltd@gmail.com',
      'ray@itsfait.com',
      'Ray@itsfait.com',
      'admin@itsfait.com',
      'Admin@itsfait.com'
    ];

    const emailCheck = {
      currentEmail: locals.user?.email,
      isInAdminList: locals.user?.email ? ADMIN_EMAILS.includes(locals.user.email.toLowerCase()) : false,
      adminEmails: ADMIN_EMAILS
    };

    return json({
      success: true,
      currentUser,
      adminCheck,
      emailCheck,
      cookies: {
        hasSessionCookie: !!sessionCookie,
        hasTestSessionCookie: !!testSessionCookie,
        sessionCookieLength: sessionCookie?.length || 0
      },
      firebaseAdminAvailable: isFirebaseAdminAvailable(),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting current user info:', error);
    return json({ 
      error: 'Failed to get current user info',
      details: error.message
    }, { status: 500 });
  }
};
