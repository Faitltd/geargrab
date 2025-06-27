import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminFirestore, isAdminInitialized } from '$lib/firebase/server';

export const GET: RequestHandler = async () => {
  try {
    // Check if Firebase Admin is initialized
    if (!isAdminInitialized || !adminFirestore) {
      return json({
        success: false,
        error: 'Firebase Admin SDK not initialized',
        details: 'Missing Firebase Admin credentials (FIREBASE_ADMIN_CLIENT_EMAIL or FIREBASE_ADMIN_PRIVATE_KEY)',
        timestamp: new Date().toISOString(),
        configuration: {
          hasProjectId: !!(process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID),
          hasClientEmail: !!process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          hasPrivateKey: !!process.env.FIREBASE_ADMIN_PRIVATE_KEY,
          projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || 'unknown'
        }
      }, { status: 500 });
    }

    // Test Firebase connection by attempting to read from a collection
    const testQuery = adminFirestore.collection('_health_check').limit(1);

    // Try to get the collection (this will test the connection)
    await testQuery.get();

    // Get project info
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || 'unknown';

    return json({
      success: true,
      message: 'Firebase connection healthy',
      projectId,
      timestamp: new Date().toISOString(),
      services: {
        firestore: 'connected',
        auth: 'available',
        storage: 'available'
      }
    });

  } catch (error) {
    console.error('Firebase health check failed:', error);

    return json({
      success: false,
      error: 'Firebase connection failed',
      details: error.message,
      timestamp: new Date().toISOString(),
      configuration: {
        hasProjectId: !!(process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID),
        hasClientEmail: !!process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        hasPrivateKey: !!process.env.FIREBASE_ADMIN_PRIVATE_KEY,
        projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || 'unknown'
      }
    }, { status: 500 });
  }
};
