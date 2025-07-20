// Review related types

import type { BaseEntity } from './common';

export interface ReviewData extends BaseEntity {
  reviewerId: string;
  revieweeId: string;
  listingId?: string;
  listingTitle?: string;
  listingImageUrl?: string;
  rentalId?: string;
  bookingId?: string;
  saleId?: string;
  type: ReviewType;
  rating: number;
  title?: string;
  comment: string;
  photos?: string[];
  helpful: number;
  helpfulVotes: string[]; // User IDs who voted helpful
  reported: boolean;
  reportCount: number;
  verified: boolean;
  response?: ReviewResponse;
  tags?: ReviewTag[];
  status: 'active' | 'hidden' | 'deleted';
  moderationNotes?: string;
  // Additional fields for display
  reviewerName?: string;
  reviewerAvatar?: string;
  revieweeName?: string;
  revieweeAvatar?: string;
  reportReason?: string;
  reportedAt?: any;
}

export type ReviewType = 'listing' | 'renter' | 'owner' | 'buyer' | 'seller';

export interface ReviewResponse {
  id: string;
  responderId: string;
  comment: string;
  createdAt: any;
  updatedAt?: any;
}

export interface ReviewTag {
  id: string;
  name: string;
  category: 'positive' | 'negative' | 'neutral';
  color?: string;
}

export interface ReviewRequest {
  id?: string;
  bookingId: string;
  rentalId?: string;
  listingId: string;
  listingTitle: string;
  listingImageUrl?: string;
  reviewerId: string;
  reviewerName: string;
  revieweeId: string;
  revieweeName: string;
  revieweeAvatar?: string;
  type: ReviewType;
  dueDate: any;
  remindersSent: number;
  completed: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface UserRatingStats {
  asRenter: {
    totalReviews: number;
    averageRating: number;
    recentRating: number; // Last 10 reviews
  };
  asOwner: {
    totalReviews: number;
    averageRating: number;
    recentRating: number; // Last 10 reviews
  };
  overall: {
    totalReviews: number;
    averageRating: number;
    responseRate: number; // Percentage of reviews responded to
  };
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  recentReviews: ReviewData[];
  topTags: Array<{
    tag: string;
    count: number;
    percentage: number;
    sentiment: 'positive' | 'negative' | 'neutral';
  }>;
  verifiedReviews: number;
  recentReviewsCount: number; // Reviews in last 30 days
}

export interface ReviewFilters {
  rating?: number[];
  minRating?: number;
  maxRating?: number;
  type?: ReviewType[];
  verified?: boolean;
  hasPhotos?: boolean;
  tags?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  sortBy?: 'newest' | 'oldest' | 'highest_rating' | 'lowest_rating' | 'most_helpful';
  limit?: number;
  offset?: number;
}

export interface ReviewSubmission {
  revieweeId: string;
  listingId?: string;
  rentalId?: string;
  saleId?: string;
  type: ReviewType;
  rating: number;
  title?: string;
  comment: string;
  photos?: File[];
  tags?: string[];
}

export interface ReviewMetrics {
  userRating: number;
  userReviewCount: number;
  listingRating: number;
  listingReviewCount: number;
  responseRate: number;
  responseTime: string;
}

// Available review tags
export const REVIEW_TAGS = {
  listing: [
    { id: 'clean', name: 'Clean & Well-Maintained', category: 'positive' as const, color: 'green' },
    { id: 'accurate', name: 'Accurate Description', category: 'positive' as const, color: 'purple' },
    { id: 'quality', name: 'High Quality', category: 'positive' as const, color: 'blue' },
    { id: 'value', name: 'Great Value', category: 'positive' as const, color: 'yellow' },
    { id: 'condition', name: 'Excellent Condition', category: 'positive' as const, color: 'green' },
    { id: 'easy-use', name: 'Easy to Use', category: 'positive' as const, color: 'indigo' },
    { id: 'complete', name: 'Complete Set', category: 'positive' as const, color: 'teal' },
    { id: 'modern', name: 'Modern/Updated', category: 'positive' as const, color: 'cyan' },
    { id: 'dirty', name: 'Not Clean', category: 'negative' as const, color: 'red' },
    { id: 'damaged', name: 'Damaged', category: 'negative' as const, color: 'red' },
    { id: 'missing-parts', name: 'Missing Parts', category: 'negative' as const, color: 'red' },
    { id: 'poor-condition', name: 'Poor Condition', category: 'negative' as const, color: 'red' }
  ],
  user: [
    { id: 'responsive', name: 'Responsive', category: 'positive' as const, color: 'blue' },
    { id: 'friendly', name: 'Friendly', category: 'positive' as const, color: 'green' },
    { id: 'reliable', name: 'Reliable', category: 'positive' as const, color: 'purple' },
    { id: 'flexible', name: 'Flexible', category: 'positive' as const, color: 'indigo' },
    { id: 'professional', name: 'Professional', category: 'positive' as const, color: 'gray' },
    { id: 'punctual', name: 'Punctual', category: 'positive' as const, color: 'orange' },
    { id: 'careful', name: 'Careful with Gear', category: 'positive' as const, color: 'emerald' },
    { id: 'communicative', name: 'Great Communication', category: 'positive' as const, color: 'sky' },
    { id: 'unresponsive', name: 'Unresponsive', category: 'negative' as const, color: 'red' },
    { id: 'late', name: 'Late', category: 'negative' as const, color: 'red' },
    { id: 'unreliable', name: 'Unreliable', category: 'negative' as const, color: 'red' },
    { id: 'poor-communication', name: 'Poor Communication', category: 'negative' as const, color: 'red' }
  ]
} as const;

export type ReviewTagId = typeof REVIEW_TAGS.listing[number]['id'] | typeof REVIEW_TAGS.user[number]['id'];

// Review validation rules
export const REVIEW_VALIDATION = {
  rating: { min: 1, max: 5 },
  comment: { minLength: 10, maxLength: 1000 },
  title: { maxLength: 100 },
  tags: { maxCount: 5 },
  photos: { maxCount: 5, maxSizeMB: 5 },
  response: { maxLength: 500 }
} as const;

// Review reminder schedule (days after rental completion)
export const REVIEW_REMINDER_SCHEDULE = [1, 3, 7, 14] as const;

// Review request expiry (days)
export const REVIEW_REQUEST_EXPIRY_DAYS = 30;
