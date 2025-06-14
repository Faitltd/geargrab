#!/bin/bash

# GearGrab Cloud Run Deployment Script
# Deploys the application to Google Cloud Run and configures geargrab.co domain

set -e  # Exit on any error

echo "🚀 GearGrab Cloud Run Deployment"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="geargrabco"
SERVICE_NAME="geargrab"
REGION="us-central1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"
DOMAIN="geargrab.co"

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if gcloud is installed and authenticated
check_gcloud() {
    print_info "Checking Google Cloud CLI..."
    
    if ! command -v gcloud &> /dev/null; then
        print_error "Google Cloud CLI is not installed. Please install it first."
        echo "Visit: https://cloud.google.com/sdk/docs/install"
        exit 1
    fi
    
    # Check if authenticated
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        print_error "Not authenticated with Google Cloud. Please run: gcloud auth login"
        exit 1
    fi
    
    print_status "Google Cloud CLI is ready"
}

# Set the project
set_project() {
    print_info "Setting Google Cloud project to ${PROJECT_ID}..."
    gcloud config set project ${PROJECT_ID}
    print_status "Project set to ${PROJECT_ID}"
}

# Enable required APIs
enable_apis() {
    print_info "Enabling required Google Cloud APIs..."
    
    gcloud services enable cloudbuild.googleapis.com
    gcloud services enable run.googleapis.com
    gcloud services enable containerregistry.googleapis.com
    
    print_status "APIs enabled"
}

# Build and push Docker image
build_and_push() {
    print_info "Building and pushing Docker image..."
    
    # Build the image
    print_info "Building Docker image: ${IMAGE_NAME}"
    gcloud builds submit --tag ${IMAGE_NAME} .
    
    print_status "Docker image built and pushed"
}

# Deploy to Cloud Run
deploy_service() {
    print_info "Deploying to Cloud Run..."
    
    gcloud run deploy ${SERVICE_NAME} \
        --image ${IMAGE_NAME} \
        --platform managed \
        --region ${REGION} \
        --allow-unauthenticated \
        --port 8080 \
        --memory 1Gi \
        --cpu 1 \
        --min-instances 0 \
        --max-instances 10 \
        --set-env-vars "NODE_ENV=production" \
        --set-env-vars "VITE_APP_URL=https://${DOMAIN}" \
        --set-env-vars "VITE_USE_EMULATORS=false"
    
    print_status "Service deployed to Cloud Run"
}

# Get service URL
get_service_url() {
    SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} \
        --platform managed \
        --region ${REGION} \
        --format 'value(status.url)')
    
    print_info "Service URL: ${SERVICE_URL}"
    echo "SERVICE_URL=${SERVICE_URL}" > .env.cloudrun
}

# Configure custom domain
configure_domain() {
    print_info "Configuring custom domain: ${DOMAIN}"
    
    # Map domain to service
    gcloud beta run domain-mappings create \
        --service ${SERVICE_NAME} \
        --domain ${DOMAIN} \
        --region ${REGION} || true

    # Get domain mapping details
    print_info "Domain mapping configuration:"
    gcloud beta run domain-mappings describe ${DOMAIN} \
        --region ${REGION} \
        --format="table(spec.routePolicy.traffic.percent,status.conditions.type,status.conditions.status)" || true
    
    print_warning "Make sure to configure DNS records for ${DOMAIN}"
    print_info "Add these DNS records to your domain:"
    echo "  Type: CNAME"
    echo "  Name: www"
    echo "  Value: ghs.googlehosted.com"
    echo ""
    echo "  Type: A"
    echo "  Name: @"
    echo "  Value: (Get from Cloud Run domain mapping)"
}

# Set environment variables
set_environment_variables() {
    print_info "Setting environment variables..."
    
    # Check if .env.production exists
    if [[ -f ".env.production" ]]; then
        print_info "Loading environment variables from .env.production"
        
        # Read environment variables and set them
        while IFS= read -r line; do
            if [[ $line =~ ^[A-Z_].*=.* ]] && [[ ! $line =~ ^# ]]; then
                var_name=$(echo "$line" | cut -d'=' -f1)
                var_value=$(echo "$line" | cut -d'=' -f2-)
                
                # Remove quotes if present
                var_value=$(echo "$var_value" | sed 's/^"//;s/"$//')
                
                print_info "Setting ${var_name}"
                gcloud run services update ${SERVICE_NAME} \
                    --region ${REGION} \
                    --set-env-vars "${var_name}=${var_value}" \
                    --quiet
            fi
        done < .env.production
        
        print_status "Environment variables set"
    else
        print_warning ".env.production file not found. Skipping environment variable setup."
        print_info "Create .env.production with your production environment variables"
    fi
}

# Test deployment
test_deployment() {
    print_info "Testing deployment..."
    
    if curl -f -s "${SERVICE_URL}" > /dev/null; then
        print_status "Deployment is accessible"
    else
        print_warning "Deployment may not be ready yet"
    fi
    
    print_info "Testing custom domain..."
    if curl -f -s "https://${DOMAIN}" > /dev/null; then
        print_status "Custom domain is working"
    else
        print_warning "Custom domain not ready yet (DNS propagation may take time)"
    fi
}

# Main deployment flow
main() {
    echo
    print_info "Starting Cloud Run deployment..."
    echo
    
    # Step 1: Check prerequisites
    check_gcloud
    echo
    
    # Step 2: Set project
    set_project
    echo
    
    # Step 3: Enable APIs
    enable_apis
    echo
    
    # Step 4: Build and push image
    build_and_push
    echo
    
    # Step 5: Deploy service
    deploy_service
    echo
    
    # Step 6: Get service URL
    get_service_url
    echo
    
    # Step 7: Set environment variables
    set_environment_variables
    echo
    
    # Step 8: Configure custom domain
    configure_domain
    echo
    
    # Step 9: Test deployment
    test_deployment
    echo
    
    # Success message
    print_status "Deployment completed successfully!"
    echo
    print_info "Your application is now live at:"
    echo "  Cloud Run URL: ${SERVICE_URL}"
    echo "  Custom Domain: https://${DOMAIN}"
    echo
    print_info "Next steps:"
    echo "  1. Configure DNS records for your domain"
    echo "  2. Test the payment flow"
    echo "  3. Set up monitoring and alerts"
    echo "  4. Configure Stripe webhooks to point to your domain"
    echo
}

# Handle script arguments
case "${1:-}" in
    "build")
        check_gcloud
        set_project
        build_and_push
        ;;
    "deploy")
        check_gcloud
        set_project
        deploy_service
        get_service_url
        ;;
    "domain")
        check_gcloud
        set_project
        configure_domain
        ;;
    "test")
        get_service_url
        test_deployment
        ;;
    *)
        main
        ;;
esac
