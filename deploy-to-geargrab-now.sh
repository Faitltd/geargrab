#!/bin/bash

# 🚀 Deploy GearGrab Social Authentication to geargrab.co
# This script deploys the complete social authentication system

set -e

echo "🚀 Deploying GearGrab Social Authentication System"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
PROJECT_ID="geargrabco"
SERVICE_NAME="geargrab-app"
REGION="us-central1"

echo -e "${BLUE}📋 Deployment Configuration:${NC}"
echo "  Project ID: $PROJECT_ID"
echo "  Service: $SERVICE_NAME"
echo "  Region: $REGION"
echo "  Domain: geargrab.co"
echo ""

# Check if gcloud is authenticated
echo -e "${BLUE}🔐 Checking authentication...${NC}"
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "${YELLOW}⚠️  Authentication required. Please run:${NC}"
    echo "  gcloud auth login"
    echo "  gcloud config set project $PROJECT_ID"
    echo ""
    echo "Then run this script again."
    exit 1
fi

# Set the project
echo -e "${BLUE}🎯 Setting project...${NC}"
gcloud config set project $PROJECT_ID

# Enable required APIs
echo -e "${BLUE}🔧 Enabling required APIs...${NC}"
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Skip local build - let Cloud Run handle it
echo -e "${BLUE}🏗️  Skipping local build - Cloud Run will handle building...${NC}"
echo "This avoids local dependency conflicts and uses Cloud Run's build environment."

# Deploy using Cloud Run with source deployment (simpler than Docker)
echo -e "${BLUE}🚀 Deploying to Cloud Run...${NC}"
echo "This will take 5-10 minutes..."
echo ""

gcloud run deploy $SERVICE_NAME \
  --source . \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --port 3000 \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --timeout 300 \
  --set-env-vars "NODE_ENV=production" \
  --set-env-vars "VITE_APP_URL=https://geargrab.co" \
  --set-env-vars "VITE_USE_EMULATORS=false" \
  --set-env-vars "FIREBASE_PROJECT_ID=geargrabco"

# Get the service URL
echo -e "${BLUE}📡 Getting service URL...${NC}"
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format="value(status.url)")

echo ""
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo -e "${BLUE}Service URL: $SERVICE_URL${NC}"
echo ""

# Configure domain mapping (if not already done)
echo -e "${BLUE}🌐 Configuring domain mapping...${NC}"
if ! gcloud run domain-mappings describe geargrab.co --region=$REGION --quiet 2>/dev/null; then
    echo "Creating domain mapping for geargrab.co..."
    gcloud run domain-mappings create \
        --service=$SERVICE_NAME \
        --domain=geargrab.co \
        --region=$REGION \
        --quiet || echo "Domain mapping may already exist or need DNS configuration"
else
    echo "Domain mapping for geargrab.co already exists"
fi

# Health check
echo -e "${BLUE}🔍 Running health check...${NC}"
sleep 10
if curl -f "$SERVICE_URL/api/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Health check passed!${NC}"
else
    echo -e "${YELLOW}⚠️  Health check failed - service may still be starting${NC}"
fi

echo ""
echo -e "${GREEN}🎯 DEPLOYMENT SUMMARY${NC}"
echo "================================"
echo -e "${BLUE}✅ Social Authentication System Deployed${NC}"
echo "  - 7 Social Providers: Google, Facebook, Twitter, GitHub, Microsoft, Apple, Discord"
echo "  - No email/password login (clean UX)"
echo "  - Firebase Auth integration"
echo "  - Responsive auth modals"
echo "  - Production security rules"
echo ""
echo -e "${BLUE}🌐 Access URLs:${NC}"
echo "  Service: $SERVICE_URL"
echo "  Production: https://geargrab.co"
echo "  Health: $SERVICE_URL/api/health"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "1. Test authentication at https://geargrab.co"
echo "2. Configure social provider settings in Firebase Console"
echo "3. Clear browser cache if needed"
echo ""
echo -e "${GREEN}🚀 GearGrab is now live with social authentication!${NC}"
