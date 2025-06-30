// Stripe webhook endpoint for processing payment events
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import Stripe from 'stripe';
import { env } from '$env/dynamic/private';
import { adminFirestore } from '$lib/firebase/admin';
import admin from 'firebase-admin';

// Use admin.firestore.FieldValue.serverTimestamp() instead of direct import
const serverTimestamp = admin.firestore.FieldValue.serverTimestamp;

export const POST: RequestHandler = async ({ request }) => {
  const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20'
  });
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('Missing Stripe signature');
      return json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log('Received Stripe webhook:', event.type);

    // Store webhook event
    await adminFirestore.collection('stripeWebhookEvents').doc(event.id).set({
      id: event.id,
      type: event.type,
      data: event.data,
      processed: false,
      createdAt: serverTimestamp(),
      processedAt: null
    });

    // Process the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.dispute.created':
        await handleChargeDispute(event.data.object as Stripe.Dispute);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Mark event as processed
    await adminFirestore.collection('stripeWebhookEvents').doc(event.id).update({
      processed: true,
      processedAt: serverTimestamp()
    });

    return json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return json({ error: 'Webhook processing failed' }, { status: 500 });
  }
};

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    const bookingId = paymentIntent.metadata?.bookingId;
    
    if (!bookingId) {
      console.error('No booking ID in payment intent metadata');
      return;
    }

    // Update booking status
    const bookingRef = adminFirestore.collection('bookings').doc(bookingId);
    const bookingDoc = await bookingRef.get();

    if (!bookingDoc.exists) {
      console.error('Booking not found:', bookingId);
      return;
    }

    const booking = bookingDoc.data();

    // Update booking with payment confirmation
    await bookingRef.update({
      status: 'confirmed',
      'payment.status': 'completed',
      'payment.stripePaymentIntentId': paymentIntent.id,
      'payment.processedAt': serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Store payment intent details
    await adminFirestore.collection('stripePaymentIntents').doc(paymentIntent.id).set({
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      bookingId: bookingId,
      customerId: booking?.renterUid,
      merchantId: booking?.ownerUid,
      createdAt: serverTimestamp(),
      metadata: paymentIntent.metadata
    });

    // Create payout record for owner
    if (booking?.ownerUid && booking?.totalPrice) {
      const amount = booking.totalPrice;
      const stripeFee = Math.round(amount * 0.029 + 30);
      const platformFee = Math.round(amount * 0.15);
      const ownerPayout = amount - stripeFee - platformFee;

      await adminFirestore.collection('payouts').add({
        ownerId: booking.ownerUid,
        bookingId: bookingId,
        amount: ownerPayout,
        currency: 'usd',
        status: 'pending',
        type: 'booking_payout',
        scheduledFor: serverTimestamp(),
        createdAt: serverTimestamp(),
        fees: {
          stripeFee,
          platformFee
        }
      });
    }

    // Send confirmation notifications
    await sendBookingConfirmationNotifications(bookingId, booking);

    console.log('Payment intent succeeded processed:', paymentIntent.id);

  } catch (error) {
    console.error('Error handling payment intent succeeded:', error);
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    const bookingId = paymentIntent.metadata?.bookingId;
    
    if (!bookingId) {
      console.error('No booking ID in payment intent metadata');
      return;
    }

    // Update booking status
    await adminFirestore.collection('bookings').doc(bookingId).update({
      status: 'payment_failed',
      'payment.status': 'failed',
      'payment.stripePaymentIntentId': paymentIntent.id,
      'payment.failureReason': paymentIntent.last_payment_error?.message || 'Payment failed',
      updatedAt: serverTimestamp()
    });

    console.log('Payment intent failed processed:', paymentIntent.id);

  } catch (error) {
    console.error('Error handling payment intent failed:', error);
  }
}

async function handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent) {
  try {
    const bookingId = paymentIntent.metadata?.bookingId;
    
    if (!bookingId) {
      console.error('No booking ID in payment intent metadata');
      return;
    }

    // Update booking status
    await adminFirestore.collection('bookings').doc(bookingId).update({
      status: 'cancelled',
      'payment.status': 'cancelled',
      'payment.stripePaymentIntentId': paymentIntent.id,
      updatedAt: serverTimestamp()
    });

    console.log('Payment intent canceled processed:', paymentIntent.id);

  } catch (error) {
    console.error('Error handling payment intent canceled:', error);
  }
}

async function handleChargeDispute(dispute: Stripe.Dispute) {
  try {
    // Create dispute record
    await adminFirestore.collection('disputes').add({
      stripeDisputeId: dispute.id,
      chargeId: dispute.charge,
      amount: dispute.amount,
      currency: dispute.currency,
      reason: dispute.reason,
      status: dispute.status,
      evidence: dispute.evidence,
      createdAt: serverTimestamp()
    });

    // Notify admin
    await adminFirestore.collection('adminNotifications').add({
      type: 'dispute_created',
      title: 'New Charge Dispute',
      message: `A dispute has been created for charge ${dispute.charge}`,
      data: {
        disputeId: dispute.id,
        amount: dispute.amount,
        reason: dispute.reason
      },
      priority: 'high',
      createdAt: serverTimestamp()
    });

    console.log('Charge dispute processed:', dispute.id);

  } catch (error) {
    console.error('Error handling charge dispute:', error);
  }
}

async function sendBookingConfirmationNotifications(bookingId: string, booking: any) {
  try {
    // Send notification to renter
    if (booking?.renterUid) {
      await adminFirestore.collection('notificationHistory').add({
        userId: booking.renterUid,
        type: 'booking_confirmed',
        title: 'Booking Confirmed!',
        message: 'Your payment has been processed and your booking is confirmed.',
        channels: ['push', 'email'],
        status: 'pending',
        data: {
          bookingId: bookingId,
          listingId: booking.listingId
        },
        createdAt: serverTimestamp()
      });
    }

    // Send notification to owner
    if (booking?.ownerUid) {
      await adminFirestore.collection('notificationHistory').add({
        userId: booking.ownerUid,
        type: 'booking_received',
        title: 'New Booking Received',
        message: 'You have received a new booking with confirmed payment.',
        channels: ['push', 'email'],
        status: 'pending',
        data: {
          bookingId: bookingId,
          listingId: booking.listingId
        },
        createdAt: serverTimestamp()
      });
    }

  } catch (error) {
    console.error('Error sending booking confirmation notifications:', error);
  }
}
