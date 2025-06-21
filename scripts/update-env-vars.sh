#!/bin/bash

# Update Environment Variables Script
# Updates only essential environment variables

set -e

echo "🔧 Updating Environment Variables"
echo "================================"

# Load environment variables from .env.production
if [ -f ".env.production" ]; then
    echo "✅ Found .env.production file"
    source .env.production
else
    echo "❌ .env.production file not found"
    exit 1
fi

# Update only critical environment variables
echo "🔄 Updating critical environment variables..."

# Firebase configuration
gcloud run services update geargrab \
    --region us-central1 \
    --set-env-vars="VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY" \
    --quiet

echo "✅ Firebase API key updated"

# Authentication configuration
gcloud run services update geargrab \
    --region us-central1 \
    --set-env-vars="VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN" \
    --quiet

echo "✅ Firebase auth domain updated"

# Stripe configuration
gcloud run services update geargrab \
    --region us-central1 \
    --set-env-vars="VITE_STRIPE_PUBLISHABLE_KEY=$VITE_STRIPE_PUBLISHABLE_KEY" \
    --quiet

echo "✅ Stripe publishable key updated"

# App URL
gcloud run services update geargrab \
    --region us-central1 \
    --set-env-vars="VITE_APP_URL=https://geargrab.co" \
    --quiet

echo "✅ App URL updated"

# Node environment
gcloud run services update geargrab \
    --region us-central1 \
    --set-env-vars="NODE_ENV=production" \
    --quiet

echo "✅ Node environment updated"

echo "🎉 Critical environment variables updated successfully!"

# Test the service
DEPLOY_URL=$(gcloud run services describe geargrab --region=us-central1 --format="value(status.url)")
echo "🔍 Testing service after env var updates..."

if curl -s --head "$DEPLOY_URL" | head -n 1 | grep -q "200"; then
    echo "✅ Service is responding correctly"
else
    echo "⚠️ Service may need a moment to restart"
fi
