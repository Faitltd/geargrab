#!/bin/bash

echo "🚀 Quick GearGrab Deployment"
echo "============================="

# Check authentication
echo "🔐 Checking gcloud authentication..."
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ Not authenticated with gcloud. Please run:"
    echo "   gcloud auth login"
    echo "   gcloud config set project geargrabco"
    exit 1
fi

echo "✅ Authenticated with gcloud"

# Deploy to Cloud Run
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
    --set-env-vars NODE_ENV=production \
    --set-env-vars PORT=8080 \
    --set-env-vars HOST=0.0.0.0 \
    --set-env-vars VITE_USE_EMULATORS=false \
    --set-env-vars VITE_APP_URL=https://geargrab.co \
    --set-env-vars FIREBASE_PROJECT_ID=geargrabco \
    --set-env-vars FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-fbsvc@geargrabco.iam.gserviceaccount.com

echo "✅ Deployment completed!"
echo "🌐 Visit: https://geargrab.co"
echo ""
echo "🔧 To fix admin access, visit these URLs while logged in:"
echo "   Debug: https://geargrab.co/api/debug/current-user"
echo "   Setup: https://geargrab.co/api/debug/setup-admin (POST request)"
