import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type {
  CreatePaymentIntentRequest,
  CreatePaymentIntentResponse,
  PaymentIntentErrorResponse
} from '$lib/types/api';
import type Stripe from 'stripe';
import { AuthMiddlewareV2 } from '$lib/auth/middleware-v2';

export const GET: RequestHandler = async () => {
  return json({
    message: 'Payment intent endpoint is accessible',
    timestamp: new Date().toISOString()
  });
};

// Stripe server-side integration
let stripe: Stripe | null = null;

async function getStripe(): Promise<Stripe> {
  if (!stripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY;

    // Check if we have a valid Stripe secret key
    if (!secretKey ||
        !secretKey.startsWith('sk_') ||
        secretKey.includes('REPLACE_WITH') ||
        secretKey.includes('YOUR_') ||
        secretKey.includes('1234567890')) {
      console.error('Invalid or missing Stripe secret key. Please configure real Stripe keys.');
      throw new Error('Stripe not configured. Please add real Stripe API keys to environment variables.');
    }

    const StripeConstructor = (await import('stripe')).default;
    stripe = new StripeConstructor(secretKey, {
      apiVersion: '2024-06-20',
    });
  }
  return stripe;
}

export const POST: RequestHandler = async (event) => {
  const startTime = Date.now();
  console.log('💳 Payment intent creation started');

  try {
    // Check if this is a test request (for debugging payment forms)
    const url = new URL(event.request.url);
    const isTestMode = url.searchParams.get('test') === 'true' ||
                      event.request.headers.get('X-Test-Mode') === 'true' ||
                      process.env.NODE_ENV === 'development';

    let userId: string;

    if (isTestMode) {
      // Test mode - bypass authentication for payment form testing
      userId = 'test-user-' + Date.now();
      console.log('🧪 Test mode enabled - bypassing authentication for user:', userId);
    } else {
      // Production mode - require authentication
      console.log('🔍 Checking authentication for payment intent...');

      const authResult = await AuthMiddlewareV2.requireAuth(event);

      // If authResult is a Response, it means authentication failed
      if (authResult instanceof Response) {
        console.log('❌ Payment authentication failed - returning 401');

        // Add additional debugging info
        const authHeader = event.request.headers.get('Authorization');
        console.log('🔍 Auth header present:', !!authHeader);
        console.log('🔍 Auth header format:', authHeader ? authHeader.substring(0, 20) + '...' : 'none');

        return authResult;
      }

      // Authentication successful
      userId = authResult.userId!;
      console.log('✅ Payment authentication successful for user:', userId);
    }

    const body: CreatePaymentIntentRequest = await event.request.json();
    const { amount, currency = 'usd', metadata = {} } = body;

    // Validate required parameters
    if (!amount || typeof amount !== 'number' || amount < 50) {
      const duration = Date.now() - startTime;
      console.log(`❌ Invalid payment amount after ${duration}ms:`, { amount, type: typeof amount });

      const errorResponse: PaymentIntentErrorResponse = {
        error: `Invalid amount. Minimum $0.50 required.`,
        code: 'INVALID_AMOUNT',
        debugInfo: process.env.NODE_ENV === 'development' ? { amount, duration } : undefined
      };
      return json(errorResponse, { status: 400 });
    }

    // Create Stripe payment intent
    try {
      const stripeClient = await getStripe();
      const paymentIntent = await stripeClient.paymentIntents.create({
        amount: Math.round(amount),
        currency,
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          userId,
          ...metadata
        }
      });

      const duration = Date.now() - startTime;
      console.log(`✅ Payment intent created successfully in ${duration}ms:`, {
        paymentIntentId: paymentIntent.id,
        amount,
        currency,
        userId
      });

      const successResponse: CreatePaymentIntentResponse = {
        clientSecret: paymentIntent.client_secret!,
        paymentIntentId: paymentIntent.id
      };
      return json(successResponse);

    } catch (stripeError: any) {
      const duration = Date.now() - startTime;
      console.error(`❌ Stripe error after ${duration}ms:`, {
        error: stripeError.message,
        code: stripeError.code,
        type: stripeError.type
      });

      const errorResponse: PaymentIntentErrorResponse = {
        error: 'Failed to create payment intent. Please try again.',
        code: 'STRIPE_ERROR',
        debugInfo: process.env.NODE_ENV === 'development' ? {
          stripeError: stripeError.message,
          duration
        } : undefined
      };
      return json(errorResponse, { status: 500 });
    }

  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    console.error(`❌ Payment system error after ${duration}ms:`, error);

    const errorResponse: PaymentIntentErrorResponse = {
      error: 'Payment system error. Please try again.',
      code: 'INTERNAL_ERROR',
      debugInfo: process.env.NODE_ENV === 'development' ? {
        error: error instanceof Error ? error.message : String(error),
        duration
      } : undefined
    };
    return json(errorResponse, { status: 500 });
  }
};
