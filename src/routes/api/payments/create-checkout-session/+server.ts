/**
 * Create Stripe Checkout Session API Endpoint
 * Handles creation of Stripe checkout sessions for bookings
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { bookingsService } from '$lib/services/bookings.service';
import { listingsService } from '$lib/services/listings.service';
import Stripe from 'stripe';
import { STRIPE_SECRET_KEY } from '$env/static/private';
import { PUBLIC_APP_URL } from '$env/static/public';
import type { CheckoutSessionRequest } from '$lib/services/stripe.service';

// Initialize Stripe
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

/**
 * POST /api/payments/create-checkout-session
 * Create a Stripe checkout session for a booking
 */
export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Check authentication
    if (!locals.user) {
      throw error(401, {
        message: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    const requestData: CheckoutSessionRequest = await request.json();
    const { bookingId, listingId, mode, pricing, bookingData } = requestData;

    // Validate required fields
    if (!bookingId || !listingId || !mode || !pricing) {
      throw error(400, {
        message: 'Missing required fields',
        code: 'VALIDATION_ERROR'
      });
    }

    // Get booking details
    const booking = await bookingsService.getBooking(bookingId);
    if (!booking) {
      throw error(404, {
        message: 'Booking not found',
        code: 'BOOKING_NOT_FOUND'
      });
    }

    // Verify user is the renter
    if (booking.renterId !== locals.user.uid) {
      throw error(403, {
        message: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

    // Verify booking is in correct status for payment
    if (booking.status !== 'confirmed') {
      throw error(400, {
        message: 'Booking must be confirmed before payment',
        code: 'INVALID_BOOKING_STATUS'
      });
    }

    // Get listing details
    const listing = await listingsService.getListing(listingId);
    if (!listing) {
      throw error(404, {
        message: 'Listing not found',
        code: 'LISTING_NOT_FOUND'
      });
    }

    // Build line items for Stripe
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    // Add each pricing breakdown item
    pricing.breakdown.forEach((item) => {
      if (item.amount > 0) {
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: item.label,
              description: item.description || undefined,
              metadata: {
                bookingId,
                listingId,
                type: item.type
              }
            },
            unit_amount: Math.round(item.amount * 100) // Convert to cents
          },
          quantity: 1
        });
      }
    });

    // Create metadata for the session
    const metadata: Record<string, string> = {
      bookingId,
      listingId,
      mode,
      renterId: booking.renterId,
      ownerId: booking.ownerId,
      totalAmount: (pricing.total * 100).toString(),
      startDate: booking.startDate.toISOString(),
      endDate: booking.endDate.toISOString(),
      totalDays: booking.totalDays.toString()
    };

    if (bookingData) {
      metadata.pickupMethod = bookingData.pickupMethod;
      metadata.insurance = bookingData.insurance.toString();
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${PUBLIC_APP_URL}/bookings/${bookingId}?payment_cancelled=true`,
      customer_email: locals.user.email || undefined,
      billing_address_collection: 'required',
      metadata,
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes from now
      automatic_tax: {
        enabled: true
      },
      payment_intent_data: {
        metadata: {
          ...metadata,
          platform: 'geargrab'
        },
        description: `GearGrab rental: ${listing.title}`,
        statement_descriptor: 'GEARGRAB RENTAL'
      }
    });

    // Update booking with payment session info
    await bookingsService.updateBookingStatus(
      bookingId,
      'confirmed', // Keep as confirmed until payment succeeds
      locals.user.uid,
      `Payment session created: ${session.id}`
    );

    return json({
      success: true,
      data: {
        sessionId: session.id,
        url: session.url,
        expiresAt: session.expires_at
      }
    });

  } catch (err: any) {
    console.error('Error creating checkout session:', err);
    
    if (err.status) {
      throw err; // Re-throw SvelteKit errors
    }
    
    // Handle Stripe errors
    if (err.type === 'StripeError') {
      return json({
        success: false,
        error: {
          message: err.message || 'Payment processing error',
          code: 'STRIPE_ERROR',
          type: err.type
        }
      }, { status: 400 });
    }
    
    return json({
      success: false,
      error: {
        message: err.message || 'Failed to create checkout session',
        code: 'CREATE_SESSION_FAILED'
      }
    }, { status: 500 });
  }
};
