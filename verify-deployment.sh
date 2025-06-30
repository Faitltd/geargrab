#!/bin/bash

# GearGrab Deployment Verification Script
# Quick script to verify deployment status

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🔍 GearGrab Deployment Verification${NC}"
echo "=================================="

# Test main site
echo -e "\n${BLUE}Testing main site...${NC}"
MAIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://geargrab.co)
if [ "$MAIN_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Main site (geargrab.co): OK${NC}"
else
    echo -e "${RED}❌ Main site (geargrab.co): Failed (HTTP $MAIN_STATUS)${NC}"
fi

# Test health endpoint
echo -e "\n${BLUE}Testing health endpoint...${NC}"
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://geargrab.co/health)
if [ "$HEALTH_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Health endpoint: OK${NC}"
else
    echo -e "${RED}❌ Health endpoint: Failed (HTTP $HEALTH_STATUS)${NC}"
fi

# Test API endpoints
echo -e "\n${BLUE}Testing API endpoints...${NC}"
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://geargrab.co/api/health)
if [ "$API_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ API health: OK${NC}"
else
    echo -e "${RED}❌ API health: Failed (HTTP $API_STATUS)${NC}"
fi

# Check Cloud Run service
echo -e "\n${BLUE}Checking Cloud Run service...${NC}"
if command -v gcloud &> /dev/null; then
    SERVICE_URL=$(gcloud run services describe geargrab --region=us-central1 --format='value(status.url)' 2>/dev/null)
    if [ ! -z "$SERVICE_URL" ]; then
        echo -e "${GREEN}✅ Cloud Run service: $SERVICE_URL${NC}"
        
        # Test Cloud Run URL directly
        CR_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $SERVICE_URL)
        if [ "$CR_STATUS" = "200" ]; then
            echo -e "${GREEN}✅ Cloud Run direct access: OK${NC}"
        else
            echo -e "${RED}❌ Cloud Run direct access: Failed (HTTP $CR_STATUS)${NC}"
        fi
    else
        echo -e "${RED}❌ Could not get Cloud Run service URL${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  gcloud CLI not available - skipping Cloud Run check${NC}"
fi

# Summary
echo -e "\n${BLUE}Summary:${NC}"
if [ "$MAIN_STATUS" = "200" ] && [ "$HEALTH_STATUS" = "200" ]; then
    echo -e "${GREEN}🎉 Deployment verification PASSED!${NC}"
    echo -e "${GREEN}✅ GearGrab is live and working at https://geargrab.co${NC}"
else
    echo -e "${RED}❌ Deployment verification FAILED!${NC}"
    echo -e "${YELLOW}⚠️  Some endpoints are not responding correctly${NC}"
fi

echo ""
echo "Verification completed at: $(date)"
