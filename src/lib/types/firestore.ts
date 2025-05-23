import type { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phoneNumber?: string;
  createdAt: Timestamp;
  isVerified: boolean;
  bio?: string;
  location?: {
    city: string;
    state: string;
    zipCode: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    }
  };
  ratings?: {
    asOwner: number;
    asRenter: number;
  };
  responseTime?: number; // Average response time in minutes
  isGGVerified?: boolean;
  ggVerificationLevel?: 'level1' | 'level2' | 'level3'; // Example verification tiers
  ggVerifiedAt?: Timestamp;
}

export interface UserPrivate {
  uid: string;
  stripeCustomerId?: string;
  stripeConnectAccountId?: string;
  paymentMethods?: string[];
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  verificationDetails?: {
    idVerified: boolean;
    addressVerified: boolean;
    phoneVerified: boolean;
    verifiedAt?: Timestamp;
  };
}

export interface Listing {
  id: string;
  ownerUid: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  brand?: string;
  model?: string;
  condition: 'New' | 'Like New' | 'Good' | 'Fair' | 'Poor';
  ageInYears?: number;
  dailyPrice: number;
  weeklyPrice?: number;
  monthlyPrice?: number;
  securityDeposit: number;
  location: {
    city: string;
    state: string;
    zipCode: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    }
  };
  deliveryOptions: {
    pickup: boolean;
    dropoff: boolean;
    shipping: boolean;
    pickupLocation?: string;
    dropoffDistance?: number;
    shippingFee?: number;
  };
  images: string[];
  features: string[];
  specifications?: Record<string, string>;
  includesInsurance: boolean;
  insuranceDetails?: string;
  availabilityCalendar: Record<string, boolean>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  status: 'active' | 'inactive' | 'pending' | 'rejected';
  averageRating?: number;
  reviewCount?: number;
}

export interface Booking {
  id: string;
  listingId: string;
  listingTitle: string;
  listingImage: string;
  ownerUid: string;
  renterUid: string;
  startDate: Timestamp;
  endDate: Timestamp;
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled' | 'disputed';
  totalPrice: number;
  securityDeposit: number;
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'partially_refunded' | 'failed';
  paymentIntentId?: string;
  deliveryMethod: 'pickup' | 'dropoff' | 'shipping';
  deliveryDetails?: {
    address?: string;
    trackingNumber?: string;
    instructions?: string;
  };
  insuranceTier?: 'basic' | 'standard' | 'premium' | 'none';
  insuranceCost?: number;
  cancellationPolicy: 'flexible' | 'moderate' | 'strict';
  cancellationDetails?: {
    cancelledBy: string;
    cancelledAt: Timestamp;
    reason?: string;
    refundAmount?: number;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  checkoutCondition?: string;
  returnCondition?: string;
  ownerNotes?: string;
  renterNotes?: string;
}

export interface Review {
  id: string;
  bookingId: string;
  listingId: string;
  reviewerUid: string;
  revieweeUid: string;
  rating: number;
  comment: string;
  reviewType: 'owner' | 'renter';
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  response?: {
    comment: string;
    createdAt: Timestamp;
  };
}

export interface Message {
  id: string;
  senderUid: string;
  recipientUid: string;
  content: string;
  createdAt: Timestamp;
  read: boolean;
  readAt?: Timestamp;
  bookingId?: string;
  listingId?: string;
  attachments?: string[];
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage: {
    content: string;
    senderUid: string;
    createdAt: Timestamp;
  };
  unreadCount: Record<string, number>;
  bookingId?: string;
  listingId?: string;
}

export interface VerificationSession {
  id: string;
  userId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  idVerification: {
    status: 'pending' | 'verified' | 'rejected';
    documentType?: 'drivers_license' | 'passport' | 'state_id';
    documentImageUrl?: string;
    selfieImageUrl?: string;
    verifiedAt?: Timestamp;
    rejectionReason?: string;
  };
  addressVerification: {
    status: 'pending' | 'verified' | 'rejected';
    documentImageUrl?: string;
    verifiedAt?: Timestamp;
    rejectionReason?: string;
  };
  phoneVerification: {
    status: 'pending' | 'verified' | 'rejected';
    phoneNumber?: string;
    verificationCode?: string;
    verifiedAt?: Timestamp;
    rejectionReason?: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
}

export interface Claim {
  id: string; // Document ID
  bookingId: string;
  listingId: string; // Denormalized from booking for easier access
  claimantUid: string; // UID of the user who filed the claim
  ownerUid: string; // UID of the listing owner, denormalized from booking
  renterUid: string; // UID of the renter, denormalized from booking
  reason: string; // e.g., 'damage', 'theft', 'misrepresentation', 'not_as_described', 'late_return', 'other'
  description: string; // Detailed explanation of the claim
  status: 'pending' | 'under_review' | 'information_requested' | 'approved' | 'rejected' | 'resolved' | 'escalated_to_support';
  resolutionDetails?: string; // Details on how the claim was resolved, if applicable
  evidenceUrls?: string[]; // URLs to any uploaded evidence (photos, videos, documents)
  adminNotes?: string; // Notes from an admin handling the claim
  communicationHistory?: Array<{
    userId: string;
    message: string;
    timestamp: Timestamp;
  }>; // For communication within the claim
  createdAt: Timestamp;
  updatedAt: Timestamp;
  resolvedAt?: Timestamp; // Timestamp when the claim was finally resolved or closed
}

export interface GGVerification {
  id: string; // Document ID
  userId: string; // UID of the user being verified
  documentType: 'drivers_license' | 'passport' | 'national_id' | 'residence_permit' | 'other';
  documentFrontUrl: string; // URL to the Firebase Storage path for the front of the ID document
  documentBackUrl?: string; // URL to the Firebase Storage path for the back of the ID document (if applicable)
  faceImageUrl: string; // URL to the Firebase Storage path for the selfie/face image for comparison
  status: 'pending_review' | 'approved' | 'rejected' | 'needs_resubmission' | 'expired' | 'in_progress';
  rejectionReason?: string; // If status is 'rejected' or 'needs_resubmission'
  rejectionCode?: 'POOR_QUALITY' | 'MISMATCH' | 'EXPIRED_DOCUMENT' | 'SUSPICIOUS_ACTIVITY' | 'INCOMPLETE' | 'OTHER'; // Standardized rejection codes
  verificationDetails?: string; // Any additional details from the admin or system
  attempts: number; // Number of submission attempts for this verification
  createdAt: Timestamp;
  updatedAt: Timestamp;
  reviewedAt?: Timestamp; // When an admin/system last reviewed it
  reviewedBy?: string; // UID of the admin or system identifier that reviewed it
  expiresAt?: Timestamp; // If verification can expire (e.g., for certain document types)
}
