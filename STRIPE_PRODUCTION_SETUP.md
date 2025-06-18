# Stripe Production Setup Guide

## Overview
This guide explains how to set up real Stripe payment processing for GearGrab in production.

## Prerequisites
- Stripe account (https://stripe.com)
- Access to your deployment environment (Cloud Run, etc.)

## Step 1: Get Your Stripe Keys

### 1.1 Login to Stripe Dashboard
1. Go to https://dashboard.stripe.com
2. Login to your Stripe account
3. Make sure you're in the correct mode:
   - **Test mode** for development/staging
   - **Live mode** for production

### 1.2 Get API Keys
1. Navigate to **Developers > API keys**
2. Copy the following keys:
   - **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - **Secret key** (starts with `sk_test_` or `sk_live_`)

### 1.3 Set Up Webhooks
1. Navigate to **Developers > Webhooks**
2. Click **Add endpoint**
3. Set endpoint URL: `https://your-domain.com/api/webhooks/stripe`
4. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
5. Copy the **Webhook signing secret** (starts with `whsec_`)

## Step 2: Update Environment Variables

### 2.1 Local Development (.env)
```bash
# Stripe Test Keys (for development)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### 2.2 Production Deployment
Update your production environment variables:

#### For Google Cloud Run:
```bash
gcloud run services update geargrab-app --region=us-central1 \
  --set-env-vars="VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key,STRIPE_SECRET_KEY=sk_live_your_live_key,STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret"
```

#### For other platforms:
Set these environment variables in your deployment platform:
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

## Step 3: Test the Integration

### 3.1 Test Mode
1. Use test keys (pk_test_*, sk_test_*)
2. Use Stripe test card numbers:
   - **Success**: 4242 4242 4242 4242
   - **Decline**: 4000 0000 0000 0002
   - **Requires authentication**: 4000 0025 0000 3155

### 3.2 Live Mode
1. Switch to live keys (pk_live_*, sk_live_*)
2. Use real payment methods
3. Monitor transactions in Stripe Dashboard

## Step 4: Security Considerations

### 4.1 Key Management
- **Never** commit API keys to version control
- Use environment variables for all keys
- Rotate keys regularly
- Use different keys for different environments

### 4.2 Webhook Security
- Always verify webhook signatures
- Use HTTPS for webhook endpoints
- Implement idempotency for webhook handling

### 4.3 Payment Validation
- Always verify payment status server-side
- Validate payment amounts match expected values
- Check payment intent status before fulfilling orders

## Step 5: Monitoring and Logging

### 5.1 Stripe Dashboard
- Monitor payments in real-time
- Set up email notifications for failed payments
- Review dispute and chargeback notifications

### 5.2 Application Logging
- Log all payment attempts
- Monitor for unusual patterns
- Set up alerts for payment failures

## Step 6: Going Live Checklist

### 6.1 Stripe Account Setup
- [ ] Complete Stripe account verification
- [ ] Add business information
- [ ] Set up bank account for payouts
- [ ] Configure payout schedule

### 6.2 Application Setup
- [ ] Update to live Stripe keys
- [ ] Test payment flow end-to-end
- [ ] Verify webhook handling
- [ ] Test error scenarios

### 6.3 Legal and Compliance
- [ ] Update terms of service
- [ ] Add privacy policy
- [ ] Ensure PCI compliance
- [ ] Review refund policy

## Troubleshooting

### Common Issues

#### 1. "Invalid API Key" Error
- Verify the key format (pk_* or sk_*)
- Check if using test key in live mode or vice versa
- Ensure key is not truncated or has extra spaces

#### 2. "Payment Intent Not Found"
- Verify payment intent ID format
- Check if using correct Stripe account
- Ensure payment intent was created successfully

#### 3. Webhook Signature Verification Failed
- Verify webhook secret is correct
- Check endpoint URL is accessible
- Ensure using raw request body for signature verification

### Support Resources
- Stripe Documentation: https://stripe.com/docs
- Stripe Support: https://support.stripe.com
- GearGrab Development Team: [your-team-contact]

## Production Deployment Commands

### Deploy with Stripe Keys
```bash
# Build and deploy with production Stripe keys
npm run build
gcloud run deploy geargrab-app \
  --source . \
  --region=us-central1 \
  --set-env-vars="VITE_STRIPE_PUBLISHABLE_KEY=$STRIPE_PUBLISHABLE_KEY,STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY,STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET"
```

### Verify Deployment
```bash
# Test payment endpoint
curl -X POST "https://your-domain.com/api/payments/create-intent" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -d '{"amount": 1000, "currency": "usd"}'
```

## Next Steps
1. Set up your Stripe account
2. Get your API keys
3. Update environment variables
4. Test the payment flow
5. Deploy to production
6. Monitor transactions

For additional support, refer to the Stripe documentation or contact the development team.
