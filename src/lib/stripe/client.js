/**
 * Stripe Client Configuration
 * Initialize Stripe.js for frontend payments
 */

import { loadStripe } from '@stripe/stripe-js';
import { browser } from '$app/environment';

// Stripe configuration
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!STRIPE_PUBLISHABLE_KEY) {
  console.error('Missing Stripe publishable key. Please set VITE_STRIPE_PUBLISHABLE_KEY in your environment variables.');
}

// Initialize Stripe
let stripePromise = null;

if (browser && STRIPE_PUBLISHABLE_KEY) {
  stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
}

/**
 * Get Stripe instance
 */
export async function getStripe() {
  if (!browser) {
    throw new Error('Stripe can only be used in the browser');
  }
  
  if (!stripePromise) {
    throw new Error('Stripe not initialized. Check your publishable key.');
  }
  
  return await stripePromise;
}

/**
 * Check if Stripe is configured
 */
export function isStripeConfigured() {
  return !!STRIPE_PUBLISHABLE_KEY;
}

/**
 * Format amount for display (convert cents to dollars)
 */
export function formatAmount(amountInCents, currency = 'USD') {
  const amount = amountInCents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

/**
 * Convert dollars to cents for Stripe
 */
export function dollarsToCents(dollars) {
  return Math.round(dollars * 100);
}

/**
 * Convert cents to dollars for display
 */
export function centsToDollars(cents) {
  return cents / 100;
}

/**
 * Validate card element
 */
export function validateCardElement(cardElement) {
  if (!cardElement) {
    throw new Error('Card element is required');
  }
  
  // Additional validation can be added here
  return true;
}

/**
 * Handle Stripe errors
 */
export function handleStripeError(error) {
  console.error('Stripe error:', error);
  
  switch (error.type) {
    case 'card_error':
    case 'validation_error':
      return error.message;
    case 'invalid_request_error':
      return 'Invalid payment request. Please try again.';
    case 'api_connection_error':
      return 'Network error. Please check your connection and try again.';
    case 'api_error':
      return 'Payment processing error. Please try again.';
    case 'authentication_error':
      return 'Authentication error. Please refresh the page and try again.';
    case 'rate_limit_error':
      return 'Too many requests. Please wait a moment and try again.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}

/**
 * Create payment method
 */
export async function createPaymentMethod(stripe, cardElement, billingDetails = {}) {
  try {
    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
      billing_details: billingDetails,
    });
    
    if (error) {
      throw error;
    }
    
    return paymentMethod;
  } catch (error) {
    throw new Error(handleStripeError(error));
  }
}

/**
 * Confirm payment intent
 */
export async function confirmPayment(stripe, clientSecret, paymentMethod) {
  try {
    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: paymentMethod.id
    });
    
    if (error) {
      throw error;
    }
    
    return paymentIntent;
  } catch (error) {
    throw new Error(handleStripeError(error));
  }
}

/**
 * Confirm payment with card element
 */
export async function confirmPaymentWithCard(stripe, clientSecret, cardElement, billingDetails = {}) {
  try {
    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: billingDetails,
      }
    });
    
    if (error) {
      throw error;
    }
    
    return paymentIntent;
  } catch (error) {
    throw new Error(handleStripeError(error));
  }
}
