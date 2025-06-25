// Location-based search API endpoint
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminFirestore } from '$lib/firebase/admin';

// Haversine distance calculation
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export const GET: RequestHandler = async ({ url }) => {
  try {
    // Get search parameters
    const lat = parseFloat(url.searchParams.get('lat') || '0');
    const lng = parseFloat(url.searchParams.get('lng') || '0');
    const radius = parseFloat(url.searchParams.get('radius') || '50'); // Default 50km
    const category = url.searchParams.get('category');
    const priceMin = parseFloat(url.searchParams.get('priceMin') || '0');
    const priceMax = parseFloat(url.searchParams.get('priceMax') || '10000');
    const availableFrom = url.searchParams.get('availableFrom');
    const availableTo = url.searchParams.get('availableTo');
    const sortBy = url.searchParams.get('sortBy') || 'distance';
    const limit = parseInt(url.searchParams.get('limit') || '50');

    // Validate required parameters
    if (!lat || !lng) {
      return json({ error: 'Latitude and longitude are required' }, { status: 400 });
    }

    console.log(`🔍 Location search: ${lat}, ${lng} within ${radius}km`);

    // Build Firestore query
    let query = adminFirestore.collection('listings')
      .where('status', '==', 'active')
      .where('isActive', '==', true);

    // Add category filter
    if (category) {
      query = query.where('category', '==', category);
    }

    // Add price range filter
    if (priceMin > 0) {
      query = query.where('dailyPrice', '>=', priceMin);
    }
    if (priceMax < 10000) {
      query = query.where('dailyPrice', '<=', priceMax);
    }

    // Execute query
    const snapshot = await query.limit(limit * 2).get(); // Get more to filter by distance

    const results = [];
    const userLocation = { lat, lng };

    // Process results and calculate distances
    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Skip if no location data
      if (!data.location?.lat || !data.location?.lng) {
        continue;
      }

      const listingLocation = {
        lat: data.location.lat,
        lng: data.location.lng
      };

      // Calculate distance
      const distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        listingLocation.lat,
        listingLocation.lng
      );

      // Skip if outside radius
      if (distance > radius) {
        continue;
      }

      // Check availability if dates provided
      if (availableFrom && availableTo) {
        const fromDate = new Date(availableFrom);
        const toDate = new Date(availableTo);
        
        // Simple availability check (you might want to make this more sophisticated)
        const unavailableDates = data.availabilityCalendar?.unavailableDates || [];
        const hasConflict = unavailableDates.some((unavailableDate: any) => {
          const unavailable = unavailableDate.toDate ? unavailableDate.toDate() : new Date(unavailableDate);
          return unavailable >= fromDate && unavailable <= toDate;
        });
        
        if (hasConflict) {
          continue;
        }
      }

      // Get owner information
      let ownerData = { name: 'Unknown', rating: 0, avatar: null };
      if (data.ownerUid) {
        try {
          const ownerDoc = await adminFirestore.collection('users').doc(data.ownerUid).get();
          if (ownerDoc.exists) {
            const owner = ownerDoc.data();
            ownerData = {
              name: owner?.displayName || owner?.email || 'Unknown',
              rating: owner?.averageRating || 0,
              avatar: owner?.photoURL || null
            };
          }
        } catch (error) {
          console.warn('Failed to get owner data:', error);
        }
      }

      // Build result object
      const result = {
        id: doc.id,
        title: data.title,
        description: data.description,
        dailyPrice: data.dailyPrice,
        location: {
          lat: listingLocation.lat,
          lng: listingLocation.lng,
          city: data.location.city,
          state: data.location.state,
          address: data.location.address
        },
        distance: Math.round(distance * 10) / 10, // Round to 1 decimal
        images: data.images || [],
        category: data.category,
        condition: data.condition,
        features: data.features || [],
        owner: ownerData,
        averageRating: data.averageRating || 0,
        totalReviews: data.totalReviews || 0,
        createdAt: data.createdAt
      };

      results.push(result);
    }

    // Sort results
    switch (sortBy) {
      case 'distance':
        results.sort((a, b) => a.distance - b.distance);
        break;
      case 'price':
        results.sort((a, b) => a.dailyPrice - b.dailyPrice);
        break;
      case 'rating':
        results.sort((a, b) => b.averageRating - a.averageRating);
        break;
      case 'newest':
        results.sort((a, b) => {
          const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return bDate.getTime() - aDate.getTime();
        });
        break;
    }

    // Limit final results
    const finalResults = results.slice(0, limit);

    console.log(`✅ Found ${finalResults.length} listings within ${radius}km`);

    return json({
      results: finalResults,
      total: finalResults.length,
      searchLocation: userLocation,
      radius,
      filters: {
        category,
        priceMin,
        priceMax,
        availableFrom,
        availableTo,
        sortBy
      }
    });

  } catch (error) {
    console.error('Error in location search:', error);
    return json({ error: 'Search failed' }, { status: 500 });
  }
};
