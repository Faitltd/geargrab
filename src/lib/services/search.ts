// Advanced search and filtering service for GearGrab
import { db } from '$lib/firebase/client';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  startAfter,
  getDocs,
  type DocumentSnapshot 
} from 'firebase/firestore';

export interface SearchFilters {
  // Basic filters
  query?: string;
  category?: string;
  location?: {
    city?: string;
    state?: string;
    radius?: number; // miles
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  
  // Date filters
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  
  // Price filters
  priceRange?: {
    min: number;
    max: number;
    period: 'day' | 'week' | 'month';
  };
  
  // Feature filters
  features?: string[];
  condition?: ('new' | 'excellent' | 'good' | 'fair')[];
  
  // Availability filters
  instantBook?: boolean;
  deliveryOptions?: ('pickup' | 'delivery' | 'shipping')[];
  
  // Trust & safety filters
  verifiedOwners?: boolean;
  minRating?: number;
  insuranceRequired?: boolean;
  
  // Sorting
  sortBy?: 'relevance' | 'price_low' | 'price_high' | 'distance' | 'rating' | 'newest';
  
  // Pagination
  limit?: number;
  lastDoc?: DocumentSnapshot;
}

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  dailyPrice: number;
  weeklyPrice?: number;
  monthlyPrice?: number;
  images: string[];
  location: {
    city: string;
    state: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  owner: {
    id: string;
    name: string;
    avatar?: string;
    rating: number;
    reviewCount: number;
    isVerified: boolean;
  };
  features: string[];
  condition: string;
  rating: number;
  reviewCount: number;
  distance?: number; // miles from search location
  availability: {
    instantBook: boolean;
    deliveryOptions: string[];
    nextAvailable?: Date;
  };
  insurance: {
    required: boolean;
    tiers: string[];
  };
  createdAt: Date;
  lastBooked?: Date;
  isPromoted?: boolean;
}

export interface SearchSuggestion {
  type: 'category' | 'location' | 'feature' | 'brand';
  text: string;
  count?: number;
}

export interface PopularSearch {
  query: string;
  count: number;
  category?: string;
}

// Predefined categories and subcategories
export const GEAR_CATEGORIES = {
  camping: {
    name: 'Camping',
    icon: '⛺',
    subcategories: ['Tents', 'Sleeping Bags', 'Sleeping Pads', 'Camp Furniture', 'Cooking Gear', 'Lighting']
  },
  hiking: {
    name: 'Hiking & Backpacking',
    icon: '🥾',
    subcategories: ['Backpacks', 'Hiking Boots', 'Trekking Poles', 'Navigation', 'Hydration', 'Safety Gear']
  },
  climbing: {
    name: 'Climbing',
    icon: '🧗',
    subcategories: ['Ropes', 'Harnesses', 'Helmets', 'Protection', 'Shoes', 'Hardware']
  },
  skiing: {
    name: 'Skiing & Snowboarding',
    icon: '⛷️',
    subcategories: ['Skis', 'Snowboards', 'Boots', 'Bindings', 'Poles', 'Safety Gear']
  },
  cycling: {
    name: 'Cycling',
    icon: '🚴',
    subcategories: ['Mountain Bikes', 'Road Bikes', 'E-Bikes', 'Helmets', 'Accessories', 'Maintenance']
  },
  watersports: {
    name: 'Water Sports',
    icon: '🏄',
    subcategories: ['Kayaks', 'Paddleboards', 'Surfboards', 'Wetsuits', 'Life Jackets', 'Accessories']
  },
  photography: {
    name: 'Photography',
    icon: '📸',
    subcategories: ['Cameras', 'Lenses', 'Tripods', 'Lighting', 'Drones', 'Accessories']
  }
};

// Common gear features
export const GEAR_FEATURES = [
  'Waterproof', 'Lightweight', 'Compact', 'Durable', 'Breathable',
  'Insulated', 'UV Protection', 'Quick Setup', 'Multi-Season',
  'Professional Grade', 'Beginner Friendly', 'Award Winning'
];

class SearchService {
  // Perform search with filters
  async search(filters: SearchFilters): Promise<{
    results: SearchResult[];
    totalCount: number;
    hasMore: boolean;
    suggestions?: SearchSuggestion[];
  }> {
    try {
      // In a real implementation, this would use Algolia, Elasticsearch, or Firebase's full-text search
      // For now, we'll return sample data that matches the filters
      
      const sampleResults: SearchResult[] = [
        {
          id: 'listing_001',
          title: 'REI Co-op Half Dome 4 Plus Tent - Premium Family Camping',
          description: 'Spacious 4-person tent perfect for family camping adventures',
          category: 'camping',
          subcategory: 'Tents',
          dailyPrice: 45,
          weeklyPrice: 250,
          monthlyPrice: 800,
          images: [
            'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
          ],
          location: {
            city: 'Salt Lake City',
            state: 'UT',
            coordinates: { lat: 40.7608, lng: -111.8910 }
          },
          owner: {
            id: 'owner_001',
            name: 'David Wilson',
            avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
            rating: 4.9,
            reviewCount: 127,
            isVerified: true
          },
          features: ['Waterproof', 'Quick Setup', 'Family Friendly', 'Spacious'],
          condition: 'excellent',
          rating: 4.8,
          reviewCount: 89,
          distance: 2.3,
          availability: {
            instantBook: true,
            deliveryOptions: ['pickup', 'delivery'],
            nextAvailable: new Date('2024-02-01')
          },
          insurance: {
            required: false,
            tiers: ['basic', 'standard', 'premium']
          },
          createdAt: new Date('2023-06-15'),
          lastBooked: new Date('2024-01-10'),
          isPromoted: true
        },
        {
          id: 'listing_002',
          title: 'Osprey Atmos 65L Backpack - Ultralight Hiking Pack',
          description: 'Professional-grade hiking backpack for multi-day adventures',
          category: 'hiking',
          subcategory: 'Backpacks',
          dailyPrice: 25,
          weeklyPrice: 140,
          monthlyPrice: 450,
          images: [
            'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
          ],
          location: {
            city: 'Park City',
            state: 'UT',
            coordinates: { lat: 40.6461, lng: -111.4980 }
          },
          owner: {
            id: 'owner_002',
            name: 'Sarah Johnson',
            avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
            rating: 4.7,
            reviewCount: 93,
            isVerified: true
          },
          features: ['Lightweight', 'Ergonomic', 'Ventilated', 'Durable'],
          condition: 'good',
          rating: 4.6,
          reviewCount: 45,
          distance: 15.7,
          availability: {
            instantBook: false,
            deliveryOptions: ['pickup', 'shipping'],
            nextAvailable: new Date('2024-02-05')
          },
          insurance: {
            required: true,
            tiers: ['standard', 'premium']
          },
          createdAt: new Date('2023-08-22'),
          lastBooked: new Date('2024-01-08')
        }
      ];

      // Apply filters to sample data
      let filteredResults = sampleResults;

      if (filters.query) {
        const queryLower = filters.query.toLowerCase();
        filteredResults = filteredResults.filter(item =>
          item.title.toLowerCase().includes(queryLower) ||
          item.description.toLowerCase().includes(queryLower) ||
          item.features.some(feature => feature.toLowerCase().includes(queryLower))
        );
      }

      if (filters.category) {
        filteredResults = filteredResults.filter(item => item.category === filters.category);
      }

      if (filters.priceRange) {
        filteredResults = filteredResults.filter(item => {
          const price = filters.priceRange!.period === 'day' ? item.dailyPrice :
                       filters.priceRange!.period === 'week' ? (item.weeklyPrice || item.dailyPrice * 7) :
                       (item.monthlyPrice || item.dailyPrice * 30);
          return price >= filters.priceRange!.min && price <= filters.priceRange!.max;
        });
      }

      if (filters.verifiedOwners) {
        filteredResults = filteredResults.filter(item => item.owner.isVerified);
      }

      if (filters.minRating) {
        filteredResults = filteredResults.filter(item => item.rating >= filters.minRating!);
      }

      if (filters.instantBook) {
        filteredResults = filteredResults.filter(item => item.availability.instantBook);
      }

      // Apply sorting
      if (filters.sortBy) {
        filteredResults.sort((a, b) => {
          switch (filters.sortBy) {
            case 'price_low':
              return a.dailyPrice - b.dailyPrice;
            case 'price_high':
              return b.dailyPrice - a.dailyPrice;
            case 'rating':
              return b.rating - a.rating;
            case 'distance':
              return (a.distance || 0) - (b.distance || 0);
            case 'newest':
              return b.createdAt.getTime() - a.createdAt.getTime();
            default:
              return 0;
          }
        });
      }

      // Apply pagination
      const pageSize = filters.limit || 20;
      const paginatedResults = filteredResults.slice(0, pageSize);

      return {
        results: paginatedResults,
        totalCount: filteredResults.length,
        hasMore: filteredResults.length > pageSize,
        suggestions: this.generateSuggestions(filters.query)
      };

    } catch (error) {
      console.error('Error performing search:', error);
      throw error;
    }
  }

  // Get search suggestions
  generateSuggestions(query?: string): SearchSuggestion[] {
    const suggestions: SearchSuggestion[] = [];

    if (!query || query.length < 2) {
      // Return popular categories
      Object.entries(GEAR_CATEGORIES).forEach(([key, category]) => {
        suggestions.push({
          type: 'category',
          text: category.name,
          count: Math.floor(Math.random() * 100) + 20
        });
      });
    } else {
      // Return query-based suggestions
      const queryLower = query.toLowerCase();
      
      // Category suggestions
      Object.entries(GEAR_CATEGORIES).forEach(([key, category]) => {
        if (category.name.toLowerCase().includes(queryLower)) {
          suggestions.push({
            type: 'category',
            text: category.name,
            count: Math.floor(Math.random() * 50) + 10
          });
        }
      });

      // Feature suggestions
      GEAR_FEATURES.forEach(feature => {
        if (feature.toLowerCase().includes(queryLower)) {
          suggestions.push({
            type: 'feature',
            text: feature,
            count: Math.floor(Math.random() * 30) + 5
          });
        }
      });
    }

    return suggestions.slice(0, 8);
  }

  // Get popular searches
  async getPopularSearches(): Promise<PopularSearch[]> {
    // In a real implementation, this would come from analytics data
    return [
      { query: 'camping tent', count: 1250, category: 'camping' },
      { query: 'hiking backpack', count: 980, category: 'hiking' },
      { query: 'mountain bike', count: 875, category: 'cycling' },
      { query: 'sleeping bag', count: 720, category: 'camping' },
      { query: 'kayak', count: 650, category: 'watersports' },
      { query: 'ski equipment', count: 580, category: 'skiing' },
      { query: 'climbing gear', count: 520, category: 'climbing' },
      { query: 'camera', count: 480, category: 'photography' }
    ];
  }

  // Get trending gear
  async getTrendingGear(): Promise<SearchResult[]> {
    // Return gear that's currently popular
    const filters: SearchFilters = {
      sortBy: 'relevance',
      limit: 6
    };
    
    const results = await this.search(filters);
    return results.results;
  }

  // Get gear recommendations based on user activity
  async getRecommendations(userId: string): Promise<SearchResult[]> {
    // In a real implementation, this would use ML/AI for personalized recommendations
    const filters: SearchFilters = {
      sortBy: 'rating',
      limit: 8
    };
    
    const results = await this.search(filters);
    return results.results;
  }

  // Save search for analytics
  async saveSearch(query: string, filters: SearchFilters, userId?: string): Promise<void> {
    try {
      // In a real implementation, save to analytics collection
      console.log('Search saved:', { query, filters, userId, timestamp: new Date() });
    } catch (error) {
      console.error('Error saving search:', error);
    }
  }
}

export const searchService = new SearchService();
