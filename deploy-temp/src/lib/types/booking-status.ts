/**
 * Booking Status Management for Two-Stage Payment System
 * 
 * Flow:
 * 1. pending_owner_approval - Initial booking request, upfront fees paid
 * 2. confirmed - Owner approved, rental fees charged
 * 3. active - Booking is currently in progress
 * 4. completed - Booking finished successfully
 * 5. cancelled - Booking cancelled (with appropriate refunds)
 * 6. denied - Owner denied the booking request
 */

export enum BookingStatus {
  // Stage 1: Initial booking request
  PENDING_OWNER_APPROVAL = 'pending_owner_approval',
  
  // Stage 2: After owner approval
  CONFIRMED = 'confirmed',
  
  // Active booking states
  ACTIVE = 'active',
  COMPLETED = 'completed',
  
  // Cancelled/denied states
  CANCELLED = 'cancelled',
  DENIED = 'denied'
}

export interface BookingStatusInfo {
  status: BookingStatus;
  description: string;
  userMessage: string;
  ownerMessage: string;
  allowedTransitions: BookingStatus[];
  paymentRequired: boolean;
  refundEligible: boolean;
}

export const BOOKING_STATUS_CONFIG: Record<BookingStatus, BookingStatusInfo> = {
  [BookingStatus.PENDING_OWNER_APPROVAL]: {
    status: BookingStatus.PENDING_OWNER_APPROVAL,
    description: 'Waiting for owner approval',
    userMessage: 'Your booking request has been submitted and is waiting for the owner to approve it.',
    ownerMessage: 'You have a new booking request that needs your approval.',
    allowedTransitions: [BookingStatus.CONFIRMED, BookingStatus.DENIED],
    paymentRequired: false, // Upfront fees already paid
    refundEligible: true
  },
  
  [BookingStatus.CONFIRMED]: {
    status: BookingStatus.CONFIRMED,
    description: 'Booking confirmed by owner',
    userMessage: 'Great! Your booking has been confirmed by the owner. The rental fee has been charged.',
    ownerMessage: 'You have confirmed this booking. The rental fee has been charged to the renter.',
    allowedTransitions: [BookingStatus.ACTIVE, BookingStatus.CANCELLED],
    paymentRequired: true, // Rental fees need to be charged
    refundEligible: true
  },
  
  [BookingStatus.ACTIVE]: {
    status: BookingStatus.ACTIVE,
    description: 'Booking is currently active',
    userMessage: 'Your rental is currently active. Enjoy your adventure!',
    ownerMessage: 'This rental is currently active.',
    allowedTransitions: [BookingStatus.COMPLETED, BookingStatus.CANCELLED],
    paymentRequired: false,
    refundEligible: false // No refunds during active rental
  },
  
  [BookingStatus.COMPLETED]: {
    status: BookingStatus.COMPLETED,
    description: 'Booking completed successfully',
    userMessage: 'Your rental has been completed. Thank you for using GearGrab!',
    ownerMessage: 'This rental has been completed successfully.',
    allowedTransitions: [],
    paymentRequired: false,
    refundEligible: false
  },
  
  [BookingStatus.CANCELLED]: {
    status: BookingStatus.CANCELLED,
    description: 'Booking was cancelled',
    userMessage: 'This booking has been cancelled. Refunds will be processed according to the cancellation policy.',
    ownerMessage: 'This booking has been cancelled.',
    allowedTransitions: [],
    paymentRequired: false,
    refundEligible: true
  },
  
  [BookingStatus.DENIED]: {
    status: BookingStatus.DENIED,
    description: 'Booking request was denied by owner',
    userMessage: 'Unfortunately, the owner has declined your booking request. Your payment has been refunded.',
    ownerMessage: 'You have declined this booking request.',
    allowedTransitions: [],
    paymentRequired: false,
    refundEligible: true
  }
};

/**
 * Check if a status transition is allowed
 */
export function isValidStatusTransition(from: BookingStatus, to: BookingStatus): boolean {
  const config = BOOKING_STATUS_CONFIG[from];
  return config.allowedTransitions.includes(to);
}

/**
 * Get user-friendly status display
 */
export function getStatusDisplay(status: BookingStatus): string {
  const config = BOOKING_STATUS_CONFIG[status];
  return config.description;
}

/**
 * Get appropriate message for user or owner
 */
export function getStatusMessage(status: BookingStatus, isOwner: boolean = false): string {
  const config = BOOKING_STATUS_CONFIG[status];
  return isOwner ? config.ownerMessage : config.userMessage;
}

/**
 * Check if payment is required for this status
 */
export function requiresPayment(status: BookingStatus): boolean {
  const config = BOOKING_STATUS_CONFIG[status];
  return config.paymentRequired;
}

/**
 * Check if refund is eligible for this status
 */
export function isRefundEligible(status: BookingStatus): boolean {
  const config = BOOKING_STATUS_CONFIG[status];
  return config.refundEligible;
}
