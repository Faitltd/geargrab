#!/bin/bash

# Master Deployment Script for GearGrab
echo "🚀 GearGrab Production Deployment - Complete Flow"
echo "================================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

print_step() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if secrets file exists
if [ ! -f "scripts/env-secrets.sh" ]; then
    print_error "Missing secrets file!"
    echo ""
    echo "Before running this script:"
    echo "1. Copy scripts/env-template.sh to scripts/env-secrets.sh"
    echo "2. Fill in your actual Stripe keys and other secrets"
    echo "3. Run this script again"
    echo ""
    echo "cp scripts/env-template.sh scripts/env-secrets.sh"
    echo "# Edit scripts/env-secrets.sh with your actual keys"
    exit 1
fi

# Make scripts executable
chmod +x scripts/*.sh

print_step "Step 1: Authentication and Project Setup"
./scripts/01-setup-auth.sh
if [ $? -ne 0 ]; then
    print_error "Authentication failed"
    exit 1
fi

echo ""
print_step "Step 2: Build and Deploy"
./scripts/02-build-deploy.sh
if [ $? -ne 0 ]; then
    print_error "Build/Deploy failed"
    exit 1
fi

echo ""
print_step "Step 3: Configure Firebase"
./scripts/03-set-firebase-env.sh
if [ $? -ne 0 ]; then
    print_error "Firebase configuration failed"
    exit 1
fi

echo ""
print_step "Step 4: Configure Stripe"
./scripts/04-set-stripe-env.sh
if [ $? -ne 0 ]; then
    print_error "Stripe configuration failed"
    exit 1
fi

echo ""
print_step "Step 5: Configure Domain"
./scripts/05-configure-domain.sh
if [ $? -ne 0 ]; then
    print_warning "Domain configuration had issues (may already exist)"
fi

echo ""
print_step "Step 6: Verify Deployment"
./scripts/06-verify-deployment.sh

echo ""
print_success "🎉 GearGrab deployment complete!"
echo ""
echo "🌐 Your application is live at:"
echo "   https://geargrab.co"
echo ""
echo "📋 Next steps:"
echo "1. Configure DNS records for geargrab.co"
echo "2. Set up Stripe webhook: https://geargrab.co/api/webhooks/stripe"
echo "3. Test the complete payment flow"
echo "4. Monitor logs and performance"
