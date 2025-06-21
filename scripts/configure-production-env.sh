#!/bin/bash

# GearGrab Production Environment Configuration Script
# This script configures Cloud Run with the necessary environment variables for production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
PROJECT_ID="geargrabco"
SERVICE_NAME="geargrab-app"
REGION="us-central1"

log_info "Configuring GearGrab production environment..."

# Check if user is authenticated with gcloud
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    log_error "Please authenticate with gcloud first: gcloud auth login"
    exit 1
fi

# Set the project
gcloud config set project $PROJECT_ID

log_info "Setting up environment variables for Cloud Run service: $SERVICE_NAME"

# Essential environment variables for production
log_info "Configuring Firebase environment variables..."

# Note: These need to be replaced with actual production values
gcloud run services update $SERVICE_NAME \
    --region=$REGION \
    --set-env-vars="NODE_ENV=production" \
    --set-env-vars="VITE_USE_EMULATORS=false" \
    --set-env-vars="FIREBASE_PROJECT_ID=geargrabco" \
    --quiet

log_success "Basic environment variables configured"

log_warning "IMPORTANT: You need to configure the following environment variables with actual production values:"
echo ""
echo "🔐 Firebase Admin (Required for authentication):"
echo "   FIREBASE_ADMIN_CLIENT_EMAIL=your-service-account@geargrabco.iam.gserviceaccount.com"
echo "   FIREBASE_ADMIN_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----"
echo ""
echo "💳 Stripe (Required for payments):"
echo "   STRIPE_SECRET_KEY=sk_live_..."
echo "   STRIPE_WEBHOOK_SECRET=whsec_..."
echo ""
echo "📧 Email Service (Required for notifications):"
echo "   RESEND_API_KEY=re_..."
echo "   FROM_EMAIL=bookings@geargrab.co"
echo ""
echo "To set these variables, run:"
echo "gcloud run services update $SERVICE_NAME --region=$REGION --set-env-vars=\"VARIABLE_NAME=value\""
echo ""

log_info "Current service configuration:"
gcloud run services describe $SERVICE_NAME --region=$REGION --format="table(spec.template.spec.template.spec.containers[0].env[].name,spec.template.spec.template.spec.containers[0].env[].value)"

log_success "Production environment configuration script completed"
log_warning "Remember to configure the actual production credentials before processing real payments!"
