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
  ownerUid: string; // Legacy compatibility
  title: string;
  description: string;
  category: string;
  condition: string;
  brand?: string;
  model?: string;
  dailyPrice: number;
  weeklyPrice?: number;
  monthlyPrice?: number;
  securityDeposit: number;
  location: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  deliveryOptions?: {
    dropoffDistance?: number;
    shippingFee?: number;
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
  ownerUid: string; // Legacy compatibility
  renterId: string;
  renterUid: string; // Legacy compatibility
  startDate: Timestamp;
  endDate: Timestamp;
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  totalPrice: number;
  depositAmount?: number;
  securityDeposit?: number;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  paymentIntentId?: string;
  deliveryMethod?: 'pickup' | 'delivery' | 'dropoff' | 'shipping';
  deliveryDetails?: any;
  insuranceTier?: 'basic' | 'standard' | 'premium' | 'none';
  insuranceCost?: number;
  cancellationPolicy?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  paidAt?: Timestamp;
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

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: Timestamp;
  read: boolean;
  type: 'text' | 'image' | 'system';
  attachments?: string[];
}

export interface Conversation {
  id: string;
  participants: string[];
  participantNames: Record<string, string>;
  participantAvatars?: Record<string, string>;
  lastMessage?: string;
  lastMessageTimestamp?: Timestamp;
  lastMessageSenderId?: string;
  unreadCount: Record<string, number>;
  bookingId?: string;
  listingId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}