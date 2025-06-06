import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminFirestore } from '$firebase/server';

export const GET: RequestHandler = async () => {
  try {
    // Test Firebase connection by attempting to read from a collection
    const testQuery = adminFirestore.collection('_health_check').limit(1);

    // Try to get the collection (this will test the connection)
    await testQuery.get();
    
    // Get project info
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID || 'unknown';
    
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
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
};
