/**
 * Payment Routes
 * Handle rental payments, escrow, and transaction processing
 */

const express = require('express');
const { query, transaction, queryBuilders } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler, APIError, NotFoundError, ForbiddenError } = require('../middleware/errorHandler');
const {
  stripe,
  createPaymentIntent,
  createOrGetCustomer,
  processRefund,
  calculateFees,
  canAcceptPayments
} = require('../config/stripe');

const router = express.Router();

/**
 * POST /api/payments/create-payment-intent
 * Create payment intent for rental booking
 */
router.post('/create-payment-intent',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { rental_id } = req.body;
    const renterId = req.user.id;
    
    if (!rental_id) {
      throw new APIError('Rental ID is required', 400);
    }
    
    await transaction(async (client) => {
      // Get rental details
      const rentalResult = await client.query(`
        SELECT r.*, gi.title as gear_title, gi.daily_price,
               owner.stripe_connect_account_id, owner.email as owner_email,
               renter.stripe_customer_id, renter.email as renter_email
        FROM rentals r
        JOIN gear_items gi ON r.gear_item_id = gi.id
        JOIN users owner ON r.owner_id = owner.id
        JOIN users renter ON r.renter_id = renter.id
        WHERE r.id = $1
      `, [rental_id]);
      
      if (rentalResult.rows.length === 0) {
        throw new NotFoundError('Rental not found');
      }
      
      const rental = rentalResult.rows[0];
      
      // Verify user is the renter
      if (rental.renter_id !== renterId) {
        throw new ForbiddenError('You can only pay for your own rentals');
      }
      
      // Check rental status
      if (rental.status !== 'pending') {
        throw new APIError('Rental is not in pending status', 400);
      }
      
      // Check if owner can accept payments
      if (!rental.stripe_connect_account_id) {
        throw new APIError('Gear owner has not set up payments', 400);
      }
      
      const ownerCanAcceptPayments = await canAcceptPayments(rental.stripe_connect_account_id);
      if (!ownerCanAcceptPayments) {
        throw new APIError('Gear owner cannot accept payments yet', 400);
      }
      
      // Create or get Stripe customer for renter
      let customerId = rental.stripe_customer_id;
      if (!customerId) {
        const customer = await createOrGetCustomer(rental.renter_email, {
          first_name: req.user.first_name,
          last_name: req.user.last_name,
          phone_number: req.user.phone_number,
          user_id: renterId
        });
        
        customerId = customer.id;
        
        // Update user with customer ID
        await client.query(
          'UPDATE users SET stripe_customer_id = $1 WHERE id = $2',
          [customerId, renterId]
        );
      }
      
      // Calculate total amount in cents
      const totalAmountCents = Math.round(rental.total_amount * 100);
      
      // Create payment intent
      const paymentIntent = await createPaymentIntent(
        totalAmountCents,
        rental.stripe_connect_account_id,
        {
          rental_id: rental_id,
          gear_title: rental.gear_title,
          renter_id: renterId,
          owner_id: rental.owner_id,
          start_date: rental.start_date,
          end_date: rental.end_date
        }
      );
      
      // Store payment intent in database
      await client.query(`
        INSERT INTO payment_intents (
          id, rental_id, stripe_payment_intent_id, amount, status, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        paymentIntent.id,
        rental_id,
        paymentIntent.id,
        totalAmountCents,
        paymentIntent.status,
        renterId
      ]);
      
      return {
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
        amount: totalAmountCents,
        currency: paymentIntent.currency,
        fees: calculateFees(totalAmountCents)
      };
    });
    
    res.json(result);
  })
);

/**
 * POST /api/payments/confirm-payment
 * Confirm payment and update rental status
 */
router.post('/confirm-payment',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { payment_intent_id } = req.body;
    const userId = req.user.id;
    
    if (!payment_intent_id) {
      throw new APIError('Payment intent ID is required', 400);
    }
    
    await transaction(async (client) => {
      // Get payment intent from database
      const paymentResult = await client.query(
        'SELECT * FROM payment_intents WHERE stripe_payment_intent_id = $1',
        [payment_intent_id]
      );
      
      if (paymentResult.rows.length === 0) {
        throw new NotFoundError('Payment intent not found');
      }
      
      const paymentRecord = paymentResult.rows[0];
      
      // Get payment intent from Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);
      
      if (paymentIntent.status !== 'succeeded') {
        throw new APIError('Payment has not succeeded', 400);
      }
      
      // Get rental details
      const rentalResult = await client.query(
        'SELECT * FROM rentals WHERE id = $1',
        [paymentRecord.rental_id]
      );
      
      const rental = rentalResult.rows[0];
      
      // Verify user is the renter
      if (rental.renter_id !== userId) {
        throw new ForbiddenError('You can only confirm your own payments');
      }
      
      // Update payment intent status
      await client.query(
        'UPDATE payment_intents SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [paymentIntent.status, paymentRecord.id]
      );
      
      // Update rental status to confirmed
      await client.query(
        'UPDATE rentals SET status = $1, confirmed_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['confirmed', rental.id]
      );
      
      // Create transaction record for tax compliance
      const fees = calculateFees(paymentRecord.amount);
      
      await client.query(`
        INSERT INTO transaction_records (
          rental_id, payment_processor, payment_processor_transaction_id,
          payment_method_type, payment_status, base_amount, platform_fee_amount,
          payment_processing_fee, total_amount, owner_payout_amount,
          platform_revenue, payer_user_id, payee_user_id, transaction_date,
          tax_year, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      `, [
        rental.id,
        'stripe',
        payment_intent_id,
        'card',
        'completed',
        rental.subtotal * 100, // Convert to cents
        fees.platformFee,
        fees.stripeFee,
        paymentRecord.amount,
        fees.ownerAmount,
        fees.platformFee,
        rental.renter_id,
        rental.owner_id,
        new Date(),
        new Date().getFullYear(),
        userId
      ]);
      
      return {
        rental_id: rental.id,
        payment_status: 'succeeded',
        rental_status: 'confirmed'
      };
    });
    
    res.json(result);
  })
);

/**
 * GET /api/payments/rental/:rental_id
 * Get payment status for a rental
 */
router.get('/rental/:rental_id',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { rental_id } = req.params;
    const userId = req.user.id;
    
    // Get rental and payment details
    const result = await query(`
      SELECT r.*, pi.stripe_payment_intent_id, pi.status as payment_status,
             tr.payment_status as transaction_status, tr.total_amount as transaction_amount
      FROM rentals r
      LEFT JOIN payment_intents pi ON r.id = pi.rental_id
      LEFT JOIN transaction_records tr ON r.id = tr.rental_id
      WHERE r.id = $1 AND (r.renter_id = $2 OR r.owner_id = $2)
    `, [rental_id, userId]);
    
    if (result.rows.length === 0) {
      throw new NotFoundError('Rental not found or access denied');
    }
    
    const rental = result.rows[0];
    
    res.json({
      rental_id: rental.id,
      rental_status: rental.status,
      payment_intent_id: rental.stripe_payment_intent_id,
      payment_status: rental.payment_status,
      transaction_status: rental.transaction_status,
      total_amount: rental.total_amount,
      transaction_amount: rental.transaction_amount ? rental.transaction_amount / 100 : null, // Convert from cents
      confirmed_at: rental.confirmed_at,
      created_at: rental.created_at
    });
  })
);

/**
 * POST /api/payments/refund
 * Process refund for a rental
 */
router.post('/refund',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { rental_id, reason = 'requested_by_customer', amount = null } = req.body;
    const userId = req.user.id;
    
    if (!rental_id) {
      throw new APIError('Rental ID is required', 400);
    }
    
    await transaction(async (client) => {
      // Get rental and payment details
      const rentalResult = await client.query(`
        SELECT r.*, pi.stripe_payment_intent_id, tr.id as transaction_id
        FROM rentals r
        JOIN payment_intents pi ON r.id = pi.rental_id
        LEFT JOIN transaction_records tr ON r.id = tr.rental_id
        WHERE r.id = $1 AND (r.renter_id = $2 OR r.owner_id = $2)
      `, [rental_id, userId]);
      
      if (rentalResult.rows.length === 0) {
        throw new NotFoundError('Rental not found or access denied');
      }
      
      const rental = rentalResult.rows[0];
      
      if (!rental.stripe_payment_intent_id) {
        throw new APIError('No payment found for this rental', 400);
      }
      
      // Check if refund is allowed
      if (!['confirmed', 'active', 'completed'].includes(rental.status)) {
        throw new APIError('Refund not allowed for this rental status', 400);
      }
      
      // Process refund with Stripe
      const refundAmountCents = amount ? Math.round(amount * 100) : null;
      const refund = await processRefund(rental.stripe_payment_intent_id, refundAmountCents, reason);
      
      // Update rental status
      await client.query(
        'UPDATE rentals SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['cancelled', rental_id]
      );
      
      // Create refund adjustment record
      if (rental.transaction_id) {
        await client.query(`
          INSERT INTO refund_adjustments (
            original_transaction_id, adjustment_type, adjustment_amount,
            reason, affects_tax_reporting, tax_year_impact, created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          rental.transaction_id,
          'refund',
          refund.amount,
          reason,
          true,
          new Date().getFullYear(),
          userId
        ]);
      }
      
      return {
        refund_id: refund.id,
        amount_refunded: refund.amount / 100, // Convert from cents
        status: refund.status,
        reason: refund.reason
      };
    });
    
    res.json(result);
  })
);

module.exports = router;
