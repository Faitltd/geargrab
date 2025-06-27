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

    const { adminEmail } = await request.json();
    
    if (!adminEmail) {
      return json({ 
        error: 'Admin email is required' 
      }, { status: 400 });
    }

    // Admin emails that should have admin access
    const adminEmails = [
      'admin@itsfait.com',
      'ray@itsfait.com',
      '126212038+faitltd@users.noreply.github.com',
      'faitltd@gmail.com'
    ];

    const isAdminEmail = adminEmails.includes(adminEmail.toLowerCase());
    
    if (!isAdminEmail) {
      return json({ 
        error: 'Not an admin email',
        providedEmail: adminEmail,
        adminEmails: adminEmails
      }, { status: 403 });
    }

    // Find user by email in Firebase Auth
    let userRecord;
    try {
      userRecord = await adminAuth.getUserByEmail(adminEmail);
    } catch (error) {
      return json({ 
        error: 'User not found in Firebase Auth',
        email: adminEmail,
        details: error.message
      }, { status: 404 });
    }

    // Create a custom token for the admin user
    const customToken = await adminAuth.createCustomToken(userRecord.uid, {
      admin: true,
      email: userRecord.email
    });

    // Set user as admin in Firestore if not already
    const adminDoc = await adminFirestore.collection('adminUsers').doc(userRecord.uid).get();
    if (!adminDoc.exists) {
      await adminFirestore.collection('adminUsers').doc(userRecord.uid).set({
        uid: userRecord.uid,
        email: userRecord.email,
        isAdmin: true,
        adminLevel: 'super',
        permissions: ['all'],
        createdAt: adminFirestore.Timestamp.now(),
        updatedAt: adminFirestore.Timestamp.now()
      });
    }

    return json({ 
      success: true,
      message: 'Admin session setup complete',
      customToken,
      userUid: userRecord.uid,
      userEmail: userRecord.email,
      instructions: 'Use this custom token to sign in on the frontend and create a session'
    });

  } catch (error) {
    console.error('Error creating admin session:', error);
    return json({ 
      error: 'Failed to create admin session',
      details: error.message
    }, { status: 500 });
  }
};
