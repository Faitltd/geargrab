import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type Stripe from 'stripe';

let stripe: Stripe | null = null;

async function getStripe(): Promise<Stripe> {
  if (!stripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }
    
    const StripeConstructor = (await import('stripe')).default;
    stripe = new StripeConstructor(secretKey, {
      apiVersion: '2023-10-16',
    });
  }
  return stripe;
}

function createWebhookErrorResponse(message: string, status: number) {
  return json({
    error: message,
    timestamp: new Date().toISOString()
  }, { status });
}

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
  try {
    // 1. Validate webhook signature
    const signature = request.headers.get('stripe-signature');
    if (!signature) {
      console.warn('Webhook request missing signature:', {
        ip: getClientAddress(),
        timestamp: new Date().toISOString()
      });
      return createWebhookErrorResponse('Missing webhook signature', 400);
    }

    // 2. Get webhook secret
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not configured');
      return createWebhookErrorResponse('Webhook processing unavailable', 503);
    }

    // 3. Get request body
    const body = await request.text();
    
    // 4. Verify webhook signature
    let event: Stripe.Event;
    try {
      const stripeClient = await getStripe();
      event = stripeClient.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (error: any) {
      console.error('Webhook signature verification failed:', {
        error: error.message,
        ip: getClientAddress(),
        timestamp: new Date().toISOString()
      });
      
      if (error.message?.includes('timestamp')) {
        return createWebhookErrorResponse('Webhook timestamp too old', 400);
      }
      
      return createWebhookErrorResponse('Invalid webhook signature', 400);
    }

    // 5. Process webhook event
    console.log('Processing webhook event:', {
      type: event.type,
      id: event.id,
      timestamp: new Date().toISOString()
    });

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
        
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
        
      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
    }

    return json({ received: true });

  } catch (error: unknown) {
    console.error('Webhook processing error:', error);
    return createWebhookErrorResponse('Webhook processing failed', 500);
  }
};

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log('Payment succeeded:', {
      id: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      metadata: paymentIntent.metadata
    });
    
    // Update database, send emails, etc.
    
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log('Payment failed:', {
      id: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      error: paymentIntent.last_payment_error?.message,
      metadata: paymentIntent.metadata
    });
    
    // Update database, send failure notifications, etc.
    
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}