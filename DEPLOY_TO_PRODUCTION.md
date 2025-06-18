# 🚀 Deploy GearGrab to Production (Cloud Run + geargrab.co)

## ✅ **READY FOR PRODUCTION DEPLOYMENT**

The payment system has been cleaned of all testing/mock code and is ready for production deployment to Google Cloud Run with the geargrab.co domain.

## 🔧 **Pre-Deployment Checklist**

### ✅ **Code Preparation Complete**
- ✅ Removed all mock authentication code
- ✅ Removed test payment pages
- ✅ Cleaned up development-only features
- ✅ Production environment configuration ready
- ✅ Docker configuration optimized
- ✅ Cloud Run deployment scripts ready

### 📋 **Required Before Deployment**

#### 1. **Google Cloud Setup**
```bash
# Install Google Cloud CLI if not already installed
# Visit: https://cloud.google.com/sdk/docs/install

# Authenticate with Google Cloud
gcloud auth login

# Set the project
gcloud config set project geargrabco
```

#### 2. **Environment Variables**
Update `.env.production` with your actual values:
- `VITE_STRIPE_PUBLISHABLE_KEY` - Your live Stripe publishable key
- `STRIPE_SECRET_KEY` - Your live Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Your Stripe webhook secret
- `FIREBASE_ADMIN_PRIVATE_KEY` - Your Firebase service account private key

#### 3. **Stripe Configuration**
- Set up live Stripe account
- Configure webhook endpoint: `https://geargrab.co/api/webhooks/stripe`
- Add webhook events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `payment_intent.canceled`

## 🚀 **Deployment Commands**

### **Option 1: Automated Deployment (Recommended)**
```bash
# Run the complete deployment script
./scripts/deploy-cloud-run.sh
```

### **Option 2: Manual Step-by-Step**
```bash
# 1. Build and push Docker image
gcloud builds submit --tag gcr.io/geargrabco/geargrab .

# 2. Deploy to Cloud Run
gcloud run deploy geargrab \
  --image gcr.io/geargrabco/geargrab \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10

# 3. Configure custom domain
gcloud run domain-mappings create \
  --service geargrab \
  --domain geargrab.co \
  --region us-central1
```

### **Option 3: Cloud Build (CI/CD)**
```bash
# Trigger Cloud Build
gcloud builds submit --config cloudbuild.yaml .
```

## 🌐 **Domain Configuration**

### **DNS Records for geargrab.co**
Add these DNS records to your domain registrar:

```
Type: A
Name: @
Value: [Get from Cloud Run domain mapping]

Type: CNAME  
Name: www
Value: ghs.googlehosted.com
```

### **Get DNS Values**
```bash
# Get the IP address for A record
gcloud run domain-mappings describe geargrab.co \
  --region us-central1 \
  --format="value(status.resourceRecords[0].rrdata)"
```

## 🔐 **Security Configuration**

### **Environment Variables in Cloud Run**
```bash
# Set production environment variables
gcloud run services update geargrab \
  --region us-central1 \
  --set-env-vars "NODE_ENV=production" \
  --set-env-vars "VITE_APP_URL=https://geargrab.co" \
  --set-env-vars "STRIPE_SECRET_KEY=sk_live_..." \
  --set-env-vars "FIREBASE_PROJECT_ID=geargrabco"
```

### **Stripe Webhook Configuration**
1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://geargrab.co/api/webhooks/stripe`
3. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `payment_intent.canceled`
4. Copy webhook signing secret to environment variables

## 🧪 **Post-Deployment Testing**

### **1. Basic Functionality**
```bash
# Test if site is accessible
curl -I https://geargrab.co

# Test API health
curl https://geargrab.co/api/health
```

### **2. Payment Flow Testing**
1. Create a test account
2. Browse to a gear listing
3. Attempt to book and pay
4. Use Stripe test cards:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`

### **3. Webhook Testing**
1. Make a test payment
2. Check Stripe Dashboard → Webhooks for delivery status
3. Verify booking status updates in Firestore

## 📊 **Monitoring Setup**

### **Cloud Run Monitoring**
```bash
# View logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=geargrab" --limit 50

# Monitor metrics
gcloud run services describe geargrab --region us-central1
```

### **Error Tracking**
- Set up Sentry or similar error tracking
- Configure alerts for payment failures
- Monitor webhook delivery failures

## 🔄 **Continuous Deployment**

### **GitHub Actions (Optional)**
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Cloud Run
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: google-github-actions/setup-gcloud@v0
        with:
          service_account_key: ${{ secrets.GCP_SA_KEY }}
          project_id: geargrabco
      - run: gcloud builds submit --config cloudbuild.yaml .
```

## 🎉 **Success Checklist**

After deployment, verify:
- [ ] Site loads at https://geargrab.co
- [ ] User authentication works
- [ ] Payment processing works with test cards
- [ ] Webhooks are received and processed
- [ ] Booking creation works
- [ ] Error handling works properly
- [ ] SSL certificate is valid
- [ ] Performance is acceptable

## 📞 **Support**

### **Troubleshooting**
- Check Cloud Run logs: `gcloud logging read "resource.type=cloud_run_revision"`
- Verify environment variables: `gcloud run services describe geargrab`
- Test webhook delivery in Stripe Dashboard
- Check Firestore for booking records

### **Rollback**
```bash
# Rollback to previous revision
gcloud run services update-traffic geargrab \
  --to-revisions REVISION-NAME=100 \
  --region us-central1
```

## 🚀 **Ready to Deploy!**

The system is now production-ready. Run the deployment script to go live:

```bash
./scripts/deploy-cloud-run.sh
```

Your gear rental platform will be live at **https://geargrab.co** with full payment processing capabilities! 🎉
