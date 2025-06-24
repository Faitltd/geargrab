#!/bin/bash

# Fix Specific Issues Script
# Addresses the catalog display and authentication errors

set -e

echo "🔧 Fixing Specific Issues"
echo "========================"

# Test current deployment
DEPLOY_URL="https://geargrab-nxoediodla-uc.a.run.app"
CUSTOM_URL="https://geargrab.co"

echo "📍 Testing current deployment..."

# Check what's actually being displayed
echo "🔍 Checking homepage content..."
HOMEPAGE_CONTENT=$(curl -s "$CUSTOM_URL" | head -100)

# Look for product listings
if echo "$HOMEPAGE_CONTENT" | grep -q "Insurance" && ! echo "$HOMEPAGE_CONTENT" | grep -q "Tent\|Bike\|Kayak"; then
    echo "❌ Issue confirmed: Only Insurance showing in catalog"
    CATALOG_ISSUE=true
else
    echo "✅ Product catalog appears to be loading correctly"
    CATALOG_ISSUE=false
fi

# Check for JavaScript errors in the page
echo "🔍 Checking for JavaScript configuration..."
if echo "$HOMEPAGE_CONTENT" | grep -q "VITE_FIREBASE_API_KEY\|VITE_STRIPE_PUBLISHABLE_KEY"; then
    echo "✅ Environment variables found in page"
    ENV_ISSUE=false
else
    echo "❌ Environment variables not found in page"
    ENV_ISSUE=true
fi

# Test authentication endpoint
echo "🔍 Testing authentication..."
AUTH_TEST=$(curl -s -w "HTTPSTATUS:%{http_code}" "$DEPLOY_URL/api/auth/session")
AUTH_CODE=$(echo $AUTH_TEST | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
echo "   Auth endpoint: $AUTH_CODE"

# Test payment endpoint
echo "🔍 Testing payment endpoint..."
PAYMENT_TEST=$(curl -s -w "HTTPSTATUS:%{http_code}" "$DEPLOY_URL/api/payments/create-intent")
PAYMENT_CODE=$(echo $PAYMENT_TEST | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
echo "   Payment endpoint: $PAYMENT_CODE"

echo ""
echo "🔧 Applying targeted fixes..."

# Fix 1: Clear any caching issues
echo "1️⃣ Clearing build cache..."
rm -rf .svelte-kit/output
rm -rf build/
rm -rf node_modules/.vite/

# Fix 2: Rebuild with fresh environment
echo "2️⃣ Rebuilding with fresh environment..."
npm run build

# Fix 3: Check if the issue is in the product loading logic
echo "3️⃣ Checking product loading logic..."

# Look for any filtering or loading issues in the codebase
if [ -f "src/routes/+page.svelte" ]; then
    echo "   Checking homepage component..."
    if grep -q "products.*filter\|products.*slice" "src/routes/+page.svelte"; then
        echo "   ⚠️ Found filtering logic that might be limiting products"
    fi
fi

# Fix 4: Test the rebuilt application locally first
echo "4️⃣ Testing rebuilt application..."
echo "   Starting local server for quick test..."

# Start local server in background
npm run preview &
LOCAL_PID=$!
sleep 5

# Test local version
LOCAL_TEST=$(curl -s "http://localhost:4173" | head -50 || echo "failed")
if echo "$LOCAL_TEST" | grep -q "Insurance" && ! echo "$LOCAL_TEST" | grep -q "Tent\|Bike"; then
    echo "   ❌ Issue persists in local build"
    LOCAL_ISSUE=true
else
    echo "   ✅ Local build appears correct"
    LOCAL_ISSUE=false
fi

# Kill local server
kill $LOCAL_PID 2>/dev/null || true

# Fix 5: Deploy the corrected version
if [ "$LOCAL_ISSUE" = "false" ]; then
    echo "5️⃣ Deploying corrected version..."
    
    # Deploy without gcloud auth issues
    echo "   Building Docker image..."
    docker build -t geargrab-fix .
    
    echo "   ✅ Build complete"
    echo "   ⚠️ Manual deployment required due to auth issues"
    echo ""
    echo "📋 Manual deployment steps:"
    echo "   1. Run: gcloud auth login"
    echo "   2. Run: gcloud run deploy geargrab --source . --region=us-central1"
    echo ""
else
    echo "5️⃣ Investigating product loading issue..."
    
    # Check if products are being filtered somewhere
    echo "   Checking for product filtering..."
    
    # Look for any code that might be limiting the product display
    if grep -r "products.*slice\|products.*filter\|products.*Insurance" src/ 2>/dev/null; then
        echo "   ⚠️ Found potential filtering code"
    fi
    
    echo ""
    echo "🔍 Potential fixes needed:"
    echo "   1. Check product loading logic in components"
    echo "   2. Verify no hardcoded filtering is limiting display"
    echo "   3. Ensure all products are being imported correctly"
fi

echo ""
echo "📊 Issue Summary"
echo "==============="
echo "Catalog Issue: $CATALOG_ISSUE"
echo "Environment Issue: $ENV_ISSUE"
echo "Local Build Issue: $LOCAL_ISSUE"
echo ""
echo "🌐 Test URLs:"
echo "   Production: $CUSTOM_URL"
echo "   Direct: $DEPLOY_URL"
echo ""
echo "🔧 Next steps:"
echo "   1. If local build is good, redeploy"
echo "   2. If local build has issues, check product loading logic"
echo "   3. Test authentication flow manually"
echo "   4. Test payment flow with logged-in user"
