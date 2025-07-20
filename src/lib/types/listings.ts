// Listing related types

import type { BaseEntity, Coordinates, DateRange } from './common';

export interface ListingData extends BaseEntity {
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  brand?: string;
  model?: string;
  condition: GearCondition;
  images: string[];
  pricing: ListingPricing;
  availability: ListingAvailability;
  location: ListingLocation;
  owner: ListingOwner;
  specifications?: GearSpecifications;
  policies?: ListingPolicies;
  status: ListingStatus;
  views: number;
  favorites: number;
  tags?: string[];
}

export interface ListingPricing {
  salePrice?: number;
  rentalPrice?: {
    daily: number;
    weekly?: number;
    monthly?: number;
  };
  deposit?: number;
  currency: string;
  negotiable: boolean;
}

export interface ListingAvailability {
  forSale: boolean;
  forRent: boolean;
  availableDates?: DateRange[];
  blockedDates?: DateRange[];
  minimumRentalDays?: number;
  maximumRentalDays?: number;
}

export interface ListingLocation {
  coordinates: Coordinates;
  address?: {
    city: string;
    state: string;
    country: string;
  };
  deliveryOptions: {
    pickup: boolean;
    delivery: boolean;
    shipping: boolean;
  };
  deliveryRadius?: number;
  deliveryFee?: number;
}

export interface ListingOwner {
  id: string;
  name: string;
  avatar?: string;
  rating?: number;
  reviewCount?: number;
  responseTime?: string;
  joinedDate: string;
  isVerified: boolean;
}

export interface GearSpecifications {
  weight?: string;
  dimensions?: string;
  material?: string;
  color?: string;
  size?: string;
  year?: number;
  features?: string[];
  included?: string[];
  notIncluded?: string[];
}

export interface ListingPolicies {
  cancellation: {
    policy: 'flexible' | 'moderate' | 'strict';
    description: string;
  };
  damage: {
    policy: string;
    fee?: number;
  };
  lateReturn: {
    fee: number;
    gracePeriod: number;
  };
  cleaning: {
    required: boolean;
    fee?: number;
  };
}

export type ListingStatus = 'active' | 'inactive' | 'sold' | 'rented' | 'pending' | 'draft';

export type GearCondition = 'new' | 'excellent' | 'good' | 'fair' | 'poor';

export interface ListingFilters {
  category?: string;
  subcategory?: string;
  condition?: GearCondition[];
  priceRange?: {
    min: number;
    max: number;
  };
  location?: Coordinates;
  radius?: number;
  availability?: DateRange;
  forSale?: boolean;
  forRent?: boolean;
  deliveryOptions?: string[];
}

export interface ListingSearchParams extends ListingFilters {
  query?: string;
  sortBy?: 'relevance' | 'price' | 'distance' | 'newest' | 'rating';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}
