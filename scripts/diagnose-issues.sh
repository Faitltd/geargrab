#!/bin/bash

# Diagnose Issues Script
# Detailed investigation of failing tests

set -e

echo "🔍 Diagnosing Issues"
echo "==================="

# Get deployment URL
DEPLOY_URL=$(gcloud run services describe geargrab --region=us-central1 --format="value(status.url)" 2>/dev/null)

if [ -z "$DEPLOY_URL" ]; then
    echo "❌ Could not get deployment URL"
    exit 1
fi

echo "📍 Testing URL: $DEPLOY_URL"

# Test 1: Payment endpoint detailed check
echo "🔍 Payment endpoint detailed check..."
PAYMENT_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" "$DEPLOY_URL/api/payments/create-intent")
HTTP_CODE=$(echo $PAYMENT_RESPONSE | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
RESPONSE_BODY=$(echo $PAYMENT_RESPONSE | sed -e 's/HTTPSTATUS:.*//g')

echo "   HTTP Code: $HTTP_CODE"
echo "   Response: $RESPONSE_BODY"

if [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "405" ]; then
    echo "✅ Payment endpoint is working correctly"
else
    echo "❌ Payment endpoint issue - Expected 401 or 405, got $HTTP_CODE"
fi

# Test 2: Check page content for Firebase
echo "🔍 Firebase configuration detailed check..."
PAGE_CONTENT=$(curl -s "$DEPLOY_URL")

# Check for Firebase in the page
if echo "$PAGE_CONTENT" | grep -q "firebase"; then
    echo "✅ Firebase found in page content"
    # Look for specific Firebase config
    if echo "$PAGE_CONTENT" | grep -q "apiKey"; then
        echo "✅ Firebase API key configuration found"
    else
        echo "⚠️ Firebase API key not found in page"
    fi
else
    echo "❌ Firebase not found in page content"
    echo "   Checking for common Firebase patterns..."
    if echo "$PAGE_CONTENT" | grep -q "firebaseapp"; then
        echo "   Found firebaseapp reference"
    fi
    if echo "$PAGE_CONTENT" | grep -q "googleapis"; then
        echo "   Found googleapis reference"
    fi
fi

# Test 3: Check page content for Stripe
echo "🔍 Stripe configuration detailed check..."
if echo "$PAGE_CONTENT" | grep -q "stripe"; then
    echo "✅ Stripe found in page content"
    # Look for Stripe publishable key
    if echo "$PAGE_CONTENT" | grep -q "pk_"; then
        echo "✅ Stripe publishable key found"
    else
        echo "⚠️ Stripe publishable key not found"
    fi
else
    echo "❌ Stripe not found in page content"
    echo "   Checking for Stripe patterns..."
    if echo "$PAGE_CONTENT" | grep -q "js.stripe.com"; then
        echo "   Found Stripe JS reference"
    fi
fi

# Test 4: Check environment variables
echo "🔍 Environment variables check..."
ENV_VARS=$(gcloud run services describe geargrab --region=us-central1 --format="value(spec.template.spec.template.spec.containers[0].env[].name)" 2>/dev/null | tr '\n' ' ')
echo "   Environment variables: $ENV_VARS"

# Check for critical env vars
if echo "$ENV_VARS" | grep -q "VITE_FIREBASE_API_KEY"; then
    echo "✅ Firebase API key env var present"
else
    echo "❌ Firebase API key env var missing"
fi

if echo "$ENV_VARS" | grep -q "VITE_STRIPE_PUBLISHABLE_KEY"; then
    echo "✅ Stripe publishable key env var present"
else
    echo "❌ Stripe publishable key env var missing"
fi

# Test 5: Check if the page loads completely
echo "🔍 Page load completeness check..."
PAGE_SIZE=$(echo "$PAGE_CONTENT" | wc -c)
echo "   Page size: $PAGE_SIZE bytes"

if [ "$PAGE_SIZE" -gt 1000 ]; then
    echo "✅ Page appears to load completely"
else
    echo "⚠️ Page may not be loading completely"
fi

# Test 6: Check for JavaScript errors in the page
echo "🔍 JavaScript error check..."
if echo "$PAGE_CONTENT" | grep -q "error\|Error\|ERROR"; then
    echo "⚠️ Potential JavaScript errors found in page"
else
    echo "✅ No obvious JavaScript errors in page"
fi

echo "🎯 Diagnosis complete!"
