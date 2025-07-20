// Payment related types

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  clientSecret?: string;
  metadata?: Record<string, string>;
}

export type PaymentStatus = 
  | 'requires_payment_method'
  | 'requires_confirmation'
  | 'requires_action'
  | 'processing'
  | 'succeeded'
  | 'canceled';

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account';
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  bankAccount?: {
    last4: string;
    bankName: string;
    accountType: string;
  };
}

export interface CheckoutSession {
  id: string;
  url: string;
  status: 'open' | 'complete' | 'expired';
  metadata?: Record<string, string>;
}

export interface RefundRequest {
  paymentIntentId: string;
  amount?: number;
  reason: RefundReason;
  metadata?: Record<string, string>;
}

export type RefundReason = 
  | 'duplicate'
  | 'fraudulent'
  | 'requested_by_customer'
  | 'expired_uncaptured_charge';

export interface PaymentFees {
  platformFee: number;
  processingFee: number;
  total: number;
  currency: string;
}

export interface Payout {
  id: string;
  amount: number;
  currency: string;
  status: PayoutStatus;
  arrivalDate: string;
  method: string;
  description?: string;
}

export type PayoutStatus = 
  | 'paid'
  | 'pending'
  | 'in_transit'
  | 'canceled'
  | 'failed';

export interface StripeAccount {
  id: string;
  type: 'express' | 'standard' | 'custom';
  country: string;
  defaultCurrency: string;
  detailsSubmitted: boolean;
  payoutsEnabled: boolean;
  chargesEnabled: boolean;
}

export interface PaymentAnalytics {
  totalRevenue: number;
  totalPayouts: number;
  pendingPayouts: number;
  averageTransactionSize: number;
  transactionCount: number;
  refundAmount: number;
  refundCount: number;
  currency: string;
}
