#!/bin/bash

# Ultra-Fast GearGrab Deployment Script
# Uses optimized Cloud Build with caching for maximum speed

set -e

echo "⚡ Ultra-Fast GearGrab Deployment"
echo "==============================="

# Configuration
PROJECT_ID="geargrabco"
REGION="us-central1"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Ultra-fast deployment using Cloud Build
ultra_fast_deploy() {
    print_info "Starting ultra-fast deployment with Cloud Build..."
    
    # Set project
    gcloud config set project ${PROJECT_ID} --quiet
    
    # Submit build with optimized cloudbuild.yaml
    print_info "Submitting optimized build..."
    gcloud builds submit --config cloudbuild.yaml . --quiet
    
    print_status "Ultra-fast deployment completed!"
}

# Get service URL
get_url() {
    SERVICE_URL=$(gcloud run services describe geargrab \
        --platform managed \
        --region ${REGION} \
        --format 'value(status.url)' 2>/dev/null || echo "")
    
    if [[ -n "$SERVICE_URL" ]]; then
        print_info "Service URL: ${SERVICE_URL}"
        echo "SERVICE_URL=${SERVICE_URL}" > .env.cloudrun
        print_info "Custom Domain: https://geargrab.co"
    fi
}

# Main execution
case "${1:-}" in
    "url")
        get_url
        ;;
    *)
        ultra_fast_deploy
        get_url
        ;;
esac
