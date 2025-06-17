import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminFirestore } from '$firebase/server';
import { BookingStatus, isValidStatusTransition } from '$lib/types/booking-status';
import Stripe from 'stripe';
import { STRIPE_SECRET_KEY } from '$env/static/private';

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

// Approve or deny a booking request
export const POST: RequestHandler = async ({ params, request, locals }) => {
  // Check if user is authenticated
  if (!locals.userId) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { action, reason } = await request.json();
    const bookingId = params.id;
    
    if (!bookingId) {
      return json({ error: 'Booking ID is required' }, { status: 400 });
    }
    
    if (!action || !['approve', 'deny'].includes(action)) {
      return json({ error: 'Valid action (approve/deny) is required' }, { status: 400 });
    }
    
    // Get the booking
    const bookingRef = adminFirestore.collection('bookings').doc(bookingId);
    const bookingDoc = await bookingRef.get();
    
    if (!bookingDoc.exists) {
      return json({ error: 'Booking not found' }, { status: 404 });
    }
    
    const booking = bookingDoc.data();
    
    // Verify the user is the owner of the listing
    if (booking?.ownerUid !== locals.userId) {
      return json({ error: 'Unauthorized - you are not the owner of this listing' }, { status: 403 });
    }
    
    // Check current status
    const currentStatus = booking?.status as BookingStatus;
    if (currentStatus !== BookingStatus.PENDING_OWNER_APPROVAL) {
      return json({ error: 'Booking is not in a state that can be approved or denied' }, { status: 400 });
    }
    
    const now = adminFirestore.Timestamp.now();
    
    if (action === 'approve') {
      // Approve the booking and charge the rental fee
      const newStatus = BookingStatus.CONFIRMED;
      
      if (!isValidStatusTransition(currentStatus, newStatus)) {
        return json({ error: 'Invalid status transition' }, { status: 400 });
      }
      
      try {
        // Charge the rental fee (Stage 2 payment)
        const laterFees = booking.priceBreakdown?.laterFees || 0;
        
        if (laterFees > 0) {
          // Create a new payment intent for the rental fee
          const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(laterFees * 100), // Convert to cents
            currency: 'usd',
            automatic_payment_methods: {
              enabled: true,
            },
            metadata: {
              bookingId,
              paymentStage: 'rental',
              originalUpfrontPayment: booking.upfrontPaymentId || ''
            },
            description: `Rental fee for booking ${bookingId}`
          });
          
          // For now, we'll mark the payment as successful
          // In a real implementation, you'd need to handle the payment flow
          // This might involve sending a payment link to the customer
          
          // Update booking with approval and rental payment info
          await bookingRef.update({
            status: newStatus,
            updatedAt: now,
            approvedAt: now,
            approvedBy: locals.userId,
            rentalPaymentId: paymentIntent.id,
            paymentStage: 'rental',
            approvalReason: reason || 'Booking approved by owner'
          });
          
          return json({ 
            success: true, 
            status: newStatus,
            message: 'Booking approved successfully. Rental fee will be charged.',
            paymentIntentId: paymentIntent.id
          });
        } else {
          // No rental fee to charge (edge case)
          await bookingRef.update({
            status: newStatus,
            updatedAt: now,
            approvedAt: now,
            approvedBy: locals.userId,
            paymentStage: 'complete',
            approvalReason: reason || 'Booking approved by owner'
          });
          
          return json({ 
            success: true, 
            status: newStatus,
            message: 'Booking approved successfully.'
          });
        }
      } catch (stripeError: any) {
        console.error('Stripe error during rental fee charge:', stripeError);
        return json({ 
          error: 'Failed to process rental fee payment',
          details: stripeError.message 
        }, { status: 500 });
      }
      
    } else if (action === 'deny') {
      // Deny the booking and refund the upfront payment
      const newStatus = BookingStatus.DENIED;
      
      if (!isValidStatusTransition(currentStatus, newStatus)) {
        return json({ error: 'Invalid status transition' }, { status: 400 });
      }
      
      try {
        // Refund the upfront payment
        const upfrontPaymentId = booking.upfrontPaymentId;
        
        if (upfrontPaymentId) {
          const refund = await stripe.refunds.create({
            payment_intent: upfrontPaymentId,
            reason: 'requested_by_customer',
            metadata: {
              bookingId,
              reason: reason || 'Booking denied by owner'
            }
          });
          
          // Update booking with denial and refund info
          await bookingRef.update({
            status: newStatus,
            updatedAt: now,
            deniedAt: now,
            deniedBy: locals.userId,
            denialReason: reason || 'Booking denied by owner',
            refundId: refund.id,
            refundStatus: refund.status
          });
          
          return json({ 
            success: true, 
            status: newStatus,
            message: 'Booking denied and payment refunded.',
            refundId: refund.id
          });
        } else {
          // No payment to refund (edge case)
          await bookingRef.update({
            status: newStatus,
            updatedAt: now,
            deniedAt: now,
            deniedBy: locals.userId,
            denialReason: reason || 'Booking denied by owner'
          });
          
          return json({ 
            success: true, 
            status: newStatus,
            message: 'Booking denied.'
          });
        }
      } catch (stripeError: any) {
        console.error('Stripe error during refund:', stripeError);
        return json({ 
          error: 'Failed to process refund',
          details: stripeError.message 
        }, { status: 500 });
      }
    }
    
  } catch (error) {
    console.error('Error processing booking approval/denial:', error);
    return json({ error: 'Failed to process request' }, { status: 500 });
  }
};
