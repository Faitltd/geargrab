import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type {
  CreatePaymentIntentRequest,
  CreatePaymentIntentResponse,
  PaymentIntentErrorResponse
} from '$lib/types/api';
import type Stripe from 'stripe';

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
      apiVersion: '2025-05-28.basil',
    });
  }
  return stripe;
}

export const POST: RequestHandler = async (event) => {
  try {
    // Require authentication for all payment operations
    if (!event.locals.userId) {
      return json({
        error: 'Authentication required. Please log in to continue.',
        code: 'INTERNAL_ERROR'
      }, { status: 401 });
    }

    const userId = event.locals.userId;
    const body: CreatePaymentIntentRequest = await event.request.json();
    const { amount, currency = 'usd', metadata = {} } = body;

    // Validate required parameters
    if (!amount || typeof amount !== 'number' || amount < 50) {
      const errorResponse: PaymentIntentErrorResponse = {
        error: `Invalid amount. Minimum $0.50 required.`,
        code: 'INVALID_AMOUNT'
      };
      return json(errorResponse, { status: 400 });
    }

    // Create Stripe payment intent
    try {
      const stripeClient = await getStripe();
      const paymentIntent = await stripeClient.paymentIntents.create({
        amount: Math.round(amount),
        currency,
        metadata: {
          userId,
          ...metadata
        }
      });

      const successResponse: CreatePaymentIntentResponse = {
        clientSecret: paymentIntent.client_secret!,
        paymentIntentId: paymentIntent.id
      };
      return json(successResponse);

    } catch (stripeError: any) {
      const errorResponse: PaymentIntentErrorResponse = {
        error: 'Failed to create payment intent. Please try again.',
        code: 'STRIPE_ERROR'
      };
      return json(errorResponse, { status: 500 });
    }

  } catch (error: unknown) {
    const errorResponse: PaymentIntentErrorResponse = {
      error: 'Payment system error. Please try again.',
      code: 'INTERNAL_ERROR'
    };
    return json(errorResponse, { status: 500 });
  }
};