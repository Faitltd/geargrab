import { json } from '@sveltejs/kit';
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
};