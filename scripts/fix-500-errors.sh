#!/bin/bash

# 🔧 Fix 500 Errors - Step-by-Step Script
# This script fixes the Firebase Admin SDK initialization issues causing 500 errors

set -e  # Exit on any error

echo "🔧 GearGrab 500 Error Fix - Step by Step"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Check current status
echo -e "${BLUE}Step 1: Checking current deployment status...${NC}"
echo "Current Cloud Run URL:"
gcloud run services describe geargrab --region us-central1 --format="value(status.url)" 2>/dev/null || echo "❌ Service not found"

echo ""
echo -e "${BLUE}Step 2: Checking environment variables...${NC}"
echo "Checking if Firebase Admin env vars are set..."

# Check if we have the required environment variables locally
if [ -z "$FIREBASE_PROJECT_ID" ] || [ -z "$FIREBASE_ADMIN_CLIENT_EMAIL" ] || [ -z "$FIREBASE_ADMIN_PRIVATE_KEY" ]; then
    echo -e "${RED}❌ Missing Firebase Admin environment variables${NC}"
    echo ""
    echo "Required variables:"
    echo "  - FIREBASE_PROJECT_ID"
    echo "  - FIREBASE_ADMIN_CLIENT_EMAIL" 
    echo "  - FIREBASE_ADMIN_PRIVATE_KEY"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Run: ./scripts/setup-firebase-admin.sh"
    echo "2. Then run: ./scripts/deploy-with-env.sh"
    exit 1
else
    echo -e "${GREEN}✅ Firebase Admin environment variables found locally${NC}"
fi

echo ""
echo -e "${BLUE}Step 3: Checking Cloud Run environment variables...${NC}"

# Check if Cloud Run service has environment variables
ENV_COUNT=$(gcloud run services describe geargrab --region us-central1 --format="value(spec.template.spec.template.spec.containers[0].env[].name)" 2>/dev/null | wc -l)

if [ "$ENV_COUNT" -eq 0 ]; then
    echo -e "${RED}❌ No environment variables set in Cloud Run${NC}"
    echo ""
    echo -e "${YELLOW}This is the cause of the 500 errors!${NC}"
    echo ""
    echo "Next step: Run ./scripts/deploy-with-env.sh to fix this"
    exit 1
else
    echo -e "${GREEN}✅ Environment variables are set in Cloud Run${NC}"
    echo "Count: $ENV_COUNT variables"
fi

echo ""
echo -e "${BLUE}Step 4: Checking recent logs for errors...${NC}"

# Get recent logs
echo "Recent error logs:"
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=geargrab AND severity>=ERROR" --limit=5 --format="table(timestamp,severity,textPayload)" 2>/dev/null || echo "No recent error logs found"

echo ""
echo -e "${GREEN}✅ Diagnosis complete!${NC}"
echo ""
echo -e "${YELLOW}Summary:${NC}"
echo "- If you see 'Firebase Admin not available' in logs → Run ./scripts/deploy-with-env.sh"
echo "- If you see missing env vars → Run ./scripts/setup-firebase-admin.sh first"
echo "- If deployment is needed → Run ./scripts/quick-deploy.sh"
echo ""
echo "Choose the appropriate script based on the diagnosis above."
