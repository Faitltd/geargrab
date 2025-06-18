import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Mock listings data for testing
const mockListings = [
  {
    id: 'listing_1',
    title: 'Professional DSLR Camera',
    description: 'High-quality DSLR camera perfect for photography enthusiasts',
    category: 'photography',
    price: 50,
    location: 'Salt Lake City, UT',
    images: ['https://example.com/camera1.jpg'],
    owner: 'John Doe',
    rating: 4.8,
    features: ['4K Video', 'Image Stabilization', 'WiFi Connectivity']
  },
  {
    id: 'listing_2',
    title: 'Mountain Bike - Trek',
    description: 'Full suspension mountain bike for trail adventures',
    category: 'biking',
    price: 75,
    location: 'Park City, UT',
    images: ['https://example.com/bike1.jpg'],
    owner: 'Jane Smith',
    rating: 4.9,
    features: ['Full Suspension', '29" Wheels', 'Disc Brakes']
  },
  {
    id: 'listing_3',
    title: 'Camping Tent - 4 Person',
    description: 'Spacious 4-person tent for family camping trips',
    category: 'camping',
    price: 30,
    location: 'Provo, UT',
    images: ['https://example.com/tent1.jpg'],
    owner: 'Mike Johnson',
    rating: 4.7,
    features: ['Waterproof', 'Easy Setup', 'Vestibule']
  },
  {
    id: 'listing_4',
    title: 'Ski Equipment Set',
    description: 'Complete ski set with boots, skis, and poles',
    category: 'skiing',
    price: 60,
    location: 'Alta, UT',
    images: ['https://example.com/ski1.jpg'],
    owner: 'Sarah Wilson',
    rating: 4.6,
    features: ['All Mountain Skis', 'Adjustable Bindings', 'Ski Poles Included']
  },
  {
    id: 'listing_5',
    title: 'Hiking Backpack - 65L',
    description: 'Large capacity backpack for multi-day hiking trips',
    category: 'hiking',
    price: 25,
    location: 'Ogden, UT',
    images: ['https://example.com/backpack1.jpg'],
    owner: 'Chris Brown',
    rating: 4.5,
    features: ['65L Capacity', 'Rain Cover', 'Multiple Compartments']
  },
  {
    id: 'listing_6',
    title: 'Action Camera - GoPro',
    description: 'Waterproof action camera for adventure recording',
    category: 'photography',
    price: 35,
    location: 'Moab, UT',
    images: ['https://example.com/gopro1.jpg'],
    owner: 'Alex Davis',
    rating: 4.8,
    features: ['4K Recording', 'Waterproof', 'Image Stabilization']
  }
];

export const GET: RequestHandler = async ({ url }) => {
    try {
      // Get search parameters
      const query = url.searchParams.get('q') || '';
      const category = url.searchParams.get('category') || '';
      const minPrice = parseInt(url.searchParams.get('minPrice') || '0');
      const maxPrice = parseInt(url.searchParams.get('maxPrice') || '1000');
      const location = url.searchParams.get('location') || '';
      const sortBy = url.searchParams.get('sortBy') || 'relevance';
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const offset = parseInt(url.searchParams.get('offset') || '0');

      // Filter listings based on search criteria
      let filteredListings = mockListings.filter(listing => {
        // Text search
        if (query) {
          const searchText = query.toLowerCase();
          const matchesText = 
            listing.title.toLowerCase().includes(searchText) ||
            listing.description.toLowerCase().includes(searchText) ||
            listing.features.some(feature => feature.toLowerCase().includes(searchText));
          
          if (!matchesText) return false;
        }

        // Category filter
        if (category && listing.category !== category) {
          return false;
        }

        // Price range filter
        if (listing.price < minPrice || listing.price > maxPrice) {
          return false;
        }

        // Location filter
        if (location && !listing.location.toLowerCase().includes(location.toLowerCase())) {
          return false;
        }

        return true;
      });

      // Sort listings
      switch (sortBy) {
        case 'price_low':
          filteredListings.sort((a, b) => a.price - b.price);
          break;
        case 'price_high':
          filteredListings.sort((a, b) => b.price - a.price);
          break;
        case 'rating':
          filteredListings.sort((a, b) => b.rating - a.rating);
          break;
        case 'newest':
          // For mock data, we'll just reverse the order
          filteredListings.reverse();
          break;
        case 'relevance':
        default:
          // Keep original order for relevance
          break;
      }

      // Apply pagination
      const paginatedListings = filteredListings.slice(offset, offset + limit);

      // Calculate pagination info
      const totalResults = filteredListings.length;
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
