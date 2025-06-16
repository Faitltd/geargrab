#!/bin/bash

echo "🔍 Debugging Authentication Issue"
echo "================================="

# Test 1: Check if user appears logged in on debug page
echo "📡 Step 1: Checking debug page authentication status..."
DEBUG_RESPONSE=$(curl -s https://geargrab.co/debug/stripe)

if echo "$DEBUG_RESPONSE" | grep -q "Log In to Test Payments"; then
    echo "❌ Debug page shows user as NOT logged in"
    echo "   This suggests the client-side auth state is not working"
elif echo "$DEBUG_RESPONSE" | grep -q "Authentication.*successful"; then
    echo "✅ Debug page shows user as logged in"
else
    echo "⚠️  Debug page authentication status unclear"
fi

# Test 2: Check what happens when we make a direct API call
echo ""
echo "🔑 Step 2: Testing direct API call without auth..."
API_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" https://geargrab.co/api/payments/create-intent \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "currency": "usd"}')

HTTP_STATUS=$(echo "$API_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
RESPONSE_BODY=$(echo "$API_RESPONSE" | sed 's/HTTP_STATUS:[0-9]*$//')

echo "HTTP Status: $HTTP_STATUS"
if [ "$HTTP_STATUS" = "401" ]; then
    echo "✅ API correctly returns 401 for unauthenticated requests"
    echo "Response: $RESPONSE_BODY"
else
    echo "⚠️  Unexpected status code: $HTTP_STATUS"
    echo "Response: $RESPONSE_BODY"
fi

# Test 3: Check if Firebase Admin is configured
echo ""
echo "🔥 Step 3: Testing Firebase Admin configuration..."
FIREBASE_TEST=$(curl -s https://geargrab.co/api/payments/create-intent)
if echo "$FIREBASE_TEST" | grep -q "accessible"; then
    echo "✅ Payment endpoint is accessible (GET request works)"
else
    echo "❌ Payment endpoint may have issues"
fi

echo ""
echo "🎯 DIAGNOSIS:"
echo "============="
echo "The issue is likely one of these:"
echo ""
echo "1. 🔄 CLIENT-SIDE AUTH STATE:"
echo "   - User appears logged in on frontend"
echo "   - But auth token is not being sent properly"
echo "   - Check browser console for auth errors"
echo ""
echo "2. 🔑 TOKEN ISSUES:"
echo "   - Firebase ID token expired"
echo "   - Token not being refreshed properly"
echo "   - Token format/encoding issues"
echo ""
echo "3. 🔥 FIREBASE ADMIN:"
echo "   - Server-side Firebase Admin not configured"
echo "   - Token validation failing on server"
echo "   - Environment variables missing"
echo ""
echo "📋 NEXT STEPS:"
echo "1. Open browser console (F12) while on geargrab.co"
echo "2. Look for authentication-related errors"
echo "3. Check if Firebase auth state is properly loaded"
echo "4. Try refreshing the page and logging in again"
echo ""
