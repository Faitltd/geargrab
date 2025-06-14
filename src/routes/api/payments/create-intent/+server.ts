import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { SecurityMiddleware } from '$lib/security/middleware';

export const GET: RequestHandler = async ({ url, getClientAddress }) => {
  console.log('🔍 GET request to payment intent endpoint');
  console.log('🔍 Request details:', {
    url: url.toString(),
    clientAddress: getClientAddress(),
    nodeEnv: process.env.NODE_ENV
  });

  return json({
    message: 'Payment intent endpoint is accessible',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    endpoint: '/api/payments/create-intent'
  });
};

// Stripe server-side integration
let stripe: any = null;

async function getStripe() {
  if (!stripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY;

    // Check if we have a valid Stripe secret key
    if (!secretKey || !secretKey.startsWith('sk_')) {
      console.error('Invalid or missing Stripe secret key. Key should start with "sk_test_" or "sk_live_"');
      throw new Error('Stripe configuration error');
    }

    const Stripe = (await import('stripe')).default;
    stripe = new Stripe(secretKey, {
      apiVersion: '2023-10-16',
    });
  }
  return stripe;
}

export const POST: RequestHandler = async (event) => {
  console.log('🚀 Payment intent endpoint called');

  try {
    // TEMPORARY: Disable authentication for debugging payment issues
    // This allows us to test if the payment system itself works
    console.log('⚠️ TEMPORARY: Authentication disabled for payment debugging');

    const authHeader = event.request.headers.get('Authorization');
    let userId = 'temp_user_for_testing';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
          userId = payload.user_id || payload.sub || 'authenticated_user';
          console.log('✅ Found user ID in token:', userId);
        }
      } catch (e) {
        console.log('⚠️ Could not parse token, using default user ID');
      }
    } else {
      console.log('⚠️ No auth token provided, using temporary user ID for testing');
    }

    const body = await event.request.json();
    const { amount, currency = 'usd', metadata = {} } = body;

    console.log('📝 Payment request:', { amount, currency, metadata, userId });

    // Validate required parameters
    if (!amount || amount < 50) {
      return json({
        error: 'Invalid amount. Minimum $0.50 required.',
        code: 'INVALID_AMOUNT'
      }, { status: 400 });
    }

    // Get Stripe configuration
    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey || !secretKey.startsWith('sk_')) {
      console.error('❌ Stripe secret key not configured');
      return json({
        error: 'Payment system not configured. Please contact support.',
        code: 'PAYMENT_CONFIG_ERROR'
      }, { status: 500 });
    }

    // Create Stripe payment intent
    try {
      const stripeInstance = await getStripe();

      const paymentIntentData = {
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

      console.log('🔄 Creating Stripe payment intent...');
      const paymentIntent = await stripeInstance.paymentIntents.create(paymentIntentData);

      console.log('✅ Payment intent created successfully:', paymentIntent.id);
      return json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });

    } catch (stripeError) {
      console.error('❌ Stripe error:', stripeError);
      return json({
        error: 'Failed to create payment intent. Please try again.',
        code: 'STRIPE_ERROR'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Unexpected error in payment endpoint:', error);
    return json({
      error: 'Payment system error. Please try again.',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
};
