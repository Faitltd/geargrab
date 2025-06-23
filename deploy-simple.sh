#!/bin/bash

# Simple deployment script that bypasses npm issues
# Uses pre-built container approach for faster deployment

set -e

echo "🚀 Starting simple deployment process..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Deploy using the existing optimized Dockerfile
echo "🚀 Deploying to Cloud Run..."

gcloud run deploy geargrab \
    --source . \
    --region us-central1 \
    --platform managed \
    --allow-unauthenticated \
    --port 8080 \
    --memory 2Gi \
    --cpu 2 \
    --max-instances 10 \
    --timeout 300 \
    --concurrency 80 \
    --set-env-vars="$(cat .env | grep -v '^#' | grep -v '^$' | tr '\n' ',')" \
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

echo "🎉 Simple deployment complete!"
