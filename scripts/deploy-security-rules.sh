#!/bin/bash

# Deploy Security Rules Script
# Deploys the updated Firestore and Storage security rules

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔒 Deploying Firebase Security Rules${NC}"
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}❌ Firebase CLI is not installed${NC}"
    echo "Please install it with: npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in
if ! firebase projects:list &> /dev/null; then
    echo -e "${YELLOW}⚠️ Not logged in to Firebase${NC}"
    echo "Please run: firebase login"
    exit 1
fi

# Get current project
PROJECT=$(firebase use --json | jq -r '.result.project // empty')
if [ -z "$PROJECT" ]; then
    echo -e "${RED}❌ No Firebase project selected${NC}"
    echo "Please run: firebase use <project-id>"
    exit 1
fi

echo -e "${BLUE}📋 Current project: ${PROJECT}${NC}"
echo ""

# Backup current rules
echo -e "${YELLOW}📦 Backing up current rules...${NC}"
mkdir -p backups/$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"

# Download current rules
firebase firestore:rules:get > "${BACKUP_DIR}/firestore.rules.backup" 2>/dev/null || echo "No existing Firestore rules"
firebase storage:rules:get > "${BACKUP_DIR}/storage.rules.backup" 2>/dev/null || echo "No existing Storage rules"

echo -e "${GREEN}✅ Rules backed up to ${BACKUP_DIR}${NC}"

# Validate new rules
echo -e "${YELLOW}🔍 Validating new rules...${NC}"

# Test Firestore rules
if firebase firestore:rules:validate firestore.rules; then
    echo -e "${GREEN}✅ Firestore rules are valid${NC}"
else
    echo -e "${RED}❌ Firestore rules validation failed${NC}"
    exit 1
fi

# Test Storage rules
if firebase storage:rules:validate storage.rules; then
    echo -e "${GREEN}✅ Storage rules are valid${NC}"
else
    echo -e "${RED}❌ Storage rules validation failed${NC}"
    exit 1
fi

# Deploy rules
echo ""
echo -e "${YELLOW}🚀 Deploying rules...${NC}"

# Deploy Firestore rules
echo "Deploying Firestore rules..."
if firebase deploy --only firestore:rules; then
    echo -e "${GREEN}✅ Firestore rules deployed successfully${NC}"
else
    echo -e "${RED}❌ Failed to deploy Firestore rules${NC}"
    exit 1
fi

# Deploy Storage rules
echo "Deploying Storage rules..."
if firebase deploy --only storage:rules; then
    echo -e "${GREEN}✅ Storage rules deployed successfully${NC}"
else
    echo -e "${RED}❌ Failed to deploy Storage rules${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Security rules deployed successfully!${NC}"
echo ""

# Show security improvements
echo -e "${BLUE}🔒 Security Improvements Applied:${NC}"
echo "✅ Authentication required for all data access"
echo "✅ Comprehensive data validation"
echo "✅ File upload restrictions (size, type, naming)"
echo "✅ Role-based access control"
echo "✅ Performance optimizations"
echo "✅ Protection against data injection"
echo ""

# Show next steps
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "1. Update your client applications to handle authentication requirements"
echo "2. Implement custom claims in your server-side code"
echo "3. Test all functionality with the new rules"
echo "4. Monitor Firebase console for any rule violations"
echo ""

# Show custom claims setup reminder
echo -e "${YELLOW}⚠️ Important: Custom Claims Setup Required${NC}"
echo "The new storage rules use custom claims for better performance."
echo "Make sure to integrate the custom claims system:"
echo ""
echo "1. Use src/lib/auth/customClaims.js for server-side claim management"
echo "2. Call claim functions when users create/delete resources:"
echo "   - onListingCreated() when listings are created"
echo "   - onBookingCreated() when bookings are made"
echo "   - onMessageCreated() when conversations start"
echo "3. Use the /api/auth/claims endpoint for claim management"
echo ""

echo -e "${GREEN}🔐 Your Firebase security is now enterprise-level!${NC}"
