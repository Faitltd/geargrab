#!/bin/bash

# 🔧 Master Script: Fix Authentication & 500 Errors
# This script guides you through fixing all authentication and deployment issues

set -e

echo "🔧 GearGrab Authentication & 500 Error Fix"
echo "==========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${BLUE}This script will guide you through fixing authentication and 500 errors.${NC}"
echo ""

# Step 1: Diagnose the current issue
echo -e "${PURPLE}Step 1: Diagnosing current issues...${NC}"
echo "Running diagnosis script..."
echo ""

if [ -f "./scripts/fix-500-errors.sh" ]; then
    chmod +x ./scripts/fix-500-errors.sh
    ./scripts/fix-500-errors.sh
    DIAGNOSIS_EXIT_CODE=$?
else
    echo -e "${RED}❌ Diagnosis script not found${NC}"
    DIAGNOSIS_EXIT_CODE=1
fi

echo ""
echo -e "${PURPLE}Step 2: Choose your fix based on diagnosis...${NC}"
echo ""

if [ $DIAGNOSIS_EXIT_CODE -ne 0 ]; then
    echo -e "${YELLOW}Based on the diagnosis, you need to fix environment variables.${NC}"
    echo ""
    echo "Available options:"
    echo "1. Setup Firebase Admin credentials (if missing)"
    echo "2. Deploy with environment variables (if credentials exist)"
    echo "3. Simple code deployment (if env vars are already set)"
    echo "4. Check deployment health"
    echo ""
    
    read -p "Choose an option (1-4): " choice
    
    case $choice in
        1)
            echo ""
            echo -e "${BLUE}Setting up Firebase Admin credentials...${NC}"
            if [ -f "./scripts/setup-firebase-admin.sh" ]; then
                chmod +x ./scripts/setup-firebase-admin.sh
                ./scripts/setup-firebase-admin.sh
            else
                echo -e "${RED}❌ Setup script not found${NC}"
                exit 1
            fi
            
            echo ""
            echo -e "${YELLOW}Now run option 2 to deploy with the new credentials.${NC}"
            read -p "Deploy now? (y/N): " deploy_now
            if [[ $deploy_now =~ ^[Yy]$ ]]; then
                if [ -f "./scripts/deploy-with-env.sh" ]; then
                    chmod +x ./scripts/deploy-with-env.sh
                    ./scripts/deploy-with-env.sh
                fi
            fi
            ;;
        2)
            echo ""
            echo -e "${BLUE}Deploying with environment variables...${NC}"
            if [ -f "./scripts/deploy-with-env.sh" ]; then
                chmod +x ./scripts/deploy-with-env.sh
                ./scripts/deploy-with-env.sh
            else
                echo -e "${RED}❌ Deploy script not found${NC}"
                exit 1
            fi
            ;;
        3)
            echo ""
            echo -e "${BLUE}Simple code deployment...${NC}"
            if [ -f "./scripts/simple-deploy.sh" ]; then
                chmod +x ./scripts/simple-deploy.sh
                ./scripts/simple-deploy.sh
            else
                echo -e "${RED}❌ Simple deploy script not found${NC}"
                exit 1
            fi
            ;;
        4)
            echo ""
            echo -e "${BLUE}Checking deployment health...${NC}"
            if [ -f "./scripts/check-deployment.sh" ]; then
                chmod +x ./scripts/check-deployment.sh
                ./scripts/check-deployment.sh
            else
                echo -e "${RED}❌ Health check script not found${NC}"
                exit 1
            fi
            ;;
        *)
            echo -e "${RED}Invalid option${NC}"
            exit 1
            ;;
    esac
else
    echo -e "${GREEN}✅ No issues found! Your deployment appears to be working.${NC}"
    echo ""
    echo -e "${YELLOW}If you're still experiencing issues:${NC}"
    echo "1. Clear your browser cache completely"
    echo "2. Try incognito/private browsing mode"
    echo "3. Check browser console for JavaScript errors"
fi

echo ""
echo -e "${PURPLE}Step 3: Final verification...${NC}"
echo ""

# Get service URL for testing
SERVICE_URL=$(gcloud run services describe geargrab --region us-central1 --format="value(status.url)" 2>/dev/null || echo "")

if [ ! -z "$SERVICE_URL" ]; then
    echo -e "${BLUE}Your GearGrab URL: $SERVICE_URL${NC}"
    echo ""
    echo -e "${YELLOW}Final testing checklist:${NC}"
    echo "1. ✅ Clear browser cache (Ctrl+Shift+Delete)"
    echo "2. ✅ Visit: $SERVICE_URL"
    echo "3. ✅ Test sign-in navigation (should go to /auth/login)"
    echo "4. ✅ Test Google authentication"
    echo "5. ✅ Test payment forms (should work when logged in)"
    echo ""
    echo -e "${GREEN}🎉 Authentication fix process complete!${NC}"
else
    echo -e "${RED}❌ Could not get service URL. Deployment may have failed.${NC}"
fi

echo ""
echo -e "${BLUE}Need help? Check these files:${NC}"
echo "- SIGN_IN_NAVIGATION_FIX.md"
echo "- CACHE_CLEARING_GUIDE.md"
echo "- AUTHENTICATION_FIXES_SUMMARY.md"
