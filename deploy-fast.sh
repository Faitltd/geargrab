#!/bin/bash

# Fast deployment script for GearGrab
# This script optimizes the deployment process for speed

set -e

echo "🚀 Starting fast deployment process..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Clean up previous builds to reduce upload size
echo "🧹 Cleaning up previous builds..."
rm -rf build/
rm -rf .svelte-kit/
rm -rf node_modules/.cache/
rm -rf dist/

# Install dependencies with cache optimization
echo "📦 Installing dependencies with optimizations..."
npm ci --prefer-offline --no-audit --no-fund

# Build the application
echo "🔨 Building application..."
npm run build

# Check if build was successful
if [ ! -d "build" ]; then
    echo "❌ Build failed - build directory not found"
    exit 1
fi

echo "✅ Build completed successfully"

# Deploy using pre-built image approach for faster deployment
echo "🚀 Deploying to Cloud Run..."

# Use gcloud run deploy with pre-built source
gcloud run deploy geargrab \
    --source . \
    --region us-central1 \
    --platform managed \
    --allow-unauthenticated \
    --port 8080 \
    --memory 1Gi \
    --cpu 1 \
    --max-instances 10 \
    --timeout 300 \
    --concurrency 80 \
    --set-env-vars NODE_ENV=production \
    --set-env-vars PORT=8080 \
    --set-env-vars VITE_USE_EMULATORS=false \
    --set-env-vars VITE_APP_URL=https://geargrab.co \
    --quiet

if [ $? -eq 0 ]; then
    echo "✅ Deployment completed successfully!"
    echo "🌐 Your app is now live at: https://geargrab-227444442028.us-central1.run.app"
    
    # Test the deployment
    echo "🧪 Testing deployment..."
    curl -s -o /dev/null -w "%{http_code}" https://geargrab-227444442028.us-central1.run.app > /tmp/status_code
    STATUS_CODE=$(cat /tmp/status_code)
    
    if [ "$STATUS_CODE" = "200" ]; then
        echo "✅ Deployment test passed - site is responding"
    else
        echo "⚠️  Deployment test warning - received status code: $STATUS_CODE"
    fi
else
    echo "❌ Deployment failed"
    exit 1
fi

echo "🎉 Fast deployment complete!"
