#!/bin/bash

echo "🧪 Testing Stripe Key Fix..."
echo "================================"

# Test 1: Check if site loads
echo "📡 Step 1: Testing site availability..."
if curl -s -o /dev/null -w "%{http_code}" https://geargrab.co | grep -q "200"; then
    echo "✅ Site is accessible"
else
    echo "❌ Site is not accessible"
    exit 1
fi

# Test 2: Check debug page
echo ""
echo "🔍 Step 2: Testing debug page..."
DEBUG_RESPONSE=$(curl -s https://geargrab.co/debug/stripe)
if echo "$DEBUG_RESPONSE" | grep -q "Stripe Configuration"; then
    echo "✅ Debug page loads successfully"
else
    echo "❌ Debug page failed to load"
fi

# Test 3: Check for new Stripe key pattern
echo ""
echo "🔑 Step 3: Checking for new Stripe key..."
if echo "$DEBUG_RESPONSE" | grep -q "pk_live_51RZXbx"; then
    echo "✅ New Stripe key detected!"
    echo "   Key starts with: pk_live_51RZXbx..."
else
    echo "⚠️  New key not detected in debug page"
fi

# Test 4: Check for old key (should not be present)
echo ""
echo "🚫 Step 4: Checking for old key (should be gone)..."
if echo "$DEBUG_RESPONSE" | grep -q "pk_live_51NlHz8"; then
    echo "❌ Old Stripe key still present!"
    echo "   This indicates caching or deployment issue"
else
    echo "✅ Old key is gone - good!"
fi

echo ""
echo "🎯 Test Summary:"
echo "================================"
echo "Next step: Clear browser cache and test payment form"
echo "Visit: https://geargrab.co/payment?amount=1.00&currency=usd&title=Test"
echo ""
