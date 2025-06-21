#!/bin/bash

# Quick Auth Fix Deployment Script
# Fixes the clientAuth reference issue and deploys only that change

set -e

echo "🔧 Quick Auth Fix Deployment"
echo "============================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in project root directory"
    exit 1
fi

echo "✅ In project root directory"

# Build only the affected files
echo "🔄 Building with auth fix..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build successful"

# Deploy to Cloud Run with minimal changes
echo "🚀 Deploying auth fix to Cloud Run..."

# Use gcloud run deploy with just the essential flags
gcloud run deploy geargrab \
    --source . \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --port 3000 \
    --memory 1Gi \
    --cpu 1 \
    --max-instances 10 \
    --timeout 300 \
    --quiet

if [ $? -eq 0 ]; then
    echo "✅ Auth fix deployed successfully!"
    echo "🌐 Testing the fix..."
    
    # Quick test of the deployment
    DEPLOY_URL=$(gcloud run services describe geargrab --region=us-central1 --format="value(status.url)")
    echo "📍 Deployment URL: $DEPLOY_URL"
    
    # Test if the site is accessible
    if curl -s --head "$DEPLOY_URL" | head -n 1 | grep -q "200 OK"; then
        echo "✅ Site is accessible"
    else
        echo "⚠️ Site may not be fully ready yet"
    fi
else
    echo "❌ Deployment failed"
    exit 1
fi

echo "🎉 Quick auth fix deployment complete!"
