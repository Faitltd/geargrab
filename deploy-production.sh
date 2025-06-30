#!/bin/bash

# GearGrab Production Deployment Script
# Run this script to deploy GearGrab to Cloud Run and geargrab.co

set -e  # Exit on any error

echo "🚀 GearGrab Production Deployment"
echo "================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_step() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Configuration
PROJECT_ID="geargrabco"
SERVICE_NAME="geargrab"
REGION="us-central1"
DOMAIN="geargrab.co"

print_step "Step 1: Checking prerequisites..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    print_error "Google Cloud CLI is not installed"
    echo "Please install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

print_success "Google Cloud CLI found"

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    print_warning "Not authenticated with Google Cloud"
    echo "Please authenticate first:"
    echo "gcloud auth login"
    exit 1
fi

print_success "Google Cloud authentication verified"

print_step "Step 2: Setting up project..."

# Set project
echo "Setting project to ${PROJECT_ID}..."
gcloud config set project ${PROJECT_ID}
print_success "Project set to ${PROJECT_ID}"

print_step "Step 3: Enabling required APIs..."

# Enable APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
print_success "APIs enabled"

print_step "Step 4: Building Docker image..."

# Build and push image
echo "Building Docker image (this may take a few minutes)..."
gcloud builds submit --tag gcr.io/${PROJECT_ID}/${SERVICE_NAME} .
print_success "Docker image built and pushed"

print_step "Step 5: Deploying to Cloud Run..."

# Deploy to Cloud Run
gcloud run deploy ${SERVICE_NAME} \
    --image gcr.io/${PROJECT_ID}/${SERVICE_NAME} \
    --platform managed \
    --region ${REGION} \
    --allow-unauthenticated \
    --port 8080 \
    --memory 1Gi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 10 \
    --set-env-vars "NODE_ENV=production" \
    --set-env-vars "VITE_APP_URL=https://${DOMAIN}" \
    --set-env-vars "VITE_USE_EMULATORS=false"

print_success "Service deployed to Cloud Run"

print_step "Step 6: Setting Firebase environment variables..."

# Set Firebase environment variables
gcloud run services update ${SERVICE_NAME} \
    --region ${REGION} \
    --set-env-vars "VITE_FIREBASE_API_KEY=AIzaSyANV1v2FhD2ktXxBUsfGrDm9442dGGCuYs" \
    --set-env-vars "VITE_FIREBASE_AUTH_DOMAIN=geargrabco.firebaseapp.com" \
    --set-env-vars "VITE_FIREBASE_PROJECT_ID=geargrabco" \
    --set-env-vars "VITE_FIREBASE_STORAGE_BUCKET=geargrabco.firebasestorage.app" \
    --set-env-vars "VITE_FIREBASE_MESSAGING_SENDER_ID=227444442028" \
    --set-env-vars "VITE_FIREBASE_APP_ID=1:227444442028:web:6eeaed1e136d07f5b73009" \
    --set-env-vars "FIREBASE_PROJECT_ID=geargrabco"

print_success "Firebase environment variables set"

print_step "Step 7: Configuring custom domain..."

# Configure domain mapping
gcloud run domain-mappings create \
    --service ${SERVICE_NAME} \
    --domain ${DOMAIN} \
    --region ${REGION} || print_warning "Domain mapping may already exist"

print_success "Domain mapping configured"

print_step "Step 8: Getting service information..."

# Get service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} \
    --platform managed \
    --region ${REGION} \
    --format 'value(status.url)')

echo ""
print_success "Deployment completed successfully!"
echo ""
echo "🌐 Your application is now live at:"
echo "   Cloud Run URL: ${SERVICE_URL}"
echo "   Custom Domain: https://${DOMAIN}"
echo ""
print_warning "Important next steps:"
echo ""
echo "1. 🔐 Set up Stripe environment variables:"
echo "   gcloud run services update ${SERVICE_NAME} --region ${REGION} \\"
echo "     --set-env-vars \"VITE_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_KEY\" \\"
echo "     --set-env-vars \"STRIPE_SECRET_KEY=sk_live_YOUR_KEY\" \\"
echo "     --set-env-vars \"STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET\""
echo ""
echo "2. 🌐 Configure DNS records for ${DOMAIN}:"
echo "   Get the IP address from the domain mapping and add A record"
echo "   Add CNAME record: www -> ghs.googlehosted.com"
echo ""
echo "3. 🔗 Set up Stripe webhook:"
echo "   Endpoint: https://${DOMAIN}/api/webhooks/stripe"
echo "   Events: payment_intent.succeeded, payment_intent.payment_failed, payment_intent.canceled"
echo ""
echo "4. 🧪 Test the deployment:"
echo "   - Visit https://${DOMAIN}"
echo "   - Test user registration and login"
echo "   - Test payment flow with Stripe test cards"
echo ""
echo "5. 📊 Monitor the deployment:"
echo "   gcloud logging read \"resource.type=cloud_run_revision AND resource.labels.service_name=${SERVICE_NAME}\" --limit 50"
echo ""
print_success "GearGrab is now live! 🎉"
