/**
 * Individual Listing API Endpoint - Sample Data
 * Handles operations for a specific listing
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Sample listings data - same as main API
const sampleListings = [
  {
    id: '1',
    title: 'REI Co-op Half Dome 2 Plus Tent',
    description: 'Perfect 2-person tent for backpacking and car camping. Easy to set up, spacious interior, and excellent weather protection.',
    category: 'camping',
    brand: 'REI Co-op',
    condition: 'Excellent',
    location: 'San Francisco, CA',
    price: 25,
    priceUnit: 'day',
    images: ['https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
    rating: 4.8,
    reviewCount: 23,
    owner: {
      id: 'sample-owner-1',
      name: 'Alex Johnson',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
      verified: true
    },
    status: 'active',
    availability: 'available',
    featured: true,
    views: 45,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Black Diamond Solution Climbing Harness',
    description: 'Professional climbing harness with 4 gear loops and belay loop. Comfortable for all-day climbing sessions.',
    category: 'climbing',
    brand: 'Black Diamond',
    condition: 'Excellent',
    location: 'Boulder, CO',
    price: 15,
    priceUnit: 'day',
    images: ['https://images.unsplash.com/photo-1522163182402-834f871fd851?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
    rating: 4.9,
    reviewCount: 31,
    owner: {
      id: 'sample-owner-2',
      name: 'Mike Rodriguez',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
      verified: true
    },
    status: 'active',
    availability: 'available',
    featured: true,
    views: 67,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    title: 'Trek Fuel EX 8 Mountain Bike',
    description: 'Full suspension mountain bike perfect for trail riding. 29" wheels, 130mm travel, and reliable Shimano components.',
    category: 'cycling',
    brand: 'Trek',
    condition: 'Very Good',
    location: 'Moab, UT',
    price: 65,
    priceUnit: 'day',
    images: ['https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
    rating: 4.7,
    reviewCount: 18,
    owner: {
      id: 'sample-owner-3',
      name: 'Emma Wilson',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
      verified: true
    },
    status: 'active',
    availability: 'available',
    featured: true,
    views: 89,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '4',
    title: 'BOTE Flood Aero Inflatable SUP',
    description: 'Premium inflatable stand-up paddleboard. 11\'6" length, ultra-stable design perfect for beginners and experienced paddlers.',
    category: 'water-sports',
    brand: 'BOTE',
    condition: 'Excellent',
    location: 'San Diego, CA',
    price: 35,
    priceUnit: 'day',
    images: ['https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
    rating: 4.8,
    reviewCount: 27,
    owner: {
      id: 'sample-owner-4',
      name: 'Jake Martinez',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
      verified: true
    },
    status: 'active',
    availability: 'available',
    featured: true,
    views: 52,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '5',
    title: 'Rossignol Experience 88 Ti Skis',
    description: 'All-mountain skis perfect for groomed runs and off-piste adventures. 172cm length, titanium construction for stability.',
    category: 'winter-sports',
    brand: 'Rossignol',
    condition: 'Good',
    location: 'Park City, UT',
    price: 45,
    priceUnit: 'day',
    images: ['https://images.unsplash.com/photo-1551524164-6cf2ac2d8c9c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
    rating: 4.6,
    reviewCount: 14,
    owner: {
      id: 'sample-owner-5',
      name: 'Sophie Anderson',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
      verified: true
    },
    status: 'active',
    availability: 'available',
    featured: true,
    views: 73,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '6',
    title: 'Patagonia Black Hole Duffel 70L',
    description: 'Durable travel duffel bag perfect for adventure travel. Weather-resistant fabric, multiple carry options.',
    category: 'travel',
    brand: 'Patagonia',
    condition: 'Very Good',
    location: 'Seattle, WA',
    price: 12,
    priceUnit: 'day',
    images: ['https://images.unsplash.com/photo-1488646953014-85cb44e25828?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
    rating: 4.9,
    reviewCount: 22,
    owner: {
      id: 'sample-owner-6',
      name: 'David Kim',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
      verified: true
    },
    status: 'active',
    availability: 'available',
    featured: true,
    views: 38,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  }
];

/**
 * GET /api/listings/[id]
 * Fetch a specific listing by ID
 */
export const GET: RequestHandler = async ({ params }) => {
  try {
    const { id } = params;

    if (!id) {
      return error(400, {
        message: 'Listing ID is required'
      });
    }

    // Find the listing in sample data
    const listing = sampleListings.find(l => l.id === id);

    if (!listing) {
      return error(404, {
        message: 'Listing not found'
      });
    }

    return json({
      success: true,
      listing
    });

  } catch (err: any) {
    console.error('Error fetching listing:', err);
    return error(500, {
      message: 'Failed to fetch listing',
      details: err.message
    });
  }
};
