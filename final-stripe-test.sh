#!/bin/bash

echo "🎯 Final Stripe Key Test - Post Deployment"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test 1: Site availability
echo -e "${BLUE}📡 Step 1: Testing site availability...${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://geargrab.co)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Site is accessible (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${RED}❌ Site issue (HTTP $HTTP_CODE)${NC}"
fi

# Test 2: Debug page content
echo ""
echo -e "${BLUE}🔍 Step 2: Testing debug page content...${NC}"
DEBUG_CONTENT=$(curl -s https://geargrab.co/debug/stripe)

if echo "$DEBUG_CONTENT" | grep -q "Stripe Configuration"; then
    echo -e "${GREEN}✅ Debug page loads${NC}"
else
    echo -e "${RED}❌ Debug page failed${NC}"
fi

# Test 3: Check for new Stripe key
echo ""
echo -e "${BLUE}🔑 Step 3: Checking for NEW Stripe key...${NC}"
if echo "$DEBUG_CONTENT" | grep -q "pk_live_51RZXbx"; then
    echo -e "${GREEN}✅ NEW Stripe key detected!${NC}"
    echo -e "${GREEN}   Key pattern: pk_live_51RZXbx...${NC}"
    NEW_KEY_FOUND=true
else
    echo -e "${YELLOW}⚠️  NEW key not found in debug page${NC}"
    NEW_KEY_FOUND=false
fi

# Test 4: Check for old key (should be gone)
echo ""
echo -e "${BLUE}🚫 Step 4: Checking for OLD key (should be gone)...${NC}"
if echo "$DEBUG_CONTENT" | grep -q "pk_live_51NlHz8"; then
    echo -e "${RED}❌ OLD Stripe key still present!${NC}"
    OLD_KEY_PRESENT=true
else
    echo -e "${GREEN}✅ OLD key is gone${NC}"
    OLD_KEY_PRESENT=false
fi

# Test 5: Payment form test
echo ""
echo -e "${BLUE}💳 Step 5: Testing payment form...${NC}"
PAYMENT_RESPONSE=$(curl -s https://geargrab.co/payment?amount=1.00)
if echo "$PAYMENT_RESPONSE" | grep -q "Payment Information"; then
    echo -e "${GREEN}✅ Payment form loads${NC}"
else
    echo -e "${YELLOW}⚠️  Payment form may have issues${NC}"
fi

# Summary
echo ""
echo -e "${BLUE}🎯 FINAL SUMMARY${NC}"
echo "=================================="

if [ "$NEW_KEY_FOUND" = true ] && [ "$OLD_KEY_PRESENT" = false ]; then
    echo -e "${GREEN}🎉 SUCCESS! Stripe key fix is complete!${NC}"
    echo ""
    echo -e "${GREEN}✅ New key is active${NC}"
    echo -e "${GREEN}✅ Old key is removed${NC}"
    echo ""
    echo -e "${BLUE}📋 Next Steps:${NC}"
    echo "1. Clear your browser cache (Ctrl+Shift+Delete)"
    echo "2. Visit: https://geargrab.co/debug/stripe"
    echo "3. Test payment: https://geargrab.co/payment?amount=1.00"
    echo "4. You should now see credit card input fields!"
elif [ "$OLD_KEY_PRESENT" = true ]; then
    echo -e "${RED}⚠️  PARTIAL: Old key still present${NC}"
    echo "Browser cache may need clearing"
elif [ "$NEW_KEY_FOUND" = false ]; then
    echo -e "${YELLOW}⚠️  PENDING: New key not yet visible${NC}"
    echo "May need a few more minutes for deployment to complete"
else
    echo -e "${YELLOW}⚠️  MIXED RESULTS: Check individual steps above${NC}"
fi

echo ""
echo -e "${BLUE}🔗 Test URLs:${NC}"
echo "Debug: https://geargrab.co/debug/stripe"
echo "Payment: https://geargrab.co/payment?amount=1.00&currency=usd&title=Test"
echo ""
