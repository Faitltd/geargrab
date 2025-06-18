#!/usr/bin/env node

/**
 * Stripe Security Fix Implementation Script
 * Demonstrates proper secure and user-friendly error handling
 */

import fs from 'fs';
import path from 'path';

// Create a secure payment endpoint template
const securePaymentEndpoint = `import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { SecurityMiddleware } from '$lib/security/middleware';
import type Stripe from 'stripe';

// Stripe configuration with proper error handling
let stripe: Stripe | null = null;

async function getStripe(): Promise<Stripe> {
  if (!stripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey || !secretKey.startsWith('sk_')) {
      throw new Error('STRIPE_CONFIG_ERROR');
    }

    const StripeConstructor = (await import('stripe')).default;
    stripe = new StripeConstructor(secretKey, {
      apiVersion: '2023-10-16',
    });
  }
  return stripe;
}

// Secure error response helper
function createSecureErrorResponse(message: string, code: string, status: number) {
  return json({
    error: message,
    code,
    timestamp: new Date().toISOString(),
    support: status >= 500 ? "Please contact support if this issue persists" : undefined
  }, { status });
}

// Input validation helper
function validatePaymentRequest(body: any) {
  if (!body || typeof body !== 'object') {
    return createSecureErrorResponse(
      'Invalid request format. Please check your payment details.',
      'INVALID_REQUEST',
      400
    );
  }

  if (!body.amount || typeof body.amount !== 'number') {
    return createSecureErrorResponse(
      'Payment amount is required. Please enter a valid amount.',
      'MISSING_AMOUNT',
      400
    );
  }

  if (body.amount < 50) {
    return createSecureErrorResponse(
      'Minimum payment amount is $0.50. Please increase the amount.',
      'AMOUNT_TOO_LOW',
      400
    );
  }

  if (body.amount > 99999999) {
    return createSecureErrorResponse(
      'Payment amount is too large. Please contact support for large transactions.',
      'AMOUNT_TOO_HIGH',
      400
    );
  }

  if (body.currency && body.currency !== 'usd') {
    return createSecureErrorResponse(
      'Only USD currency is currently supported.',
      'UNSUPPORTED_CURRENCY',
      400
    );
  }

  return null; // Valid
}

// Rate limiting helper
async function applyRateLimit(event: any): Promise<Response | null> {
  try {
    return await SecurityMiddleware.applyRateLimit(event, 'payment');
  } catch (error) {
    console.error('Rate limiting error:', error);
    return createSecureErrorResponse(
      'Service temporarily unavailable. Please try again in a few minutes.',
      'RATE_LIMIT_ERROR',
      503
    );
  }
}

// Authentication helper
function requireAuthentication(locals: any): Response | null {
  if (!locals.userId) {
    return createSecureErrorResponse(
      'Authentication required. Please log in to continue.',
      'AUTH_REQUIRED',
      401
    );
  }
  return null;
}

// Main payment endpoint with comprehensive security
export const POST: RequestHandler = async (event) => {
  const { request, locals, getClientAddress } = event;
  
  try {
    // 1. Apply rate limiting first
    const rateLimitResponse = await applyRateLimit(event);
    if (rateLimitResponse) return rateLimitResponse;

    // 2. Require authentication
    const authResponse = requireAuthentication(locals);
    if (authResponse) return authResponse;

    // 3. Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return createSecureErrorResponse(
        'Invalid request format. Please check your payment details.',
        'INVALID_JSON',
        400
      );
    }

    // 4. Validate input
    const validationError = validatePaymentRequest(body);
    if (validationError) return validationError;

    const { amount, currency = 'usd', metadata = {} } = body;
    const userId = locals.userId;

    // 5. Log security event
    console.log('Payment intent request:', {
      userId,
      amount: amount / 100,
      currency,
      ip: getClientAddress(),
      timestamp: new Date().toISOString()
    });

    // 6. Initialize Stripe with proper error handling
    let stripeClient;
    try {
      stripeClient = await getStripe();
    } catch (error) {
      console.error('Stripe configuration error:', error);
      
      if (process.env.NODE_ENV === 'development') {
        return createSecureErrorResponse(
          'Payment system not configured for development. Please check environment variables.',
          'DEV_CONFIG_ERROR',
          503
        );
      }
      
      return createSecureErrorResponse(
        'Payment service temporarily unavailable. Please try again later.',
        'SERVICE_UNAVAILABLE',
        503
      );
    }

    // 7. Create payment intent with Stripe error handling
    try {
      const paymentIntent = await stripeClient.paymentIntents.create({
        amount: Math.round(amount),
        currency,
        metadata: {
          userId,
          ...metadata
        }
      });

      // 8. Success response
      return json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency
      });

    } catch (stripeError: any) {
      console.error('Stripe API error:', {
        code: stripeError.code,
        message: stripeError.message,
        type: stripeError.type,
        userId,
        amount
      });

      // Handle specific Stripe errors with user-friendly messages
      switch (stripeError.code) {
        case 'api_key_expired':
        case 'invalid_api_key':
          return createSecureErrorResponse(
            'Payment service configuration error. Please contact support.',
            'PAYMENT_CONFIG_ERROR',
            503
          );
          
        case 'amount_too_small':
          return createSecureErrorResponse(
            'Payment amount is too small. Minimum amount is $0.50.',
            'AMOUNT_TOO_SMALL',
            400
          );
          
        case 'amount_too_large':
          return createSecureErrorResponse(
            'Payment amount is too large. Please contact support for large transactions.',
            'AMOUNT_TOO_LARGE',
            400
          );
          
        case 'currency_not_supported':
          return createSecureErrorResponse(
            'Currency not supported. Only USD is currently accepted.',
            'CURRENCY_NOT_SUPPORTED',
            400
          );
          
        case 'rate_limit':
          return createSecureErrorResponse(
            'Too many payment requests. Please wait a moment and try again.',
            'STRIPE_RATE_LIMIT',
            429
          );
          
        default:
          return createSecureErrorResponse(
            'Payment processing failed. Please check your details and try again.',
            'PAYMENT_FAILED',
            400
          );
      }
    }

  } catch (error: unknown) {
    console.error('Unexpected payment endpoint error:', error);
    
    return createSecureErrorResponse(
      'An unexpected error occurred. Please try again or contact support.',
      'INTERNAL_ERROR',
      500
    );
  }
};`;

// Create a secure webhook endpoint template
const secureWebhookEndpoint = `import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type Stripe from 'stripe';

let stripe: Stripe | null = null;

async function getStripe(): Promise<Stripe> {
  if (!stripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }
    
    const StripeConstructor = (await import('stripe')).default;
    stripe = new StripeConstructor(secretKey, {
      apiVersion: '2023-10-16',
    });
  }
  return stripe;
}

function createWebhookErrorResponse(message: string, status: number) {
  return json({
    error: message,
    timestamp: new Date().toISOString()
  }, { status });
}

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
  try {
    // 1. Validate webhook signature
    const signature = request.headers.get('stripe-signature');
    if (!signature) {
      console.warn('Webhook request missing signature:', {
        ip: getClientAddress(),
        timestamp: new Date().toISOString()
      });
      return createWebhookErrorResponse('Missing webhook signature', 400);
    }

    // 2. Get webhook secret
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not configured');
      return createWebhookErrorResponse('Webhook processing unavailable', 503);
    }

    // 3. Get request body
    const body = await request.text();
    
    // 4. Verify webhook signature
    let event: Stripe.Event;
    try {
      const stripeClient = await getStripe();
      event = stripeClient.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (error: any) {
      console.error('Webhook signature verification failed:', {
        error: error.message,
        ip: getClientAddress(),
        timestamp: new Date().toISOString()
      });
      
      if (error.message?.includes('timestamp')) {
        return createWebhookErrorResponse('Webhook timestamp too old', 400);
      }
      
      return createWebhookErrorResponse('Invalid webhook signature', 400);
    }

    // 5. Process webhook event
    console.log('Processing webhook event:', {
      type: event.type,
      id: event.id,
      timestamp: new Date().toISOString()
    });

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
        
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
        
      default:
        console.log(\`Unhandled webhook event type: \${event.type}\`);
    }

    return json({ received: true });

  } catch (error: unknown) {
    console.error('Webhook processing error:', error);
    return createWebhookErrorResponse('Webhook processing failed', 500);
  }
};

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log('Payment succeeded:', {
      id: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      metadata: paymentIntent.metadata
    });
    
    // Update database, send emails, etc.
    
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log('Payment failed:', {
      id: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      error: paymentIntent.last_payment_error?.message,
      metadata: paymentIntent.metadata
    });
    
    // Update database, send failure notifications, etc.
    
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}`;

// Create improved error handling utilities
const errorHandlingUtils = `// Enhanced error handling utilities for Stripe integration

export interface SecureErrorResponse {
  error: string;
  code: string;
  timestamp: string;
  support?: string;
  action?: string;
}

export class StripeErrorHandler {
  // Create user-friendly error responses
  static createUserFriendlyError(
    message: string, 
    code: string, 
    status: number,
    action?: string
  ): Response {
    const response: SecureErrorResponse = {
      error: message,
      code,
      timestamp: new Date().toISOString(),
      action
    };

    if (status >= 500) {
      response.support = "Please contact support if this issue persists";
    }

    return json(response, { status });
  }

  // Handle Stripe-specific errors
  static handleStripeError(stripeError: any): Response {
    const errorMap = {
      'card_declined': {
        message: 'Your card was declined. Please try a different payment method.',
        status: 400,
        action: 'try_different_card'
      },
      'expired_card': {
        message: 'Your card has expired. Please use a different payment method.',
        status: 400,
        action: 'update_card'
      },
      'insufficient_funds': {
        message: 'Insufficient funds. Please check your account balance or use a different card.',
        status: 400,
        action: 'check_balance'
      },
      'incorrect_cvc': {
        message: 'Your card security code is incorrect. Please check and try again.',
        status: 400,
        action: 'check_cvc'
      },
      'processing_error': {
        message: 'Payment processing failed. Please try again in a moment.',
        status: 400,
        action: 'retry_payment'
      },
      'rate_limit': {
        message: 'Too many payment attempts. Please wait a moment and try again.',
        status: 429,
        action: 'wait_and_retry'
      }
    };

    const errorInfo = errorMap[stripeError.code] || {
      message: 'Payment processing failed. Please try again.',
      status: 400,
      action: 'retry_payment'
    };

    return this.createUserFriendlyError(
      errorInfo.message,
      stripeError.code || 'PAYMENT_ERROR',
      errorInfo.status,
      errorInfo.action
    );
  }

  // Validate payment inputs
  static validatePaymentInput(body: any): Response | null {
    if (!body || typeof body !== 'object') {
      return this.createUserFriendlyError(
        'Invalid payment request. Please refresh the page and try again.',
        'INVALID_REQUEST',
        400,
        'refresh_page'
      );
    }

    if (!body.amount || typeof body.amount !== 'number') {
      return this.createUserFriendlyError(
        'Payment amount is required. Please enter a valid amount.',
        'MISSING_AMOUNT',
        400,
        'enter_amount'
      );
    }

    if (body.amount < 50) {
      return this.createUserFriendlyError(
        'Minimum payment amount is $0.50. Please increase the amount.',
        'AMOUNT_TOO_LOW',
        400,
        'increase_amount'
      );
    }

    return null; // Valid input
  }

  // Log security events
  static logSecurityEvent(event: string, details: any) {
    console.error(\`Security Event: \${event}\`, {
      timestamp: new Date().toISOString(),
      event,
      ...details
    });

    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureMessage(event, 'error', { extra: details });
    }
  }
}`;

// Write the files
console.log('🔧 Creating secure Stripe implementation files...');

// Create the secure payment endpoint
fs.writeFileSync('secure-payment-endpoint.ts', securePaymentEndpoint);
console.log('✅ Created secure-payment-endpoint.ts');

// Create the secure webhook endpoint  
fs.writeFileSync('secure-webhook-endpoint.ts', secureWebhookEndpoint);
console.log('✅ Created secure-webhook-endpoint.ts');

// Create error handling utilities
fs.writeFileSync('stripe-error-utils.ts', errorHandlingUtils);
console.log('✅ Created stripe-error-utils.ts');

console.log('\n🎯 Secure Stripe implementation files created successfully!');
console.log('\nThese files demonstrate:');
console.log('✅ Proper authentication enforcement');
console.log('✅ Comprehensive rate limiting');
console.log('✅ User-friendly error messages');
console.log('✅ Security event logging');
console.log('✅ Input validation');
console.log('✅ Stripe error handling');
console.log('✅ Webhook security');

export { securePaymentEndpoint, secureWebhookEndpoint, errorHandlingUtils };
