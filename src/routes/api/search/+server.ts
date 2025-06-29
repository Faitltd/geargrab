import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminFirestore, isFirebaseAdminAvailable } from '$lib/firebase/server';
import type { Listing } from '$types/firestore';

// Main search endpoint
export const GET: RequestHandler = async ({ url }) => {
  try {
    // Parse query parameters
    const query = url.searchParams.get('q') || '';
    const category = url.searchParams.get('category');
    const location = url.searchParams.get('location');
    const minPrice = parseFloat(url.searchParams.get('minPrice') || '0');
    const maxPrice = parseFloat(url.searchParams.get('maxPrice') || '999999');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const sortBy = url.searchParams.get('sortBy') || 'relevance';

    console.log('🔍 Search request:', { query, category, location, minPrice, maxPrice, limit, sortBy });

    // Check if Firebase Admin is available
    if (!isFirebaseAdminAvailable()) {
      console.log('Firebase Admin not available, returning empty results');
      return json({
        listings: [],
        total: 0,
        message: 'Firebase Admin not configured - using client-side data only'
      });
    }

    // Build Firestore query
    let firestoreQuery = adminFirestore.collection('listings')
      .where('status', '==', 'active')
      .where('isActive', '==', true);

    // Add category filter if specified
    if (category && category !== 'all') {
      firestoreQuery = firestoreQuery.where('category', '==', category);
    }

    // Note: Price filtering will be done client-side to avoid complex index requirements

    // Note: Location filtering will be done client-side to avoid complex index requirements

    // Add sorting
    switch (sortBy) {
      case 'price_low':
        firestoreQuery = firestoreQuery.orderBy('dailyPrice', 'asc');
        break;
      case 'price_high':
        firestoreQuery = firestoreQuery.orderBy('dailyPrice', 'desc');
        break;
      case 'newest':
        firestoreQuery = firestoreQuery.orderBy('createdAt', 'desc');
        break;
      case 'rating':
        firestoreQuery = firestoreQuery.orderBy('averageRating', 'desc');
        break;
      case 'relevance':
      default:
        // For relevance, we'll order by creation date and then filter/sort client-side
        firestoreQuery = firestoreQuery.orderBy('createdAt', 'desc');
        break;
    }

    // Add limit (get more than needed for client-side filtering)
    firestoreQuery = firestoreQuery.limit(Math.min(limit * 5, 100));

    // Execute query
    const snapshot = await firestoreQuery.get();

    // Process results
    let listings: (Listing & { relevanceScore?: number })[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      const listing = { id: doc.id, ...data } as Listing;

      // If there's a text query, calculate relevance score
      let relevanceScore = 0;
      if (query && query.trim()) {
        const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 0);
        const searchableText = [
          listing.title,
          listing.description,
          listing.brand,
          listing.model,
          listing.category,
          ...(listing.features || [])
        ].join(' ').toLowerCase();

        // Calculate relevance score
        searchTerms.forEach(term => {
          if (listing.title.toLowerCase().includes(term)) relevanceScore += 10;
          if (listing.description.toLowerCase().includes(term)) relevanceScore += 5;
          if (listing.brand?.toLowerCase().includes(term)) relevanceScore += 8;
          if (listing.model?.toLowerCase().includes(term)) relevanceScore += 8;
          if (listing.category.toLowerCase().includes(term)) relevanceScore += 6;
          if (listing.features?.some(f => f.toLowerCase().includes(term))) relevanceScore += 3;
        });

        // Only include if there's some relevance
        if (relevanceScore > 0) {
          listings.push({ ...listing, relevanceScore });
        }
      } else {
        // No text query, include all results
        listings.push(listing);
      }
    });

    // Apply client-side filtering

    // Location filtering
    if (location && location.trim()) {
      const locationLower = location.toLowerCase().trim();
      listings = listings.filter(listing => {
        const cityMatch = listing.location?.city?.toLowerCase().includes(locationLower);
        const stateMatch = listing.location?.state?.toLowerCase().includes(locationLower);
        const zipMatch = listing.location?.zipCode?.includes(locationLower);
        return cityMatch || stateMatch || zipMatch;
      });
    }

    // Price range filtering
    if (minPrice > 0 || maxPrice < 999999) {
      listings = listings.filter(listing => {
        const price = listing.dailyPrice || 0;
        return price >= minPrice && price <= maxPrice;
      });
    }

    // Sort by relevance if text query was provided
    if (query && query.trim()) {
      listings.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
    }

    // Limit final results
    listings = listings.slice(0, limit);

    // Clean up response (remove internal scoring fields)
    const cleanListings = listings.map(({ relevanceScore, ...listing }) => listing);

    console.log(`✅ Search completed: ${cleanListings.length} results found`);

    return json({
      success: true,
      listings: cleanListings,
      total: cleanListings.length,
      searchParams: {
        query,
        category,
        location,
        priceRange: { min: minPrice, max: maxPrice },
        sortBy
      }
    });

  } catch (error) {
    console.error('❌ Error searching listings:', error);
    return json({ 
      success: false,
      error: 'Failed to search listings',
      listings: [],
      total: 0
    }, { status: 500 });
  }
};
