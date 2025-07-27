/**
 * Webhook Routes
 * Handle Stripe webhooks for payment events
 */

const express = require('express');
const { query, transaction } = require('../config/database');
const { asyncHandler, APIError } = require('../middleware/errorHandler');
const { verifyWebhookSignature } = require('../config/stripe');

const router = express.Router();

// Raw body parser for webhook signature verification
router.use('/stripe', express.raw({ type: 'application/json' }));

/**
 * POST /api/webhooks/stripe
 * Handle Stripe webhook events
 */
router.post('/stripe',
  asyncHandler(async (req, res) => {
    const signature = req.headers['stripe-signature'];
    
    if (!signature) {
      throw new APIError('Missing Stripe signature', 400);
    }
    
    try {
      // Verify webhook signature
      const event = verifyWebhookSignature(req.body, signature);
      
      console.log(`Received Stripe webhook: ${event.type}`);
      
      // Handle different event types
      switch (event.type) {
        case 'payment_intent.succeeded':
          await handlePaymentIntentSucceeded(event.data.object);
          break;
          
        case 'payment_intent.payment_failed':
          await handlePaymentIntentFailed(event.data.object);
          break;
          
        case 'account.updated':
          await handleAccountUpdated(event.data.object);
          break;
          
        case 'transfer.created':
          await handleTransferCreated(event.data.object);
          break;
          
        case 'payout.paid':
          await handlePayoutPaid(event.data.object);
          break;
          
        case 'invoice.payment_succeeded':
          await handleInvoicePaymentSucceeded(event.data.object);
          break;
          
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
      
      res.json({ received: true });
      
    } catch (error) {
      console.error('Webhook processing error:', error);
      throw new APIError('Webhook processing failed', 400);
    }
  })
);

/**
 * Handle successful payment intent
 */
async function handlePaymentIntentSucceeded(paymentIntent) {
  await transaction(async (client) => {
    // Update payment intent status
    await client.query(
      'UPDATE payment_intents SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE stripe_payment_intent_id = $2',
      ['succeeded', paymentIntent.id]
    );
    
    // Get rental ID from metadata
    const rentalId = paymentIntent.metadata.rental_id;
    if (rentalId) {
      // Update rental status if not already confirmed
      const rentalResult = await client.query(
        'SELECT status FROM rentals WHERE id = $1',
        [rentalId]
      );
      
      if (rentalResult.rows.length > 0 && rentalResult.rows[0].status === 'pending') {
        await client.query(
          'UPDATE rentals SET status = $1, confirmed_at = CURRENT_TIMESTAMP WHERE id = $2',
          ['confirmed', rentalId]
        );
        
        // TODO: Send confirmation email to both parties
        console.log(`Rental ${rentalId} confirmed via webhook`);
      }
    }
  });
}

/**
 * Handle failed payment intent
 */
async function handlePaymentIntentFailed(paymentIntent) {
  await transaction(async (client) => {
    // Update payment intent status
    await client.query(
      'UPDATE payment_intents SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE stripe_payment_intent_id = $2',
      ['payment_failed', paymentIntent.id]
    );
    
    // Get rental ID from metadata
    const rentalId = paymentIntent.metadata.rental_id;
    if (rentalId) {
      // Keep rental in pending status but log the failure
      console.log(`Payment failed for rental ${rentalId}: ${paymentIntent.last_payment_error?.message}`);
      
      // TODO: Send payment failure notification to renter
    }
  });
}

/**
 * Handle Connect account updates
 */
async function handleAccountUpdated(account) {
  try {
    // Update user's Connect account status
    await query(`
      UPDATE users 
      SET updated_at = CURRENT_TIMESTAMP
      WHERE stripe_connect_account_id = $1
    `, [account.id]);
    
    console.log(`Connect account ${account.id} updated - charges_enabled: ${account.charges_enabled}, payouts_enabled: ${account.payouts_enabled}`);
    
    // TODO: Notify user if account is now fully enabled
    
  } catch (error) {
    console.error('Error handling account update:', error);
  }
}

/**
 * Handle transfer creation (when funds are sent to Connect account)
 */
async function handleTransferCreated(transfer) {
  try {
    console.log(`Transfer created: ${transfer.id} for ${transfer.amount / 100} ${transfer.currency.toUpperCase()}`);
    
    // TODO: Log transfer for accounting purposes
    
  } catch (error) {
    console.error('Error handling transfer creation:', error);
  }
}

/**
 * Handle payout completion (when Connect account receives funds)
 */
async function handlePayoutPaid(payout) {
  try {
    console.log(`Payout completed: ${payout.id} for ${payout.amount / 100} ${payout.currency.toUpperCase()}`);
    
    // TODO: Update payout records if tracking individual payouts
    
  } catch (error) {
    console.error('Error handling payout:', error);
  }
}

/**
 * Handle invoice payment (for subscription billing if implemented)
 */
async function handleInvoicePaymentSucceeded(invoice) {
  try {
    console.log(`Invoice payment succeeded: ${invoice.id}`);
    
    // TODO: Handle subscription or recurring billing
    
  } catch (error) {
    console.error('Error handling invoice payment:', error);
  }
}

/**
 * GET /api/webhooks/test
 * Test endpoint for webhook functionality
 */
router.get('/test',
  asyncHandler(async (req, res) => {
    res.json({
      message: 'Webhook endpoint is working',
      timestamp: new Date().toISOString()
    });
  })
);

module.exports = router;
