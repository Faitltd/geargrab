#!/bin/bash

# Fast GearGrab Cloud Run Deployment Script
# Optimized for speed with minimal checks and parallel operations

set -e  # Exit on any error

echo "🚀 Fast GearGrab Deployment"
echo "=========================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="geargrabco"
SERVICE_NAME="geargrab"
REGION="us-central1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Fast deployment with minimal checks
fast_deploy() {
    print_info "Starting fast deployment..."
    
    # Set project (no verification)
    gcloud config set project ${PROJECT_ID} --quiet
    
    # Build and deploy in one command with optimizations
    print_info "Building and deploying with Cloud Build..."
    
    gcloud run deploy ${SERVICE_NAME} \
        --source . \
        --platform managed \
        --region ${REGION} \
        --allow-unauthenticated \
        --port 8080 \
        --memory 1Gi \
        --cpu 1 \
        --min-instances 0 \
        --max-instances 10 \
        --set-env-vars "NODE_ENV=production,VITE_APP_URL=https://geargrab.co,VITE_USE_EMULATORS=false" \
        --quiet
    
    print_status "Fast deployment completed!"
}

# Get service URL quickly
get_url() {
    SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} \
        --platform managed \
        --region ${REGION} \
        --format 'value(status.url)' 2>/dev/null || echo "")
    
    if [[ -n "$SERVICE_URL" ]]; then
        print_info "Service URL: ${SERVICE_URL}"
        echo "SERVICE_URL=${SERVICE_URL}" > .env.cloudrun
    fi
}

# Main fast deployment
case "${1:-}" in
    "url")
        get_url
        ;;
    *)
        fast_deploy
        get_url
        ;;
esac
