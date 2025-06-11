import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

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

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const isDevelopment = process.env.NODE_ENV !== 'production';

    // Check if user is authenticated (allow mock users in development)
    if (!locals.userId && !isDevelopment) {
      console.log('Payment intent creation failed: No user authentication');
      return json({ error: 'Authentication required. Please log in and try again.' }, { status: 401 });
    }

    // In development, use a mock user ID if none exists
    const userId = locals.userId || (isDevelopment ? 'dev_user_mock' : null);

    if (!userId) {
      console.log('Payment intent creation failed: No user authentication');
      return json({ error: 'Authentication required. Please log in and try again.' }, { status: 401 });
    }

    const { amount, currency = 'usd', metadata = {} } = await request.json();
    console.log('Payment intent request:', { amount, currency, metadata, userId });

    // Validate amount
    if (!amount || amount < 50) { // Minimum $0.50
      console.log('Payment intent creation failed: Invalid amount', amount);
      return json({ error: 'Invalid amount. Minimum $0.50 required.' }, { status: 400 });
    }

    // Check if we're in development mode and Stripe is not properly configured
    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (isDevelopment && (!secretKey || !secretKey.startsWith('sk_'))) {
      console.log('Development mode: Using mock payment intent');
      // Return a mock payment intent for development
      const mockPaymentIntent = {
        id: `pi_mock_${Date.now()}`,
        client_secret: `pi_mock_${Date.now()}_secret_mock`,
        amount: Math.round(amount),
        currency,
        status: 'requires_payment_method'
      };

      return json({
        clientSecret: mockPaymentIntent.client_secret,
        paymentIntentId: mockPaymentIntent.id
      });
    }

    const stripeInstance = await getStripe();
    console.log('Stripe instance initialized');

    // Create payment intent
    console.log('Creating Stripe payment intent...');
    const paymentIntent = await stripeInstance.paymentIntents.create({
      amount: Math.round(amount), // Amount in cents
      currency,
      metadata: {
        userId: userId,
        ...metadata
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    console.log('Payment intent created successfully:', paymentIntent.id);
    return json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    console.error('Error details:', {
      message: error.message,
      type: error.type,
      code: error.code,
      stack: error.stack
    });

    // In development mode, if Stripe fails, return a mock response
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
  }
};
