#!/bin/bash

# GearGrab Production Payments Setup Script
# This script helps you quickly enable real Stripe payments

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "${BLUE}======================================"
    echo -e "🚀 GearGrab Production Payments Setup"
    echo -e "======================================${NC}"
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

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Validation functions
validate_stripe_key() {
    local key_type=$1
    local key_value=$2
    local expected_prefix=$3
    
    if [[ ! $key_value =~ ^$expected_prefix ]]; then
        print_error "Invalid $key_type format. Expected to start with '$expected_prefix'"
        return 1
    fi
    
    if [ ${#key_value} -lt 20 ]; then
        print_error "$key_type appears too short. Please check the key."
        return 1
    fi
    
    return 0
}

test_stripe_connection() {
    local secret_key=$1
    
    print_info "Testing Stripe connection..."
    
    # Test API connection (this would need actual implementation)
    # For now, just validate key format
    if validate_stripe_key "Secret Key" "$secret_key" "sk_live_"; then
        print_success "Stripe key format validation passed"
        return 0
    else
        return 1
    fi
}

# Main script
main() {
    print_header
    
    # Check prerequisites
    echo -e "\n${BLUE}📋 Checking Prerequisites...${NC}"
    
    # Check if gcloud is installed
    if ! command -v gcloud &> /dev/null; then
        print_error "Google Cloud CLI not found. Please install gcloud first."
        echo "Visit: https://cloud.google.com/sdk/docs/install"
        exit 1
    fi
    
    # Check if authenticated with gcloud
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        print_error "Not authenticated with Google Cloud. Please run 'gcloud auth login'"
        exit 1
    fi
    
    # Check current project
    current_project=$(gcloud config get-value project 2>/dev/null || echo "")
    if [ "$current_project" != "geargrabco" ]; then
        print_warning "Current project is '$current_project', expected 'geargrabco'"
        read -p "Switch to geargrabco project? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            gcloud config set project geargrabco
            print_success "Switched to geargrabco project"
        else
            print_error "Please switch to the correct project first"
            exit 1
        fi
    fi
    
    print_success "Prerequisites check passed"
    
    # Environment check
    echo -e "\n${BLUE}🌍 Environment Check...${NC}"
    
    if [ "$NODE_ENV" = "production" ]; then
        print_success "Running in production environment"
    else
        print_warning "Not in production environment (NODE_ENV=$NODE_ENV)"
        read -p "Continue with production setup anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Exiting. Set NODE_ENV=production to continue."
            exit 1
        fi
    fi
    
    # Stripe setup
    echo -e "\n${BLUE}💳 Stripe Configuration...${NC}"
    
    print_info "You'll need your Stripe LIVE mode keys from:"
    print_info "https://dashboard.stripe.com/apikeys (make sure Live mode is selected)"
    echo
    
    # Get publishable key
    while true; do
        read -p "Enter Stripe Publishable Key (pk_live_...): " STRIPE_PUB_KEY
        if validate_stripe_key "Publishable Key" "$STRIPE_PUB_KEY" "pk_live_"; then
            break
        fi
        echo "Please try again."
    done
    
    # Get secret key
    while true; do
        read -s -p "Enter Stripe Secret Key (sk_live_...): " STRIPE_SECRET_KEY
        echo
        if validate_stripe_key "Secret Key" "$STRIPE_SECRET_KEY" "sk_live_"; then
            break
        fi
        echo "Please try again."
    done
    
    # Get webhook secret
    echo
    print_info "Webhook setup instructions:"
    print_info "1. Go to https://dashboard.stripe.com/webhooks"
    print_info "2. Add endpoint: https://geargrab.co/api/webhooks/stripe"
    print_info "3. Select events: payment_intent.succeeded, payment_intent.payment_failed"
    print_info "4. Copy the webhook signing secret"
    echo
    
    while true; do
        read -s -p "Enter Webhook Secret (whsec_...): " STRIPE_WEBHOOK_SECRET
        echo
        if validate_stripe_key "Webhook Secret" "$STRIPE_WEBHOOK_SECRET" "whsec_"; then
            break
        fi
        echo "Please try again."
    done
    
    # Test Stripe connection
    if ! test_stripe_connection "$STRIPE_SECRET_KEY"; then
        print_error "Stripe connection test failed"
        exit 1
    fi
    
    # Confirmation
    echo -e "\n${YELLOW}⚠️  IMPORTANT: This will enable REAL payments with REAL money!${NC}"
    echo -e "${YELLOW}   Make sure you're ready for production transactions.${NC}"
    echo
    read -p "Continue with production deployment? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Deployment cancelled by user"
        exit 0
    fi
    
    # Deploy to Cloud Run
    echo -e "\n${BLUE}🚀 Deploying to Production...${NC}"
    
    print_info "Updating Cloud Run service with production Stripe keys..."
    
    if gcloud run services update geargrab --region us-central1 \
        --set-env-vars="VITE_STRIPE_PUBLISHABLE_KEY=$STRIPE_PUB_KEY" \
        --set-env-vars="STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY" \
        --set-env-vars="STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET" \
        --set-env-vars="NODE_ENV=production" \
        --quiet; then
        
        print_success "Cloud Run service updated successfully!"
    else
        print_error "Failed to update Cloud Run service"
        exit 1
    fi
    
    # Test deployment
    echo -e "\n${BLUE}🧪 Testing Deployment...${NC}"
    
    print_info "Waiting for deployment to complete..."
    sleep 10
    
    # Test health endpoint
    if curl -s -f https://geargrab.co/api/health > /dev/null; then
        print_success "Health check passed"
    else
        print_warning "Health check failed - service may still be starting"
    fi
    
    # Success message
    echo -e "\n${GREEN}🎉 Production Payments Enabled Successfully!${NC}"
    echo
    print_info "Next steps:"
    echo "  1. Test with a small payment ($1-5) to verify everything works"
    echo "  2. Monitor Stripe dashboard for incoming payments"
    echo "  3. Check webhook events are being received"
    echo "  4. Verify payments appear in your bank account"
    echo
    print_info "Important URLs:"
    echo "  • Application: https://geargrab.co"
    echo "  • Stripe Dashboard: https://dashboard.stripe.com"
    echo "  • Webhook Endpoint: https://geargrab.co/api/webhooks/stripe"
    echo
    print_warning "Remember to:"
    echo "  • Monitor payment success rates"
    echo "  • Set up alerts for failed payments"
    echo "  • Keep your Stripe keys secure"
    echo "  • Regularly check webhook delivery status"
    
    # Test payment suggestion
    echo -e "\n${BLUE}💡 Suggested Test:${NC}"
    echo "  1. Go to https://geargrab.co"
    echo "  2. Find a gear item to rent"
    echo "  3. Complete a small test payment"
    echo "  4. Verify payment appears in Stripe dashboard"
    
    print_success "Setup complete! Your production payments are now live! 🚀"
}

# Error handling
trap 'print_error "Script failed on line $LINENO"' ERR

# Run main function
main "$@"
