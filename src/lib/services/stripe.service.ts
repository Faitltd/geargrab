/**
 * Stripe Service
 * Handles Stripe payment integration for the frontend
 */

import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { PUBLIC_STRIPE_PUBLISHABLE_KEY } from '$env/static/public';
import type { BookingPricing } from '$lib/types/bookings';

let stripePromise: Promise<Stripe | null>;

/**
 * Get Stripe instance
 */
export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    stripePromise = loadStripe(PUBLIC_STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
}

/**
 * Checkout session request interface
 */
export interface CheckoutSessionRequest {
  bookingId: string;
  listingId: string;
  mode: 'rental' | 'sale';
  pricing: BookingPricing;
  bookingData?: {
    startDate: string;
    endDate: string;
    totalDays: number;
    pickupMethod: 'pickup' | 'delivery' | 'meetup';
    insurance: boolean;
  };
}

/**
 * Checkout session response interface
 */
export interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
  success: boolean;
  error?: string;
}

/**
 * Create a Stripe checkout session for a booking
 */
export async function createCheckoutSession(
  request: CheckoutSessionRequest
): Promise<CheckoutSessionResponse> {
  try {
    const response = await fetch('/api/payments/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to create checkout session');
    }

    return result.data;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw new Error('Failed to create checkout session');
  }
}

/**
 * Redirect to Stripe checkout
 */
export async function redirectToCheckout(sessionId: string): Promise<void> {
  const stripe = await getStripe();
  
  if (!stripe) {
    throw new Error('Stripe failed to load');
  }

  const { error } = await stripe.redirectToCheckout({
    sessionId
  });

  if (error) {
    console.error('Stripe redirect error:', error);
    throw new Error(error.message || 'Failed to redirect to checkout');
  }
}

/**
 * Create checkout session and redirect in one step
 */
export async function checkoutAndRedirect(
  request: CheckoutSessionRequest
): Promise<void> {
  try {
    const session = await createCheckoutSession(request);
    await redirectToCheckout(session.sessionId);
  } catch (error) {
    console.error('Error during checkout and redirect:', error);
    throw error;
  }
}

/**
 * Verify payment session
 */
export async function verifyPaymentSession(sessionId: string): Promise<{
  success: boolean;
  bookingId?: string;
  paymentStatus?: string;
  error?: string;
}> {
  try {
    const response = await fetch(`/api/payments/verify-session?session_id=${sessionId}`);
    const result = await response.json();

    return result;
  } catch (error) {
    console.error('Error verifying payment session:', error);
    return {
      success: false,
      error: 'Failed to verify payment session'
    };
  }
}

/**
 * Get payment status for a booking
 */
export async function getPaymentStatus(bookingId: string): Promise<{
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  paymentIntentId?: string;
  amount?: number;
  currency?: string;
  error?: string;
}> {
  try {
    const response = await fetch(`/api/payments/status/${bookingId}`);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to get payment status');
    }

    return result.data;
  } catch (error) {
    console.error('Error getting payment status:', error);
    return {
      status: 'failed',
      error: 'Failed to get payment status'
    };
  }
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase()
  }).format(amount);
}

/**
 * Convert dollars to cents for Stripe
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Convert cents to dollars from Stripe
 */
export function centsToDollars(cents: number): number {
  return cents / 100;
}

/**
 * Validate Stripe publishable key
 */
export function validateStripeKey(): boolean {
  return PUBLIC_STRIPE_PUBLISHABLE_KEY.startsWith('pk_');
}

/**
 * Get Stripe environment (test or live)
 */
export function getStripeEnvironment(): 'test' | 'live' {
  return PUBLIC_STRIPE_PUBLISHABLE_KEY.includes('test') ? 'test' : 'live';
}

/**
 * Payment method types supported
 */
export const SUPPORTED_PAYMENT_METHODS = [
  'card',
  'apple_pay',
  'google_pay'
] as const;

/**
 * Stripe configuration constants
 */
export const STRIPE_CONFIG = {
  currency: 'usd',
  locale: 'en-US',
  appearance: {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#3B82F6', // Primary blue
      colorBackground: '#ffffff',
      colorText: '#1F2937',
      colorDanger: '#EF4444',
      fontFamily: 'Inter, system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '8px'
    }
  }
};

/**
 * Error messages for common Stripe errors
 */
export const STRIPE_ERROR_MESSAGES: Record<string, string> = {
  card_declined: 'Your card was declined. Please try a different payment method.',
  expired_card: 'Your card has expired. Please use a different card.',
  incorrect_cvc: 'Your card\'s security code is incorrect.',
  processing_error: 'An error occurred while processing your card. Please try again.',
  incorrect_number: 'Your card number is incorrect.',
  incomplete_number: 'Your card number is incomplete.',
  incomplete_cvc: 'Your card\'s security code is incomplete.',
  incomplete_expiry: 'Your card\'s expiration date is incomplete.',
  invalid_expiry_month: 'Your card\'s expiration month is invalid.',
  invalid_expiry_year: 'Your card\'s expiration year is invalid.',
  invalid_number: 'Your card number is invalid.',
  postal_code_invalid: 'Your postal code is invalid.',
  email_invalid: 'Your email address is invalid.'
};

/**
 * Get user-friendly error message
 */
export function getStripeErrorMessage(error: any): string {
  if (error?.code && STRIPE_ERROR_MESSAGES[error.code]) {
    return STRIPE_ERROR_MESSAGES[error.code];
  }
  
  if (error?.message) {
    return error.message;
  }
  
  return 'An unexpected error occurred. Please try again.';
}
