# 🚀 GearGrab Production Setup Guide

## Overview
This guide will help you configure GearGrab for production with real payments, authentication, and all necessary services.

## ✅ Current Status
- ✅ **Application Deployed:** https://geargrab.co
- ✅ **Cloud Run Service:** Running and accessible
- ✅ **Firebase Hosting:** Routing to Cloud Run
- ✅ **Payment System:** Code ready for production
- ⚠️ **Environment Variables:** Need production credentials

## 🔧 Required Production Configuration

### 1. Firebase Admin Setup (Required for Authentication)

**Create Service Account:**
```bash
# Go to Firebase Console > Project Settings > Service Accounts
# Generate new private key and download JSON file
```

**Configure Environment Variables:**
```bash
gcloud run services update geargrab-app --region=us-central1 \
  --set-env-vars="FIREBASE_ADMIN_CLIENT_EMAIL=your-service-account@geargrabco.iam.gserviceaccount.com,FIREBASE_ADMIN_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

### 2. Stripe Production Setup (Required for Real Payments)

**Get Production Keys:**
1. Go to Stripe Dashboard > Developers > API Keys
2. Switch to "Live" mode
3. Copy Publishable Key and Secret Key

**Configure Stripe:**
```bash
gcloud run services update geargrab-app --region=us-central1 \
  --set-env-vars="STRIPE_SECRET_KEY=sk_live_...,VITE_STRIPE_PUBLISHABLE_KEY=pk_live_..."
```

**Set up Webhook:**
1. Go to Stripe Dashboard > Developers > Webhooks
2. Add endpoint: `https://geargrab.co/api/webhooks/stripe`
3. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Copy webhook secret

```bash
gcloud run services update geargrab-app --region=us-central1 \
  --set-env-vars="STRIPE_WEBHOOK_SECRET=whsec_..."
```

### 3. Email Service Setup (Required for Notifications)

**Resend Setup:**
1. Go to Resend Dashboard
2. Create API key
3. Verify domain: geargrab.co

```bash
gcloud run services update geargrab-app --region=us-central1 \
  --set-env-vars="RESEND_API_KEY=re_...,FROM_EMAIL=bookings@geargrab.co"
```

### 4. Complete Environment Configuration

**All Required Variables:**
```bash
gcloud run services update geargrab-app --region=us-central1 \
  --set-env-vars="NODE_ENV=production,VITE_USE_EMULATORS=false,FIREBASE_PROJECT_ID=geargrabco,FIREBASE_ADMIN_CLIENT_EMAIL=your-service-account@geargrabco.iam.gserviceaccount.com,FIREBASE_ADMIN_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----,STRIPE_SECRET_KEY=sk_live_...,STRIPE_WEBHOOK_SECRET=whsec_...,RESEND_API_KEY=re_...,FROM_EMAIL=bookings@geargrab.co"
```

## 🧪 Testing Production Setup

### 1. Test Authentication
```bash
# Should return proper authentication error (not 500)
curl -X POST https://geargrab.co/api/payments/create-intent \
  -H "Content-Type: application/json" \
  -d '{"amount": 1000, "currency": "usd"}'
```

### 2. Test with Real User
1. Go to https://geargrab.co/auth/signup
2. Create account
3. Go to https://geargrab.co/listing/emob-001
4. Try booking process

### 3. Test Payment Flow
1. Log in to the site
2. Select a listing
3. Go through booking process
4. Use Stripe test card: 4242 4242 4242 4242

## 🔒 Security Checklist

- [ ] Firebase Admin private key secured
- [ ] Stripe live keys configured
- [ ] Webhook secrets set
- [ ] HTTPS enforced
- [ ] CORS properly configured
- [ ] Rate limiting active

## 📊 Monitoring Setup

**Enable Logging:**
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=geargrab-app" --limit=50
```

**Health Check:**
```bash
curl https://geargrab.co/api/health
```

## 🚨 Emergency Procedures

**Rollback Deployment:**
```bash
gcloud run services update geargrab-app --region=us-central1 --image=gcr.io/geargrabco/geargrab-app:previous-version
```

**Check Service Status:**
```bash
gcloud run services describe geargrab-app --region=us-central1
```

## 📞 Support Contacts

- **Technical Issues:** Check Cloud Run logs
- **Payment Issues:** Check Stripe Dashboard
- **Email Issues:** Check Resend Dashboard

---

## 🎯 Quick Start Commands

**1. Set up Firebase Admin:**
```bash
# Download service account JSON from Firebase Console
# Extract client_email and private_key
gcloud run services update geargrab-app --region=us-central1 \
  --set-env-vars="FIREBASE_ADMIN_CLIENT_EMAIL=service-account@geargrabco.iam.gserviceaccount.com"
```

**2. Set up Stripe:**
```bash
gcloud run services update geargrab-app --region=us-central1 \
  --set-env-vars="STRIPE_SECRET_KEY=sk_live_your_key_here"
```

**3. Test the setup:**
```bash
curl https://geargrab.co/api/health
```

Once these are configured, the full rental process with real payments will be operational! 🎉
