import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Stripe integration
let stripe: any = null;

async function getStripe() {
  if (!stripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey || !secretKey.startsWith('sk_')) {
      throw new Error('Invalid or missing Stripe secret key');
    }

    const Stripe = (await import('stripe')).default;
    stripe = new Stripe(secretKey, {
      apiVersion: '2023-10-16',
    });
  }
  return stripe;
}

// Create payment intent for background check
export const POST: RequestHandler = async ({ request, locals }) => {
  // Check if user is authenticated
  if (!locals.userId) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { checkType, provider } = await request.json();

    // Validate required fields
    if (!checkType || !provider) {
      return json({ 
        error: 'Missing required fields: checkType, provider' 
      }, { status: 400 });
    }

    // Validate check type
    if (!['basic', 'standard', 'comprehensive'].includes(checkType)) {
      return json({ error: 'Invalid check type' }, { status: 400 });
    }

    // Calculate pricing
    const pricing = {
      basic: 29.99,
      standard: 49.99,
      comprehensive: 79.99
    };

    const amount = pricing[checkType as keyof typeof pricing];
    if (!amount) {
      return json({ error: 'Invalid check type for pricing' }, { status: 400 });
    }

    // Create payment intent
    const stripeClient = await getStripe();
    
    const paymentIntent = await stripeClient.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        userId: locals.userId,
        checkType,
        provider,
        service: 'background_check'
      }
    });

    return json({
      clientSecret: paymentIntent.client_secret,
      amount,
      checkType,
      provider
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    return json({ 
      error: 'Failed to create payment intent' 
    }, { status: 500 });
  }
};
