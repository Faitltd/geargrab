import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Simple test endpoint with no authentication whatsoever
export const POST: RequestHandler = async ({ request }) => {
  try {
    console.log('🧪 Test payment intent endpoint called');
    
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

    // Check if we have Stripe configured
    const secretKey = process.env.STRIPE_SECRET_KEY;
    
    if (!secretKey || !secretKey.startsWith('sk_')) {
      console.log('⚠️ Stripe not configured, returning mock payment intent');
      
      // Return a mock payment intent for testing
      const mockPaymentIntent = {
        id: `pi_test_${Date.now()}`,
        client_secret: `pi_test_${Date.now()}_secret_test`,
        amount: Math.round(amount),
        currency,
        status: 'requires_payment_method'
      };

      return json({
        clientSecret: mockPaymentIntent.client_secret,
        paymentIntentId: mockPaymentIntent.id,
        mock: true,
        message: 'Test payment intent created successfully'
      });
    }

    // Try to create real Stripe payment intent
    try {
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(secretKey, {
        apiVersion: '2023-10-16',
      });

      const paymentIntentData = {
        amount: Math.round(amount),
        currency,
        metadata: {
          test: 'true',
          service: 'gear_rental_test',
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
        mock: false,
        message: 'Real payment intent created successfully'
      });
    } catch (stripeError) {
      console.error('❌ Stripe error in test endpoint:', stripeError);
      
      // Fall back to mock on Stripe error
      const mockPaymentIntent = {
        id: `pi_fallback_${Date.now()}`,
        client_secret: `pi_fallback_${Date.now()}_secret_fallback`,
        amount: Math.round(amount),
        currency,
        status: 'requires_payment_method'
      };

      return json({
        clientSecret: mockPaymentIntent.client_secret,
        paymentIntentId: mockPaymentIntent.id,
        mock: true,
        message: 'Fallback mock payment intent created due to Stripe error'
      });
    }

  } catch (error) {
    console.error('❌ Error in test payment intent endpoint:', error);
    
    return json({
      error: 'Test payment intent creation failed',
      details: error.message
    }, { status: 500 });
  }
};
