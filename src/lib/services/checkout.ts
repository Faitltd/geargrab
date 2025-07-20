import { getFunctions, httpsCallable, type Functions } from 'firebase/functions';
import { getFirebaseApp } from '$lib/firebase';
import { browser } from '$app/environment';
import type { BookingData } from './bookings';

// Checkout session request interface
export interface CheckoutSessionRequest {
  listingId: string;
  mode: 'rental' | 'sale';
  bookingData?: {
    dates: string[];
    startDate: string;
    endDate: string;
    deliveryOption: 'pickup' | 'delivery';
    insuranceOption: boolean;
    totalCost: number;
    breakdown: {
      basePrice: number;
      days: number;
      subtotal: number;
      deliveryFee: number;
      insuranceFee: number;
      taxAmount: number;
      total: number;
    };
  };
}

// Checkout session response interface
export interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
  expiresAt: number;
}

// Checkout session status
export interface CheckoutSessionStatus {
  sessionId: string;
  status: 'pending' | 'completed' | 'expired' | 'failed';
  paymentStatus?: string;
  listingId: string;
  mode: 'rental' | 'sale';
  amount: number;
  currency: string;
  createdAt: any;
  completedAt?: any;
  expiredAt?: any;
  failedAt?: any;
}

// Initialize Firebase Functions
let functions: Functions | null = null;

if (browser) {
  const app = getFirebaseApp();
  if (app) {
    functions = getFunctions(app);
  }
}

/**
 * Create a Stripe checkout session for a listing
 */
export const createCheckoutSession = async (
  request: CheckoutSessionRequest
): Promise<CheckoutSessionResponse> => {
  if (!functions) {
    throw new Error('Firebase Functions not initialized');
  }

  try {
    const createSession = httpsCallable<CheckoutSessionRequest, CheckoutSessionResponse>(
      functions,
      'createCheckoutSession'
    );

    const result = await createSession(request);
    return result.data;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw new Error('Failed to create checkout session');
  }
};

/**
 * Create checkout session for a rental booking
 */
export const createRentalCheckoutSession = async (
  listingId: string,
  bookingData: CheckoutSessionRequest['bookingData']
): Promise<CheckoutSessionResponse> => {
  if (!bookingData) {
    throw new Error('Booking data is required for rental checkout');
  }

  return createCheckoutSession({
    listingId,
    mode: 'rental',
    bookingData,
  });
};

/**
 * Create checkout session for a sale purchase
 */
export const createSaleCheckoutSession = async (
  listingId: string
): Promise<CheckoutSessionResponse> => {
  return createCheckoutSession({
    listingId,
    mode: 'sale',
  });
};

/**
 * Redirect to Stripe checkout
 */
export const redirectToCheckout = async (sessionUrl: string): Promise<void> => {
  if (!browser) {
    throw new Error('Checkout redirect can only be called in the browser');
  }

  // Redirect to Stripe checkout
  window.location.href = sessionUrl;
};

/**
 * Create checkout session and redirect in one step
 */
export const checkoutAndRedirect = async (
  request: CheckoutSessionRequest
): Promise<void> => {
  try {
    const session = await createCheckoutSession(request);
    await redirectToCheckout(session.url);
  } catch (error) {
    console.error('Error during checkout and redirect:', error);
    throw error;
  }
};

/**
 * Create rental checkout session and redirect
 */
export const rentalCheckoutAndRedirect = async (
  listingId: string,
  bookingData: CheckoutSessionRequest['bookingData']
): Promise<void> => {
  if (!bookingData) {
    throw new Error('Booking data is required for rental checkout');
  }

  return checkoutAndRedirect({
    listingId,
    mode: 'rental',
    bookingData,
  });
};

/**
 * Create sale checkout session and redirect
 */
export const saleCheckoutAndRedirect = async (
  listingId: string
): Promise<void> => {
  return checkoutAndRedirect({
    listingId,
    mode: 'sale',
  });
};

/**
 * Get checkout session status from Firestore
 */
export const getCheckoutSessionStatus = async (
  sessionId: string
): Promise<CheckoutSessionStatus | null> => {
  // This would typically be implemented as a Firestore query
  // For now, we'll return null and implement this later if needed
  console.log('Getting checkout session status for:', sessionId);
  return null;
};

/**
 * Utility function to format currency amounts
 */
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(amount);
};

/**
 * Utility function to validate checkout request
 */
export const validateCheckoutRequest = (request: CheckoutSessionRequest): string[] => {
  const errors: string[] = [];

  if (!request.listingId) {
    errors.push('Listing ID is required');
  }

  if (!request.mode || !['rental', 'sale'].includes(request.mode)) {
    errors.push('Mode must be either "rental" or "sale"');
  }

  if (request.mode === 'rental') {
    if (!request.bookingData) {
      errors.push('Booking data is required for rental mode');
    } else {
      const { bookingData } = request;
      
      if (!bookingData.dates || bookingData.dates.length === 0) {
        errors.push('Rental dates are required');
      }

      if (!bookingData.startDate || !bookingData.endDate) {
        errors.push('Start date and end date are required');
      }

      if (!bookingData.deliveryOption || !['pickup', 'delivery'].includes(bookingData.deliveryOption)) {
        errors.push('Delivery option must be either "pickup" or "delivery"');
      }

      if (typeof bookingData.insuranceOption !== 'boolean') {
        errors.push('Insurance option must be a boolean');
      }

      if (!bookingData.totalCost || bookingData.totalCost <= 0) {
        errors.push('Total cost must be greater than 0');
      }

      if (!bookingData.breakdown) {
        errors.push('Cost breakdown is required');
      }
    }
  }

  return errors;
};

/**
 * Error handling utility for checkout operations
 */
export const handleCheckoutError = (error: any): string => {
  console.error('Checkout error:', error);

  if (error?.code === 'functions/unauthenticated') {
    return 'Please sign in to continue with checkout';
  }

  if (error?.code === 'functions/invalid-argument') {
    return error.message || 'Invalid checkout request';
  }

  if (error?.code === 'functions/not-found') {
    return 'The requested item was not found';
  }

  if (error?.code === 'functions/failed-precondition') {
    return error.message || 'Checkout requirements not met';
  }

  if (error?.message) {
    return error.message;
  }

  return 'An unexpected error occurred during checkout';
};
