#!/bin/bash

# 🚀 Deploy GearGrab with Environment Variables
# This script deploys the app with all required environment variables

set -e

echo "🚀 Deploy GearGrab with Environment Variables"
echo "============================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Load environment variables from .env if it exists
if [ -f ".env" ]; then
    echo -e "${BLUE}Loading environment variables from .env...${NC}"

    # Source the .env file instead of using export with xargs
    # This handles multi-line variables like private keys properly
    set -a  # automatically export all variables
    source .env
    set +a  # stop automatically exporting

    echo -e "${GREEN}✅ Environment variables loaded${NC}"
else
    echo -e "${YELLOW}⚠️ No .env file found${NC}"
fi

echo ""
echo -e "${BLUE}Checking required environment variables...${NC}"

# Check Firebase Admin variables
MISSING_VARS=()

if [ -z "$FIREBASE_PROJECT_ID" ]; then
    MISSING_VARS+=("FIREBASE_PROJECT_ID")
fi

if [ -z "$FIREBASE_ADMIN_CLIENT_EMAIL" ]; then
    MISSING_VARS+=("FIREBASE_ADMIN_CLIENT_EMAIL")
fi

if [ -z "$FIREBASE_ADMIN_PRIVATE_KEY" ]; then
    MISSING_VARS+=("FIREBASE_ADMIN_PRIVATE_KEY")
fi

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo -e "${RED}❌ Missing required environment variables:${NC}"
    for var in "${MISSING_VARS[@]}"; do
        echo "  - $var"
    done
    echo ""
    echo -e "${YELLOW}Run ./scripts/setup-firebase-admin.sh first${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All required environment variables found${NC}"
echo "  FIREBASE_PROJECT_ID: $FIREBASE_PROJECT_ID"
echo "  FIREBASE_ADMIN_CLIENT_EMAIL: ${FIREBASE_ADMIN_CLIENT_EMAIL:0:30}..."
echo "  FIREBASE_ADMIN_PRIVATE_KEY: [Present]"

echo ""
echo -e "${BLUE}Building deployment command...${NC}"

# Build environment variables string for gcloud deployment
ENV_VARS="FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID,FIREBASE_ADMIN_CLIENT_EMAIL=$FIREBASE_ADMIN_CLIENT_EMAIL,FIREBASE_ADMIN_PRIVATE_KEY=$FIREBASE_ADMIN_PRIVATE_KEY"

# Add optional environment variables if they exist
if [ ! -z "$STRIPE_SECRET_KEY" ]; then
    ENV_VARS="$ENV_VARS,STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY"
    echo "  + STRIPE_SECRET_KEY: [Present]"
fi

if [ ! -z "$STRIPE_WEBHOOK_SECRET" ]; then
    ENV_VARS="$ENV_VARS,STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET"
    echo "  + STRIPE_WEBHOOK_SECRET: [Present]"
fi

# Build the gcloud run deploy command using set-env-vars
DEPLOY_CMD="gcloud run deploy geargrab \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000 \
  --memory 1Gi \
  --cpu 1 \
  --max-instances 10 \
  --timeout 300 \
  --set-env-vars=\"$ENV_VARS\""

echo ""
echo -e "${YELLOW}Starting deployment...${NC}"
echo "This will take 5-10 minutes..."
echo ""

# Execute the deployment
eval $DEPLOY_CMD
DEPLOY_EXIT_CODE=$?

if [ $DEPLOY_EXIT_CODE -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 Deployment complete!${NC}"
else
    echo ""
    echo -e "${RED}❌ Deployment failed with exit code: $DEPLOY_EXIT_CODE${NC}"
    exit $DEPLOY_EXIT_CODE
fi
echo ""

# Get the service URL
SERVICE_URL=$(gcloud run services describe geargrab --region us-central1 --format="value(status.url)")
echo -e "${BLUE}Service URL: $SERVICE_URL${NC}"

echo ""
echo -e "${BLUE}Testing deployment...${NC}"

# Test the deployment
echo "Testing homepage..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$SERVICE_URL" || echo "000")

if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Homepage loads successfully (200)${NC}"
else
    echo -e "${RED}❌ Homepage returned status: $HTTP_STATUS${NC}"
fi

echo ""
echo -e "${BLUE}Checking logs for Firebase Admin initialization...${NC}"
sleep 5  # Wait a moment for logs to appear

# Check recent logs for Firebase Admin status
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=geargrab AND textPayload:\"Firebase Admin\"" --limit=3 --format="value(textPayload)" 2>/dev/null || echo "No Firebase Admin logs found yet"

echo ""
echo -e "${GREEN}✅ Deployment with environment variables complete!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Clear your browser cache completely"
echo "2. Test authentication at: $SERVICE_URL/auth/login"
echo "3. Check that sign-in navigation works properly"
echo "4. Verify payment forms load without 401 errors"
echo ""
echo -e "${BLUE}If you still see issues:${NC}"
echo "- Run: ./scripts/check-deployment.sh"
echo "- Check browser console for any remaining errors"
