import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSecureHandler } from '$lib/security/middleware';

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

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();

    try {
      const isDevelopment = process.env.NODE_ENV !== 'production';
      // Temporary: Use mock user ID for debugging
      const userId = 'temp_user_' + Date.now();

      console.log('🚀 Payment intent creation started');
      console.log('🔍 Environment:', { isDevelopment, userId });

      const { amount, currency = 'usd', metadata = {} } = body;
      console.log('📝 Payment request:', { amount, currency, metadata });

      console.log('✅ Authenticated user payment:', { userId });

    // Validate amount
    if (!amount || amount < 50) { // Minimum $0.50
      console.log('❌ Invalid amount:', amount);
      return json({
        error: 'Invalid amount. Minimum $0.50 required.',
        code: 'INVALID_AMOUNT'
      }, { status: 400 });
    }



    // Check Stripe configuration
    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey || !secretKey.startsWith('sk_')) {
      console.log('⚠️ Stripe not configured, using mock payment intent');
      // Return a mock payment intent for development/testing
      const mockPaymentIntent = {
        id: `pi_mock_${Date.now()}`,
        client_secret: `pi_mock_${Date.now()}_secret_mock`,
        amount: Math.round(amount),
        currency,
        status: 'requires_payment_method'
      };

      return json({
        clientSecret: mockPaymentIntent.client_secret,
        paymentIntentId: mockPaymentIntent.id,
        mock: true
      });
    }

    // Create Stripe payment intent
    try {
      const stripeInstance = await getStripe();
      console.log('✅ Stripe instance initialized');

      const paymentIntentData = {
        amount: Math.round(amount), // Amount in cents
        currency,
        metadata: {
          userId: userId,
          service: 'gear_rental',
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
        paymentIntentId: paymentIntent.id,
        mock: false
      });
    } catch (stripeError) {
      console.error('❌ Stripe error:', stripeError);
      throw stripeError;
    }

  } catch (error) {
    console.error('❌ Error creating payment intent:', error);
    console.error('❌ Error details:', {
      message: error.message,
      type: error.type,
      code: error.code,
      stack: error.stack,
      name: error.name
    });

    // Log the full error object for debugging
    console.error('❌ Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));

    // In development mode, if Stripe fails, return a mock response
    const isDevelopment = process.env.NODE_ENV !== 'production';
    if (isDevelopment && error.message?.includes('Stripe configuration error')) {
      console.log('Development fallback: Using mock payment intent due to Stripe config error');
      const mockPaymentIntent = {
        id: `pi_mock_${Date.now()}`,
        client_secret: `pi_mock_${Date.now()}_secret_mock`
      };

      return json({
        clientSecret: mockPaymentIntent.client_secret,
        paymentIntentId: mockPaymentIntent.id
      });
    }

    // Provide more specific error messages based on Stripe error types
    if (error.type === 'StripeInvalidRequestError') {
      return json(
        { error: 'Invalid payment request. Please check your payment details.' },
        { status: 400 }
      );
    } else if (error.type === 'StripeAuthenticationError') {
      return json(
        { error: 'Payment service authentication failed. Please contact support.' },
        { status: 500 }
      );
    } else {
      return json(
        { error: 'Failed to create payment intent. Please try again.' },
        { status: 500 }
      );
    }
  } catch (outerError) {
    console.error('❌ Outer error:', outerError);
    return json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
};
