/**
 * Stripe Configuration
 * Stripe Connect setup for marketplace payments
 */

const Stripe = require('stripe');

// Initialize Stripe with secret key
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Stripe configuration
const STRIPE_CONFIG = {
  // Webhook endpoint secret for verifying webhook signatures
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  
  // Platform fee percentage (GearGrab's commission)
  platformFeePercent: 0.10, // 10%
  
  // Stripe fee percentage (approximate)
  stripeFeePercent: 0.029, // 2.9% + $0.30
  stripeFeeFixed: 30, // $0.30 in cents
  
  // Currency
  currency: 'usd',
  
  // Connect settings
  connect: {
    // Redirect URLs for Connect onboarding
    refreshUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard/payments/refresh`,
    returnUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard/payments/return`,
  }
};

/**
 * Create a Stripe Connect account for a user
 */
async function createConnectAccount(userEmail, userInfo = {}) {
  try {
    const account = await stripe.accounts.create({
      type: 'express',
      email: userEmail,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      individual: {
        email: userEmail,
        first_name: userInfo.first_name,
        last_name: userInfo.last_name,
        phone: userInfo.phone_number,
      },
      settings: {
        payouts: {
          schedule: {
            interval: 'weekly',
            weekly_anchor: 'friday'
          }
        }
      }
    });
    
    return account;
  } catch (error) {
    console.error('Failed to create Stripe Connect account:', error);
    throw new Error('Failed to create payment account');
  }
}

/**
 * Create account link for Connect onboarding
 */
async function createAccountLink(accountId, type = 'account_onboarding') {
  try {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: STRIPE_CONFIG.connect.refreshUrl,
      return_url: STRIPE_CONFIG.connect.returnUrl,
      type: type,
    });
    
    return accountLink;
  } catch (error) {
    console.error('Failed to create account link:', error);
    throw new Error('Failed to create onboarding link');
  }
}

/**
 * Get Connect account details
 */
async function getConnectAccount(accountId) {
  try {
    const account = await stripe.accounts.retrieve(accountId);
    return account;
  } catch (error) {
    console.error('Failed to retrieve Connect account:', error);
    throw new Error('Failed to retrieve payment account');
  }
}

/**
 * Check if Connect account can accept payments
 */
async function canAcceptPayments(accountId) {
  try {
    const account = await stripe.accounts.retrieve(accountId);
    return account.charges_enabled && account.payouts_enabled;
  } catch (error) {
    console.error('Failed to check account status:', error);
    return false;
  }
}

/**
 * Create payment intent for rental
 */
async function createPaymentIntent(amount, connectedAccountId, metadata = {}) {
  try {
    // Calculate fees
    const platformFee = Math.round(amount * STRIPE_CONFIG.platformFeePercent);
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // Amount in cents
      currency: STRIPE_CONFIG.currency,
      application_fee_amount: platformFee,
      transfer_data: {
        destination: connectedAccountId,
      },
      metadata: {
        ...metadata,
        platform_fee: platformFee,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });
    
    return paymentIntent;
  } catch (error) {
    console.error('Failed to create payment intent:', error);
    throw new Error('Failed to create payment intent');
  }
}

/**
 * Create setup intent for saving payment methods
 */
async function createSetupIntent(customerId, connectedAccountId) {
  try {
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      on_behalf_of: connectedAccountId,
    });
    
    return setupIntent;
  } catch (error) {
    console.error('Failed to create setup intent:', error);
    throw new Error('Failed to create setup intent');
  }
}

/**
 * Create or retrieve Stripe customer
 */
async function createOrGetCustomer(userEmail, userInfo = {}) {
  try {
    // First, try to find existing customer
    const existingCustomers = await stripe.customers.list({
      email: userEmail,
      limit: 1,
    });
    
    if (existingCustomers.data.length > 0) {
      return existingCustomers.data[0];
    }
    
    // Create new customer
    const customer = await stripe.customers.create({
      email: userEmail,
      name: `${userInfo.first_name || ''} ${userInfo.last_name || ''}`.trim(),
      phone: userInfo.phone_number,
      metadata: {
        user_id: userInfo.user_id,
      },
    });
    
    return customer;
  } catch (error) {
    console.error('Failed to create/get customer:', error);
    throw new Error('Failed to create customer');
  }
}

/**
 * Process refund
 */
async function processRefund(paymentIntentId, amount = null, reason = 'requested_by_customer') {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount, // If null, refunds full amount
      reason: reason,
    });
    
    return refund;
  } catch (error) {
    console.error('Failed to process refund:', error);
    throw new Error('Failed to process refund');
  }
}

/**
 * Create transfer to connected account (for manual payouts)
 */
async function createTransfer(amount, connectedAccountId, metadata = {}) {
  try {
    const transfer = await stripe.transfers.create({
      amount: amount,
      currency: STRIPE_CONFIG.currency,
      destination: connectedAccountId,
      metadata: metadata,
    });
    
    return transfer;
  } catch (error) {
    console.error('Failed to create transfer:', error);
    throw new Error('Failed to create transfer');
  }
}

/**
 * Verify webhook signature
 */
function verifyWebhookSignature(payload, signature) {
  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      STRIPE_CONFIG.webhookSecret
    );
    return event;
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    throw new Error('Invalid webhook signature');
  }
}

/**
 * Calculate fees for a transaction
 */
function calculateFees(amount) {
  const platformFee = Math.round(amount * STRIPE_CONFIG.platformFeePercent);
  const stripeFee = Math.round(amount * STRIPE_CONFIG.stripeFeePercent) + STRIPE_CONFIG.stripeFeeFixed;
  const ownerAmount = amount - platformFee - stripeFee;
  
  return {
    totalAmount: amount,
    platformFee,
    stripeFee,
    ownerAmount,
    platformFeePercent: STRIPE_CONFIG.platformFeePercent,
    stripeFeePercent: STRIPE_CONFIG.stripeFeePercent,
  };
}

module.exports = {
  stripe,
  STRIPE_CONFIG,
  createConnectAccount,
  createAccountLink,
  getConnectAccount,
  canAcceptPayments,
  createPaymentIntent,
  createSetupIntent,
  createOrGetCustomer,
  processRefund,
  createTransfer,
  verifyWebhookSignature,
  calculateFees,
};
