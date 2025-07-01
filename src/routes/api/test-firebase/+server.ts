import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  try {
    // Check environment variables
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV,
      FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
      FIREBASE_ADMIN_CLIENT_EMAIL: !!process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      FIREBASE_ADMIN_PRIVATE_KEY: !!process.env.FIREBASE_ADMIN_PRIVATE_KEY,
      FIREBASE_SERVICE_ACCOUNT_KEY: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
      // Show actual values for debugging (safe ones only)
      FIREBASE_PROJECT_ID_VALUE: process.env.FIREBASE_PROJECT_ID,
      FIREBASE_ADMIN_CLIENT_EMAIL_VALUE: process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.substring(0, 30) + '...',
      FIREBASE_ADMIN_PRIVATE_KEY_LENGTH: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.length
    };

    // Try to import and test Firebase Admin
    let adminTest = null;
    try {
      const { adminFirestore, isFirebaseAdminAvailable } = await import('$lib/firebase/server');
      adminTest = {
        isAvailable: isFirebaseAdminAvailable,
        firestoreExists: !!adminFirestore
      };
    } catch (error) {
      adminTest = {
        error: error.message,
        isAvailable: false
      };
    }

    return json({
      success: true,
      environment: envCheck,
      firebaseAdmin: adminTest,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
};
