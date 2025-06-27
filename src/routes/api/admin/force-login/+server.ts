import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminAuth, adminFirestore, isFirebaseAdminAvailable } from '$lib/firebase/server';

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    if (!isFirebaseAdminAvailable()) {
      return json({ 
        error: 'Firebase Admin not available' 
      }, { status: 500 });
    }

    const { email, password } = await request.json();
    
    // Admin emails that should have admin access
    const adminEmails = [
      'admin@itsfait.com',
      'ray@itsfait.com',
      '126212038+faitltd@users.noreply.github.com',
      'faitltd@gmail.com'
    ];

    // Simple password check for testing (NOT for production)
    const testPassword = 'admin123';
    
    if (!adminEmails.includes(email.toLowerCase())) {
      return json({ 
        error: 'Not an admin email',
        providedEmail: email
      }, { status: 403 });
    }

    if (password !== testPassword) {
      return json({ 
        error: 'Invalid password' 
      }, { status: 401 });
    }

    // Create a test admin user ID
    const testAdminUid = `admin_${Date.now()}`;

    // Set user as admin in Firestore first
    try {
      await adminFirestore.collection('adminUsers').doc(testAdminUid).set({
        uid: testAdminUid,
        email: email,
        isAdmin: true,
        adminLevel: 'super',
        permissions: ['all'],
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } catch (firestoreError) {
      console.error('Firestore error:', firestoreError);
      // Continue anyway - the session might still work
    }

    // Create a session cookie directly
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

    const sessionData = {
      uid: testAdminUid,
      email: email,
      isAdmin: true,
      exp: Math.floor(Date.now() / 1000) + (expiresIn / 1000)
    };

    // Set a simple session cookie for testing
    cookies.set('__session_test', JSON.stringify(sessionData), {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: expiresIn / 1000
    });

    return json({
      success: true,
      message: 'Admin session created successfully',
      userUid: testAdminUid,
      userEmail: email,
      sessionData: sessionData,
      instructions: 'Test session cookie set. Refresh the page and try accessing admin panel now.'
    });

  } catch (error) {
    console.error('Error creating admin session:', error);
    return json({ 
      error: 'Failed to create admin session',
      details: error.message
    }, { status: 500 });
  }
};
