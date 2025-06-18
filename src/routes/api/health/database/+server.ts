import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminFirestore } from '$lib/firebase/server';

export const GET: RequestHandler = async () => {
  try {
    // Test database operations by checking key collections
    const collections = ['users', 'listings', 'bookings', 'messages'];
    const results = [];

    for (const collectionName of collections) {
      try {
        const snapshot = await adminFirestore
          .collection(collectionName)
          .limit(1)
          .get();
        
        results.push({
          collection: collectionName,
          status: 'accessible',
          documentCount: snapshot.size
        });
      } catch (error) {
        results.push({
          collection: collectionName,
          status: 'error',
          error: error.message
        });
      }
    }

    const accessibleCollections = results
      .filter(r => r.status === 'accessible')
      .map(r => r.collection);

    const hasErrors = results.some(r => r.status === 'error');

    return json({
      success: !hasErrors,
      message: hasErrors ? 'Some database operations failed' : 'Database operations working',
      collections: accessibleCollections,
      details: results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Database health check failed:', error);
    
    return json({
      success: false,
      error: 'Database health check failed',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
};
