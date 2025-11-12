import type Stripe from 'stripe';
import { adminFirestore } from '$lib/firebase/server';
import { sendBookingEmails, sendPaymentEmails } from './email';

// Stripe integration
let stripe: Stripe | null = null;

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

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  client_secret: string;
}

export interface BookingPayment {
  bookingId: string;
  amount: number;
  currency: string;
  description: string;
  metadata: {
    bookingId: string;
    listingId: string;
    renterId: string;
    ownerId: string;
    paymentType: 'upfront' | 'rental' | 'security_deposit';
  };
}

class PaymentService {
  /**
   * Create a payment intent for booking
   */
  async createBookingPayment(payment: BookingPayment): Promise<PaymentIntent> {
    try {
      const stripeInstance = await getStripe();
      
      const paymentIntent = await stripeInstance.paymentIntents.create({
        amount: Math.round(payment.amount * 100), // Convert to cents
        currency: payment.currency,
        description: payment.description,
        metadata: payment.metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        client_secret: paymentIntent.client_secret!,
      };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw new Error('Failed to create payment intent');
    }
  }

  /**
   * Process successful payment
   */
  async processSuccessfulPayment(paymentIntentId: string, event: any) {
    try {
      const stripeInstance = await getStripe();
      const paymentIntent = await stripeInstance.paymentIntents.retrieve(paymentIntentId);
      
      const { bookingId, paymentType } = paymentIntent.metadata;
      
      if (!bookingId) {
        throw new Error('No booking ID in payment metadata');
      }

      // Update booking in Firestore
      const bookingRef = adminFirestore.collection('bookings').doc(bookingId);
      const bookingDoc = await bookingRef.get();
      
      if (!bookingDoc.exists) {
        throw new Error(`Booking ${bookingId} not found`);
      }

      const booking = bookingDoc.data();
      const updateData: any = {
        updatedAt: new Date(),
      };

      // Handle different payment types
      switch (paymentType) {
        case 'upfront':
          updateData.upfrontPaymentId = paymentIntentId;
          updateData.upfrontPaymentStatus = 'paid';
          updateData.status = 'pending_owner_approval';
          break;
          
        case 'rental':
          updateData.rentalPaymentId = paymentIntentId;
          updateData.rentalPaymentStatus = 'paid';
          updateData.status = 'confirmed';
          break;
          
        case 'security_deposit':
          updateData.securityDepositPaymentId = paymentIntentId;
          updateData.securityDepositStatus = 'held';
          break;
      }

      await bookingRef.update(updateData);

      // Send appropriate emails
      if (paymentType === 'upfront') {
        await this.sendBookingNotificationEmails(bookingId);
      } else if (paymentType === 'rental') {
        await this.sendBookingConfirmationEmails(bookingId);
      }

      console.log(`✅ Payment processed successfully: ${paymentIntentId} for booking ${bookingId}`);
      
    } catch (error) {
      console.error('Error processing successful payment:', error);
      throw error;
    }
  }

  /**
   * Handle failed payment
   */
  async processFailedPayment(paymentIntentId: string) {
    try {
      const stripeInstance = await getStripe();
      const paymentIntent = await stripeInstance.paymentIntents.retrieve(paymentIntentId);
      
      const { bookingId, paymentType } = paymentIntent.metadata;
      
      if (!bookingId) {
        return;
      }

      // Update booking status
      const bookingRef = adminFirestore.collection('bookings').doc(bookingId);
      await bookingRef.update({
        [`${paymentType}PaymentStatus`]: 'failed',
        status: 'payment_failed',
        updatedAt: new Date(),
      });

      console.log(`❌ Payment failed: ${paymentIntentId} for booking ${bookingId}`);
      
    } catch (error) {
      console.error('Error processing failed payment:', error);
    }
  }

  /**
   * Refund payment
   */
  async refundPayment(paymentIntentId: string, amount?: number, reason?: string) {
    try {
      const stripeInstance = await getStripe();
      
      const refund = await stripeInstance.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined,
        reason: reason as any,
      });

      return refund;
    } catch (error) {
      console.error('Error creating refund:', error);
      throw new Error('Failed to process refund');
    }
  }

  /**
   * Release security deposit
   */
  async releaseSecurityDeposit(bookingId: string) {
    try {
      const bookingRef = adminFirestore.collection('bookings').doc(bookingId);
      const bookingDoc = await bookingRef.get();
      
      if (!bookingDoc.exists) {
        throw new Error('Booking not found');
      }

      const booking = bookingDoc.data();
      const securityDepositPaymentId = booking?.securityDepositPaymentId;
      
      if (!securityDepositPaymentId) {
        throw new Error('No security deposit payment found');
      }

      // Refund the security deposit
      await this.refundPayment(securityDepositPaymentId, undefined, 'requested_by_customer');
      
      // Update booking
      await bookingRef.update({
        securityDepositStatus: 'released',
        updatedAt: new Date(),
      });

      console.log(`✅ Security deposit released for booking ${bookingId}`);
      
    } catch (error) {
      console.error('Error releasing security deposit:', error);
      throw error;
    }
  }

  /**
   * Send booking notification emails
   */
  private async sendBookingNotificationEmails(bookingId: string) {
    try {
      await sendBookingEmails(bookingId, 'new_booking');
    } catch (error) {
      console.error('Error sending booking notification emails:', error);
    }
  }

  /**
   * Send booking confirmation emails
   */
  private async sendBookingConfirmationEmails(bookingId: string) {
    try {
      await sendBookingEmails(bookingId, 'booking_confirmed');
    } catch (error) {
      console.error('Error sending booking confirmation emails:', error);
    }
  }

  /**
   * Calculate booking pricing
   */
  calculateBookingPricing(dailyPrice: number, days: number, serviceFeeRate: number = 0.15) {
    const basePrice = dailyPrice * days;
    const serviceFee = Math.round(basePrice * serviceFeeRate * 100) / 100;
    const totalPrice = basePrice + serviceFee;
    
    return {
      basePrice,
      serviceFee,
      totalPrice,
      days
    };
  }
}

export const paymentService = new PaymentService();
