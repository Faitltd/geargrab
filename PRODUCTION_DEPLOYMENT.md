# GearGrab Production Deployment Guide

## 🚀 Deploy to Google Cloud Run & geargrab.co

This guide will deploy the GearGrab platform to Google Cloud Run and configure the custom domain geargrab.co.

## Prerequisites

1. **Google Cloud Account** with billing enabled
2. **Domain ownership** of geargrab.co
3. **gcloud CLI** installed and authenticated
4. **Firebase project** set up (optional for full functionality)

## Quick Deployment Steps

### 1. Set Up Google Cloud Project

```bash
# Create a new project (or use existing)
gcloud projects create geargrab-production --name="GearGrab Production"

# Set as default project
gcloud config set project geargrab-production

# Enable billing (required for Cloud Run)
# Visit: https://console.cloud.google.com/billing
```

### 2. Enable Required APIs

```bash
gcloud services enable \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    containerregistry.googleapis.com \
    secretmanager.googleapis.com \
    domains.googleapis.com
```

### 3. Create Required Secrets (Optional)

For full functionality, create these secrets in Google Secret Manager:

```bash
# Firebase service account key (if using Firebase)
gcloud secrets create firebase-private-key --data-file=path/to/firebase-key.json

# Stripe keys (if using payments)
echo "sk_live_your_stripe_secret_key" | gcloud secrets create stripe-secret-key --data-file=-

# Session secret for authentication
openssl rand -base64 32 | gcloud secrets create session-secret --data-file=-
```

### 4. Deploy to Cloud Run

```bash
# Run the deployment script
./deploy-to-production.sh
```

Or manually deploy:

```bash
# Submit build to Cloud Build
gcloud builds submit \
    --config=cloudbuild.yaml \
    --substitutions="_REGION=us-central1,_PUBLIC_APP_URL=https://geargrab.co" \
    .
```

### 5. Set Up Custom Domain

```bash
# Create domain mapping
gcloud run domain-mappings create \
    --service=geargrab \
    --domain=geargrab.co \
    --region=us-central1

# Get DNS records to configure
gcloud run domain-mappings describe geargrab.co \
    --region=us-central1 \
    --format="table(status.resourceRecords[].name,status.resourceRecords[].rrdata,status.resourceRecords[].type)"
```

### 6. Configure DNS Records

Add these records to your domain provider (e.g., Cloudflare, GoDaddy):

```
Type: A
Name: @
Value: [IP from Cloud Run]

Type: AAAA  
Name: @
Value: [IPv6 from Cloud Run]

Type: CNAME
Name: www
Value: geargrab.co
```

## Current Platform Features

### ✅ Working Features
- **Complete UI/UX** - Professional gear rental interface
- **Sample Data API** - 6 gear categories with realistic listings
- **Authentication Pages** - Google Auth integration (needs Firebase config)
- **Gear Detail Pages** - Full product information and booking interface
- **Search & Filtering** - Category-based browsing
- **Responsive Design** - Mobile and desktop optimized

### 🔧 Configuration Needed for Full Functionality
- **Firebase Authentication** - Set up Firebase project and add config
- **Stripe Payments** - Add Stripe keys for payment processing
- **Database** - Connect to Firestore or other database for persistence
- **File Storage** - Configure image upload and storage

## Environment Variables

The platform uses these environment variables:

```bash
# Public (build-time)
PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
PUBLIC_FIREBASE_PROJECT_ID=your_project_id
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_key
PUBLIC_APP_URL=https://geargrab.co

# Private (runtime secrets)
FIREBASE_PRIVATE_KEY=firebase_service_account_key
STRIPE_SECRET_KEY=sk_live_your_stripe_secret
SESSION_SECRET=random_session_secret
```

## Monitoring & Maintenance

### View Logs
```bash
gcloud run services logs read geargrab --region=us-central1
```

### Update Service
```bash
gcloud run services update geargrab \
    --region=us-central1 \
    --set-env-vars="NEW_VAR=value"
```

### Check Domain Status
```bash
gcloud run domain-mappings describe geargrab.co --region=us-central1
```

## Troubleshooting

### Common Issues

1. **Build Fails**
   - Check Dockerfile and dependencies
   - Verify Cloud Build API is enabled
   - Check build logs: `gcloud builds log [BUILD_ID]`

2. **Domain Not Working**
   - Verify DNS records are configured correctly
   - Wait for DNS propagation (up to 48 hours)
   - Check SSL certificate status

3. **Service Not Starting**
   - Check environment variables
   - Verify secrets are created
   - Review service logs

### Health Check

The platform includes a health check endpoint:
- **URL**: `https://geargrab.co/health`
- **Expected Response**: `{"status": "ok"}`

## Cost Optimization

- **Cloud Run**: Pay per request, scales to zero
- **Container Registry**: Minimal storage costs
- **Cloud Build**: Free tier available
- **Estimated Monthly Cost**: $10-50 for moderate traffic

## Security Features

- **Content Security Policy** - Prevents XSS attacks
- **HTTPS Only** - SSL/TLS encryption
- **Non-root Container** - Security best practices
- **Secret Management** - Encrypted environment variables

## Next Steps

1. **Deploy the platform** using the steps above
2. **Configure DNS** for geargrab.co domain
3. **Set up Firebase** for authentication (optional)
4. **Add Stripe** for payments (optional)
5. **Test the platform** thoroughly
6. **Monitor performance** and costs

The platform is ready for production use with sample data and can be enhanced with real database and payment integration as needed.
