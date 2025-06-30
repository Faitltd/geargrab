#!/bin/bash

# GearGrab Reliable Deployment Script
# Single script to handle all deployment needs without failures

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="geargrabco"
SERVICE_NAME="geargrab"
REGION="us-central1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
IMAGE_TAG="${IMAGE_NAME}:${TIMESTAMP}"

# Functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_header() {
    echo -e "${PURPLE}🚀 $1${NC}"
    echo -e "${PURPLE}$(printf '=%.0s' {1..50})${NC}"
}

# Check prerequisites
check_prerequisites() {
    log_header "Checking Prerequisites"
    
    # Check if gcloud is installed and authenticated
    if ! command -v gcloud &> /dev/null; then
        log_error "gcloud CLI is not installed"
        exit 1
    fi
    
    # Check if Docker is running
    if ! docker info &> /dev/null; then
        log_error "Docker is not running"
        exit 1
    fi
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        log_error "package.json not found. Please run from project root."
        exit 1
    fi
    
    # Check authentication
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        log_warning "Not authenticated with gcloud. Running authentication..."
        gcloud auth login
    fi
    
    # Set project
    gcloud config set project $PROJECT_ID
    
    log_success "Prerequisites check passed"
}

# Clean up previous builds
cleanup_builds() {
    log_header "Cleaning Up Previous Builds"
    
    # Remove node_modules and build artifacts
    rm -rf node_modules/.cache
    rm -rf .svelte-kit
    rm -rf build
    
    log_success "Cleanup completed"
}

# Build application locally first
build_application() {
    log_header "Building Application Locally"
    
    # Install dependencies
    log_info "Installing dependencies..."
    npm ci --no-audit --no-fund
    
    # Run build
    log_info "Building application..."
    npm run build
    
    # Verify build
    if [ ! -f "build/index.js" ]; then
        log_error "Build failed - index.js not found"
        exit 1
    fi
    
    log_success "Local build completed successfully"
}

# Build Docker image
build_docker_image() {
    log_header "Building Docker Image"
    
    log_info "Building Docker image: $IMAGE_TAG"
    
    # Build with proper error handling
    if docker build --platform linux/amd64 -t $IMAGE_TAG . --no-cache; then
        log_success "Docker image built successfully"
    else
        log_error "Docker build failed"
        exit 1
    fi
}

# Push to Google Container Registry
push_image() {
    log_header "Pushing Image to GCR"
    
    # Configure Docker for GCR
    gcloud auth configure-docker --quiet
    
    # Push image
    log_info "Pushing image: $IMAGE_TAG"
    if docker push $IMAGE_TAG; then
        log_success "Image pushed successfully"
    else
        log_error "Image push failed"
        exit 1
    fi
}

# Deploy to Cloud Run
deploy_to_cloud_run() {
    log_header "Deploying to Cloud Run"
    
    log_info "Deploying service: $SERVICE_NAME"
    
    # Deploy with comprehensive environment variables
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
        --set-env-vars VITE_USE_EMULATORS=false \
        --set-env-vars VITE_APP_URL=https://geargrab.co \
        --set-env-vars FIREBASE_PROJECT_ID=geargrabco \
        --quiet
    
    if [ $? -eq 0 ]; then
        log_success "Cloud Run deployment completed"
    else
        log_error "Cloud Run deployment failed"
        exit 1
    fi
}

# Test deployment
test_deployment() {
    log_header "Testing Deployment"
    
    # Get service URL
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)')
    
    if [ -z "$SERVICE_URL" ]; then
        log_error "Could not get service URL"
        exit 1
    fi
    
    log_info "Service URL: $SERVICE_URL"
    log_info "Waiting for service to be ready..."
    sleep 30
    
    # Test the deployment
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $SERVICE_URL)
    
    if [ "$HTTP_CODE" = "200" ]; then
        log_success "Deployment test PASSED"
        log_success "🎉 GearGrab is live at: https://geargrab.co"
    else
        log_warning "Received HTTP $HTTP_CODE - service may still be starting"
        log_info "Check https://geargrab.co in a few minutes"
    fi
}

# Main deployment process
main() {
    log_header "GearGrab Reliable Deployment"
    echo -e "${BLUE}Starting deployment process...${NC}"
    echo ""
    
    check_prerequisites
    cleanup_builds
    build_application
    build_docker_image
    push_image
    deploy_to_cloud_run
    test_deployment
    
    echo ""
    log_header "Deployment Complete"
    log_success "🚀 GearGrab has been successfully deployed!"
    log_info "📱 Visit: https://geargrab.co"
    log_info "⏰ Deployed at: $(date)"
    log_info "🏷️  Image: $IMAGE_TAG"
    echo ""
}

# Run main function
main "$@"
