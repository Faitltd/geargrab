import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminFirestore, isFirebaseAdminAvailable } from '$lib/firebase/server';

export const GET: RequestHandler = async ({ locals, cookies }) => {
  try {
    const sessionCookie = cookies.get('__session');
    const sessionId = cookies.get('__session_id');
    const testSessionCookie = cookies.get('__session_test');

    const authStatus = {
      hasSessionCookie: !!sessionCookie,
      hasSessionId: !!sessionId,
      hasTestSessionCookie: !!testSessionCookie,
      sessionCookieLength: sessionCookie?.length || 0,
      testSessionCookieLength: testSessionCookie?.length || 0,
      localsUserId: locals.userId,
      localsUser: locals.user,
      firebaseAdminAvailable: isFirebaseAdminAvailable(),
      timestamp: new Date().toISOString()
    };

    // Check if user is in admin collection
    let adminStatus = null;
    if (locals.userId && isFirebaseAdminAvailable()) {
      try {
        const adminDoc = await adminFirestore.collection('adminUsers').doc(locals.userId).get();
        adminStatus = {
          exists: adminDoc.exists,
          data: adminDoc.exists ? adminDoc.data() : null
        };
      } catch (error) {
        adminStatus = {
          error: error.message
        };
      }
    }

    return json({
      success: true,
      authStatus,
      adminStatus,
      cookies: {
        sessionCookie: sessionCookie ? `${sessionCookie.substring(0, 20)}...` : null,
        sessionId,
        testSessionCookie: testSessionCookie ? `${testSessionCookie.substring(0, 50)}...` : null
      }
    });

  } catch (error) {
    console.error('Error checking auth status:', error);
    return json({ 
      error: 'Failed to check auth status',
      details: error.message
    }, { status: 500 });
  }
};
