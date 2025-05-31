import type { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  phoneNumber?: string;
  createdAt: Timestamp;
  lastLoginAt?: Timestamp;
  isOwner?: boolean;
  isRenter?: boolean;
  isVerified?: boolean;
  completedBookings?: number;
  listingsCount?: number;
  bio?: string;
  location?: string;
  ratings?: {
    asOwner: number;
    asRenter: number;
  };
}

export interface Listing {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  category: string;
  condition: string;
  dailyPrice: number;
  weeklyPrice?: number;
  monthlyPrice?: number;
  location: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  images: string[];
  features: string[];
  unavailableDates: Timestamp[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
  views?: number;
  bookingsCount?: number;
  avgRating?: number;
}

export interface Booking {
  id: string;
  listingId: string;
  listingTitle: string;
  listingImage: string;
  ownerId: string;
  renterId: string;
  startDate: Timestamp;
  endDate: Timestamp;
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  totalPrice: number;
  depositAmount?: number;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  ownerReviewed?: boolean;
  renterReviewed?: boolean;
}

export interface Review {
  id: string;
  bookingId: string;
  listingId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment: string;
  createdAt: Timestamp;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'booking' | 'message' | 'system' | 'payment';
  read: boolean;
  relatedId?: string;
  createdAt: Timestamp;
}