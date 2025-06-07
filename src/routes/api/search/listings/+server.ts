import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminFirestore, isFirebaseAdminAvailable } from '$lib/firebase/server';
import { calculateDistance, getBoundingBox, kmToMiles } from '$lib/services/geocoding';
import type { Listing } from '$types/firestore';

export const GET: RequestHandler = async ({ url }) => {
  try {
    // Parse query parameters
    const query = url.searchParams.get('q') || '';
    const lat = parseFloat(url.searchParams.get('lat') || '0');
    const lng = parseFloat(url.searchParams.get('lng') || '0');
    const radius = parseFloat(url.searchParams.get('radius') || '50'); // Default 50km
    const category = url.searchParams.get('category');
    const minPrice = parseFloat(url.searchParams.get('minPrice') || '0');
    const maxPrice = parseFloat(url.searchParams.get('maxPrice') || '999999');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const sortBy = url.searchParams.get('sortBy') || 'relevance'; // relevance, price, distance, date

    console.log('Search parameters:', { query, lat, lng, radius, category, minPrice, maxPrice, limit, sortBy });

    // Check if Firebase Admin is available
    if (!isFirebaseAdminAvailable()) {
      console.log('Firebase Admin not available, returning empty results for development');
      return json({
        listings: [],
        total: 0,
        message: 'Firebase Admin not configured - using client-side data only'
      });
    }

    // Build Firestore query
    let firestoreQuery = adminFirestore.collection('listings')
      .where('status', '==', 'active');

    // Add category filter if specified
    if (category && category !== 'all') {
      firestoreQuery = firestoreQuery.where('category', '==', category);
    }

    // Add price range filters
    if (minPrice > 0) {
      firestoreQuery = firestoreQuery.where('dailyPrice', '>=', minPrice);
    }
    if (maxPrice < 999999) {
      firestoreQuery = firestoreQuery.where('dailyPrice', '<=', maxPrice);
    }

    // If location is provided, add bounding box filter
    if (lat !== 0 && lng !== 0) {
      const boundingBox = getBoundingBox(lat, lng, radius);
      
      firestoreQuery = firestoreQuery
        .where('location.lat', '>=', boundingBox.south)
        .where('location.lat', '<=', boundingBox.north);
    }

    // Add limit
    firestoreQuery = firestoreQuery.limit(limit * 2); // Get more to filter by distance

    // Execute query
    const snapshot = await firestoreQuery.get();

    // Process results
    let listings: (Listing & { distance?: number; relevanceScore?: number })[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      const listing = { id: doc.id, ...data } as Listing;

      // Calculate distance if location is provided
      let distance: number | undefined;
      if (lat !== 0 && lng !== 0 && listing.location?.lat && listing.location?.lng) {
        distance = calculateDistance(lat, lng, listing.location.lat, listing.location.lng);
        
        // Filter by radius
        if (distance > radius) {
          return; // Skip this listing
        }
      }

      // Calculate relevance score for text search
      let relevanceScore = 0;
      if (query) {
        const searchTerms = query.toLowerCase().split(' ');
        const searchableText = [
          listing.title,
          listing.description,
          listing.brand,
          listing.model,
          listing.category,
          listing.subcategory
        ].join(' ').toLowerCase();

        searchTerms.forEach(term => {
          if (searchableText.includes(term)) {
            relevanceScore += 1;
            // Boost score for title matches
            if (listing.title.toLowerCase().includes(term)) {
              relevanceScore += 2;
            }
          }
        });

        // Skip if no relevance for text search
        if (relevanceScore === 0 && query.length > 0) {
          return;
        }
      }

      listings.push({
        ...listing,
        distance,
        relevanceScore
      });
    });

    // Apply longitude bounding box filter (Firestore doesn't support multiple range queries)
    if (lat !== 0 && lng !== 0) {
      const boundingBox = getBoundingBox(lat, lng, radius);
      listings = listings.filter(listing => {
        if (!listing.location?.lng) return false;
        return listing.location.lng >= boundingBox.west && listing.location.lng <= boundingBox.east;
      });
    }

    // Sort results
    switch (sortBy) {
      case 'price':
        listings.sort((a, b) => a.dailyPrice - b.dailyPrice);
        break;
      case 'distance':
        if (lat !== 0 && lng !== 0) {
          listings.sort((a, b) => (a.distance || 999) - (b.distance || 999));
        }
        break;
      case 'date':
        listings.sort((a, b) => {
          const aDate = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
          const bDate = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
          return bDate.getTime() - aDate.getTime();
        });
        break;
      case 'relevance':
      default:
        listings.sort((a, b) => {
          // Sort by relevance score first, then by distance
          if (a.relevanceScore !== b.relevanceScore) {
            return (b.relevanceScore || 0) - (a.relevanceScore || 0);
          }
          return (a.distance || 999) - (b.distance || 999);
        });
        break;
    }

    // Limit final results
    listings = listings.slice(0, limit);

    // Clean up response (remove internal scoring fields)
    const cleanListings = listings.map(({ distance, relevanceScore, ...listing }) => ({
      ...listing,
      ...(distance !== undefined && { distance: Math.round(distance * 100) / 100 }), // Round to 2 decimal places
      ...(distance !== undefined && { distanceMiles: Math.round(kmToMiles(distance) * 100) / 100 })
    }));

    return json({
      success: true,
      listings: cleanListings,
      totalCount: cleanListings.length,
      searchParams: {
        query,
        location: lat !== 0 && lng !== 0 ? { lat, lng } : null,
        radius,
        category,
        priceRange: { min: minPrice, max: maxPrice },
        sortBy
      }
    });

  } catch (error) {
    console.error('Error searching listings:', error);
    return json({ 
      success: false,
      error: 'Failed to search listings',
      listings: []
    }, { status: 500 });
  }
};
