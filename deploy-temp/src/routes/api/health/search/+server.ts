import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  try {
    // Check search functionality
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // Test search service availability
    try {
      const testResponse = await fetch('/api/search?q=test&limit=1');
      const searchWorking = testResponse.ok;
      
      return json({
        success: true,
        message: 'Search system operational',
        service: searchWorking ? 'Firestore' : 'Mock',
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
          usingMockData: !searchWorking || isDevelopment
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
