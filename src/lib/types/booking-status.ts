export enum BookingStatus {
  Pending = 'pending',
  PendingOwnerApproval = 'pending_owner_approval',
  Confirmed = 'confirmed',
  Active = 'active',
  Completed = 'completed',
  Cancelled = 'cancelled',
  PaymentFailed = 'payment_failed',
  Refunded = 'refunded'
}

export const BOOKING_STATUSES = Object.values(BookingStatus);
