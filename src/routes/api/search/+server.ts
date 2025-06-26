import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminFirestore, isFirebaseAdminAvailable } from '$lib/firebase/admin';

export const GET: RequestHandler = async ({ url }) => {
    try {
      // Get search parameters
      const query = url.searchParams.get('q') || '';
      const category = url.searchParams.get('category') || '';
      const minPrice = parseInt(url.searchParams.get('minPrice') || '0');
      const maxPrice = parseInt(url.searchParams.get('maxPrice') || '10000');
      const location = url.searchParams.get('location') || '';
      const sortBy = url.searchParams.get('sortBy') || 'relevance';
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const offset = parseInt(url.searchParams.get('offset') || '0');

      console.log('🔍 Search API called with:', { query, category, minPrice, maxPrice, location, sortBy, limit });

      // Check if Firebase Admin is available
      if (!isFirebaseAdminAvailable()) {
        console.log('Firebase Admin not available, returning empty results');
        return json({
          success: true,
          listings: [],
          pagination: {
            totalResults: 0,
            currentPage: 1,
            totalPages: 0,
            hasMore: false,
            limit,
            offset
          },
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
      if (maxPrice < 10000) {
        firestoreQuery = firestoreQuery.where('dailyPrice', '<=', maxPrice);
      }

      // Add limit
      firestoreQuery = firestoreQuery.limit(limit * 2); // Get more to filter by text search

      // Execute query
      const snapshot = await firestoreQuery.get();

      // Process results
      let listings: any[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        const listing = { id: doc.id, ...data };
        listings.push(listing);
      });

      console.log(`📦 Found ${listings.length} listings before text filtering`);

      // Apply client-side text search if query provided
      if (query && query.trim()) {
        const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
        listings = listings.filter(listing => {
          const searchableText = [
            listing.title || '',
            listing.description || '',
            listing.brand || '',
            listing.model || '',
            listing.category || '',
            listing.subcategory || '',
            ...(listing.features || [])
          ].join(' ').toLowerCase();

          return searchTerms.some(term => searchableText.includes(term));
        });
      }

      console.log(`🎯 Found ${listings.length} listings after text filtering`);

      // Sort results
      switch (sortBy) {
        case 'price':
          listings.sort((a, b) => (a.dailyPrice || 0) - (b.dailyPrice || 0));
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
          // Sort by relevance (title matches first, then description matches)
          if (query && query.trim()) {
            const searchTerms = query.toLowerCase().split(' ');
            listings.sort((a, b) => {
              let aScore = 0;
              let bScore = 0;

              searchTerms.forEach(term => {
                if ((a.title || '').toLowerCase().includes(term)) aScore += 3;
                if ((a.description || '').toLowerCase().includes(term)) aScore += 1;
                if ((b.title || '').toLowerCase().includes(term)) bScore += 3;
                if ((b.description || '').toLowerCase().includes(term)) bScore += 1;
              });

              return bScore - aScore;
            });
          }
          break;
      }

      // Apply pagination
      const totalResults = listings.length;
      const paginatedListings = listings.slice(offset, offset + limit);
      const hasMore = offset + limit < totalResults;
      const totalPages = Math.ceil(totalResults / limit);
      const currentPage = Math.floor(offset / limit) + 1;

      return json({
        success: true,
        listings: paginatedListings,
        pagination: {
          totalResults,
          currentPage,
          totalPages,
          hasMore,
          limit,
          offset
        },
        filters: {
          query,
          category,
          minPrice,
          maxPrice,
          location,
          sortBy
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Search error:', error);
      return json({
        success: false,
        error: 'Search failed',
        details: error.message,
        listings: [],
        pagination: {
          totalResults: 0,
          currentPage: 1,
          totalPages: 0,
          hasMore: false,
          limit: 20,
          offset: 0
        }
      }, { status: 500 });
    }
};
