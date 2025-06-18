#!/bin/bash

# GearGrab Production Deployment Script
# This script automates the production deployment process

set -e  # Exit on any error

echo "🚀 GearGrab Production Deployment Script"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=${GOOGLE_CLOUD_PROJECT:-"geargrab-production"}
SERVICE_NAME="geargrab"
REGION="us-central1"
DOMAIN="geargrab.co"

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

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if required tools are installed
    if ! command -v gcloud &> /dev/null; then
        log_error "Google Cloud CLI not found. Please install it first."
        exit 1
    fi
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js not found. Please install it first."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        log_error "npm not found. Please install it first."
        exit 1
    fi
    
    # Check if authenticated with Google Cloud
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        log_error "Not authenticated with Google Cloud. Run 'gcloud auth login' first."
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

check_environment() {
    log_info "Checking environment configuration..."
    
    # Check if .env file exists
    if [ ! -f ".env" ]; then
        log_error ".env file not found. Please create it from .env.example"
        exit 1
    fi
    
    # Check critical environment variables
    source .env
    
    required_vars=(
        "VITE_FIREBASE_PROJECT_ID"
        "FIREBASE_ADMIN_CLIENT_EMAIL"
        "FIREBASE_ADMIN_PRIVATE_KEY"
        "STRIPE_SECRET_KEY"
        "VITE_STRIPE_PUBLISHABLE_KEY"
        "RESEND_API_KEY"
        "CHECKR_API_KEY"
    )
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            log_error "Environment variable $var is not set"
            exit 1
        fi
    done
    
    log_success "Environment configuration check passed"
}

run_tests() {
    log_info "Running pre-deployment tests..."
    
    # Install dependencies
    npm ci
    
    # Run production readiness tests
    if npm run test:production-readiness; then
        log_success "Production readiness tests passed"
    else
        log_error "Production readiness tests failed"
        exit 1
    fi
    
    # Run security audit
    if npm run audit:security; then
        log_success "Security audit passed"
    else
        log_error "Security audit failed"
        exit 1
    fi
    
    # Run full test suite
    if npm run test:all; then
        log_success "Full test suite passed"
    else
        log_warning "Some tests failed, but continuing with deployment"
    fi
}

build_application() {
    log_info "Building application for production..."
    
    # Set production environment
    export NODE_ENV=production
    
    # Build the application
    if npm run build; then
        log_success "Application built successfully"
    else
        log_error "Application build failed"
        exit 1
    fi
}

deploy_to_cloud_run() {
    log_info "Deploying to Google Cloud Run..."
    
    # Set the project
    gcloud config set project $PROJECT_ID
    
    # Deploy to Cloud Run
    gcloud run deploy $SERVICE_NAME \
        --source . \
        --platform managed \
        --region $REGION \
        --allow-unauthenticated \
        --set-env-vars NODE_ENV=production \
        --memory 1Gi \
        --cpu 1 \
        --max-instances 10 \
        --timeout 300 \
        --port 3000
    
    if [ $? -eq 0 ]; then
        log_success "Deployment to Cloud Run successful"
    else
        log_error "Deployment to Cloud Run failed"
        exit 1
    fi
}

configure_custom_domain() {
    log_info "Configuring custom domain..."
    
    # Map custom domain to Cloud Run service
    gcloud run domain-mappings create \
        --service $SERVICE_NAME \
        --domain $DOMAIN \
        --region $REGION \
        --platform managed
    
    if [ $? -eq 0 ]; then
        log_success "Custom domain configured"
        log_info "Please update your DNS records to point $DOMAIN to the provided IP"
    else
        log_warning "Custom domain configuration failed or already exists"
    fi
}

verify_deployment() {
    log_info "Verifying deployment..."
    
    # Get the service URL
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")
    
    if [ -z "$SERVICE_URL" ]; then
        log_error "Could not get service URL"
        exit 1
    fi
    
    log_info "Service deployed at: $SERVICE_URL"
    
    # Test the health endpoint
    if curl -f "$SERVICE_URL/api/health/system" > /dev/null 2>&1; then
        log_success "Health check passed"
    else
        log_error "Health check failed"
        exit 1
    fi
    
    # Run production tests against deployed service
    TEST_BASE_URL=$SERVICE_URL npm run test:production-readiness
    
    if [ $? -eq 0 ]; then
        log_success "Post-deployment verification passed"
    else
        log_error "Post-deployment verification failed"
        exit 1
    fi
}

setup_monitoring() {
    log_info "Setting up monitoring and alerts..."
    
    # Enable Cloud Monitoring
    gcloud services enable monitoring.googleapis.com
    
    # Create uptime check
    gcloud alpha monitoring uptime create \
        --display-name="GearGrab Health Check" \
        --http-check-path="/api/health/system" \
        --hostname="$DOMAIN" \
        --port=443 \
        --use-ssl
    
    log_success "Monitoring configured"
}

main() {
    echo
    log_info "Starting production deployment process..."
    echo
    
    # Confirm deployment
    read -p "Are you sure you want to deploy to production? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Deployment cancelled"
        exit 0
    fi
    
    # Run deployment steps
    check_prerequisites
    check_environment
    run_tests
    build_application
    deploy_to_cloud_run
    configure_custom_domain
    verify_deployment
    setup_monitoring
    
    echo
    log_success "🎉 Production deployment completed successfully!"
    echo
    log_info "Next steps:"
    echo "1. Update DNS records to point $DOMAIN to Cloud Run"
    echo "2. Monitor the application for the first 24 hours"
    echo "3. Verify all user flows are working correctly"
    echo "4. Check error rates and performance metrics"
    echo
    log_info "Service URL: $(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")"
    log_info "Admin Panel: https://$DOMAIN/admin"
    log_info "Health Check: https://$DOMAIN/api/health/system"
    echo
}

# Handle script interruption
trap 'log_error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main "$@"
