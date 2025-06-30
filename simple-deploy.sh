#!/bin/bash

# Simple GearGrab Deployment Script
# Run this to deploy to Cloud Run

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Simple GearGrab Deployment${NC}"
echo -e "${BLUE}=============================${NC}"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Please run this script from the project root.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Project structure verified${NC}"

# Build the application
echo -e "${BLUE}📦 Building application...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed. Please check for build errors.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build completed successfully${NC}"

# Deploy to Cloud Run
echo -e "${BLUE}🚀 Deploying to Cloud Run...${NC}"
echo -e "${YELLOW}⚠️ Make sure you're authenticated with gcloud first:${NC}"
echo -e "${YELLOW}   gcloud auth login${NC}"
echo -e "${YELLOW}   gcloud config set project geargrabco${NC}"
echo ""

gcloud run deploy geargrab \
    --source . \
    --region us-central1 \
    --platform managed \
    --allow-unauthenticated \
    --port 8080 \
    --memory 2Gi \
    --cpu 2 \
    --max-instances 10 \
    --timeout 300 \
    --concurrency 80 \
    --set-env-vars NODE_ENV=production \
    --set-env-vars PORT=8080 \
    --set-env-vars HOST=0.0.0.0 \
    --set-env-vars VITE_USE_EMULATORS=false \
    --set-env-vars VITE_APP_URL=https://geargrab.co \
    --set-env-vars FIREBASE_PROJECT_ID=geargrabco \
    --set-env-vars FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-fbsvc@geargrabco.iam.gserviceaccount.com

DEPLOY_STATUS=$?

if [ $DEPLOY_STATUS -eq 0 ]; then
    echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
    echo -e "${BLUE}🌐 Application should be available at: https://geargrab.co${NC}"
    echo -e "${YELLOW}⏳ Please wait 1-2 minutes for the deployment to fully propagate${NC}"
    
    echo ""
    echo -e "${BLUE}🧪 Running tests...${NC}"
    sleep 10
    ./test-deployment.sh
else
    echo -e "${RED}❌ Deployment failed with status: $DEPLOY_STATUS${NC}"
    exit 1
fi
