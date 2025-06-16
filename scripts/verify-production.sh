#!/bin/bash

# 🚀 GearGrab Production Verification Script
# Verifies that geargrab.co is working properly

set -e

echo "🔍 GearGrab Production Verification"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

DOMAIN="https://geargrab.co"
ERRORS=0

# Function to test endpoint
test_endpoint() {
    local url="$1"
    local expected_status="$2"
    local description="$3"
    
    echo -n "Testing $description... "
    
    status=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")
    
    if [ "$status" = "$expected_status" ]; then
        echo -e "${GREEN}✅ $status${NC}"
    else
        echo -e "${RED}❌ $status (expected $expected_status)${NC}"
        ERRORS=$((ERRORS + 1))
    fi
}

# Test main pages
echo -e "${BLUE}Testing Main Pages:${NC}"
test_endpoint "$DOMAIN" "200" "Homepage"
test_endpoint "$DOMAIN/browse" "200" "Browse Page"
test_endpoint "$DOMAIN/auth/login" "200" "Login Page"
test_endpoint "$DOMAIN/list-gear" "200" "List Gear Page"
test_endpoint "$DOMAIN/how-it-works" "200" "How It Works Page"

echo ""

# Test www redirect
echo -e "${BLUE}Testing WWW Domain:${NC}"
test_endpoint "https://www.geargrab.co" "200" "WWW Domain"

echo ""

# Test SSL and security headers
echo -e "${BLUE}Testing Security:${NC}"
echo -n "Checking SSL certificate... "
if curl -s -I "$DOMAIN" | grep -q "HTTP/2 200"; then
    echo -e "${GREEN}✅ HTTPS working${NC}"
else
    echo -e "${RED}❌ HTTPS issue${NC}"
    ERRORS=$((ERRORS + 1))
fi

echo -n "Checking security headers... "
if curl -s -I "$DOMAIN" | grep -q "content-security-policy"; then
    echo -e "${GREEN}✅ CSP header present${NC}"
else
    echo -e "${RED}❌ CSP header missing${NC}"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# Test API endpoints (should require auth)
echo -e "${BLUE}Testing API Security:${NC}"
test_endpoint "$DOMAIN/api/bookings" "401" "Bookings API (should require auth)"

echo -n "Testing Payment API POST (should require auth)... "
status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$DOMAIN/api/payments/create-intent" -H "Content-Type: application/json" -d '{"amount":100}' || echo "000")
if [ "$status" = "401" ]; then
    echo -e "${GREEN}✅ $status${NC}"
else
    echo -e "${RED}❌ $status (expected 401)${NC}"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# Summary
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! GearGrab.co is working perfectly!${NC}"
    echo ""
    echo -e "${BLUE}Production URL: $DOMAIN${NC}"
    echo -e "${BLUE}Status: Ready for users! 🚀${NC}"
else
    echo -e "${RED}❌ $ERRORS test(s) failed. Please check the issues above.${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Clear browser cache and test authentication flow"
echo "2. Test Google Sign-In functionality"
echo "3. Test payment processing with authenticated users"
echo "4. Verify all pages load correctly"
echo ""
echo -e "${GREEN}GearGrab is now live at: $DOMAIN${NC}"
