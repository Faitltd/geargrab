import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSecureHandler } from '$lib/security/middleware';
import { geocodeAddress, reverseGeocode } from '$lib/services/geocoding';

export const GET: RequestHandler = createSecureHandler(
  async ({ url }) => {
    const address = url.searchParams.get('address');
    const lat = url.searchParams.get('lat');
    const lng = url.searchParams.get('lng');

    // Determine if this is forward or reverse geocoding
    if (address) {
      // Forward geocoding: address -> coordinates
      const result = await geocodeAddress(address);
      
      if (!result.success) {
        return json({ 
          success: false, 
          error: result.error 
        }, { status: 400 });
      }

      return json({
        success: true,
        result: result.result
      });

    } else if (lat && lng) {
      // Reverse geocoding: coordinates -> address
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);

      if (isNaN(latitude) || isNaN(longitude)) {
        return json({ 
          success: false, 
          error: 'Invalid latitude or longitude' 
        }, { status: 400 });
      }

      const result = await reverseGeocode(latitude, longitude);
      
      if (!result.success) {
        return json({ 
          success: false, 
          error: result.error 
        }, { status: 400 });
      }

      return json({
        success: true,
        result: result.result
      });

    } else {
      return json({ 
        success: false, 
        error: 'Either address or lat/lng parameters are required' 
      }, { status: 400 });
    }
  },
  {
    rateLimit: 'api',
    validateCSRF: false // Allow GET requests without CSRF
  }
);
