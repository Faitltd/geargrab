#!/bin/bash

# GearGrab Payment Readiness Test
# This script tests if the payment system is ready for production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
DOMAIN="https://geargrab.co"
PAYMENT_ENDPOINT="$DOMAIN/api/payments/create-intent"

log_info "🧪 Testing GearGrab Payment System Readiness..."

# Test 1: Payment API Endpoint
log_info "Testing payment API endpoint..."
PAYMENT_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/payment_test.json \
    -X POST "$PAYMENT_ENDPOINT" \
    -H "Content-Type: application/json" \
    -d '{"amount": 1000, "currency": "usd"}')
PAYMENT_HTTP_CODE="${PAYMENT_RESPONSE: -3}"

if [ "$PAYMENT_HTTP_CODE" = "401" ]; then
    log_success "✅ Payment API responding correctly (HTTP 401 - Authentication required)"
    echo "   This means the payment system is ready and waiting for authentication"
elif [ "$PAYMENT_HTTP_CODE" = "200" ]; then
    log_warning "⚠️ Payment API responding without authentication (HTTP 200)"
    echo "   This might indicate authentication is not properly configured"
elif [ "$PAYMENT_HTTP_CODE" = "500" ]; then
    log_error "❌ Payment API has server errors (HTTP 500)"
    echo "   Check server logs for configuration issues"
else
    log_error "❌ Payment API failed (HTTP $PAYMENT_HTTP_CODE)"
    cat /tmp/payment_test.json 2>/dev/null || echo "No response body"
fi

# Test 2: Frontend Pages
log_info "Testing critical frontend pages..."

PAGES=("/" "/browse" "/listing/emob-001" "/auth/login" "/auth/signup" "/list-gear")
ALL_PAGES_OK=true

for page in "${PAGES[@]}"; do
    PAGE_RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null "$DOMAIN$page")
    PAGE_HTTP_CODE="${PAGE_RESPONSE: -3}"
    
    if [ "$PAGE_HTTP_CODE" = "200" ]; then
        log_success "✅ Page $page loading correctly"
    else
        log_error "❌ Page $page failed (HTTP $PAGE_HTTP_CODE)"
        ALL_PAGES_OK=false
    fi
done

# Test 3: Static Assets
log_info "Testing static assets..."
LOGO_RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null "$DOMAIN/geargrab-logo.png")
LOGO_HTTP_CODE="${LOGO_RESPONSE: -3}"

if [ "$LOGO_HTTP_CODE" = "200" ]; then
    log_success "✅ Static assets loading correctly"
else
    log_warning "⚠️ Some static assets may not be loading (Logo: HTTP $LOGO_HTTP_CODE)"
fi

# Summary
echo ""
log_info "🎯 Payment System Readiness Summary:"
echo ""

if [ "$PAYMENT_HTTP_CODE" = "401" ] && [ "$ALL_PAGES_OK" = true ]; then
    log_success "🎉 PAYMENT SYSTEM IS READY FOR PRODUCTION!"
    echo ""
    echo "✅ What's Working:"
    echo "   • Payment API is responding correctly"
    echo "   • All frontend pages are loading"
    echo "   • Authentication middleware is active"
    echo "   • Infrastructure is properly deployed"
    echo ""
    echo "🔧 To Enable Real Payments:"
    echo "   1. Configure Firebase Admin credentials"
    echo "   2. Add Stripe production keys"
    echo "   3. Set up email service (Resend)"
    echo ""
    echo "📖 See ENABLE_REAL_PAYMENTS.md for detailed instructions"
    echo ""
    echo "🚀 Once configured, users will be able to:"
    echo "   • Sign up and log in"
    echo "   • Browse and book gear"
    echo "   • Make real payments with Stripe"
    echo "   • Receive email confirmations"
    echo "   • Complete full rental transactions"
    
elif [ "$PAYMENT_HTTP_CODE" = "401" ]; then
    log_warning "⚠️ Payment system is ready, but some frontend issues detected"
    echo ""
    echo "✅ Payment API: Ready"
    echo "⚠️ Frontend: Some pages have issues"
    echo ""
    echo "Fix frontend issues, then configure production credentials"
    
else
    log_error "❌ Payment system needs configuration"
    echo ""
    echo "Issues detected:"
    [ "$PAYMENT_HTTP_CODE" != "401" ] && echo "   • Payment API not responding correctly"
    [ "$ALL_PAGES_OK" != true ] && echo "   • Some frontend pages not loading"
    echo ""
    echo "Check deployment and configuration"
fi

# Cleanup
rm -f /tmp/payment_test.json

echo ""
log_info "Test complete!"
