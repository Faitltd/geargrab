#!/bin/bash

# 🔍 Check Deployment Status and Health
# This script checks if the deployment is working correctly

set -e

echo "🔍 GearGrab Deployment Health Check"
echo "==================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get service URL
echo -e "${BLUE}Getting service information...${NC}"
SERVICE_URL=$(gcloud run services describe geargrab --region us-central1 --format="value(status.url)" 2>/dev/null)

if [ -z "$SERVICE_URL" ]; then
    echo -e "${RED}❌ Could not get service URL${NC}"
    echo "Make sure the service is deployed: ./scripts/deploy-with-env.sh"
    exit 1
fi

echo -e "${GREEN}✅ Service URL: $SERVICE_URL${NC}"

echo ""
echo -e "${BLUE}Checking environment variables in Cloud Run...${NC}"

# Check environment variables
ENV_VARS=$(gcloud run services describe geargrab --region us-central1 --format="value(spec.template.spec.template.spec.containers[0].env[].name)" 2>/dev/null)

if [ -z "$ENV_VARS" ]; then
    echo -e "${RED}❌ No environment variables set in Cloud Run${NC}"
    echo "This is likely the cause of 500 errors!"
    echo "Run: ./scripts/deploy-with-env.sh"
    exit 1
else
    echo -e "${GREEN}✅ Environment variables found:${NC}"
    echo "$ENV_VARS" | while read var; do
        echo "  - $var"
    done
fi

echo ""
echo -e "${BLUE}Testing endpoints...${NC}"

# Test homepage
echo "Testing homepage..."
HOMEPAGE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$SERVICE_URL" || echo "000")
echo "  Homepage: $HOMEPAGE_STATUS"

# Test auth endpoints
echo "Testing auth endpoints..."
LOGIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$SERVICE_URL/auth/login" || echo "000")
echo "  Login page: $LOGIN_STATUS"

# Test API endpoints
echo "Testing API endpoints..."
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$SERVICE_URL/api/payments/create-intent" || echo "000")
echo "  Payment API: $API_STATUS (401 expected for unauthenticated)"

echo ""
echo -e "${BLUE}Checking recent logs...${NC}"

# Check for errors in logs
echo "Recent error logs:"
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=geargrab AND severity>=ERROR" --limit=5 --format="table(timestamp,severity,textPayload)" 2>/dev/null || echo "No recent errors"

echo ""
echo "Recent Firebase Admin logs:"
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=geargrab AND textPayload:\"Firebase Admin\"" --limit=3 --format="value(textPayload)" 2>/dev/null || echo "No Firebase Admin logs found"

echo ""
echo -e "${BLUE}Health Summary:${NC}"

# Determine overall health
ISSUES=()

if [ "$HOMEPAGE_STATUS" != "200" ]; then
    ISSUES+=("Homepage not loading (Status: $HOMEPAGE_STATUS)")
fi

if [ "$LOGIN_STATUS" != "200" ]; then
    ISSUES+=("Login page not loading (Status: $LOGIN_STATUS)")
fi

if [ -z "$ENV_VARS" ]; then
    ISSUES+=("No environment variables set")
fi

if [ ${#ISSUES[@]} -eq 0 ]; then
    echo -e "${GREEN}✅ Deployment appears healthy!${NC}"
    echo ""
    echo -e "${YELLOW}Next steps for testing:${NC}"
    echo "1. Clear browser cache completely"
    echo "2. Visit: $SERVICE_URL"
    echo "3. Test sign-in navigation"
    echo "4. Check browser console for errors"
else
    echo -e "${RED}❌ Issues found:${NC}"
    for issue in "${ISSUES[@]}"; do
        echo "  - $issue"
    done
    echo ""
    echo -e "${YELLOW}Recommended fixes:${NC}"
    if [[ " ${ISSUES[@]} " =~ "No environment variables set" ]]; then
        echo "  - Run: ./scripts/deploy-with-env.sh"
    fi
    if [[ " ${ISSUES[@]} " =~ "Homepage not loading" ]]; then
        echo "  - Check build logs: gcloud logging read 'resource.type=cloud_run_revision'"
    fi
fi

echo ""
echo -e "${BLUE}Quick test commands:${NC}"
echo "Test homepage: curl -I $SERVICE_URL"
echo "Test login: curl -I $SERVICE_URL/auth/login"
echo "View logs: gcloud logging read 'resource.type=cloud_run_revision AND resource.labels.service_name=geargrab' --limit=10"
