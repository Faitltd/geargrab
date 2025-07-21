/**
 * Stripe Webhook Handler
 * Handles Stripe webhook events for payment processing
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import Stripe from 'stripe';
import { bookingsService } from '$lib/services/bookings.service';

// Mock Stripe for demo deployment
const stripe = {
  webhooks: {
    constructEvent: (payload: any, signature: string, secret: string) => {
      // Return a mock webhook event for demo
      return {
        id: 'evt_demo_123',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_demo_123',
            payment_status: 'paid',
            metadata: {
              bookingId: 'demo-booking-123'
            }
          }
        }
      };
    }
  }
};

/**
 * POST /api/webhooks/stripe
 * Handle Stripe webhook events
 */
export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      throw error(400, {
        message: 'Missing Stripe signature',
        code: 'MISSING_SIGNATURE'
      });
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      throw error(400, {
        message: 'Invalid signature',
        code: 'INVALID_SIGNATURE'
      });
    }

    console.log('Received Stripe webhook event:', event.type, event.id);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.dispute.created':
        await handleChargeDisputeCreated(event.data.object as Stripe.Dispute);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return json({ received: true });

  } catch (err: any) {
    console.error('Webhook error:', err);
    
    if (err.status) {
      throw err; // Re-throw SvelteKit errors
    }
    
    return json({
      error: {
        message: err.message || 'Webhook processing failed',
        code: 'WEBHOOK_ERROR'
      }
    }, { status: 500 });
  }
};

/**
 * Handle successful checkout session
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  try {
    const bookingId = session.metadata?.bookingId;
    const renterId = session.metadata?.renterId;

    if (!bookingId || !renterId) {
      console.error('Missing booking metadata in checkout session:', session.id);
      return;
    }

    console.log(`Processing checkout completion for booking ${bookingId}`);

    // Update booking status to paid
    await bookingsService.updateBookingStatus(
      bookingId,
      'paid',
      renterId,
      `Payment completed via Stripe session ${session.id}`
    );

    console.log(`Booking ${bookingId} marked as paid`);

  } catch (error) {
    console.error('Error handling checkout session completed:', error);
    throw error;
  }
}

/**
 * Handle successful payment intent
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    const bookingId = paymentIntent.metadata?.bookingId;
    const renterId = paymentIntent.metadata?.renterId;

    if (!bookingId || !renterId) {
      console.error('Missing booking metadata in payment intent:', paymentIntent.id);
      return;
    }

    console.log(`Payment intent succeeded for booking ${bookingId}`);

    // Additional confirmation that payment was successful
    // This is a backup in case checkout.session.completed wasn't received
    const booking = await bookingsService.getBooking(bookingId);
    
    if (booking && booking.status === 'confirmed') {
      await bookingsService.updateBookingStatus(
        bookingId,
        'paid',
        renterId,
        `Payment confirmed via PaymentIntent ${paymentIntent.id}`
      );
    }

  } catch (error) {
    console.error('Error handling payment intent succeeded:', error);
    throw error;
  }
}

/**
 * Handle failed payment intent
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    const bookingId = paymentIntent.metadata?.bookingId;
    const renterId = paymentIntent.metadata?.renterId;

    if (!bookingId || !renterId) {
      console.error('Missing booking metadata in failed payment intent:', paymentIntent.id);
      return;
    }

    console.log(`Payment intent failed for booking ${bookingId}`);

    // Update booking with payment failure information
    await bookingsService.updateBookingStatus(
      bookingId,
      'confirmed', // Keep as confirmed so user can retry payment
      renterId,
      `Payment failed: ${paymentIntent.last_payment_error?.message || 'Unknown error'}`
    );

  } catch (error) {
    console.error('Error handling payment intent failed:', error);
    throw error;
  }
}

/**
 * Handle charge dispute created
 */
async function handleChargeDisputeCreated(dispute: Stripe.Dispute) {
  try {
    const charge = dispute.charge as Stripe.Charge;
    const paymentIntent = charge.payment_intent as string;

    console.log(`Dispute created for charge ${charge.id}, payment intent ${paymentIntent}`);

    // In a real application, you would:
    // 1. Notify the relevant parties
    // 2. Gather evidence
    // 3. Update booking status if necessary
    // 4. Send notifications to admins

    // For now, just log the dispute
    console.log('Dispute details:', {
      id: dispute.id,
      amount: dispute.amount,
      currency: dispute.currency,
      reason: dispute.reason,
      status: dispute.status
    });

  } catch (error) {
    console.error('Error handling charge dispute:', error);
    throw error;
  }
}

/**
 * Handle successful invoice payment (for subscriptions or recurring payments)
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    console.log(`Invoice payment succeeded: ${invoice.id}`);

    // Handle subscription or recurring payment logic here
    // This might be used for premium features, insurance, or recurring rentals

  } catch (error) {
    console.error('Error handling invoice payment succeeded:', error);
    throw error;
  }
}

/**
 * Verify webhook endpoint is working
 */
export const GET: RequestHandler = async () => {
  return json({
    message: 'Stripe webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
};
