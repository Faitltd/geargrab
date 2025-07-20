// User related types (extending auth types)

import type { BaseEntity, Address } from './common';
import type { UserProfile } from './auth';

export interface UserDashboardData {
  profile: UserProfile;
  stats: UserStats;
  recentActivity: UserActivity[];
  notifications: UserNotification[];
}

export interface UserStats {
  listings: {
    active: number;
    sold: number;
    rented: number;
    total: number;
  };
  rentals: {
    asRenter: number;
    asOwner: number;
    completed: number;
    active: number;
  };
  sales: {
    asBuyer: number;
    asSeller: number;
    totalRevenue: number;
    totalSpent: number;
  };
  reviews: {
    received: number;
    given: number;
    averageRating: number;
  };
}

export interface UserActivity extends BaseEntity {
  userId: string;
  type: ActivityType;
  title: string;
  description: string;
  metadata?: Record<string, any>;
  read: boolean;
}

export type ActivityType = 
  | 'listing_created'
  | 'listing_sold'
  | 'listing_rented'
  | 'rental_booked'
  | 'rental_completed'
  | 'sale_completed'
  | 'review_received'
  | 'message_received'
  | 'payment_received'
  | 'dispute_opened';

export interface UserNotification extends BaseEntity {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export type NotificationType = 
  | 'booking_request'
  | 'booking_confirmed'
  | 'payment_received'
  | 'rental_reminder'
  | 'review_request'
  | 'message_received'
  | 'listing_expired'
  | 'price_alert'
  | 'system_update';

export interface UserSettings {
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  preferences: UserPreferences;
}

export interface NotificationSettings {
  email: {
    bookings: boolean;
    messages: boolean;
    reviews: boolean;
    marketing: boolean;
    system: boolean;
  };
  push: {
    bookings: boolean;
    messages: boolean;
    reviews: boolean;
    reminders: boolean;
  };
  sms: {
    bookings: boolean;
    reminders: boolean;
    security: boolean;
  };
}

export interface PrivacySettings {
  profile: {
    showEmail: boolean;
    showPhone: boolean;
    showLocation: boolean;
    showJoinDate: boolean;
  };
  listings: {
    showOwnerInfo: boolean;
    allowMessages: boolean;
  };
  search: {
    includeInSearch: boolean;
    showOnlineStatus: boolean;
  };
}

export interface UserPreferences {
  language: string;
  currency: string;
  timezone: string;
  units: 'metric' | 'imperial';
  theme: 'light' | 'dark' | 'auto';
  defaultLocation?: Address;
  searchRadius: number;
}

export interface UserVerificationDocument {
  id: string;
  type: 'id' | 'address' | 'phone';
  status: 'pending' | 'approved' | 'rejected';
  uploadedAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
  documentUrl?: string;
}

export interface UserPaymentMethod {
  id: string;
  type: 'card' | 'bank_account';
  last4: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  createdAt: string;
}
