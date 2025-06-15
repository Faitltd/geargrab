import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { SecurityMiddleware } from '$lib/security/middleware';
import type {
  CreatePaymentIntentRequest,
  CreatePaymentIntentResponse,
  PaymentIntentErrorResponse
} from '$lib/types/api';
import type Stripe from 'stripe';

export const GET: RequestHandler = async ({ url, getClientAddress }) => {
  console.log('🔍 GET request to payment intent endpoint');
  console.log('🔍 Request details:', {
    url: url.toString(),
    clientAddress: getClientAddress(),
    nodeEnv: process.env.NODE_ENV
  });

  // Debug Stripe configuration
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const stripePublishableKey = process.env.VITE_STRIPE_PUBLISHABLE_KEY;

  return json({
    message: 'Payment intent endpoint is accessible',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    endpoint: '/api/payments/create-intent',
    debug: {
      hasStripeSecret: !!stripeSecretKey,
      stripeSecretPrefix: stripeSecretKey ? stripeSecretKey.substring(0, 8) + '...' : 'missing',
      hasStripePublishable: !!stripePublishableKey,
      stripePublishablePrefix: stripePublishableKey ? stripePublishableKey.substring(0, 8) + '...' : 'missing'
    }
  });
};

// Stripe server-side integration
let stripe: Stripe | null = null;

async function getStripe(): Promise<Stripe> {
  if (!stripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY;

    // Check if we have a valid Stripe secret key
    if (!secretKey || !secretKey.startsWith('sk_')) {
      console.error('Invalid or missing Stripe secret key. Key should start with "sk_test_" or "sk_live_"');
      throw new Error('Stripe configuration error');
    }

    const StripeConstructor = (await import('stripe')).default;
    stripe = new StripeConstructor(secretKey, {
      apiVersion: '2023-10-16',
    });
  }
  return stripe;
}

export const POST: RequestHandler = async (event) => {
  console.log('🚀 Payment intent endpoint called');

  try {
    // Authentication check - required for payments
    const userId = event.locals.userId;
    if (!userId) {
      console.error('❌ Unauthorized payment attempt');
      const errorResponse: PaymentIntentErrorResponse = {
        error: 'Authentication required for payments',
        code: 'UNAUTHORIZED'
      };
      return json(errorResponse, { status: 401 });
    }

    console.log('✅ Authenticated user making payment:', { userId });

    const body: CreatePaymentIntentRequest = await event.request.json();
    const { amount, currency = 'usd', metadata = {} } = body;

    console.log('📝 Payment request:', { amount, currency, metadata, userId });

    // Validate required parameters
    if (!amount || typeof amount !== 'number' || amount < 50) {
      console.error('❌ Invalid payment amount:', { amount, type: typeof amount });
      const errorResponse: PaymentIntentErrorResponse = {
        error: `Invalid amount. Minimum $0.50 required. Received: ${amount ? `$${(amount/100).toFixed(2)}` : 'undefined'}`,
        code: 'INVALID_AMOUNT'
      };
      return json(errorResponse, { status: 400 });
    }

    console.log('✅ Payment amount validation passed:', {
      amountInCents: amount,
      amountInDollars: (amount/100).toFixed(2)
    });

    // Get Stripe configuration
    const secretKey = process.env.STRIPE_SECRET_KEY;

    console.log('🔍 Stripe key check:', {
      hasKey: !!secretKey,
      keyPrefix: secretKey ? secretKey.substring(0, 8) + '...' : 'missing',
      keyLength: secretKey ? secretKey.length : 0
    });

    if (!secretKey || (!secretKey.startsWith('sk_test_') && !secretKey.startsWith('sk_live_'))) {
      console.error('❌ Stripe secret key not configured or invalid format');
      const errorResponse: PaymentIntentErrorResponse = {
        error: 'Payment system not configured. Please contact support.',
        code: 'PAYMENT_CONFIG_ERROR'
      };
      return json(errorResponse, { status: 500 });
    }

    // Create Stripe payment intent
    try {
      const stripeInstance = await getStripe();

      const paymentIntentData: Stripe.PaymentIntentCreateParams = {
        amount: Math.round(amount), // Amount in cents
        currency,
        metadata: {
          service: 'gear_rental',
          userId,
          ...metadata
        },
        automatic_payment_methods: {
          enabled: true,
        },
      };

      console.log('🔄 Creating Stripe payment intent with data:', paymentIntentData);
      const paymentIntent = await stripeInstance.paymentIntents.create(paymentIntentData);

      console.log('✅ Payment intent created successfully:', {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status
      });

      // Ensure client_secret exists before proceeding
      if (!paymentIntent.client_secret) {
        console.error('❌ Payment intent missing client secret');
        const errorResponse: PaymentIntentErrorResponse = {
          error: 'Payment intent creation failed. Please try again.',
          code: 'STRIPE_ERROR'
        };
        return json(errorResponse, { status: 500 });
      }

      const successResponse: CreatePaymentIntentResponse = {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      };
      return json(successResponse);

    } catch (stripeError: any) {
      console.error('❌ Stripe API error:', {
        code: stripeError.code,
        message: stripeError.message,
        type: stripeError.type,
        param: stripeError.param,
        requestId: stripeError.requestId,
        fullError: stripeError
      });

      const errorResponse: PaymentIntentErrorResponse = {
        error: stripeError.message || 'Failed to create payment intent. Please try again.',
        code: stripeError.code || 'STRIPE_ERROR'
      };
      return json(errorResponse, { status: 500 });
    }

  } catch (error: unknown) {
    console.error('❌ Unexpected error in payment endpoint:', error);
    const errorResponse: PaymentIntentErrorResponse = {
      error: 'Payment system error. Please try again.',
      code: 'INTERNAL_ERROR'
    };
    return json(errorResponse, { status: 500 });
  }
};