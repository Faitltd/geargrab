#!/bin/bash

# GearGrab Deployment Script
# Automates the complete deployment process to Google Cloud Run

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=${PROJECT_ID:-""}
REGION=${REGION:-"us-central1"}
SERVICE_NAME=${SERVICE_NAME:-"geargrab"}
IMAGE_NAME=${IMAGE_NAME:-"geargrab"}
ENVIRONMENT=${ENVIRONMENT:-"production"}

# Build configuration
BUILD_CONFIG=${BUILD_CONFIG:-"cloudbuild.yaml"}
DOCKERFILE=${DOCKERFILE:-"Dockerfile"}

# Function to print usage
usage() {
    echo -e "${BLUE}Usage: $0 [OPTIONS]${NC}"
    echo -e "${BLUE}Deploy GearGrab to Google Cloud Run${NC}"
    echo ""
    echo -e "${YELLOW}Options:${NC}"
    echo "  -p, --project PROJECT_ID    Google Cloud Project ID (required)"
    echo "  -r, --region REGION         Deployment region (default: us-central1)"
    echo "  -s, --service SERVICE_NAME  Cloud Run service name (default: geargrab)"
    echo "  -e, --env ENVIRONMENT       Environment (default: production)"
    echo "  -c, --config BUILD_CONFIG   Cloud Build config file (default: cloudbuild.yaml)"
    echo "  -d, --dry-run              Perform a dry run without actual deployment"
    echo "  -h, --help                 Show this help message"
    echo ""
    echo -e "${YELLOW}Examples:${NC}"
    echo "  $0 -p my-project-id"
    echo "  $0 -p my-project-id -r us-west1 -e staging"
    echo "  $0 --project my-project-id --dry-run"
}

# Function to validate prerequisites
validate_prerequisites() {
    echo -e "${BLUE}🔍 Validating prerequisites...${NC}"
    
    # Check if gcloud is installed
    if ! command -v gcloud &> /dev/null; then
        echo -e "${RED}❌ Error: gcloud CLI is not installed${NC}"
        echo -e "${YELLOW}Please install gcloud: https://cloud.google.com/sdk/docs/install${NC}"
        exit 1
    fi
    
    # Check if docker is installed
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Error: Docker is not installed${NC}"
        echo -e "${YELLOW}Please install Docker: https://docs.docker.com/get-docker/${NC}"
        exit 1
    fi
    
    # Check if authenticated with gcloud
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        echo -e "${RED}❌ Error: Not authenticated with gcloud${NC}"
        echo -e "${YELLOW}Please run: gcloud auth login${NC}"
        exit 1
    fi
    
    # Check if project ID is provided
    if [[ -z "$PROJECT_ID" ]]; then
        echo -e "${RED}❌ Error: PROJECT_ID is required${NC}"
        usage
        exit 1
    fi
    
    # Check if required files exist
    if [[ ! -f "$BUILD_CONFIG" ]]; then
        echo -e "${RED}❌ Error: Build config file '$BUILD_CONFIG' not found${NC}"
        exit 1
    fi
    
    if [[ ! -f "$DOCKERFILE" ]]; then
        echo -e "${RED}❌ Error: Dockerfile '$DOCKERFILE' not found${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Prerequisites validated${NC}"
}

# Function to setup project
setup_project() {
    echo -e "${BLUE}🔧 Setting up project...${NC}"
    
    # Set project
    gcloud config set project "$PROJECT_ID"
    
    # Enable required APIs
    echo -e "${YELLOW}   Enabling required APIs...${NC}"
    gcloud services enable cloudbuild.googleapis.com \
        run.googleapis.com \
        containerregistry.googleapis.com \
        secretmanager.googleapis.com \
        --project="$PROJECT_ID" \
        --quiet
    
    echo -e "${GREEN}✅ Project setup completed${NC}"
}

# Function to build and deploy
build_and_deploy() {
    echo -e "${BLUE}🚀 Starting build and deployment...${NC}"
    
    # Get current git commit hash for tagging
    if git rev-parse --git-dir > /dev/null 2>&1; then
        GIT_SHA=$(git rev-parse --short HEAD)
        echo -e "${YELLOW}   Git SHA: $GIT_SHA${NC}"
    else
        GIT_SHA="latest"
        echo -e "${YELLOW}   No git repository found, using 'latest' tag${NC}"
    fi
    
    # Prepare substitutions
    SUBSTITUTIONS="_REGION=$REGION"
    SUBSTITUTIONS="$SUBSTITUTIONS,_SERVICE_ACCOUNT_EMAIL=geargrab-cloudrun@$PROJECT_ID.iam.gserviceaccount.com"
    SUBSTITUTIONS="$SUBSTITUTIONS,_PUBLIC_FIREBASE_PROJECT_ID=$PROJECT_ID"
    SUBSTITUTIONS="$SUBSTITUTIONS,_PUBLIC_FIREBASE_AUTH_DOMAIN=$PROJECT_ID.firebaseapp.com"
    SUBSTITUTIONS="$SUBSTITUTIONS,_PUBLIC_FIREBASE_STORAGE_BUCKET=$PROJECT_ID.appspot.com"
    SUBSTITUTIONS="$SUBSTITUTIONS,_PUBLIC_APP_URL=https://$SERVICE_NAME-$(echo $PROJECT_ID | tr '[:upper:]' '[:lower:]' | tr '_' '-')-$REGION.a.run.app"
    
    # Add environment-specific substitutions
    if [[ "$ENVIRONMENT" == "staging" ]]; then
        SUBSTITUTIONS="$SUBSTITUTIONS,_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_..."
    else
        SUBSTITUTIONS="$SUBSTITUTIONS,_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_..."
    fi
    
    echo -e "${YELLOW}   Substitutions: $SUBSTITUTIONS${NC}"
    
    # Submit build
    echo -e "${PURPLE}📦 Submitting build to Cloud Build...${NC}"
    gcloud builds submit \
        --config="$BUILD_CONFIG" \
        --substitutions="$SUBSTITUTIONS" \
        --project="$PROJECT_ID" \
        .
    
    echo -e "${GREEN}✅ Build and deployment completed${NC}"
}

# Function to verify deployment
verify_deployment() {
    echo -e "${BLUE}🔍 Verifying deployment...${NC}"
    
    # Get service URL
    SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
        --region="$REGION" \
        --project="$PROJECT_ID" \
        --format='value(status.url)' 2>/dev/null || echo "")
    
    if [[ -z "$SERVICE_URL" ]]; then
        echo -e "${RED}❌ Error: Could not retrieve service URL${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}   Service URL: $SERVICE_URL${NC}"
    
    # Wait for service to be ready
    echo -e "${YELLOW}   Waiting for service to be ready...${NC}"
    sleep 30
    
    # Perform health check
    echo -e "${YELLOW}   Performing health check...${NC}"
    for i in {1..5}; do
        if curl -f "$SERVICE_URL/health" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Health check passed${NC}"
            echo -e "${GREEN}🎉 Deployment successful!${NC}"
            echo -e "${BLUE}🌐 Your application is available at: $SERVICE_URL${NC}"
            return 0
        else
            echo -e "${YELLOW}   Health check attempt $i failed, retrying...${NC}"
            sleep 10
        fi
    done
    
    echo -e "${RED}❌ Health check failed after 5 attempts${NC}"
    echo -e "${YELLOW}💡 The service might still be starting up. Check the logs:${NC}"
    echo -e "${YELLOW}   gcloud run services logs read $SERVICE_NAME --region=$REGION --project=$PROJECT_ID${NC}"
    exit 1
}

# Function to show deployment info
show_deployment_info() {
    echo -e "${BLUE}📋 Deployment Information${NC}"
    echo -e "${BLUE}=========================${NC}"
    echo -e "Project ID:     $PROJECT_ID"
    echo -e "Region:         $REGION"
    echo -e "Service Name:   $SERVICE_NAME"
    echo -e "Environment:    $ENVIRONMENT"
    echo -e "Build Config:   $BUILD_CONFIG"
    echo ""
    
    # Get service details
    if gcloud run services describe "$SERVICE_NAME" --region="$REGION" --project="$PROJECT_ID" >/dev/null 2>&1; then
        SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" --region="$REGION" --project="$PROJECT_ID" --format='value(status.url)')
        LATEST_REVISION=$(gcloud run services describe "$SERVICE_NAME" --region="$REGION" --project="$PROJECT_ID" --format='value(status.latestReadyRevisionName)')
        
        echo -e "${GREEN}✅ Service Status: DEPLOYED${NC}"
        echo -e "Service URL:    $SERVICE_URL"
        echo -e "Latest Revision: $LATEST_REVISION"
    else
        echo -e "${YELLOW}⚠️  Service Status: NOT DEPLOYED${NC}"
    fi
    
    echo ""
    echo -e "${YELLOW}📝 Useful Commands:${NC}"
    echo -e "View logs:      gcloud run services logs read $SERVICE_NAME --region=$REGION --project=$PROJECT_ID"
    echo -e "View service:   gcloud run services describe $SERVICE_NAME --region=$REGION --project=$PROJECT_ID"
    echo -e "Update traffic: gcloud run services update-traffic $SERVICE_NAME --to-latest --region=$REGION --project=$PROJECT_ID"
}

# Parse command line arguments
DRY_RUN=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--project)
            PROJECT_ID="$2"
            shift 2
            ;;
        -r|--region)
            REGION="$2"
            shift 2
            ;;
        -s|--service)
            SERVICE_NAME="$2"
            shift 2
            ;;
        -e|--env)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -c|--config)
            BUILD_CONFIG="$2"
            shift 2
            ;;
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Unknown option: $1${NC}"
            usage
            exit 1
            ;;
    esac
done

# Main execution
main() {
    echo -e "${PURPLE}🚀 GearGrab Deployment Script${NC}"
    echo -e "${PURPLE}=============================${NC}"
    
    validate_prerequisites
    
    if [[ "$DRY_RUN" == "true" ]]; then
        echo -e "${YELLOW}🔍 DRY RUN MODE - No actual deployment will occur${NC}"
        show_deployment_info
        exit 0
    fi
    
    setup_project
    build_and_deploy
    verify_deployment
    show_deployment_info
    
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
}

# Run main function
main "$@"
