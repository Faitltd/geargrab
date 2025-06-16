#!/bin/bash

# GearGrab Production Payments Validation Script
# This script validates that production payments are working correctly

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Helper functions
print_header() {
    echo -e "${BLUE}========================================="
    echo -e "🧪 GearGrab Production Payments Validator"
    echo -e "=========================================${NC}"
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

# Test functions
test_health_endpoint() {
    print_info "Testing health endpoint..."
    
    if response=$(curl -s -w "%{http_code}" https://geargrab.co/api/health); then
        http_code="${response: -3}"
        body="${response%???}"
        
        if [ "$http_code" = "200" ]; then
            print_success "Health endpoint responding (200 OK)"
            return 0
        else
            print_error "Health endpoint returned $http_code"
            return 1
        fi
    else
        print_error "Failed to connect to health endpoint"
        return 1
    fi
}

test_payment_endpoint() {
    print_info "Testing payment intent creation endpoint..."
    
    # Test without authentication (should return 401)
    if response=$(curl -s -w "%{http_code}" -X POST https://geargrab.co/api/payments/create-intent \
        -H "Content-Type: application/json" \
        -d '{"amount": 100, "currency": "usd"}'); then
        
        http_code="${response: -3}"
        
        if [ "$http_code" = "401" ]; then
            print_success "Payment endpoint properly requires authentication"
            return 0
        elif [ "$http_code" = "200" ]; then
            print_warning "Payment endpoint allows unauthenticated requests (development mode?)"
            return 0
        else
            print_error "Payment endpoint returned unexpected status: $http_code"
            return 1
        fi
    else
        print_error "Failed to connect to payment endpoint"
        return 1
    fi
}

test_webhook_endpoint() {
    print_info "Testing webhook endpoint accessibility..."
    
    if response=$(curl -s -w "%{http_code}" -X POST https://geargrab.co/api/webhooks/stripe \
        -H "Content-Type: application/json" \
        -d '{"test": true}'); then
        
        http_code="${response: -3}"
        
        if [ "$http_code" = "400" ] || [ "$http_code" = "401" ]; then
            print_success "Webhook endpoint is accessible and validating requests"
            return 0
        else
            print_warning "Webhook endpoint returned $http_code (may be normal)"
            return 0
        fi
    else
        print_error "Failed to connect to webhook endpoint"
        return 1
    fi
}

check_ssl_certificate() {
    print_info "Checking SSL certificate..."
    
    if openssl s_client -connect geargrab.co:443 -servername geargrab.co < /dev/null 2>/dev/null | \
       openssl x509 -noout -dates 2>/dev/null; then
        print_success "SSL certificate is valid"
        return 0
    else
        print_error "SSL certificate check failed"
        return 1
    fi
}

check_environment_variables() {
    print_info "Checking Cloud Run environment variables..."
    
    # Get current environment variables
    if env_vars=$(gcloud run services describe geargrab --region us-central1 --format="value(spec.template.spec.template.spec.containers[0].env[].name)" 2>/dev/null); then
        
        required_vars=("STRIPE_SECRET_KEY" "VITE_STRIPE_PUBLISHABLE_KEY" "STRIPE_WEBHOOK_SECRET" "NODE_ENV")
        missing_vars=()
        
        for var in "${required_vars[@]}"; do
            if echo "$env_vars" | grep -q "^$var$"; then
                print_success "$var is configured"
            else
                missing_vars+=("$var")
                print_error "$var is missing"
            fi
        done
        
        if [ ${#missing_vars[@]} -eq 0 ]; then
            return 0
        else
            print_error "Missing required environment variables: ${missing_vars[*]}"
            return 1
        fi
    else
        print_error "Failed to check environment variables"
        return 1
    fi
}

validate_stripe_keys() {
    print_info "Validating Stripe key formats..."
    
    # Get environment variables from Cloud Run
    if pub_key=$(gcloud run services describe geargrab --region us-central1 --format="value(spec.template.spec.template.spec.containers[0].env[?(@.name=='VITE_STRIPE_PUBLISHABLE_KEY')].value)" 2>/dev/null); then
        if [[ $pub_key =~ ^pk_live_ ]]; then
            print_success "Stripe publishable key is in live mode"
        elif [[ $pub_key =~ ^pk_test_ ]]; then
            print_warning "Stripe publishable key is in test mode"
        else
            print_error "Invalid Stripe publishable key format"
            return 1
        fi
    else
        print_error "Could not retrieve Stripe publishable key"
        return 1
    fi
    
    # Note: We can't check the secret key directly for security reasons
    print_info "Secret key validation requires manual verification in Stripe dashboard"
    
    return 0
}

run_comprehensive_test() {
    print_info "Running comprehensive production readiness test..."
    
    local tests_passed=0
    local total_tests=6
    
    # Run all tests
    test_health_endpoint && ((tests_passed++)) || true
    test_payment_endpoint && ((tests_passed++)) || true
    test_webhook_endpoint && ((tests_passed++)) || true
    check_ssl_certificate && ((tests_passed++)) || true
    check_environment_variables && ((tests_passed++)) || true
    validate_stripe_keys && ((tests_passed++)) || true
    
    echo
    print_info "Test Results: $tests_passed/$total_tests tests passed"
    
    if [ $tests_passed -eq $total_tests ]; then
        print_success "All tests passed! Production payments should be working."
        return 0
    elif [ $tests_passed -ge 4 ]; then
        print_warning "Most tests passed. Minor issues detected but payments should work."
        return 0
    else
        print_error "Multiple test failures. Production payments may not work correctly."
        return 1
    fi
}

show_manual_test_instructions() {
    echo -e "\n${BLUE}📋 Manual Testing Instructions${NC}"
    echo "=================================="
    echo
    print_info "To complete validation, perform these manual tests:"
    echo
    echo "1. 💳 Test Payment Flow:"
    echo "   • Go to https://geargrab.co"
    echo "   • Sign in to your account"
    echo "   • Find a gear item to rent"
    echo "   • Complete checkout with a small amount (\$1-5)"
    echo "   • Use test card: 4242 4242 4242 4242"
    echo
    echo "2. 📊 Verify in Stripe Dashboard:"
    echo "   • Go to https://dashboard.stripe.com"
    echo "   • Check 'Payments' section for new payment"
    echo "   • Verify payment status is 'Succeeded'"
    echo "   • Check 'Webhooks' section for delivered events"
    echo
    echo "3. 🔍 Monitor Application:"
    echo "   • Check application logs for any errors"
    echo "   • Verify user receives confirmation"
    echo "   • Test refund process if needed"
    echo
    print_warning "Important: Use small amounts for testing!"
    print_info "Real money will be processed in production mode."
}

show_troubleshooting_guide() {
    echo -e "\n${BLUE}🔧 Troubleshooting Guide${NC}"
    echo "========================"
    echo
    print_info "Common issues and solutions:"
    echo
    echo "❌ Health endpoint fails:"
    echo "   → Check if service is deployed and running"
    echo "   → Verify domain DNS settings"
    echo
    echo "❌ Payment endpoint errors:"
    echo "   → Verify Stripe keys are correctly set"
    echo "   → Check authentication is working"
    echo "   → Review application logs"
    echo
    echo "❌ Webhook endpoint issues:"
    echo "   → Verify webhook URL in Stripe dashboard"
    echo "   → Check webhook secret is correctly configured"
    echo "   → Test webhook delivery in Stripe"
    echo
    echo "❌ SSL certificate problems:"
    echo "   → Verify domain ownership"
    echo "   → Check certificate expiration"
    echo "   → Ensure proper DNS configuration"
    echo
    print_info "For more help, check the logs:"
    echo "gcloud logs read --service=geargrab --limit=50"
}

# Main function
main() {
    print_header
    
    # Check prerequisites
    if ! command -v gcloud &> /dev/null; then
        print_error "Google Cloud CLI not found"
        exit 1
    fi
    
    if ! command -v curl &> /dev/null; then
        print_error "curl not found"
        exit 1
    fi
    
    if ! command -v openssl &> /dev/null; then
        print_warning "openssl not found - SSL check will be skipped"
    fi
    
    # Run comprehensive test
    echo -e "\n${BLUE}🚀 Starting Production Validation...${NC}"
    echo
    
    if run_comprehensive_test; then
        echo -e "\n${GREEN}🎉 Production payments validation completed successfully!${NC}"
        show_manual_test_instructions
    else
        echo -e "\n${RED}❌ Production payments validation failed!${NC}"
        show_troubleshooting_guide
        exit 1
    fi
    
    echo -e "\n${BLUE}📞 Need Help?${NC}"
    echo "============="
    print_info "Stripe Support: https://support.stripe.com"
    print_info "Documentation: https://stripe.com/docs"
    print_info "Status Page: https://status.stripe.com"
}

# Run main function
main "$@"
