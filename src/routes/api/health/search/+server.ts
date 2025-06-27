import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  try {
    // Check search functionality
    const isDevelopment = process.env.NODE_ENV === 'development';
    const hasFirebaseAdmin = !!(process.env.FIREBASE_ADMIN_CLIENT_EMAIL && process.env.FIREBASE_ADMIN_PRIVATE_KEY);

    // Determine search service status
    let searchService = 'Mock';
    let searchWorking = false;
    let statusMessage = 'Using fallback search';

    if (hasFirebaseAdmin && !isDevelopment) {
      // Test search service availability
      try {
        const testResponse = await fetch('/api/search/listings?q=test&limit=1');
        searchWorking = testResponse.ok;
        if (searchWorking) {
          searchService = 'Firestore';
          statusMessage = 'Search system operational';
        }
      } catch (error) {
        console.log('Search test failed:', error.message);
      }
    }

    return json({
      success: true,
      message: statusMessage,
      service: searchService,
      collections: ['listings'],
      features: [
        'Text search',
        'Category filtering',
        'Price range filtering',
        'Location filtering',
        'Sorting options',
        'Pagination'
      ],
      configuration: {
        isDevelopment,
        hasFirebaseAdmin,
        usingMockData: !searchWorking || isDevelopment,
        realSearchConfigured: hasFirebaseAdmin && !isDevelopment
      },
      timestamp: new Date().toISOString()
    });
      
    } catch (searchError) {
      return json({
        success: false,
        message: 'Search system using fallback',
        service: 'Mock',
        error: searchError.message,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Search health check failed:', error);
    
    return json({
      success: false,
      error: 'Search health check failed',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
};
