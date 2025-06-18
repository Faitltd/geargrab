import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Temporary test endpoint with NO authentication for debugging
export const POST: RequestHandler = async ({ request }) => {
  try {
    console.log('🧪 Test payment endpoint (NO AUTH) called');
    
    const body = await request.json();
    const { amount, currency = 'usd', metadata = {} } = body;
    
    console.log('📝 Test payment request:', { amount, currency, metadata });

    // Validate amount
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
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(secretKey, {
        apiVersion: '2023-10-16',
      });

      const paymentIntentData = {
        amount: Math.round(amount), // Amount in cents
        currency,
        metadata: {
          service: 'gear_rental_test',
          test: 'no_auth',
          ...metadata
        },
        automatic_payment_methods: {
          enabled: true,
        },
      };

      console.log('🔄 Creating test Stripe payment intent...');
      const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

      console.log('✅ Test payment intent created successfully:', paymentIntent.id);
      return json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        test: true,
        message: 'Test payment intent created without authentication'
      });

    } catch (stripeError) {
      console.error('❌ Stripe error:', stripeError);
      return json({
        error: 'Failed to create payment intent. Please try again.',
        code: 'STRIPE_ERROR',
        details: stripeError.message
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Unexpected error in test payment endpoint:', error);
    return json({
      error: 'Payment system error. Please try again.',
      code: 'INTERNAL_ERROR',
      details: error.message
    }, { status: 500 });
  }
};

export const GET: RequestHandler = async () => {
  return json({
    message: 'Test payment endpoint (no auth) is accessible',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    endpoint: '/api/payments/test-no-auth'
  });
};
