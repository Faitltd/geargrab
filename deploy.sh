#!/bin/bash

# GearGrab SvelteKit Deployment Script for Cloud Run
# Usage: ./deploy.sh [environment] [project-id]

set -e

# Configuration
ENVIRONMENT=${1:-production}
PROJECT_ID=${2:-geargrabco}
SERVICE_NAME="geargrab-svelte"
REGION="us-central1"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

echo "🚀 Deploying GearGrab SvelteKit to Cloud Run"
echo "Environment: $ENVIRONMENT"
echo "Project ID: $PROJECT_ID"
echo "Service: $SERVICE_NAME"
echo "Region: $REGION"

# Check if gcloud is installed and authenticated
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI is not installed. Please install it first."
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Set the project
echo "📋 Setting Google Cloud project..."
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "🔧 Enabling required APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Build the application
echo "🏗️  Building the application..."
npm ci
npm run build

# Build Docker image
echo "🐳 Building Docker image..."
docker build -t $IMAGE_NAME:latest .
docker tag $IMAGE_NAME:latest $IMAGE_NAME:$(git rev-parse --short HEAD)

# Configure Docker to use gcloud as credential helper
echo "🔐 Configuring Docker authentication..."
gcloud auth configure-docker

# Push Docker image
echo "📤 Pushing Docker image to Container Registry..."
docker push $IMAGE_NAME:latest
docker push $IMAGE_NAME:$(git rev-parse --short HEAD)

# Deploy to Cloud Run
echo "🚢 Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_NAME:latest \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 3000 \
  --memory 1Gi \
  --cpu 2 \
  --max-instances 100 \
  --min-instances 1 \
  --concurrency 1000 \
  --timeout 300 \
  --set-env-vars NODE_ENV=production,BASE44_SERVER_URL=https://base44.app,BASE44_ENV=prod \
  --execution-environment gen2 \
  --cpu-throttling=false

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)')

echo "✅ Deployment completed successfully!"
echo "🌐 Service URL: $SERVICE_URL"
echo ""
echo "📋 Next steps:"
echo "1. Set up custom domain mapping for geargrab.co"
echo "2. Configure Base44 environment variables"
echo "3. Set up monitoring and logging"
echo ""
echo "🔧 To map custom domain:"
echo "gcloud run domain-mappings create --service $SERVICE_NAME --domain geargrab.co --region $REGION"
