import type { ListingData } from '$lib/types';

export const sampleListings: Partial<ListingData>[] = [
  {
    id: '1',
    title: 'REI Co-op Half Dome 2 Plus Tent',
    description: 'Perfect 2-person tent for backpacking and car camping. Easy to set up, spacious interior, and excellent weather protection. Great for weekend adventures!',
    category: 'Camping & Hiking',
    brand: 'REI Co-op',
    condition: 'Excellent',
    location: 'San Francisco, CA',
    price: 25,
    pricing: {
      rentalPrice: {
        daily: 25,
        weekly: 150,
        monthly: 500
      }
    },
    images: [
      'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1571863533956-01c88e79957e?w=800&h=600&fit=crop'
    ],
    availability: {
      available: true,
      availableFrom: new Date().toISOString(),
      availableUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    },
    owner: {
      id: 'sample-owner-1',
      name: 'Alex Johnson',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      rating: 4.8,
      reviewCount: 23
    },
    status: 'active',
    views: 45,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Osprey Atmos AG 65 Backpack',
    description: 'Ultra-comfortable 65L backpack with Anti-Gravity suspension system. Perfect for multi-day hiking trips. Includes rain cover and hydration reservoir sleeve.',
    category: 'Camping & Hiking',
    brand: 'Osprey',
    condition: 'Very Good',
    location: 'Portland, OR',
    price: 20,
    pricing: {
      rentalPrice: {
        daily: 20,
        weekly: 120,
        monthly: 400
      }
    },
    images: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=800&h=600&fit=crop'
    ],
    availability: {
      available: true,
      availableFrom: new Date().toISOString(),
      availableUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    },
    owner: {
      id: 'sample-owner-2',
      name: 'Sarah Chen',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      rating: 4.9,
      reviewCount: 31
    },
    status: 'active',
    views: 67,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    title: 'Canon EOS R5 Camera Body',
    description: 'Professional mirrorless camera with 45MP sensor and 8K video recording. Perfect for photography enthusiasts and content creators. Includes battery and charger.',
    category: 'Photography & Video',
    brand: 'Canon',
    condition: 'Excellent',
    location: 'Los Angeles, CA',
    price: 75,
    pricing: {
      rentalPrice: {
        daily: 75,
        weekly: 450,
        monthly: 1500
      }
    },
    images: [
      'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&h=600&fit=crop'
    ],
    availability: {
      available: true,
      availableFrom: new Date().toISOString(),
      availableUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    },
    owner: {
      id: 'sample-owner-3',
      name: 'Mike Rodriguez',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      rating: 4.7,
      reviewCount: 18
    },
    status: 'active',
    views: 89,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '4',
    title: 'Patagonia Down Sweater Jacket',
    description: 'Lightweight and packable down jacket perfect for layering. 800-fill-power down insulation keeps you warm in cold conditions. Size Medium.',
    category: 'Clothing & Gear',
    brand: 'Patagonia',
    condition: 'Very Good',
    location: 'Denver, CO',
    price: 15,
    pricing: {
      rentalPrice: {
        daily: 15,
        weekly: 90,
        monthly: 300
      }
    },
    images: [
      'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop'
    ],
    availability: {
      available: true,
      availableFrom: new Date().toISOString(),
      availableUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    },
    owner: {
      id: 'sample-owner-4',
      name: 'Emma Wilson',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      rating: 4.6,
      reviewCount: 12
    },
    status: 'active',
    views: 34,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '5',
    title: 'DJI Mavic Air 2 Drone',
    description: 'Professional drone with 4K camera and 34-minute flight time. Perfect for aerial photography and videography. Includes controller, batteries, and carrying case.',
    category: 'Photography & Video',
    brand: 'DJI',
    condition: 'Excellent',
    location: 'Austin, TX',
    price: 50,
    pricing: {
      rentalPrice: {
        daily: 50,
        weekly: 300,
        monthly: 1000
      }
    },
    images: [
      'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=800&h=600&fit=crop'
    ],
    availability: {
      available: true,
      availableFrom: new Date().toISOString(),
      availableUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    },
    owner: {
      id: 'sample-owner-5',
      name: 'David Kim',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
      rating: 4.9,
      reviewCount: 27
    },
    status: 'active',
    views: 78,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  }
];
