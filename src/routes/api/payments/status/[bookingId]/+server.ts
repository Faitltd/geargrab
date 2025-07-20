/**
 * Payment Status API Endpoint
 * Get payment status for a specific booking
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { bookingsService } from '$lib/services/bookings.service';
import Stripe from 'stripe';
import { STRIPE_SECRET_KEY } from '$env/static/private';

// Initialize Stripe
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

/**
 * GET /api/payments/status/[bookingId]
 * Get payment status for a booking
 */
export const GET: RequestHandler = async ({ params, locals }) => {
  try {
    // Check authentication
    if (!locals.user) {
      throw error(401, {
        message: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    const { bookingId } = params;

    // Get booking details
    const booking = await bookingsService.getBooking(bookingId);
    
    if (!booking) {
      throw error(404, {
        message: 'Booking not found',
        code: 'BOOKING_NOT_FOUND'
      });
    }

    // Check if user has access to this booking
    if (booking.renterId !== locals.user.uid && booking.ownerId !== locals.user.uid) {
      throw error(403, {
        message: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

    // Determine payment status based on booking status
    let paymentStatus: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' = 'pending';
    
    switch (booking.status) {
      case 'pending':
      case 'confirmed':
        paymentStatus = 'pending';
        break;
      case 'paid':
      case 'active':
      case 'completed':
        paymentStatus = 'completed';
        break;
      case 'cancelled':
      case 'declined':
        paymentStatus = 'failed';
        break;
      default:
        paymentStatus = 'pending';
    }

    // If we have a payment ID, get more detailed status from Stripe
    let stripePaymentData: any = null;
    
    if (booking.paymentId) {
      try {
        // Try to retrieve payment intent
        const paymentIntent = await stripe.paymentIntents.retrieve(booking.paymentId);
        
        stripePaymentData = {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount / 100, // Convert from cents
          currency: paymentIntent.currency,
          created: new Date(paymentIntent.created * 1000),
          description: paymentIntent.description
        };

        // Update payment status based on Stripe data
        switch (paymentIntent.status) {
          case 'succeeded':
            paymentStatus = 'completed';
            break;
          case 'processing':
            paymentStatus = 'processing';
            break;
          case 'requires_payment_method':
          case 'requires_confirmation':
          case 'requires_action':
            paymentStatus = 'pending';
            break;
          case 'canceled':
            paymentStatus = 'failed';
            break;
        }

      } catch (stripeError) {
        console.error('Error retrieving payment from Stripe:', stripeError);
        // Continue with booking-based status if Stripe lookup fails
      }
    }

    return json({
      success: true,
      data: {
        bookingId,
        status: paymentStatus,
        amount: booking.pricing.total,
        currency: 'usd',
        paymentIntentId: booking.paymentId,
        bookingStatus: booking.status,
        stripeData: stripePaymentData,
        lastUpdated: booking.updatedAt
      }
    });

  } catch (err: any) {
    console.error('Error getting payment status:', err);
    
    if (err.status) {
      throw err; // Re-throw SvelteKit errors
    }
    
    return json({
      success: false,
      error: {
        message: err.message || 'Failed to get payment status',
        code: 'GET_PAYMENT_STATUS_FAILED'
      }
    }, { status: 500 });
  }
};
