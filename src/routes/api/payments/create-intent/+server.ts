import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Stripe server-side integration
let stripe: any = null;

async function getStripe() {
  if (!stripe) {
    const Stripe = (await import('stripe')).default;
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_demo_key', {
      apiVersion: '2023-10-16',
    });
  }
  return stripe;
}

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Check if user is authenticated
    if (!locals.userId) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    const { amount, currency = 'usd', metadata = {} } = await request.json();

    // Validate amount
    if (!amount || amount < 50) { // Minimum $0.50
      return json({ error: 'Invalid amount' }, { status: 400 });
    }

    const stripeInstance = await getStripe();

    // Create payment intent
    const paymentIntent = await stripeInstance.paymentIntents.create({
      amount: Math.round(amount), // Amount in cents
      currency,
      metadata: {
        userId: locals.userId,
        ...metadata
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    return json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
};
