# 🚀 GearGrab Production Deployment Checklist

## ✅ **Pre-Deployment Checklist**

### **Code Preparation** ✅ COMPLETE
- [x] Removed all mock authentication code
- [x] Removed test payment pages (`/test-payment`)
- [x] Cleaned up development-only features
- [x] Production environment configuration ready
- [x] Docker configuration optimized
- [x] Build completed successfully

### **Google Cloud Setup**
- [ ] Authenticated with Google Cloud (`gcloud auth login`)
- [ ] Project set to geargrabco (`gcloud config set project geargrabco`)
- [ ] Required APIs enabled (Cloud Build, Cloud Run, Container Registry)

### **Environment Variables**
- [ ] Firebase configuration variables set
- [ ] Stripe live API keys configured
- [ ] Webhook secrets configured
- [ ] Production URLs set

## 🔧 **Deployment Commands**

### **1. Authentication & Setup**
```bash
# Authenticate
gcloud auth login

# Set project
gcloud config set project geargrabco

# Enable APIs
gcloud services enable cloudbuild.googleapis.com run.googleapis.com containerregistry.googleapis.com
```

### **2. Build & Deploy**
```bash
# Build Docker image
gcloud builds submit --tag gcr.io/geargrabco/geargrab .

# Deploy to Cloud Run
gcloud run deploy geargrab \
  --image gcr.io/geargrabco/geargrab \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 1Gi \
  --cpu 1 \
  --set-env-vars "NODE_ENV=production,VITE_APP_URL=https://geargrab.co"
```

### **3. Environment Variables**
```bash
# Firebase configuration
gcloud run services update geargrab --region us-central1 \
  --set-env-vars "VITE_FIREBASE_API_KEY=AIzaSyANV1v2FhD2ktXxBUsfGrDm9442dGGCuYs,VITE_FIREBASE_AUTH_DOMAIN=geargrabco.firebaseapp.com,VITE_FIREBASE_PROJECT_ID=geargrabco,VITE_FIREBASE_STORAGE_BUCKET=geargrabco.firebasestorage.app,VITE_FIREBASE_MESSAGING_SENDER_ID=227444442028,VITE_FIREBASE_APP_ID=1:227444442028:web:6eeaed1e136d07f5b73009,FIREBASE_PROJECT_ID=geargrabco"

# Stripe configuration (replace with actual keys)
gcloud run services update geargrab --region us-central1 \
  --set-env-vars "VITE_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_KEY,STRIPE_SECRET_KEY=sk_live_YOUR_KEY,STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET"
```

### **4. Domain Configuration**
```bash
# Map custom domain
gcloud run domain-mappings create \
  --service geargrab \
  --domain geargrab.co \
  --region us-central1
```

## 🌐 **DNS Configuration**

### **Required DNS Records**
After domain mapping, configure these DNS records at your domain registrar:

```
Type: A
Name: @
Value: [IP from domain mapping - get from Cloud Console]

Type: CNAME
Name: www
Value: ghs.googlehosted.com
```

### **Get DNS Values**
```bash
# Get domain mapping details
gcloud run domain-mappings describe geargrab.co --region us-central1
```

## 🔐 **Security Configuration**

### **Stripe Webhook Setup**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://geargrab.co/api/webhooks/stripe`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
4. Copy webhook signing secret
5. Update Cloud Run environment variable

### **Firebase Admin Setup**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Project Settings → Service Accounts
3. Generate new private key
4. Set `FIREBASE_ADMIN_PRIVATE_KEY` environment variable

## 🧪 **Post-Deployment Testing**

### **Basic Functionality**
- [ ] Site loads at https://geargrab.co
- [ ] SSL certificate is valid
- [ ] User registration works
- [ ] User login works
- [ ] Browse listings works

### **Payment Flow**
- [ ] User can view gear listings
- [ ] Booking flow requires authentication
- [ ] Payment processing works with test cards
- [ ] Webhooks are received (check Stripe Dashboard)
- [ ] Booking records created in Firestore

### **Test Cards**
Use these Stripe test cards:
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **3D Secure**: 4000 0025 0000 3155

## 📊 **Monitoring Setup**

### **Cloud Run Monitoring**
```bash
# View logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=geargrab" --limit 50

# Monitor errors
gcloud logging read "resource.type=cloud_run_revision AND severity>=ERROR" --limit 20

# Check service status
gcloud run services describe geargrab --region us-central1
```

### **Performance Monitoring**
- [ ] Set up Cloud Monitoring alerts
- [ ] Configure error rate alerts
- [ ] Monitor payment success rates
- [ ] Set up uptime checks

## 🚨 **Troubleshooting**

### **Common Issues**

**Site not loading:**
- Check Cloud Run service status
- Verify domain mapping
- Check DNS propagation

**Payment failures:**
- Verify Stripe keys are live keys
- Check webhook endpoint accessibility
- Verify webhook secret matches

**Authentication issues:**
- Check Firebase configuration
- Verify JWT token validation
- Check user permissions

### **Rollback Procedure**
```bash
# List revisions
gcloud run revisions list --service=geargrab --region=us-central1

# Rollback to previous revision
gcloud run services update-traffic geargrab \
  --to-revisions REVISION-NAME=100 \
  --region us-central1
```

## ✅ **Success Criteria**

Deployment is successful when:
- [x] Code is production-ready (no test/mock code)
- [ ] Site accessible at https://geargrab.co
- [ ] SSL certificate valid
- [ ] User authentication working
- [ ] Payment processing functional
- [ ] Webhooks being received
- [ ] Booking creation working
- [ ] No errors in logs
- [ ] Performance acceptable

## 🎉 **Go Live!**

Once all checklist items are complete:
1. **Announce the launch** 📢
2. **Monitor closely** for the first few hours
3. **Test with real users**
4. **Celebrate!** 🎉

The GearGrab payment system is now live and ready for real-world usage! 🚀
