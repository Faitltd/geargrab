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
  location: {
    city: string;
    state: string;
    zipCode: string;
  };
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
  averageRating?: number; // For component compatibility
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
  saleId?: string;
  guideBookingId?: string;
  guideId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Sale {
  id: string;
  sellerId: string;
  sellerUid: string; // Legacy compatibility
  title: string;
  description: string;
  category: string;
  condition: string;
  brand?: string;
  model?: string;
  price: number;
  originalPrice?: number;
  location: {
    city: string;
    state: string;
    zipCode: string;
  };
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  deliveryOptions?: {
    pickup: boolean;
    shipping: boolean;
    localDelivery: boolean;
    shippingFee?: number;
    localDeliveryFee?: number;
  };
  images: string[];
  features: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
  isSold: boolean;
  views?: number;
  favoritesCount?: number;
  avgRating?: number;
  averageRating?: number; // For component compatibility
  status: 'active' | 'sold' | 'inactive' | 'pending';
}

export interface SalePurchase {
  id: string;
  saleId: string;
  saleTitle: string;
  saleImage: string;
  sellerId: string;
  sellerUid: string; // Legacy compatibility
  buyerId: string;
  buyerUid: string; // Legacy compatibility
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'completed' | 'cancelled';
  totalPrice: number;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  paymentIntentId?: string;
  deliveryMethod: 'pickup' | 'shipping' | 'local_delivery';
  deliveryDetails?: any;
  shippingAddress?: {
    name: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  trackingNumber?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  paidAt?: Timestamp;
  shippedAt?: Timestamp;
  deliveredAt?: Timestamp;
  sellerReviewed?: boolean;
  buyerReviewed?: boolean;
}

export interface Guide {
  id: string;
  guideId: string;
  guideUid: string; // Legacy compatibility
  displayName: string;
  bio: string;
  specialties: string[];
  certifications: string[];
  experience: string; // e.g., "5+ years"
  hourlyRate: number;
  dayRate?: number;
  location: {
    city: string;
    state: string;
    zipCode: string;
  };
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  serviceArea: {
    radius: number; // miles
    travelFee?: number;
  };
  availability: {
    daysOfWeek: string[]; // ['monday', 'tuesday', etc.]
    timeSlots: string[]; // ['morning', 'afternoon', 'evening']
    advanceBooking: number; // minimum days in advance
  };
  images: string[];
  languages: string[];
  equipment?: string[]; // equipment they provide
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
  isVerified: boolean;
  totalBookings?: number;
  avgRating?: number;
  averageRating?: number; // For component compatibility
  reviewCount?: number;
  responseTime?: string; // e.g., "within 2 hours"
  status: 'active' | 'inactive' | 'pending' | 'suspended';
}

export interface GuideBooking {
  id: string;
  guideId: string;
  guideName: string;
  guideImage: string;
  guideUid: string; // Legacy compatibility
  clientId: string;
  clientUid: string; // Legacy compatibility
  serviceDate: Timestamp;
  startTime: string;
  endTime: string;
  duration: number; // hours
  serviceType: 'instruction' | 'guided_tour' | 'consultation' | 'equipment_demo' | 'custom';
  specialty: string;
  location: {
    type: 'guide_location' | 'client_location' | 'meet_point';
    address?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
    details?: string;
  };
  groupSize: number;
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'mixed';
  specialRequests?: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  totalPrice: number;
  hourlyRate: number;
  travelFee?: number;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  paymentIntentId?: string;
  cancellationPolicy?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  confirmedAt?: Timestamp;
  completedAt?: Timestamp;
  paidAt?: Timestamp;
  guideReviewed?: boolean;
  clientReviewed?: boolean;
}