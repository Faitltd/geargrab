/**
 * Verify Payment Session API Endpoint
 * Verifies Stripe checkout session and returns payment status
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import Stripe from 'stripe';

// Mock Stripe for demo deployment
const stripe = {
  checkout: {
    sessions: {
      retrieve: async (sessionId: string) => {
        // Return a mock session for demo
        return {
          id: sessionId,
          payment_status: 'paid',
          status: 'complete',
          customer_details: {
            email: 'demo@geargrab.co',
            name: 'Demo User'
          },
          metadata: {
            bookingId: 'demo-booking-123'
          }
        };
      }
    }
  }
};

/**
 * GET /api/payments/verify-session?session_id=xxx
 * Verify a Stripe checkout session
 */
export const GET: RequestHandler = async ({ url, locals }) => {
  try {
    // Check authentication
    if (!locals.user) {
      throw error(401, {
        message: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    const sessionId = url.searchParams.get('session_id');
    
    if (!sessionId) {
      throw error(400, {
        message: 'Session ID is required',
        code: 'VALIDATION_ERROR'
      });
    }

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent', 'customer']
    });

    // Verify the session belongs to the authenticated user
    const bookingId = session.metadata?.bookingId;
    const renterId = session.metadata?.renterId;

    if (renterId !== locals.user.uid) {
      throw error(403, {
        message: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

    // Determine payment status
    let paymentStatus = 'pending';
    let paymentIntentId: string | undefined;

    if (session.payment_status === 'paid') {
      paymentStatus = 'completed';
    } else if (session.payment_status === 'unpaid') {
      paymentStatus = 'pending';
    } else if (session.payment_status === 'no_payment_required') {
      paymentStatus = 'completed';
    }

    // Get payment intent details if available
    if (session.payment_intent) {
      if (typeof session.payment_intent === 'string') {
        paymentIntentId = session.payment_intent;
      } else {
        paymentIntentId = session.payment_intent.id;
        
        // More detailed status from payment intent
        switch (session.payment_intent.status) {
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
          default:
            paymentStatus = 'pending';
        }
      }
    }

    return json({
      success: true,
      data: {
        sessionId: session.id,
        bookingId,
        paymentStatus,
        paymentIntentId,
        amount: session.amount_total ? session.amount_total / 100 : 0,
        currency: session.currency || 'usd',
        customerEmail: session.customer_email,
        status: session.status,
        expiresAt: session.expires_at,
        metadata: session.metadata
      }
    });

  } catch (err: any) {
    console.error('Error verifying payment session:', err);
    
    if (err.status) {
      throw err; // Re-throw SvelteKit errors
    }
    
    // Handle Stripe errors
    if (err.type === 'StripeError') {
      return json({
        success: false,
        error: {
          message: err.message || 'Failed to verify payment session',
          code: 'STRIPE_ERROR',
          type: err.type
        }
      }, { status: 400 });
    }
    
    return json({
      success: false,
      error: {
        message: err.message || 'Failed to verify payment session',
        code: 'VERIFY_SESSION_FAILED'
      }
    }, { status: 500 });
  }
};
