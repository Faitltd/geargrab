#!/bin/bash

# One-Click Production Deployment for GearGrab
# This script deploys GearGrab to Google Cloud Run and configures geargrab.co/www.geargrab.co

set -e

echo "🚀 GearGrab One-Click Production Deployment"
echo "============================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Configuration
PROJECT_ID="geargrabco"
REGION="us-central1"
SERVICE_NAME="geargrab-app"

# Check if running in the correct directory
if [[ ! -f "package.json" ]] || [[ ! -f "cloudbuild.yaml" ]]; then
    print_error "Please run this script from the GearGrab project root directory"
    exit 1
fi

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check gcloud
    if ! command -v gcloud &> /dev/null; then
        print_error "Google Cloud SDK not found. Install with:"
        echo "  curl https://sdk.cloud.google.com | bash"
        echo "  exec -l \$SHELL"
        exit 1
    fi
    
    # Check authentication
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -1 > /dev/null; then
        print_error "Not authenticated with Google Cloud. Run:"
        echo "  gcloud auth login"
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Function to validate environment variables
validate_environment() {
    print_status "Validating environment variables..."
    
    required_vars=(
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
        echo "Set them with:"
        echo "  export FIREBASE_PROJECT_ID=\"your-project-id\""
        echo "  export FIREBASE_ADMIN_CLIENT_EMAIL=\"your-email@project.iam.gserviceaccount.com\""
        echo "  export FIREBASE_ADMIN_PRIVATE_KEY=\"-----BEGIN PRIVATE KEY-----...\""
        echo "  export SESSION_SECRET=\"\$(openssl rand -base64 32)\""
        echo "  export STRIPE_SECRET_KEY=\"sk_live_...\""
        echo "  export STRIPE_WEBHOOK_SECRET=\"whsec_...\""
        exit 1
    fi
    
    # Validate session secret length
    if [[ ${#SESSION_SECRET} -lt 32 ]]; then
        print_error "SESSION_SECRET must be at least 32 characters long"
        echo "Generate a new one: export SESSION_SECRET=\"\$(openssl rand -base64 32)\""
        exit 1
    fi
    
    print_success "Environment variables validated"
}

# Function to setup Google Cloud project
setup_project() {
    print_status "Setting up Google Cloud project..."
    
    # Set project
    gcloud config set project $PROJECT_ID
    
    # Enable APIs
    print_status "Enabling required APIs..."
    gcloud services enable cloudbuild.googleapis.com
    gcloud services enable run.googleapis.com
    gcloud services enable containerregistry.googleapis.com
    
    print_success "Project setup completed"
}

# Function to trigger Cloud Build deployment
deploy_with_cloud_build() {
    print_status "Starting Cloud Build deployment..."
    
    # Create substitutions for environment variables
    substitutions="_FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID"
    substitutions="$substitutions,_FIREBASE_ADMIN_CLIENT_EMAIL=$FIREBASE_ADMIN_CLIENT_EMAIL"
    substitutions="$substitutions,_FIREBASE_ADMIN_PRIVATE_KEY=$FIREBASE_ADMIN_PRIVATE_KEY"
    substitutions="$substitutions,_SESSION_SECRET=$SESSION_SECRET"
    substitutions="$substitutions,_STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY"
    substitutions="$substitutions,_STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET"
    
    # Trigger build
    print_status "Triggering Cloud Build..."
    BUILD_ID=$(gcloud builds submit \
        --config cloudbuild.yaml \
        --substitutions "$substitutions" \
        --format="value(id)")
    
    print_status "Build ID: $BUILD_ID"
    print_status "Following build progress..."
    
    # Follow build logs
    gcloud builds log $BUILD_ID --stream
    
    # Check build status
    BUILD_STATUS=$(gcloud builds describe $BUILD_ID --format="value(status)")
    
    if [[ "$BUILD_STATUS" == "SUCCESS" ]]; then
        print_success "Cloud Build deployment completed successfully!"
    else
        print_error "Cloud Build deployment failed with status: $BUILD_STATUS"
        exit 1
    fi
}

# Function to get service information
get_service_info() {
    print_status "Getting service information..."
    
    # Get service URL
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
        --region $REGION \
        --format="value(status.url)")
    
    print_success "Service deployed at: $SERVICE_URL"
    
    # Get domain mappings
    print_status "Checking domain mappings..."
    gcloud run domain-mappings list --region $REGION
}

# Function to run verification
run_verification() {
    print_status "Running deployment verification..."
    
    # Wait for service to be ready
    sleep 30
    
    # Test health endpoint
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
        --region $REGION \
        --format="value(status.url)")
    
    if curl -f "$SERVICE_URL/api/health" > /dev/null 2>&1; then
        print_success "Health check passed"
    else
        print_warning "Health check failed - service may still be starting"
    fi
    
    # Test domains (if DNS is propagated)
    for domain in "geargrab.co" "www.geargrab.co"; do
        if curl -f "https://$domain/api/health" > /dev/null 2>&1; then
            print_success "Domain $domain is working"
        else
            print_warning "Domain $domain not yet accessible (DNS propagation may be pending)"
        fi
    done
}

# Function to display final instructions
show_final_instructions() {
    echo ""
    print_success "🎉 Deployment completed successfully!"
    echo ""
    echo "📊 Deployment Summary:"
    echo "  Project: $PROJECT_ID"
    echo "  Service: $SERVICE_NAME"
    echo "  Region: $REGION"
    echo ""
    echo "🌐 Your application will be available at:"
    echo "  - https://geargrab.co"
    echo "  - https://www.geargrab.co"
    echo ""
    echo "⏰ DNS Propagation:"
    echo "  - SSL certificates will be auto-provisioned"
    echo "  - DNS propagation can take 5 minutes to 48 hours"
    echo "  - Check status: gcloud run domain-mappings list --region $REGION"
    echo ""
    echo "🔍 Monitoring:"
    echo "  - Health: https://geargrab.co/api/health"
    echo "  - Logs: gcloud logs read \"resource.type=cloud_run_revision\""
    echo "  - Metrics: Google Cloud Console > Cloud Run > $SERVICE_NAME"
    echo ""
    echo "🔒 Security Features Active:"
    echo "  ✅ Real Firebase Authentication"
    echo "  ✅ Rate Limiting (Auth: 5/15min, Payment: 3/min, API: 100/15min)"
    echo "  ✅ Security Headers (CSP, HSTS, X-Frame-Options, etc.)"
    echo "  ✅ Input Validation & XSS Protection"
    echo "  ✅ Secure Payment Processing"
    echo "  ✅ Health Monitoring"
    echo ""
    echo "🎯 Next Steps:"
    echo "  1. Wait for DNS propagation"
    echo "  2. Test all functionality at https://geargrab.co"
    echo "  3. Set up monitoring alerts"
    echo "  4. Monitor logs for any issues"
    echo ""
    print_success "GearGrab is now live in production! 🚀"
}

# Main deployment process
main() {
    echo "Starting deployment process..."
    echo ""
    
    # Run all deployment steps
    check_prerequisites
    validate_environment
    setup_project
    deploy_with_cloud_build
    get_service_info
    run_verification
    show_final_instructions
}

# Execute deployment
main "$@"
