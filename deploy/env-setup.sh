#!/bin/bash

# Environment Variables Setup Script for GearGrab Cloud Run Deployment
# This script creates and manages secrets in Google Secret Manager

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=${PROJECT_ID:-"your-project-id"}
REGION=${REGION:-"us-central1"}

echo -e "${BLUE}🚀 Setting up environment variables for GearGrab deployment${NC}"
echo -e "${BLUE}Project ID: ${PROJECT_ID}${NC}"
echo -e "${BLUE}Region: ${REGION}${NC}"

# Function to create or update secret
create_or_update_secret() {
    local secret_name=$1
    local secret_value=$2
    local description=$3
    
    echo -e "${YELLOW}📝 Processing secret: ${secret_name}${NC}"
    
    # Check if secret exists
    if gcloud secrets describe "${secret_name}" --project="${PROJECT_ID}" >/dev/null 2>&1; then
        echo -e "${YELLOW}   Secret exists, updating...${NC}"
        echo -n "${secret_value}" | gcloud secrets versions add "${secret_name}" --data-file=- --project="${PROJECT_ID}"
    else
        echo -e "${YELLOW}   Creating new secret...${NC}"
        echo -n "${secret_value}" | gcloud secrets create "${secret_name}" \
            --data-file=- \
            --project="${PROJECT_ID}" \
            --labels="app=geargrab,environment=production" \
            --replication-policy="automatic"
    fi
    
    echo -e "${GREEN}   ✅ Secret ${secret_name} configured${NC}"
}

# Function to grant access to service account
grant_secret_access() {
    local secret_name=$1
    local service_account=$2
    
    echo -e "${YELLOW}🔐 Granting access to ${secret_name} for ${service_account}${NC}"
    
    gcloud secrets add-iam-policy-binding "${secret_name}" \
        --member="serviceAccount:${service_account}" \
        --role="roles/secretmanager.secretAccessor" \
        --project="${PROJECT_ID}" >/dev/null 2>&1
    
    echo -e "${GREEN}   ✅ Access granted${NC}"
}

# Check if gcloud is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "${RED}❌ Error: Not authenticated with gcloud. Please run 'gcloud auth login'${NC}"
    exit 1
fi

# Set project
gcloud config set project "${PROJECT_ID}"

# Enable required APIs
echo -e "${BLUE}🔧 Enabling required APIs...${NC}"
gcloud services enable secretmanager.googleapis.com --project="${PROJECT_ID}"
gcloud services enable run.googleapis.com --project="${PROJECT_ID}"
gcloud services enable cloudbuild.googleapis.com --project="${PROJECT_ID}"
gcloud services enable containerregistry.googleapis.com --project="${PROJECT_ID}"

# Service account for Cloud Run
SERVICE_ACCOUNT_EMAIL="geargrab-cloudrun@${PROJECT_ID}.iam.gserviceaccount.com"

# Create service account if it doesn't exist
if ! gcloud iam service-accounts describe "${SERVICE_ACCOUNT_EMAIL}" --project="${PROJECT_ID}" >/dev/null 2>&1; then
    echo -e "${BLUE}👤 Creating Cloud Run service account...${NC}"
    gcloud iam service-accounts create geargrab-cloudrun \
        --display-name="GearGrab Cloud Run Service Account" \
        --description="Service account for GearGrab Cloud Run deployment" \
        --project="${PROJECT_ID}"
fi

# Create secrets (you'll need to replace these with actual values)
echo -e "${BLUE}🔒 Creating secrets in Secret Manager...${NC}"

# Firebase secrets
read -p "Enter Firebase Private Key (from service account JSON): " -s FIREBASE_PRIVATE_KEY
echo
create_or_update_secret "firebase-private-key" "${FIREBASE_PRIVATE_KEY}" "Firebase service account private key"

read -p "Enter Firebase Client Email (from service account JSON): " FIREBASE_CLIENT_EMAIL
create_or_update_secret "firebase-client-email" "${FIREBASE_CLIENT_EMAIL}" "Firebase service account client email"

# Stripe secrets
read -p "Enter Stripe Secret Key: " -s STRIPE_SECRET_KEY
echo
create_or_update_secret "stripe-secret-key" "${STRIPE_SECRET_KEY}" "Stripe secret key for payments"

read -p "Enter Stripe Webhook Secret: " -s STRIPE_WEBHOOK_SECRET
echo
create_or_update_secret "stripe-webhook-secret" "${STRIPE_WEBHOOK_SECRET}" "Stripe webhook endpoint secret"

# Session secret
SESSION_SECRET=$(openssl rand -base64 32)
create_or_update_secret "session-secret" "${SESSION_SECRET}" "Session encryption secret"

# Grant access to secrets
echo -e "${BLUE}🔐 Granting secret access to service account...${NC}"
grant_secret_access "firebase-private-key" "${SERVICE_ACCOUNT_EMAIL}"
grant_secret_access "firebase-client-email" "${SERVICE_ACCOUNT_EMAIL}"
grant_secret_access "stripe-secret-key" "${SERVICE_ACCOUNT_EMAIL}"
grant_secret_access "stripe-webhook-secret" "${SERVICE_ACCOUNT_EMAIL}"
grant_secret_access "session-secret" "${SERVICE_ACCOUNT_EMAIL}"

# Grant necessary IAM roles to service account
echo -e "${BLUE}👥 Granting IAM roles to service account...${NC}"

# Cloud Run roles
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
    --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
    --role="roles/run.invoker" >/dev/null 2>&1

# Firestore roles
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
    --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
    --role="roles/datastore.user" >/dev/null 2>&1

# Storage roles
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
    --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
    --role="roles/storage.objectAdmin" >/dev/null 2>&1

# Secret Manager roles (already granted above, but ensuring)
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
    --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
    --role="roles/secretmanager.secretAccessor" >/dev/null 2>&1

echo -e "${GREEN}✅ Environment setup completed successfully!${NC}"
echo -e "${BLUE}📋 Summary:${NC}"
echo -e "   • Secrets created in Secret Manager"
echo -e "   • Service account configured: ${SERVICE_ACCOUNT_EMAIL}"
echo -e "   • IAM roles granted"
echo -e "   • APIs enabled"
echo
echo -e "${YELLOW}📝 Next steps:${NC}"
echo -e "   1. Update cloudbuild.yaml substitution variables with your actual values"
echo -e "   2. Run: gcloud builds submit --config cloudbuild.yaml"
echo -e "   3. Your app will be deployed to Cloud Run"
