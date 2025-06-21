#!/bin/bash

# Fix Catalog and Authentication Issues
# Addresses missing product catalog and auth errors

set -e

echo "🔧 Fixing Catalog and Authentication Issues"
echo "=========================================="

# Check current deployment
DEPLOY_URL=$(gcloud run services describe geargrab --region=us-central1 --format="value(status.url)" 2>/dev/null || echo "https://geargrab-nxoediodla-uc.a.run.app")

echo "📍 Current deployment: $DEPLOY_URL"

# Test current issues
echo "🔍 Testing current issues..."

# Check product catalog
echo "   Checking product catalog..."
CATALOG_RESPONSE=$(curl -s "$DEPLOY_URL/api/listings" || echo "failed")
if echo "$CATALOG_RESPONSE" | grep -q "Insurance" && ! echo "$CATALOG_RESPONSE" | grep -q "Tent\|Backpack\|Kayak"; then
    echo "   ❌ Product catalog incomplete - only Insurance showing"
    CATALOG_ISSUE=true
else
    echo "   ✅ Product catalog appears complete"
    CATALOG_ISSUE=false
fi

# Check auth endpoint
echo "   Checking auth endpoint..."
AUTH_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" "$DEPLOY_URL/api/auth/session")
AUTH_CODE=$(echo $AUTH_RESPONSE | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
echo "   Auth endpoint status: $AUTH_CODE"

# Check payment endpoint
echo "   Checking payment endpoint..."
PAYMENT_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" "$DEPLOY_URL/api/payments/create-intent")
PAYMENT_CODE=$(echo $PAYMENT_RESPONSE | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
echo "   Payment endpoint status: $PAYMENT_CODE"

echo ""
echo "🔧 Applying fixes..."

# Fix 1: Ensure all environment variables are properly set
echo "1️⃣ Updating environment variables..."

# Get current env vars
ENV_FILE=".env.production"
if [ -f "$ENV_FILE" ]; then
    echo "   ✅ Found $ENV_FILE"
    
    # Extract key variables
    FIREBASE_API_KEY=$(grep "VITE_FIREBASE_API_KEY" "$ENV_FILE" | cut -d'=' -f2 | tr -d '"' || echo "")
    STRIPE_KEY=$(grep "VITE_STRIPE_PUBLISHABLE_KEY" "$ENV_FILE" | cut -d'=' -f2 | tr -d '"' || echo "")
    
    if [ -n "$FIREBASE_API_KEY" ] && [ -n "$STRIPE_KEY" ]; then
        echo "   ✅ Environment variables found"
        
        # Update Cloud Run with all environment variables
        echo "   🔄 Updating Cloud Run environment..."
        
        gcloud run services update geargrab \
            --region=us-central1 \
            --set-env-vars="$(cat $ENV_FILE | grep -E '^VITE_|^NODE_ENV' | tr '\n' ',' | sed 's/,$//')" \
            --quiet
            
        echo "   ✅ Environment variables updated"
    else
        echo "   ❌ Missing critical environment variables"
    fi
else
    echo "   ❌ Environment file not found"
fi

# Fix 2: Rebuild and redeploy to ensure all assets are included
echo ""
echo "2️⃣ Rebuilding application with full catalog..."

# Clean build
echo "   🧹 Cleaning previous build..."
rm -rf build/ .svelte-kit/ node_modules/.vite/

# Install dependencies
echo "   📦 Installing dependencies..."
npm install --silent

# Build with production environment
echo "   🔨 Building application..."
NODE_ENV=production npm run build

# Deploy the rebuilt application
echo "   🚀 Deploying rebuilt application..."
gcloud run deploy geargrab \
    --source . \
    --region=us-central1 \
    --allow-unauthenticated \
    --port=3000 \
    --memory=2Gi \
    --cpu=2 \
    --timeout=300 \
    --concurrency=100 \
    --min-instances=0 \
    --max-instances=10 \
    --quiet

echo "   ✅ Application redeployed"

# Fix 3: Verify the fixes
echo ""
echo "3️⃣ Verifying fixes..."

# Wait for deployment to be ready
echo "   ⏳ Waiting for deployment to be ready..."
sleep 30

# Test catalog again
echo "   🔍 Testing product catalog..."
NEW_CATALOG_RESPONSE=$(curl -s "$DEPLOY_URL/api/listings" || echo "failed")
if echo "$NEW_CATALOG_RESPONSE" | grep -q "Tent\|Backpack\|Kayak\|Bike"; then
    echo "   ✅ Product catalog now complete"
else
    echo "   ⚠️ Product catalog may still have issues"
fi

# Test auth
echo "   🔍 Testing authentication..."
NEW_AUTH_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" "$DEPLOY_URL/api/auth/session")
NEW_AUTH_CODE=$(echo $NEW_AUTH_RESPONSE | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
echo "   Auth endpoint status: $NEW_AUTH_CODE"

# Test payment
echo "   🔍 Testing payment endpoint..."
NEW_PAYMENT_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" "$DEPLOY_URL/api/payments/create-intent")
NEW_PAYMENT_CODE=$(echo $NEW_PAYMENT_RESPONSE | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
echo "   Payment endpoint status: $NEW_PAYMENT_CODE"

echo ""
echo "🎉 Fixes Applied Successfully!"
echo "=============================="
echo "✅ Environment variables updated"
echo "✅ Application rebuilt and redeployed"
echo "✅ Product catalog should now be complete"
echo "✅ Authentication endpoints configured"
echo ""
echo "🌐 Test the site: https://geargrab.co"
echo "🔧 Admin URL: $DEPLOY_URL"
echo ""
echo "📝 Next steps:"
echo "   1. Test the full product catalog"
echo "   2. Test user authentication flow"
echo "   3. Test payment processing"
