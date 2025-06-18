#!/bin/bash

# Manual Deployment Script for GearGrab
# Use this if GitHub Actions deployment is not working

set -e

PROJECT_ID="geargrabco"
SERVICE_NAME="geargrab-app"
REGION="us-central1"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

echo "🚀 Manual GearGrab Deployment"
echo "============================="
echo "Project: $PROJECT_ID"
echo "Service: $SERVICE_NAME"
echo "Region: $REGION"
echo ""

# Check if gcloud is installed and authenticated
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: gcloud CLI is not installed."
    exit 1
fi

if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ Error: Not authenticated with gcloud."
    echo "Please run: gcloud auth login"
    exit 1
fi

# Set project
gcloud config set project $PROJECT_ID

# Build the application
echo "🔨 Building application..."
npm ci
npm run build

# Build Docker image
echo "🐳 Building Docker image..."
docker build -t $IMAGE_NAME:latest .

# Configure Docker for GCR
echo "🔧 Configuring Docker for Google Container Registry..."
gcloud auth configure-docker

# Push image to GCR
echo "📤 Pushing image to Google Container Registry..."
docker push $IMAGE_NAME:latest

# Deploy to Cloud Run
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --image $IMAGE_NAME:latest \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --memory 512Mi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 10 \
    --set-env-vars NODE_ENV=production \
    --port 8080

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")

echo ""
echo "✅ Deployment successful!"
echo "🌐 Your application is now available at:"
echo "   $SERVICE_URL"
echo ""
echo "🔧 To update your custom domain (geargrab.co), run:"
echo "   gcloud run domain-mappings create --service=$SERVICE_NAME --domain=geargrab.co --region=$REGION"
echo ""
