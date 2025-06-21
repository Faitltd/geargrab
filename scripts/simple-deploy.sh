#!/bin/bash

# ⚡ Simple Deploy (Code Changes Only)
# This script does a fast deployment without changing environment variables

set -e

echo "⚡ Simple Deploy GearGrab"
echo "========================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}This is a simple deployment that preserves existing environment variables.${NC}"
echo -e "${YELLOW}Use this when you only need to deploy code changes.${NC}"
echo ""

read -p "Continue with simple deployment? (y/N): " confirm
if [[ ! $confirm =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

echo ""
echo -e "${BLUE}Starting simple deployment...${NC}"
echo "This will take 5-10 minutes..."
echo ""

# Deploy without changing environment variables
gcloud run deploy geargrab \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000 \
  --memory 1Gi \
  --cpu 1 \
  --max-instances 10 \
  --timeout 300

echo ""
echo -e "${GREEN}🎉 Simple deployment complete!${NC}"

# Get the service URL
SERVICE_URL=$(gcloud run services describe geargrab --region us-central1 --format="value(status.url)")
echo -e "${BLUE}Service URL: $SERVICE_URL${NC}"

echo ""
echo -e "${YELLOW}Post-deployment checklist:${NC}"
echo "1. Clear browser cache completely"
echo "2. Test homepage: $SERVICE_URL"
echo "3. Test authentication flows"
echo "4. Check browser console for errors"
echo ""
echo -e "${BLUE}If you see 500 errors:${NC}"
echo "- Run: ./scripts/fix-500-errors.sh"
echo "- Then: ./scripts/deploy-with-env.sh"
