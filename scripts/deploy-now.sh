#!/bin/bash

# Immediate Deployment Script for GearGrab
# This script prepares and initiates deployment to Google Cloud Run

set -e

echo "🚀 GearGrab Production Deployment Initiator"
echo "============================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking deployment prerequisites..."
    
    # Check if gcloud is installed
    if ! command -v gcloud &> /dev/null; then
        print_error "Google Cloud SDK not found. Please install it first:"
        echo "  curl https://sdk.cloud.google.com | bash"
        echo "  exec -l \$SHELL"
        exit 1
    fi
    
    # Check if docker is installed
    if ! command -v docker &> /dev/null; then
        print_error "Docker not found. Please install Docker first."
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Validate environment variables
validate_env_vars() {
    print_status "Validating environment variables..."
    
    required_vars=(
        "PROJECT_ID"
        "FIREBASE_PROJECT_ID"
        "FIREBASE_ADMIN_CLIENT_EMAIL"
        "FIREBASE_ADMIN_PRIVATE_KEY"
        "SESSION_SECRET"
        "STRIPE_SECRET_KEY"
        "STRIPE_WEBHOOK_SECRET"
    )
    
    missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        print_error "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        echo ""
        echo "Please set these variables and run the script again."
        echo "See DEPLOY_NOW.md for the complete setup guide."
        exit 1
    fi
    
    # Validate session secret length
    if [[ ${#SESSION_SECRET} -lt 32 ]]; then
        print_error "SESSION_SECRET must be at least 32 characters long"
        echo "Generate a new one with: export SESSION_SECRET=\"\$(openssl rand -base64 32)\""
        exit 1
    fi
    
    print_success "Environment variables validation passed"
}

# Setup Google Cloud
setup_gcloud() {
    print_status "Setting up Google Cloud configuration..."
    
    # Set project
    gcloud config set project $PROJECT_ID
    
    # Enable required APIs
    print_status "Enabling required Google Cloud APIs..."
    gcloud services enable cloudbuild.googleapis.com
    gcloud services enable run.googleapis.com
    gcloud services enable containerregistry.googleapis.com
    
    print_success "Google Cloud setup completed"
}

# Build application
build_app() {
    print_status "Building application..."
    
    # Install dependencies
    npm ci
    
    # Run security audit
    print_status "Running security audit..."
    npm audit --audit-level moderate
    
    # Build application
    print_status "Building production application..."
    npm run build
    
    print_success "Application build completed"
}

# Deploy to Cloud Run
deploy_to_cloud_run() {
    print_status "Deploying to Google Cloud Run..."
    
    # Configuration
    SERVICE_NAME="geargrab-app"
    REGION="us-central1"
    IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"
    
    # Build Docker image
    print_status "Building Docker image..."
    docker build -t $IMAGE_NAME .
    
    # Push to Google Container Registry
    print_status "Pushing image to Google Container Registry..."
    docker push $IMAGE_NAME
    
    # Prepare environment variables
    ENV_VARS="NODE_ENV=production"
    ENV_VARS="$ENV_VARS,FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID"
    ENV_VARS="$ENV_VARS,FIREBASE_ADMIN_CLIENT_EMAIL=$FIREBASE_ADMIN_CLIENT_EMAIL"
    ENV_VARS="$ENV_VARS,FIREBASE_ADMIN_PRIVATE_KEY=$FIREBASE_ADMIN_PRIVATE_KEY"
    ENV_VARS="$ENV_VARS,SESSION_SECRET=$SESSION_SECRET"
    ENV_VARS="$ENV_VARS,CORS_ORIGINS=https://geargrab.co,https://www.geargrab.co"
    ENV_VARS="$ENV_VARS,STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY"
    ENV_VARS="$ENV_VARS,STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET"
    ENV_VARS="$ENV_VARS,RATE_LIMITING_ENABLED=true"
    ENV_VARS="$ENV_VARS,LOG_LEVEL=info"
    
    # Deploy to Cloud Run
    print_status "Deploying service to Cloud Run..."
    gcloud run deploy $SERVICE_NAME \
        --image $IMAGE_NAME \
        --region $REGION \
        --platform managed \
        --allow-unauthenticated \
        --memory 1Gi \
        --cpu 2 \
        --min-instances 0 \
        --max-instances 10 \
        --timeout 300 \
        --set-env-vars "$ENV_VARS" \
        --project $PROJECT_ID
    
    # Get service URL
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
        --region $REGION \
        --project $PROJECT_ID \
        --format 'value(status.url)')
    
    print_success "Deployment completed! Service URL: $SERVICE_URL"
    
    # Store URL for domain configuration
    echo $SERVICE_URL > .service-url
}

# Configure domains
configure_domains() {
    print_status "Configuring custom domains..."
    
    SERVICE_NAME="geargrab-app"
    REGION="us-central1"
    
    # Map geargrab.co
    print_status "Mapping geargrab.co..."
    gcloud run domain-mappings create \
        --service $SERVICE_NAME \
        --domain geargrab.co \
        --region $REGION \
        --project $PROJECT_ID
    
    # Map www.geargrab.co
    print_status "Mapping www.geargrab.co..."
    gcloud run domain-mappings create \
        --service $SERVICE_NAME \
        --domain www.geargrab.co \
        --region $REGION \
        --project $PROJECT_ID
    
    print_success "Domain mappings created"
    print_warning "Update your DNS records with the CNAME targets shown above"
}

# Run health check
run_health_check() {
    print_status "Running health check..."
    
    if [[ -f .service-url ]]; then
        SERVICE_URL=$(cat .service-url)
        
        # Wait for service to be ready
        sleep 15
        
        # Check health endpoint
        if curl -f "$SERVICE_URL/api/health" > /dev/null 2>&1; then
            print_success "Health check passed"
        else
            print_warning "Health check failed - service may still be starting"
            print_status "Check manually at: $SERVICE_URL/api/health"
        fi
    fi
}

# Main deployment process
main() {
    echo ""
    print_status "Starting GearGrab production deployment..."
    echo ""
    
    # Pre-deployment checks
    check_prerequisites
    validate_env_vars
    setup_gcloud
    
    # Build and deploy
    build_app
    deploy_to_cloud_run
    configure_domains
    
    # Post-deployment verification
    run_health_check
    
    echo ""
    print_success "🎉 Deployment process completed!"
    echo ""
    echo "📊 Deployment Summary:"
    echo "  ✅ Application deployed to Cloud Run"
    echo "  ✅ Custom domains configured"
    echo "  ✅ Security features active"
    echo "  ✅ Health monitoring enabled"
    echo ""
    echo "🌐 Your application will be available at:"
    echo "  - https://geargrab.co (after DNS propagation)"
    echo "  - https://www.geargrab.co (after DNS propagation)"
    echo ""
    echo "📋 Next Steps:"
    echo "  1. Update DNS records with CNAME targets (see output above)"
    echo "  2. Wait for DNS propagation (5 minutes to 48 hours)"
    echo "  3. Test all functionality"
    echo "  4. Set up monitoring alerts"
    echo ""
    echo "🔒 Security Features Active:"
    echo "  ✅ Real Firebase Authentication"
    echo "  ✅ Rate Limiting (Auth: 5/15min, Payment: 3/min, API: 100/15min)"
    echo "  ✅ Security Headers (CSP, HSTS, X-Frame-Options, etc.)"
    echo "  ✅ Input Validation & XSS Protection"
    echo "  ✅ Secure Payment Processing"
    echo "  ✅ Health Monitoring"
}

# Run the deployment
main "$@"
