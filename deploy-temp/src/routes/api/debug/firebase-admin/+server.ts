import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  const debugInfo = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
      FIREBASE_ADMIN_CLIENT_EMAIL: process.env.FIREBASE_ADMIN_CLIENT_EMAIL ? 
        process.env.FIREBASE_ADMIN_CLIENT_EMAIL.substring(0, 30) + '...' : 'NOT_SET',
      FIREBASE_ADMIN_PRIVATE_KEY: process.env.FIREBASE_ADMIN_PRIVATE_KEY ? 
        'SET (length: ' + process.env.FIREBASE_ADMIN_PRIVATE_KEY.length + ')' : 'NOT_SET',
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? 
        process.env.STRIPE_SECRET_KEY.substring(0, 10) + '...' : 'NOT_SET'
    }
  };

  // Test Firebase Admin initialization
  try {
    const { isFirebaseAdminAvailable } = await import('$lib/firebase/server');
    debugInfo.firebaseAdmin = {
      isAvailable: isFirebaseAdminAvailable(),
      status: 'checked'
    };
  } catch (error: any) {
    debugInfo.firebaseAdmin = {
      isAvailable: false,
      error: error.message,
      status: 'error'
    };
  }

  return json(debugInfo);
};
