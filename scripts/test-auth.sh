#!/bin/bash

# Test Authentication Script
# Tests the authentication functionality after deployment

set -e

echo "🧪 Testing Authentication"
echo "========================"

# Get the deployment URL
DEPLOY_URL=$(gcloud run services describe geargrab --region=us-central1 --format="value(status.url)" 2>/dev/null)

if [ -z "$DEPLOY_URL" ]; then
    echo "❌ Could not get deployment URL"
    exit 1
fi

echo "📍 Testing URL: $DEPLOY_URL"

# Test 1: Basic site accessibility
echo "🔍 Test 1: Basic site accessibility..."
if curl -s --head "$DEPLOY_URL" | head -n 1 | grep -q "200"; then
    echo "✅ Site is accessible"
else
    echo "❌ Site is not accessible"
    exit 1
fi

# Test 2: Check if auth endpoints are working
echo "🔍 Test 2: Auth endpoints..."
AUTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOY_URL/api/auth/session")
if [ "$AUTH_RESPONSE" = "401" ] || [ "$AUTH_RESPONSE" = "200" ]; then
    echo "✅ Auth endpoint responding correctly ($AUTH_RESPONSE)"
else
    echo "⚠️ Auth endpoint returned: $AUTH_RESPONSE"
fi

# Test 3: Check if payment endpoint is accessible
echo "🔍 Test 3: Payment endpoints..."
PAYMENT_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOY_URL/api/payments/create-intent")
if [ "$PAYMENT_RESPONSE" = "401" ] || [ "$PAYMENT_RESPONSE" = "405" ]; then
    echo "✅ Payment endpoint responding correctly ($PAYMENT_RESPONSE)"
else
    echo "⚠️ Payment endpoint returned: $PAYMENT_RESPONSE"
fi

# Test 4: Check for JavaScript errors in console (basic)
echo "🔍 Test 4: Basic page load test..."
PAGE_CONTENT=$(curl -s "$DEPLOY_URL")
if echo "$PAGE_CONTENT" | grep -q "GearGrab"; then
    echo "✅ Page content loads correctly"
else
    echo "❌ Page content may have issues"
fi

# Test 5: Check if Firebase config is present
echo "🔍 Test 5: Firebase configuration..."
if echo "$PAGE_CONTENT" | grep -q "firebase"; then
    echo "✅ Firebase configuration detected"
else
    echo "⚠️ Firebase configuration may be missing"
fi

echo "🎉 Authentication tests complete!"
echo "🌐 Visit $DEPLOY_URL to test manually"
