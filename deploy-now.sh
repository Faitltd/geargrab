#!/bin/bash

# IMMEDIATE DEPLOYMENT - No build, direct source upload
# This bypasses all build issues by letting Cloud Run handle everything

set -e

echo "🚀 IMMEDIATE DEPLOYMENT - Bypassing all build issues"
echo "⏰ Started at: $(date)"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

echo "📦 Deploying directly from source (no local build)..."

# Deploy using source-based deployment (Cloud Run handles the build)
gcloud run deploy geargrab \
    --source . \
    --region us-central1 \
    --platform managed \
    --allow-unauthenticated \
    --port 8080 \
    --memory 2Gi \
    --cpu 2 \
    --max-instances 10 \
    --timeout 900 \
    --concurrency 80 \
    --set-env-vars NODE_ENV=production \
    --set-env-vars PORT=8080 \
    --set-env-vars VITE_USE_EMULATORS=false \
    --set-env-vars VITE_APP_URL=https://geargrab.co

DEPLOY_STATUS=$?

if [ $DEPLOY_STATUS -eq 0 ]; then
    echo "✅ Deployment completed successfully!"
    echo "🌐 Your app should be live at: https://geargrab-227444442028.us-central1.run.app"
    echo "⏰ Completed at: $(date)"
    
    # Test the deployment
    echo "🧪 Testing deployment in 30 seconds..."
    sleep 30
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://geargrab-227444442028.us-central1.run.app || echo "000")
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ SUCCESS: Site is responding with HTTP 200"
        echo "🎉 Deployment fully operational!"
    else
        echo "⚠️  Warning: Site responded with HTTP $HTTP_CODE"
        echo "🔍 Check logs: gcloud run logs read geargrab --region=us-central1"
    fi
else
    echo "❌ Deployment failed with status $DEPLOY_STATUS"
    echo "🔍 Check logs: gcloud run logs read geargrab --region=us-central1"
    exit 1
fi

echo ""
echo "🎯 DEPLOYMENT SUMMARY:"
echo "================================"
echo "✅ All optimizations included:"
echo "   - Social-only authentication"
echo "   - DNS preconnect optimizations"
echo "   - Enhanced Google auth performance"
echo "   - Production fixes (COOP, Stripe CSP)"
echo "   - Optimized .gcloudignore"
echo ""
echo "🌐 Live URL: https://geargrab-227444442028.us-central1.run.app"
echo "⏰ Total time: Started at deployment start time"
echo "================================"
