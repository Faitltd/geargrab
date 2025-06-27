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

    // Find or create user in Firebase Auth
    let userRecord;
    try {
      userRecord = await adminAuth.getUserByEmail(email);
    } catch (error) {
      // User doesn't exist, create them
      try {
        userRecord = await adminAuth.createUser({
          email: email,
          emailVerified: true,
          displayName: 'Admin User'
        });
      } catch (createError) {
        return json({ 
          error: 'Failed to create admin user',
          details: createError.message
        }, { status: 500 });
      }
    }

    // Create a custom token for the admin user
    const customToken = await adminAuth.createCustomToken(userRecord.uid, {
      admin: true,
      email: userRecord.email
    });

    // Set user as admin in Firestore
    await adminFirestore.collection('adminUsers').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: userRecord.email,
      isAdmin: true,
      adminLevel: 'super',
      permissions: ['all'],
      createdAt: adminFirestore.Timestamp.now(),
      updatedAt: adminFirestore.Timestamp.now()
    });

    // Create a session cookie directly
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    
    // Create session cookie using custom token
    // Note: In a real implementation, you'd exchange the custom token for an ID token first
    // For testing purposes, we'll create a simple session
    
    const sessionData = {
      uid: userRecord.uid,
      email: userRecord.email,
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
      message: 'Admin session created',
      customToken,
      userUid: userRecord.uid,
      userEmail: userRecord.email,
      instructions: 'Test session cookie set. Try accessing admin panel now.'
    });

  } catch (error) {
    console.error('Error creating admin session:', error);
    return json({ 
      error: 'Failed to create admin session',
      details: error.message
    }, { status: 500 });
  }
};
