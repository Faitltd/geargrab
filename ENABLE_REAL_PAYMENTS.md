# 🚀 Enable Real Payments on GearGrab.co

## ✅ Current Status
- **✅ Application:** Fully deployed and operational at https://geargrab.co
- **✅ Payment API:** Responding correctly (returns 401 authentication required)
- **✅ Frontend:** All pages loading correctly
- **✅ Infrastructure:** Cloud Run + Firebase Hosting working perfectly
- **⚠️ Missing:** Production credentials for real payment processing

## 🔧 Required Steps to Enable Real Payments

### 1. 🔐 Configure Firebase Admin (Required for Authentication)

**Get Service Account Credentials:**
1. Go to [Firebase Console](https://console.firebase.google.com/project/geargrabco/settings/serviceaccounts/adminsdk)
2. Click "Generate new private key"
3. Download the JSON file
4. Extract `client_email` and `private_key` from the JSON

**Set Environment Variables:**
```bash
gcloud run services update geargrab-app --region=us-central1 \
  --set-env-vars="FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@geargrabco.iam.gserviceaccount.com,FIREBASE_ADMIN_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----"
```

### 2. 💳 Configure Stripe Production Keys

**Get Production Keys:**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Switch to "Live" mode (toggle in top left)
3. Copy "Publishable key" and "Secret key"

**Set Stripe Keys:**
```bash
gcloud run services update geargrab-app --region=us-central1 \
  --set-env-vars="STRIPE_SECRET_KEY=sk_live_YOUR_SECRET_KEY,VITE_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_PUBLISHABLE_KEY"
```

**Configure Webhook:**
1. Go to [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://geargrab.co/api/webhooks/stripe`
3. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Copy webhook signing secret

```bash
gcloud run services update geargrab-app --region=us-central1 \
  --set-env-vars="STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET"
```

### 3. 📧 Configure Email Service (Resend)

**Set up Resend:**
1. Go to [Resend Dashboard](https://resend.com/api-keys)
2. Create API key
3. Verify domain `geargrab.co` in Resend

```bash
gcloud run services update geargrab-app --region=us-central1 \
  --set-env-vars="RESEND_API_KEY=re_YOUR_API_KEY,FROM_EMAIL=bookings@geargrab.co"
```

### 4. 🎯 Complete Configuration Command

**All-in-One Setup:**
```bash
gcloud run services update geargrab-app --region=us-central1 \
  --set-env-vars="FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@geargrabco.iam.gserviceaccount.com,FIREBASE_ADMIN_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----,STRIPE_SECRET_KEY=sk_live_YOUR_SECRET_KEY,STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET,RESEND_API_KEY=re_YOUR_API_KEY,FROM_EMAIL=bookings@geargrab.co"
```

## 🧪 Testing Real Payments

### 1. Test Authentication
After configuring Firebase Admin, authentication should work:
```bash
curl -X POST https://geargrab.co/api/payments/create-intent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -d '{"amount": 1000, "currency": "usd"}'
```

### 2. Test Complete Booking Flow
1. Go to https://geargrab.co/auth/signup
2. Create account (should work with Firebase Admin configured)
3. Go to https://geargrab.co/listing/emob-001
4. Complete booking process with real payment

### 3. Test with Stripe Test Cards
Use these test cards for initial testing:
- **Success:** 4242 4242 4242 4242
- **Decline:** 4000 0000 0000 0002
- **3D Secure:** 4000 0025 0000 3155

## 🔒 Security Verification

**After configuration, verify:**
- [ ] Firebase authentication working
- [ ] Stripe payments processing
- [ ] Email notifications sending
- [ ] Webhook signatures validating
- [ ] User data properly secured

## 📊 Monitoring

**Check logs after setup:**
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=geargrab-app" --limit=20
```

**Monitor Stripe Dashboard:**
- Check payment events
- Verify webhook deliveries
- Monitor for errors

## 🚨 Important Notes

1. **Test Mode First:** Use Stripe test keys initially to verify everything works
2. **Gradual Rollout:** Start with small test payments before full launch
3. **Monitor Closely:** Watch logs and dashboards for the first few transactions
4. **Backup Plan:** Keep test environment ready for rollback if needed

## ✅ Success Indicators

When properly configured, you should see:
- ✅ Users can sign up and log in
- ✅ Payment intents create successfully
- ✅ Stripe webhooks receive events
- ✅ Email notifications send
- ✅ Bookings save to Firestore
- ✅ Complete rental flow works end-to-end

---

## 🎯 Quick Start

**Minimum viable setup (just to test):**
1. Configure Firebase Admin credentials
2. Add Stripe test keys
3. Test a booking flow

**Production ready setup:**
1. All above steps
2. Switch to Stripe live keys
3. Configure email service
4. Set up monitoring

Once these credentials are configured, **GearGrab will be fully operational with real payment processing!** 🎉
