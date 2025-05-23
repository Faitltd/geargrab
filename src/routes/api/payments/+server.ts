import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import Stripe from 'stripe';
import { adminAuth } from '$firebase/server'; // Assuming this initializes Firebase Admin SDK
import { STRIPE_SECRET_KEY } from '$env/static/private';

// Initialize Stripe
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16', // Use the latest API version
});

// POST /api/payments - Create a payment intent
export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) {
    throw error(401, 'Unauthorized: User not authenticated');
  }

  try {
    const { amount, currency, paymentMethodId } = await request.json();

    if (!amount || !currency || !paymentMethodId) {
      throw error(400, 'Missing required parameters: amount, currency, paymentMethodId');
    }

    // Basic validation for amount (must be a positive integer)
    if (typeof amount !== 'number' || amount <= 0 || !Number.isInteger(amount)) {
        throw error(400, 'Invalid amount: Must be a positive integer representing cents.');
    }

    // Basic validation for currency (must be a string, e.g., "usd")
    if (typeof currency !== 'string' || currency.length !== 3) {
        throw error(400, 'Invalid currency: Must be a 3-letter ISO currency code.');
    }

    // Basic validation for paymentMethodId (must be a string)
    if (typeof paymentMethodId !== 'string' || !paymentMethodId.startsWith('pm_')) {
        throw error(400, 'Invalid paymentMethodId.');
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount, // Amount in cents
      currency,
      payment_method: paymentMethodId,
      confirm: true, // Confirm the payment intent immediately
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never', // Handle 3D Secure redirects on the client
      },
      // customer: locals.user.stripeCustomerId, // Optional: Associate with a Stripe customer
      // description: 'Payment for service/product', // Optional
      // metadata: { userId: locals.user.uid }, // Optional
    });

    return json({
      clientSecret: paymentIntent.client_secret,
      status: paymentIntent.status,
    });

  } catch (err: any) {
    console.error('Stripe Payment Intent creation error:', err);
    if (err.type && err.type.startsWith('Stripe')) {
      throw error(err.statusCode || 500, err.message || 'Stripe API error');
    }
    // Handle our own thrown errors
    if (err.status && err.body?.message) {
        throw error(err.status, err.body.message);
    }
    throw error(500, 'Internal server error');
  }
};

// GET /api/payments?paymentIntentId={id} - Retrieve payment intent status
export const GET: RequestHandler = async ({ url, locals }) => {
  if (!locals.user) {
    throw error(401, 'Unauthorized: User not authenticated');
  }

  const paymentIntentId = url.searchParams.get('paymentIntentId');

  if (!paymentIntentId) {
    throw error(400, 'Missing paymentIntentId query parameter');
  }

  if (typeof paymentIntentId !== 'string' || !paymentIntentId.startsWith('pi_')) {
    throw error(400, 'Invalid paymentIntentId format.');
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Optional: Check if the user requesting the status is the one who created it
    // This would require storing userId in payment intent metadata during creation
    // if (paymentIntent.metadata.userId !== locals.user.uid) {
    //   throw error(403, 'Forbidden: You are not authorized to view this payment status');
    // }

    return json({
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      // You might want to return more details depending on your needs
    });

  } catch (err: any) {
    console.error('Stripe Payment Intent retrieval error:', err);
    if (err.type && err.type.startsWith('Stripe')) {
      throw error(err.statusCode || 500, err.message || 'Stripe API error');
    }
    throw error(500, 'Internal server error');
  }
};
