/**
 * Stripe Connect Routes
 * Handle Stripe Connect account creation and management
 */

const express = require('express');
const { query, transaction } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler, APIError, NotFoundError } = require('../middleware/errorHandler');
const {
  stripe,
  createConnectAccount,
  createAccountLink,
  getConnectAccount,
  canAcceptPayments,
  createOrGetCustomer,
  calculateFees
} = require('../config/stripe');

const router = express.Router();

/**
 * POST /api/stripe-connect/create-account
 * Create Stripe Connect account for user
 */
router.post('/create-account',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    
    // Check if user already has a Stripe Connect account
    const existingAccount = await query(
      'SELECT stripe_connect_account_id FROM users WHERE id = $1',
      [userId]
    );
    
    if (existingAccount.rows[0]?.stripe_connect_account_id) {
      return res.status(400).json({
        error: 'User already has a Stripe Connect account',
        account_id: existingAccount.rows[0].stripe_connect_account_id
      });
    }
    
    try {
      // Get user details
      const userResult = await query(
        'SELECT email, first_name, last_name, phone_number FROM users WHERE id = $1',
        [userId]
      );
      
      if (userResult.rows.length === 0) {
        throw new NotFoundError('User not found');
      }
      
      const user = userResult.rows[0];
      
      // Create Stripe Connect account
      const account = await createConnectAccount(user.email, {
        first_name: user.first_name,
        last_name: user.last_name,
        phone_number: user.phone_number
      });
      
      // Create Stripe customer for this user
      const customer = await createOrGetCustomer(user.email, {
        first_name: user.first_name,
        last_name: user.last_name,
        phone_number: user.phone_number,
        user_id: userId
      });
      
      // Update user with Stripe account IDs
      await query(`
        UPDATE users 
        SET stripe_connect_account_id = $1, stripe_customer_id = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `, [account.id, customer.id, userId]);
      
      // Create account link for onboarding
      const accountLink = await createAccountLink(account.id);
      
      res.json({
        message: 'Stripe Connect account created successfully',
        account_id: account.id,
        customer_id: customer.id,
        onboarding_url: accountLink.url
      });
      
    } catch (error) {
      console.error('Stripe Connect account creation error:', error);
      throw new APIError('Failed to create Stripe Connect account', 500);
    }
  })
);

/**
 * POST /api/stripe-connect/create-account-link
 * Create new account link for existing account
 */
router.post('/create-account-link',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { type = 'account_onboarding' } = req.body;
    
    // Get user's Stripe Connect account ID
    const userResult = await query(
      'SELECT stripe_connect_account_id FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      throw new NotFoundError('User not found');
    }
    
    const stripeAccountId = userResult.rows[0].stripe_connect_account_id;
    
    if (!stripeAccountId) {
      throw new APIError('User does not have a Stripe Connect account', 400);
    }
    
    try {
      // Create account link
      const accountLink = await createAccountLink(stripeAccountId, type);
      
      res.json({
        onboarding_url: accountLink.url,
        expires_at: accountLink.expires_at
      });
      
    } catch (error) {
      console.error('Account link creation error:', error);
      throw new APIError('Failed to create account link', 500);
    }
  })
);

/**
 * GET /api/stripe-connect/account-status
 * Get Stripe Connect account status
 */
router.get('/account-status',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    
    // Get user's Stripe Connect account ID
    const userResult = await query(
      'SELECT stripe_connect_account_id, stripe_customer_id FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      throw new NotFoundError('User not found');
    }
    
    const { stripe_connect_account_id, stripe_customer_id } = userResult.rows[0];
    
    if (!stripe_connect_account_id) {
      return res.json({
        has_account: false,
        can_accept_payments: false,
        onboarding_completed: false
      });
    }
    
    try {
      // Get account details from Stripe
      const account = await getConnectAccount(stripe_connect_account_id);
      const canAccept = await canAcceptPayments(stripe_connect_account_id);
      
      res.json({
        has_account: true,
        account_id: stripe_connect_account_id,
        customer_id: stripe_customer_id,
        can_accept_payments: canAccept,
        onboarding_completed: account.details_submitted,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        requirements: account.requirements,
        business_profile: account.business_profile,
        individual: account.individual ? {
          first_name: account.individual.first_name,
          last_name: account.individual.last_name,
          email: account.individual.email,
          verification: account.individual.verification
        } : null
      });
      
    } catch (error) {
      console.error('Account status check error:', error);
      throw new APIError('Failed to check account status', 500);
    }
  })
);

/**
 * GET /api/stripe-connect/dashboard-link
 * Create Stripe Express Dashboard link
 */
router.get('/dashboard-link',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    
    // Get user's Stripe Connect account ID
    const userResult = await query(
      'SELECT stripe_connect_account_id FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      throw new NotFoundError('User not found');
    }
    
    const stripeAccountId = userResult.rows[0].stripe_connect_account_id;
    
    if (!stripeAccountId) {
      throw new APIError('User does not have a Stripe Connect account', 400);
    }
    
    try {
      // Create login link for Stripe Express Dashboard
      const loginLink = await stripe.accounts.createLoginLink(stripeAccountId);
      
      res.json({
        dashboard_url: loginLink.url
      });
      
    } catch (error) {
      console.error('Dashboard link creation error:', error);
      throw new APIError('Failed to create dashboard link', 500);
    }
  })
);

/**
 * GET /api/stripe-connect/earnings
 * Get user's earnings summary
 */
router.get('/earnings',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { year = new Date().getFullYear() } = req.query;
    
    try {
      // Get earnings from transaction records
      const earningsResult = await query(`
        SELECT 
          COUNT(*) as total_transactions,
          SUM(owner_payout_amount) as total_earnings,
          SUM(base_amount) as total_rental_value,
          SUM(platform_fee_amount) as total_fees_paid,
          AVG(owner_payout_amount) as avg_transaction_amount
        FROM transaction_records tr
        JOIN rentals r ON tr.rental_id = r.id
        WHERE r.owner_id = $1 
        AND tr.payment_status = 'completed'
        AND EXTRACT(YEAR FROM tr.transaction_date) = $2
      `, [userId, year]);
      
      const earnings = earningsResult.rows[0];
      
      // Get monthly breakdown
      const monthlyResult = await query(`
        SELECT 
          EXTRACT(MONTH FROM tr.transaction_date) as month,
          COUNT(*) as transactions,
          SUM(owner_payout_amount) as earnings,
          SUM(base_amount) as rental_value
        FROM transaction_records tr
        JOIN rentals r ON tr.rental_id = r.id
        WHERE r.owner_id = $1 
        AND tr.payment_status = 'completed'
        AND EXTRACT(YEAR FROM tr.transaction_date) = $2
        GROUP BY EXTRACT(MONTH FROM tr.transaction_date)
        ORDER BY month
      `, [userId, year]);
      
      res.json({
        year: parseInt(year),
        summary: {
          total_transactions: parseInt(earnings.total_transactions) || 0,
          total_earnings: parseFloat(earnings.total_earnings) || 0,
          total_rental_value: parseFloat(earnings.total_rental_value) || 0,
          total_fees_paid: parseFloat(earnings.total_fees_paid) || 0,
          avg_transaction_amount: parseFloat(earnings.avg_transaction_amount) || 0
        },
        monthly_breakdown: monthlyResult.rows.map(row => ({
          month: parseInt(row.month),
          transactions: parseInt(row.transactions),
          earnings: parseFloat(row.earnings),
          rental_value: parseFloat(row.rental_value)
        }))
      });
      
    } catch (error) {
      console.error('Earnings fetch error:', error);
      throw new APIError('Failed to fetch earnings', 500);
    }
  })
);

/**
 * POST /api/stripe-connect/calculate-fees
 * Calculate fees for a given amount
 */
router.post('/calculate-fees',
  asyncHandler(async (req, res) => {
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      throw new APIError('Valid amount is required', 400);
    }
    
    const fees = calculateFees(Math.round(amount * 100)); // Convert to cents
    
    res.json({
      amount_dollars: amount,
      amount_cents: Math.round(amount * 100),
      fees: {
        ...fees,
        // Convert back to dollars for display
        totalAmount: fees.totalAmount / 100,
        platformFee: fees.platformFee / 100,
        stripeFee: fees.stripeFee / 100,
        ownerAmount: fees.ownerAmount / 100
      }
    });
  })
);

module.exports = router;
