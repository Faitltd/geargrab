# Enable Production Payments - Complete Setup Guide

**Date:** June 15, 2025  
**Status:** 🚀 **READY TO ENABLE PRODUCTION PAYMENTS**  
**Current State:** Test transactions working ✅  
**Next Step:** Configure real Stripe keys for production

## Overview

The payment system is fully functional with test transactions. Now we need to configure real Stripe keys to enable production payments. This guide provides step-by-step instructions for a secure production setup.

## 🎯 **Current Status**

### ✅ **What's Working**
- **Test Payments:** Mock payments working perfectly in development
- **Payment Flow:** Complete payment processing pipeline functional
- **User Experience:** Smooth authentication and payment flow
- **Error Handling:** Comprehensive error management
- **Security:** All security measures implemented

### 🔧 **What Needs Configuration**
- **Real Stripe Keys:** Production Stripe account and API keys
- **Webhook Endpoints:** Production webhook configuration
- **Environment Variables:** Production environment setup
- **Domain Verification:** Stripe domain verification for geargrab.co

## 📋 **Pre-Requirements Checklist**

### **1. Stripe Account Setup**
- [ ] Create Stripe account at [stripe.com](https://stripe.com)
- [ ] Complete business verification process
- [ ] Activate live payments in Stripe dashboard
- [ ] Verify business bank account for payouts

### **2. Domain and SSL**
- [ ] Ensure geargrab.co is properly configured
- [ ] SSL certificate is active and valid
- [ ] Domain ownership verified

### **3. Legal and Compliance**
- [ ] Terms of Service updated for payments
- [ ] Privacy Policy includes payment processing
- [ ] Refund policy clearly defined
- [ ] Business registration complete

## 🔑 **Step 1: Get Stripe Production Keys**

### **Access Stripe Dashboard**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. **Switch to Live Mode** (toggle in top-left corner)
3. Navigate to **Developers > API Keys**

### **Copy Required Keys**
```bash
# You'll need these three keys:
PUBLISHABLE_KEY=pk_live_...    # Starts with pk_live_
SECRET_KEY=sk_live_...         # Starts with sk_live_
WEBHOOK_SECRET=whsec_...       # Created in next step
```

### **Security Best Practices**
- ✅ Never share secret keys
- ✅ Store keys securely (use environment variables)
- ✅ Rotate keys periodically
- ✅ Monitor key usage in Stripe dashboard

## 🔗 **Step 2: Configure Stripe Webhooks**

### **Create Webhook Endpoint**
1. In Stripe Dashboard, go to **Developers > Webhooks**
2. Click **Add endpoint**
3. Set endpoint URL: `https://geargrab.co/api/webhooks/stripe`
4. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
   - `payment_intent.requires_action`

### **Get Webhook Secret**
1. After creating webhook, click on it
2. Click **Reveal** next to "Signing secret"
3. Copy the webhook secret (starts with `whsec_`)

### **Test Webhook Endpoint**
```bash
# Test webhook endpoint is accessible
curl -X POST https://geargrab.co/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

## ⚙️ **Step 3: Configure Production Environment**

### **Option A: Local Environment (.env)**
```bash
# Update .env file with production keys
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_PUBLISHABLE_KEY
STRIPE_SECRET_KEY=sk_live_YOUR_SECRET_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
NODE_ENV=production
```

### **Option B: Cloud Run Deployment**
```bash
# Set environment variables in Google Cloud Run
gcloud run services update geargrab --region us-central1 \
  --set-env-vars="VITE_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_PUBLISHABLE_KEY" \
  --set-env-vars="STRIPE_SECRET_KEY=sk_live_YOUR_SECRET_KEY" \
  --set-env-vars="STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET" \
  --set-env-vars="NODE_ENV=production"
```

### **Option C: Environment-Specific Files**
```bash
# Create .env.production file
cp .env .env.production

# Edit .env.production with production values
nano .env.production
```

## 🧪 **Step 4: Test Production Setup**

### **Test Payment Intent Creation**
```bash
# Test payment endpoint with production keys
curl -X POST https://geargrab.co/api/payments/create-intent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -d '{
    "amount": 100,
    "currency": "usd",
    "metadata": {
      "test": "production_test"
    }
  }'
```

### **Expected Response**
```json
{
  "clientSecret": "pi_live_1234567890_secret_abcdefghijk",
  "paymentIntentId": "pi_live_1234567890"
}
```

### **Test Small Payment**
1. Use Stripe test card: `4242 4242 4242 4242`
2. Process a $1.00 test payment
3. Verify payment appears in Stripe dashboard
4. Check webhook events are received

## 🔒 **Step 5: Security Validation**

### **Verify Security Measures**
- [ ] **HTTPS Only:** All payment pages use HTTPS
- [ ] **CSP Headers:** Content Security Policy configured
- [ ] **Authentication:** Payment requires user authentication
- [ ] **Rate Limiting:** Payment endpoints have rate limits
- [ ] **Input Validation:** All payment inputs validated
- [ ] **Error Handling:** No sensitive data in error messages

### **Test Security Features**
```bash
# Test authentication requirement
curl -X POST https://geargrab.co/api/payments/create-intent \
  -H "Content-Type: application/json" \
  -d '{"amount": 100}'
# Should return 401 Unauthorized

# Test rate limiting
for i in {1..25}; do
  curl -X POST https://geargrab.co/api/payments/create-intent &
done
# Should trigger rate limiting
```

## 📊 **Step 6: Monitoring Setup**

### **Stripe Dashboard Monitoring**
- [ ] Set up payment alerts in Stripe
- [ ] Configure failed payment notifications
- [ ] Enable fraud detection rules
- [ ] Set up payout schedules

### **Application Monitoring**
```javascript
// Add payment monitoring to your app
console.log('Payment processed:', {
  paymentIntentId,
  amount,
  currency,
  userId,
  timestamp: new Date().toISOString()
});
```

### **Error Tracking**
- [ ] Configure Sentry or similar for error tracking
- [ ] Set up alerts for payment failures
- [ ] Monitor webhook delivery success rates

## 🚀 **Step 7: Go Live Checklist**

### **Final Pre-Launch Checks**
- [ ] **Test Complete Flow:** End-to-end payment testing
- [ ] **Webhook Testing:** Verify all webhook events work
- [ ] **Error Scenarios:** Test failed payments and errors
- [ ] **Mobile Testing:** Test on mobile devices
- [ ] **Browser Testing:** Test on different browsers

### **Launch Preparation**
- [ ] **Backup Current System:** Create system backup
- [ ] **Rollback Plan:** Prepare rollback procedure
- [ ] **Support Team:** Brief support team on new features
- [ ] **Documentation:** Update user documentation

### **Go-Live Process**
1. **Deploy Production Keys** during low-traffic period
2. **Monitor Closely** for first few hours
3. **Test Live Payment** with small amount
4. **Verify Webhooks** are working
5. **Monitor Error Rates** and user feedback

## 🛠️ **Quick Setup Script**

I'll create a script to automate the production setup:

```bash
#!/bin/bash
# quick-enable-production-payments.sh

echo "🚀 GearGrab Production Payments Setup"
echo "======================================"

# Check if running in production environment
if [ "$NODE_ENV" != "production" ]; then
  echo "⚠️  Warning: Not in production environment"
  read -p "Continue anyway? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Prompt for Stripe keys
echo "📝 Enter your Stripe production keys:"
read -p "Publishable Key (pk_live_...): " STRIPE_PUB_KEY
read -s -p "Secret Key (sk_live_...): " STRIPE_SECRET_KEY
echo
read -s -p "Webhook Secret (whsec_...): " STRIPE_WEBHOOK_SECRET
echo

# Validate keys
if [[ ! $STRIPE_PUB_KEY =~ ^pk_live_ ]]; then
  echo "❌ Invalid publishable key format"
  exit 1
fi

if [[ ! $STRIPE_SECRET_KEY =~ ^sk_live_ ]]; then
  echo "❌ Invalid secret key format"
  exit 1
fi

if [[ ! $STRIPE_WEBHOOK_SECRET =~ ^whsec_ ]]; then
  echo "❌ Invalid webhook secret format"
  exit 1
fi

# Deploy to Cloud Run
echo "🚀 Deploying to production..."
gcloud run services update geargrab --region us-central1 \
  --set-env-vars="VITE_STRIPE_PUBLISHABLE_KEY=$STRIPE_PUB_KEY" \
  --set-env-vars="STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY" \
  --set-env-vars="STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET" \
  --set-env-vars="NODE_ENV=production"

echo "✅ Production payments enabled!"
echo "🧪 Test with a small payment to verify setup"
```

## 📞 **Support and Troubleshooting**

### **Common Issues**
1. **Invalid Keys:** Ensure keys are copied correctly without extra spaces
2. **Webhook Failures:** Check endpoint URL and selected events
3. **CORS Issues:** Verify domain is added to Stripe allowed domains
4. **SSL Errors:** Ensure SSL certificate is valid

### **Getting Help**
- **Stripe Support:** [support.stripe.com](https://support.stripe.com)
- **Documentation:** [stripe.com/docs](https://stripe.com/docs)
- **Status Page:** [status.stripe.com](https://status.stripe.com)

## 🎉 **Success Indicators**

### **You'll Know It's Working When:**
- ✅ Real payment intents created (start with `pi_live_`)
- ✅ Test payments appear in Stripe dashboard
- ✅ Webhooks show "succeeded" status
- ✅ Users can complete real transactions
- ✅ Money appears in your Stripe account

### **Next Steps After Go-Live**
1. **Monitor Performance:** Watch payment success rates
2. **Gather Feedback:** Collect user feedback on payment experience
3. **Optimize Flow:** Improve based on real usage data
4. **Scale Up:** Prepare for increased transaction volume

---

**Ready to enable production payments?** Follow this guide step-by-step, and you'll have real Stripe transactions working within 30 minutes! 🚀

**Need help?** Each step includes troubleshooting tips and validation commands to ensure everything works correctly.
