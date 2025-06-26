#!/bin/bash

# GearGrab Reliable Deployment Script
# This script provides a backup deployment method if GitHub Actions fails

set -e  # Exit on any error

# Configuration
PROJECT_ID="geargrabco"
SERVICE_NAME="geargrab"
REGION="us-central1"
IMAGE_TAG="gcr.io/$PROJECT_ID/$SERVICE_NAME:$(date +%s)"

echo "🚀 Starting GearGrab reliable deployment..."
echo "📦 Project: $PROJECT_ID"
echo "🏷️  Image: $IMAGE_TAG"
echo "🌍 Region: $REGION"

# Check prerequisites
echo "🔍 Checking prerequisites..."

if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI not found. Please install Google Cloud SDK."
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install Node.js."
    exit 1
fi

# Authenticate to Google Cloud
echo "🔐 Authenticating to Google Cloud..."
gcloud auth configure-docker --quiet

# Clean and install dependencies
echo "📦 Installing dependencies..."
npm cache clean --force
npm install --no-audit --no-fund

# Build the application
echo "🏗️ Building application..."
export NODE_ENV=production
npm run build

# Verify build
if [ ! -f "build/index.js" ]; then
    echo "❌ Build failed - index.js not found"
    exit 1
fi

echo "✅ Build completed successfully"

# Build Docker image
echo "🐳 Building Docker image..."
docker build --platform linux/amd64 -t $IMAGE_TAG .

# Push Docker image
echo "📤 Pushing Docker image..."
docker push $IMAGE_TAG

# Deploy to Cloud Run
echo "☁️ Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --image $IMAGE_TAG \
    --region $REGION \
    --platform managed \
    --allow-unauthenticated \
    --port 8080 \
    --memory 2Gi \
    --cpu 2 \
    --max-instances 5 \
    --timeout 300 \
    --concurrency 80 \
    --set-env-vars NODE_ENV=production \
    --set-env-vars HOST=0.0.0.0 \
    --quiet

# Test deployment
echo "🔍 Testing deployment..."
sleep 30

SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)')
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $SERVICE_URL/health)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ DEPLOYMENT SUCCESSFUL!"
    echo "🎉 Facebook login is now live at: $SERVICE_URL"
    echo "🔗 Health check: $SERVICE_URL/health"
else
    echo "⚠️ Deployment may have issues - HTTP code: $HTTP_CODE"
    echo "🔗 Check service at: $SERVICE_URL"
fi

echo "🎯 Deployment completed at $(date)"
