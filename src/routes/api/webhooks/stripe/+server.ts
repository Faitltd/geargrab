import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminFirestore } from '$lib/firebase/server';
import { sendBookingEmails, sendPaymentEmails } from '$lib/services/email';
import crypto from 'crypto';

// Stripe integration
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

// Stripe webhook handler
export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return json({ error: 'Missing Stripe signature' }, { status: 400 });
    }

    // Verify webhook signature
    const stripeInstance = await getStripe();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not configured');
      return json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    let event;
    try {
      event = stripeInstance.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      
      case 'payment_intent.canceled':
        await handlePaymentCanceled(event.data.object);
        break;
      
      case 'payment_intent.requires_action':
        await handlePaymentRequiresAction(event.data.object);
        break;
      
      case 'charge.dispute.created':
        await handleDisputeCreated(event.data.object);
        break;
      
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await handleSubscriptionChange(event.data.object, event.type);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return json({ received: true });

  } catch (error) {
    console.error('Stripe webhook error:', error);
    return json({ error: 'Webhook processing failed' }, { status: 500 });
  }
};

// Handle successful payment
async function handlePaymentSucceeded(paymentIntent: any): Promise<void> {
  try {
    const { id, amount, metadata } = paymentIntent;
    
    console.log(`Payment succeeded: ${id}, Amount: ${amount / 100}`);

    // Update payment status in database
    await updatePaymentStatus(id, 'succeeded', {
      amount: amount / 100,
      currency: paymentIntent.currency,
      paymentMethod: paymentIntent.payment_method
    });

    // Handle different service types based on metadata
    if (metadata.service === 'booking') {
      await handleBookingPayment(metadata, paymentIntent);
    } else if (metadata.service === 'background_check') {
      await handleBackgroundCheckPayment(metadata, paymentIntent);
    } else if (metadata.service === 'verification') {
      await handleVerificationPayment(metadata, paymentIntent);
    }

    // Send confirmation emails
    await sendPaymentConfirmationEmail(metadata.userId, paymentIntent);

  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

// Handle failed payment
async function handlePaymentFailed(paymentIntent: any): Promise<void> {
  try {
    const { id, last_payment_error, metadata } = paymentIntent;
    
    console.log(`Payment failed: ${id}, Error: ${last_payment_error?.message}`);

    // Update payment status
    await updatePaymentStatus(id, 'failed', {
      error: last_payment_error?.message,
      errorCode: last_payment_error?.code
    });

    // Handle booking failure
    if (metadata.service === 'booking' && metadata.bookingId) {
      await updateBookingStatus(metadata.bookingId, 'payment_failed');
    }

    // Send failure notification
    await sendPaymentFailureEmail(metadata.userId, paymentIntent);

  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

// Handle canceled payment
async function handlePaymentCanceled(paymentIntent: any): Promise<void> {
  try {
    const { id, metadata } = paymentIntent;
    
    console.log(`Payment canceled: ${id}`);

    await updatePaymentStatus(id, 'canceled');

    // Handle booking cancellation
    if (metadata.service === 'booking' && metadata.bookingId) {
      await updateBookingStatus(metadata.bookingId, 'canceled');
    }

  } catch (error) {
    console.error('Error handling payment cancellation:', error);
  }
}

// Handle payment requiring action
async function handlePaymentRequiresAction(paymentIntent: any): Promise<void> {
  try {
    const { id, metadata } = paymentIntent;
    
    console.log(`Payment requires action: ${id}`);

    await updatePaymentStatus(id, 'requires_action');

    // Notify user that action is required
    await sendPaymentActionRequiredEmail(metadata.userId, paymentIntent);

  } catch (error) {
    console.error('Error handling payment action required:', error);
  }
}

// Handle dispute created
async function handleDisputeCreated(charge: any): Promise<void> {
  try {
    const { id, amount, payment_intent } = charge;
    
    console.log(`Dispute created for charge: ${id}, Amount: ${amount / 100}`);

    // Create dispute record
    await adminFirestore.collection('disputes').add({
      chargeId: id,
      paymentIntentId: payment_intent,
      amount: amount / 100,
      status: 'created',
      createdAt: new Date(),
      reason: charge.dispute?.reason,
      evidence: {}
    });

    // Notify admin team
    await sendDisputeNotificationEmail(charge);

  } catch (error) {
    console.error('Error handling dispute creation:', error);
  }
}

// Handle invoice payment succeeded
async function handleInvoicePaymentSucceeded(invoice: any): Promise<void> {
  try {
    console.log(`Invoice payment succeeded: ${invoice.id}`);
    
    // Handle subscription or recurring payment logic here
    
  } catch (error) {
    console.error('Error handling invoice payment:', error);
  }
}

// Handle subscription changes
async function handleSubscriptionChange(subscription: any, eventType: string): Promise<void> {
  try {
    console.log(`Subscription ${eventType}: ${subscription.id}`);
    
    // Handle subscription logic here if needed for premium features
    
  } catch (error) {
    console.error('Error handling subscription change:', error);
  }
}

// Helper functions
async function updatePaymentStatus(paymentIntentId: string, status: string, additionalData: any = {}): Promise<void> {
  try {
    const paymentRef = adminFirestore.collection('payments').doc(paymentIntentId);
    
    await paymentRef.set({
      status,
      updatedAt: new Date(),
      ...additionalData
    }, { merge: true });

  } catch (error) {
    console.error('Error updating payment status:', error);
  }
}

async function updateBookingStatus(bookingId: string, status: string): Promise<void> {
  try {
    const bookingRef = adminFirestore.collection('bookings').doc(bookingId);
    
    await bookingRef.update({
      status,
      updatedAt: new Date()
    });

  } catch (error) {
    console.error('Error updating booking status:', error);
  }
}

async function handleBookingPayment(metadata: any, paymentIntent: any): Promise<void> {
  try {
    if (metadata.bookingId) {
      // Update booking to confirmed
      await updateBookingStatus(metadata.bookingId, 'confirmed');
      
      // Send booking confirmation emails
      const bookingDoc = await adminFirestore.collection('bookings').doc(metadata.bookingId).get();
      if (bookingDoc.exists) {
        const bookingData = bookingDoc.data();
        await sendBookingEmails.sendBookingConfirmation(bookingData);
      }
    }
  } catch (error) {
    console.error('Error handling booking payment:', error);
  }
}

async function handleBackgroundCheckPayment(metadata: any, paymentIntent: any): Promise<void> {
  try {
    if (metadata.userId && metadata.checkType) {
      // Update verification request status
      const verificationRef = adminFirestore.collection('verificationRequests');
      const query = verificationRef
        .where('userId', '==', metadata.userId)
        .where('type', '==', 'background_check')
        .where('status', '==', 'payment_pending');
      
      const snapshot = await query.get();
      
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        await doc.ref.update({
          status: 'payment_completed',
          paymentIntentId: paymentIntent.id,
          updatedAt: new Date()
        });
      }
    }
  } catch (error) {
    console.error('Error handling background check payment:', error);
  }
}

async function handleVerificationPayment(metadata: any, paymentIntent: any): Promise<void> {
  try {
    // Handle other verification payments
    console.log('Verification payment processed:', metadata);
  } catch (error) {
    console.error('Error handling verification payment:', error);
  }
}

// Email notification functions (simplified - would use actual email service)
async function sendPaymentConfirmationEmail(userId: string, paymentIntent: any): Promise<void> {
  try {
    console.log(`Sending payment confirmation email to user: ${userId}`);
    // Implementation would use the email service
  } catch (error) {
    console.error('Error sending payment confirmation email:', error);
  }
}

async function sendPaymentFailureEmail(userId: string, paymentIntent: any): Promise<void> {
  try {
    console.log(`Sending payment failure email to user: ${userId}`);
    // Implementation would use the email service
  } catch (error) {
    console.error('Error sending payment failure email:', error);
  }
}

async function sendPaymentActionRequiredEmail(userId: string, paymentIntent: any): Promise<void> {
  try {
    console.log(`Sending payment action required email to user: ${userId}`);
    // Implementation would use the email service
  } catch (error) {
    console.error('Error sending payment action required email:', error);
  }
}

async function sendDisputeNotificationEmail(charge: any): Promise<void> {
  try {
    console.log(`Sending dispute notification email for charge: ${charge.id}`);
    // Implementation would notify admin team
  } catch (error) {
    console.error('Error sending dispute notification email:', error);
  }
}
