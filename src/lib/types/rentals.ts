// Rental related types

import type { BaseEntity, DateRange, Address } from './common';
import type { ListingData } from './listings';

export interface RentalData extends BaseEntity {
  listingId: string;
  listing?: ListingData;
  renterId: string;
  ownerId: string;
  dates: DateRange;
  status: RentalStatus;
  pricing: RentalPricing;
  delivery: RentalDelivery;
  insurance?: RentalInsurance;
  conditionChecks: RentalConditionChecks;
  communication: RentalCommunication[];
  policies: RentalPolicies;
  payment: RentalPayment;
}

export type RentalStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'active' 
  | 'completed' 
  | 'cancelled' 
  | 'disputed';

export interface RentalPricing {
  dailyRate: number;
  totalDays: number;
  subtotal: number;
  deliveryFee?: number;
  serviceFee: number;
  insuranceFee?: number;
  deposit: number;
  total: number;
  currency: string;
}

export interface RentalDelivery {
  method: 'pickup' | 'delivery' | 'shipping';
  pickupLocation?: Address;
  deliveryAddress?: Address;
  instructions?: string;
  scheduledTime?: string;
  actualTime?: string;
  trackingNumber?: string;
}

export interface RentalInsurance {
  selected: boolean;
  provider?: string;
  coverage: number;
  premium: number;
  policyNumber?: string;
}

export interface RentalConditionChecks {
  before?: ConditionCheck;
  after?: ConditionCheck;
}

export interface ConditionCheck {
  id: string;
  rentalId: string;
  listingId: string;
  userId: string;
  userRole: 'renter' | 'owner';
  type: 'before' | 'after';
  status: 'pending' | 'completed' | 'disputed';
  photos: ConditionPhoto[];
  notes?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  timestamp: string;
  completedAt?: string;
}

export interface ConditionPhoto {
  id: string;
  url: string;
  thumbnail?: string;
  description?: string;
  timestamp: string;
  metadata?: {
    size: number;
    type: string;
    dimensions?: {
      width: number;
      height: number;
    };
  };
}

export interface RentalCommunication {
  id: string;
  senderId: string;
  recipientId: string;
  message: string;
  timestamp: string;
  type: 'message' | 'system' | 'notification';
  read: boolean;
  attachments?: string[];
}

export interface RentalPolicies {
  cancellation: {
    policy: 'flexible' | 'moderate' | 'strict';
    cutoffHours: number;
    refundPercentage: number;
  };
  lateReturn: {
    gracePeriodHours: number;
    feePerHour: number;
    maximumFee: number;
  };
  damage: {
    assessmentPeriod: number;
    disputeWindow: number;
  };
}

export interface RentalPayment {
  stripePaymentIntentId?: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
  paidAt?: string;
  refundedAt?: string;
  refundAmount?: number;
  refundReason?: string;
}

export interface RentalBookingRequest {
  listingId: string;
  dates: DateRange;
  deliveryMethod: 'pickup' | 'delivery';
  deliveryAddress?: Address;
  insurance: boolean;
  message?: string;
}

export interface DateOverlapResult {
  hasOverlap: boolean;
  conflictingDates?: string[];
  availableDates?: string[];
}
