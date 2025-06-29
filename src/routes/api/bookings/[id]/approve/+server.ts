import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminFirestore } from '$firebase/server';
import { BookingStatus, isValidStatusTransition } from '$lib/types/booking-status';
import Stripe from 'stripe';
import { env } from '$env/dynamic/private';
import { sendBookingEmails } from '$lib/services/email';

// Helper function to send approval/denial notification
async function sendApprovalNotification(bookingId: string, bookingData: any, action: 'approved' | 'denied') {
  try {
    // Get renter user data
    const renterDoc = await adminFirestore.collection('users').doc(bookingData.renterUid).get();
    const renterData = renterDoc.data();

    // Get owner user data
    const ownerDoc = await adminFirestore.collection('users').doc(bookingData.ownerUid).get();
    const ownerData = ownerDoc.data();

    if (!renterData?.email) {
      console.warn('Renter email not found for notification');
      return;
    }

    // Get listing data
    const listingDoc = await adminFirestore.collection('listings').doc(bookingData.listingId).get();
    const listing = listingDoc.data();

    // Format dates for email
    const startDate = bookingData.startDate.toDate().toLocaleDateString();
    const endDate = bookingData.endDate.toDate().toLocaleDateString();

    // Prepare email data
    const emailData = {
      bookingId,
      confirmationNumber: bookingId.substring(0, 8).toUpperCase(),
      listingTitle: listing?.title || 'Gear Item',
      listingImage: listing?.images?.[0] || '',
      startDate,
      endDate,
      totalPrice: bookingData.totalPrice || 0,
      renterName: renterData?.displayName || 'Guest',
      renterEmail: renterData.email,
      ownerName: ownerData?.displayName || 'Owner',
      ownerEmail: ownerData?.email || '',
      deliveryMethod: bookingData.deliveryMethod || 'pickup',
      status: action
    };

    // Send appropriate notification email
    if (action === 'approved') {
      // Send booking confirmation email to renter
      await sendBookingEmails(emailData);
    } else {
      // For denied bookings, we'd send a different email template
      console.log('📧 Booking denial notification prepared for:', renterData.email);
    }

    console.log(`✅ ${action} notification sent for booking:`, bookingId);
  } catch (error) {
    console.error(`❌ Failed to send ${action} notification:`, error);
    throw error;
  }
}

// Approve or deny a booking request
export const POST: RequestHandler = async ({ params, request, locals }) => {
  // Check if user is authenticated
  if (!locals.userId) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Initialize Stripe client at runtime
  if (!env.STRIPE_SECRET_KEY) {
    return json({ error: 'Stripe configuration missing' }, { status: 500 });
  }

  const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16'
  });
  
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

          // Send approval notification to renter
          try {
            await sendApprovalNotification(bookingId, booking, 'approved');
          } catch (notificationError) {
            console.error('Failed to send approval notification:', notificationError);
          }

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

          // Send approval notification to renter
          try {
            await sendApprovalNotification(bookingId, booking, 'approved');
          } catch (notificationError) {
            console.error('Failed to send approval notification:', notificationError);
          }

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

          // Send denial notification to renter
          try {
            await sendApprovalNotification(bookingId, booking, 'denied');
          } catch (notificationError) {
            console.error('Failed to send denial notification:', notificationError);
          }

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

          // Send denial notification to renter
          try {
            await sendApprovalNotification(bookingId, booking, 'denied');
          } catch (notificationError) {
            console.error('Failed to send denial notification:', notificationError);
          }

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
