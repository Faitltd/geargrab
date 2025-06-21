#!/bin/bash

# GearGrab Production Validation Script
# This script validates that the production environment is properly configured

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
HEALTH_ENDPOINT="$DOMAIN/api/health"
PAYMENT_ENDPOINT="$DOMAIN/api/payments/create-intent"

log_info "🔍 Validating GearGrab production environment..."

# Test 1: Health Check
log_info "Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/health_response.json "$HEALTH_ENDPOINT")
HTTP_CODE="${HEALTH_RESPONSE: -3}"

if [ "$HTTP_CODE" = "200" ]; then
    log_success "Health endpoint responding (HTTP $HTTP_CODE)"
    
    # Parse health response
    if command -v jq &> /dev/null; then
        STATUS=$(jq -r '.status' /tmp/health_response.json 2>/dev/null || echo "unknown")
        FIREBASE_CONFIGURED=$(jq -r '.services.firebase.configured' /tmp/health_response.json 2>/dev/null || echo "unknown")
        STRIPE_CONFIGURED=$(jq -r '.services.stripe.configured' /tmp/health_response.json 2>/dev/null || echo "unknown")
        EMAIL_CONFIGURED=$(jq -r '.services.email.configured' /tmp/health_response.json 2>/dev/null || echo "unknown")
        
        echo "  Status: $STATUS"
        echo "  Firebase: $FIREBASE_CONFIGURED"
        echo "  Stripe: $STRIPE_CONFIGURED"
        echo "  Email: $EMAIL_CONFIGURED"
        
        if [ "$STATUS" = "degraded" ]; then
            log_warning "System is in degraded state - some services not configured"
        elif [ "$STATUS" = "healthy" ]; then
            log_success "All services properly configured"
        fi
    else
        log_warning "jq not installed - install with: brew install jq (macOS) or apt-get install jq (Ubuntu)"
    fi
else
    log_error "Health endpoint failed (HTTP $HTTP_CODE)"
    cat /tmp/health_response.json 2>/dev/null || echo "No response body"
fi

# Test 2: Payment API
log_info "Testing payment API endpoint..."
PAYMENT_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/payment_response.json \
    -X POST "$PAYMENT_ENDPOINT" \
    -H "Content-Type: application/json" \
    -d '{"amount": 1000, "currency": "usd"}')
PAYMENT_HTTP_CODE="${PAYMENT_RESPONSE: -3}"

if [ "$PAYMENT_HTTP_CODE" = "401" ]; then
    log_success "Payment API responding correctly (HTTP $PAYMENT_HTTP_CODE - Authentication required)"
elif [ "$PAYMENT_HTTP_CODE" = "200" ]; then
    log_success "Payment API responding (HTTP $PAYMENT_HTTP_CODE)"
else
    log_error "Payment API failed (HTTP $PAYMENT_HTTP_CODE)"
    cat /tmp/payment_response.json 2>/dev/null || echo "No response body"
fi

# Test 3: Frontend Loading
log_info "Testing frontend loading..."
FRONTEND_RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null "$DOMAIN")
FRONTEND_HTTP_CODE="${FRONTEND_RESPONSE: -3}"

if [ "$FRONTEND_HTTP_CODE" = "200" ]; then
    log_success "Frontend loading correctly (HTTP $FRONTEND_HTTP_CODE)"
else
    log_error "Frontend failed to load (HTTP $FRONTEND_HTTP_CODE)"
fi

# Test 4: Specific Pages
log_info "Testing specific pages..."

PAGES=("/browse" "/listing/emob-001" "/auth/login" "/list-gear")
for page in "${PAGES[@]}"; do
    PAGE_RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null "$DOMAIN$page")
    PAGE_HTTP_CODE="${PAGE_RESPONSE: -3}"
    
    if [ "$PAGE_HTTP_CODE" = "200" ]; then
        log_success "Page $page loading correctly"
    else
        log_error "Page $page failed (HTTP $PAGE_HTTP_CODE)"
    fi
done

# Summary
echo ""
log_info "🎯 Production Validation Summary:"
echo ""

if [ "$HTTP_CODE" = "200" ] && [ "$PAYMENT_HTTP_CODE" = "401" ] && [ "$FRONTEND_HTTP_CODE" = "200" ]; then
    log_success "✅ Basic production setup is working!"
    echo ""
    echo "🔧 To enable full payment processing, configure:"
    echo "   1. Firebase Admin credentials"
    echo "   2. Stripe production keys"
    echo "   3. Email service (Resend)"
    echo ""
    echo "📖 See PRODUCTION_SETUP_GUIDE.md for detailed instructions"
else
    log_error "❌ Production setup has issues that need to be resolved"
fi

# Cleanup
rm -f /tmp/health_response.json /tmp/payment_response.json

echo ""
log_info "Validation complete!"
