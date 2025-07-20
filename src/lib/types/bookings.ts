/**
 * Booking Types
 * Defines all booking-related data structures
 */

export interface BookingRequest {
  listingId: string;
  renterId: string;
  ownerId: string;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  message?: string;
  pickupMethod: 'pickup' | 'delivery' | 'meetup';
  pickupLocation?: string;
  deliveryAddress?: string;
  insurance: boolean;
  pricing: BookingPricing;
}

export interface BookingPricing {
  dailyRate: number;
  totalDays: number;
  subtotal: number;
  insurance?: number;
  serviceFee: number;
  deliveryFee?: number;
  discount?: number;
  total: number;
  breakdown: PricingBreakdown[];
}

export interface PricingBreakdown {
  label: string;
  amount: number;
  type: 'charge' | 'discount' | 'fee';
  description?: string;
}

export interface Booking {
  id: string;
  listingId: string;
  listing?: {
    id: string;
    title: string;
    images: string[];
    category: string;
    owner: {
      id: string;
      name: string;
      photoURL?: string;
    };
  };
  renterId: string;
  renter?: {
    id: string;
    name: string;
    photoURL?: string;
    email: string;
    phone?: string;
  };
  ownerId: string;
  owner?: {
    id: string;
    name: string;
    photoURL?: string;
    email: string;
    phone?: string;
  };
  startDate: Date;
  endDate: Date;
  totalDays: number;
  status: BookingStatus;
  pricing: BookingPricing;
  pickupMethod: 'pickup' | 'delivery' | 'meetup';
  pickupLocation?: string;
  deliveryAddress?: string;
  insurance: boolean;
  message?: string;
  renterMessage?: string;
  ownerMessage?: string;
  createdAt: Date;
  updatedAt: Date;
  confirmedAt?: Date;
  cancelledAt?: Date;
  completedAt?: Date;
  paymentId?: string;
  paymentStatus?: PaymentStatus;
  timeline: BookingTimelineEvent[];
}

export type BookingStatus = 
  | 'pending'      // Waiting for owner approval
  | 'confirmed'    // Owner approved, payment pending
  | 'paid'         // Payment completed
  | 'active'       // Rental period started
  | 'completed'    // Rental returned and completed
  | 'cancelled'    // Cancelled by either party
  | 'declined';    // Declined by owner

export type PaymentStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded'
  | 'partially_refunded';

export interface BookingTimelineEvent {
  id: string;
  type: 'created' | 'confirmed' | 'paid' | 'started' | 'completed' | 'cancelled' | 'message';
  title: string;
  description?: string;
  timestamp: Date;
  actor: {
    id: string;
    name: string;
    role: 'renter' | 'owner' | 'system';
  };
  metadata?: Record<string, any>;
}

export interface AvailabilityCheck {
  listingId: string;
  startDate: Date;
  endDate: Date;
  available: boolean;
  conflictingBookings?: string[];
  blockedDates?: Date[];
}

export interface BookingFilters {
  status?: BookingStatus[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  listingId?: string;
  renterId?: string;
  ownerId?: string;
  limit?: number;
  offset?: number;
}

export interface BookingStats {
  totalBookings: number;
  activeBookings: number;
  completedBookings: number;
  totalRevenue: number;
  averageRating: number;
  responseRate: number;
}

// Form data interfaces
export interface BookingFormData {
  startDate: string;
  endDate: string;
  message: string;
  pickupMethod: 'pickup' | 'delivery' | 'meetup';
  pickupLocation: string;
  deliveryAddress: string;
  insurance: boolean;
  agreeToTerms: boolean;
}

export interface BookingValidation {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: string[];
}

// Calendar interfaces
export interface CalendarDay {
  date: Date;
  available: boolean;
  price?: number;
  isToday: boolean;
  isSelected: boolean;
  isInRange: boolean;
  isBlocked: boolean;
  reason?: string;
}

export interface CalendarMonth {
  year: number;
  month: number;
  days: CalendarDay[];
  name: string;
}

export interface DateRange {
  start: Date | null;
  end: Date | null;
  totalDays: number;
}

// Utility functions
export function calculateTotalDays(startDate: Date, endDate: Date): number {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function formatBookingStatus(status: BookingStatus): string {
  const statusMap: Record<BookingStatus, string> = {
    pending: 'Pending Approval',
    confirmed: 'Confirmed',
    paid: 'Payment Complete',
    active: 'Active Rental',
    completed: 'Completed',
    cancelled: 'Cancelled',
    declined: 'Declined'
  };
  return statusMap[status] || status;
}

export function getBookingStatusColor(status: BookingStatus): string {
  const colorMap: Record<BookingStatus, string> = {
    pending: 'text-yellow-600 bg-yellow-100',
    confirmed: 'text-blue-600 bg-blue-100',
    paid: 'text-green-600 bg-green-100',
    active: 'text-purple-600 bg-purple-100',
    completed: 'text-gray-600 bg-gray-100',
    cancelled: 'text-red-600 bg-red-100',
    declined: 'text-red-600 bg-red-100'
  };
  return colorMap[status] || 'text-gray-600 bg-gray-100';
}
