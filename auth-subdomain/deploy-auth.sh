#!/bin/bash

# GearGrab Auth Subdomain Deployment Script
# Deploys to login.geargrab.co

set -e

echo "🔐 GearGrab Auth Subdomain Deployment"
echo "===================================="

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud CLI not found. Please install it first."
    exit 1
fi

# Set project
echo "📋 Setting up project..."
gcloud config set project geargrabco
echo "✅ Project set to geargrabco"

# Enable required APIs
echo "📋 Enabling required APIs..."
gcloud services enable cloudbuild.googleapis.com run.googleapis.com
echo "✅ APIs enabled"

# Build and deploy to Cloud Run
echo "📋 Building and deploying auth service..."
gcloud run deploy geargrab-auth \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --timeout 300 \
  --concurrency 80 \
  --set-env-vars "NODE_ENV=production" \
  --set-env-vars "PORT=3000"

echo "✅ Auth service deployed to Cloud Run"

# Configure custom domain mapping
echo "📋 Configuring custom domain..."
gcloud run domain-mappings create \
  --service geargrab-auth \
  --domain login.geargrab.co \
  --region us-central1 || echo "⚠️  Domain mapping may already exist"

echo "✅ Domain mapping configured"

# Get service information
echo "📋 Getting service information..."
SERVICE_URL=$(gcloud run services describe geargrab-auth --region us-central1 --format 'value(status.url)')

echo ""
echo "✅ Auth subdomain deployment completed successfully!"
echo ""
echo "🌐 Your auth service is now live at:"
echo "   Cloud Run URL: $SERVICE_URL"
echo "   Custom Domain: https://login.geargrab.co"
echo ""
echo "⚠️  Important next steps:"
echo ""
echo "1. 🌐 Configure DNS records for login.geargrab.co:"
echo "   Get the IP address from the domain mapping and add A record"
echo "   Add CNAME record: login -> ghs.googlehosted.com"
echo ""
echo "2. 🔗 Update main site to redirect to login.geargrab.co"
echo ""
echo "3. 🧪 Test the auth flow:"
echo "   - Visit https://login.geargrab.co"
echo "   - Test social login providers"
echo "   - Verify redirect back to main site"
echo ""
echo "✅ GearGrab Auth is now live! 🎉"
