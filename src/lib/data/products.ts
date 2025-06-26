// Comprehensive product catalog for GearGrab
//
// 🚀 NEW LISTINGS: Use the validation utilities to ensure proper display!
// Import: import { createListing, addNewListing } from '$lib/utils/listing-helpers';
// Usage: const newListing = createListing({ title: 'My Gear', category: 'biking', dailyPrice: 40 });
//
// The validation system automatically:
// ✅ Ensures proper image URLs with fallbacks
// ✅ Validates required fields
// ✅ Provides category-appropriate default images
// ✅ Handles missing or invalid data gracefully
export interface Product {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  brand: string;
  model?: string;
  condition: 'New' | 'Like New' | 'Good' | 'Fair';
  ageInYears?: number;
  dailyPrice: number;
  weeklyPrice?: number;
  monthlyPrice?: number;
  securityDeposit: number;
  location: {
    city: string;
    state: string;
    zipCode: string;
  };
  images: string[];
  features: string[];
  specifications: Record<string, string>;
  owner: {
    id: string;
    name: string;
    avatar: string;
    rating: number;
    reviewCount: number;
  };
  availability: {
    unavailableDates: string[];
    minimumRental: number;
    maximumRental: number;
  };
  reviews: Array<{
    id: string;
    userId: string;
    userName: string;
    rating: number;
    text: string;
    date: string;
  }>;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export const products: Product[] = [
  // No static test data - all products should come from the database
];

// Featured gear for homepage (empty - should come from database)
export const featuredGear: any[] = [
  // No static test data - all featured gear should come from the database
];

// Categories for homepage
export const categories = [
  {
    name: 'Camping',
    icon: '🏕️',
    description: 'Tents, sleeping bags, and outdoor essentials'
  },
  {
    name: 'Biking',
    icon: '🚴',
    description: 'Mountain bikes, road bikes, and cycling gear'
  },
  {
    name: 'Water Sports',
    icon: '🏄',
    description: 'Kayaks, surfboards, and water equipment'
  },
  {
    name: 'Winter Sports',
    icon: '⛷️',
    description: 'Skis, snowboards, and winter gear'
  },
  {
    name: 'Climbing',
    icon: '🧗',
    description: 'Ropes, harnesses, and climbing equipment'
  },
  {
    name: 'Photography',
    icon: '📸',
    description: 'Cameras, lenses, and photo equipment'
  }
];
