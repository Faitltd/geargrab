#!/bin/bash

# GearGrab Production Deployment Script
# Deploys to Google Cloud Run and configures geargrab.co domain

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="geargrab-production"  # Replace with your actual project ID
REGION="us-central1"
SERVICE_NAME="geargrab"
DOMAIN="geargrab.co"
BRANCH="production-v2-working-api-auth"

echo -e "${PURPLE}🚀 GearGrab Production Deployment${NC}"
echo -e "${PURPLE}=================================${NC}"
echo -e "Project ID: $PROJECT_ID"
echo -e "Region: $REGION"
echo -e "Domain: $DOMAIN"
echo -e "Branch: $BRANCH"
echo ""

# Function to check prerequisites
check_prerequisites() {
    echo -e "${BLUE}🔍 Checking prerequisites...${NC}"
    
    # Check if gcloud is installed
    if ! command -v gcloud &> /dev/null; then
        echo -e "${RED}❌ Error: gcloud CLI is not installed${NC}"
        echo -e "${YELLOW}Please install: https://cloud.google.com/sdk/docs/install${NC}"
        exit 1
    fi
    
    # Check if authenticated
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        echo -e "${RED}❌ Error: Not authenticated with gcloud${NC}"
        echo -e "${YELLOW}Please run: gcloud auth login${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Prerequisites checked${NC}"
}

# Function to setup project and APIs
setup_project() {
    echo -e "${BLUE}🔧 Setting up project...${NC}"
    
    # Set project
    gcloud config set project "$PROJECT_ID"
    
    # Enable required APIs
    echo -e "${YELLOW}   Enabling APIs...${NC}"
    gcloud services enable \
        cloudbuild.googleapis.com \
        run.googleapis.com \
        containerregistry.googleapis.com \
        secretmanager.googleapis.com \
        domains.googleapis.com \
        --project="$PROJECT_ID" \
        --quiet
    
    echo -e "${GREEN}✅ Project setup completed${NC}"
}

# Function to create secrets
create_secrets() {
    echo -e "${BLUE}🔐 Setting up secrets...${NC}"
    
    # Note: These would need to be created manually with actual values
    echo -e "${YELLOW}⚠️  Manual step required: Create these secrets in Google Secret Manager:${NC}"
    echo -e "   - firebase-private-key"
    echo -e "   - firebase-client-email" 
    echo -e "   - stripe-secret-key"
    echo -e "   - stripe-webhook-secret"
    echo -e "   - session-secret"
    echo ""
    echo -e "${YELLOW}Example commands:${NC}"
    echo -e "   gcloud secrets create firebase-private-key --data-file=firebase-key.json"
    echo -e "   gcloud secrets create stripe-secret-key --data-file=stripe-secret.txt"
    echo ""
}

# Function to deploy to Cloud Run
deploy_to_cloudrun() {
    echo -e "${BLUE}🚀 Deploying to Cloud Run...${NC}"
    
    # Get current git commit
    GIT_SHA=$(git rev-parse --short HEAD)
    echo -e "${YELLOW}   Git SHA: $GIT_SHA${NC}"
    
    # Submit build with Cloud Build
    echo -e "${PURPLE}📦 Starting Cloud Build...${NC}"
    gcloud builds submit \
        --config=cloudbuild.yaml \
        --substitutions="_REGION=$REGION,_PUBLIC_FIREBASE_PROJECT_ID=$PROJECT_ID,_PUBLIC_APP_URL=https://$DOMAIN" \
        --project="$PROJECT_ID" \
        .
    
    echo -e "${GREEN}✅ Cloud Run deployment completed${NC}"
}

# Function to setup custom domain
setup_custom_domain() {
    echo -e "${BLUE}🌐 Setting up custom domain...${NC}"
    
    # Get the Cloud Run service URL
    SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
        --region="$REGION" \
        --project="$PROJECT_ID" \
        --format='value(status.url)')
    
    echo -e "${YELLOW}   Service URL: $SERVICE_URL${NC}"
    
    # Create domain mapping
    echo -e "${YELLOW}   Creating domain mapping for $DOMAIN...${NC}"
    gcloud run domain-mappings create \
        --service="$SERVICE_NAME" \
        --domain="$DOMAIN" \
        --region="$REGION" \
        --project="$PROJECT_ID" \
        --quiet || echo -e "${YELLOW}   Domain mapping may already exist${NC}"
    
    # Get DNS records that need to be configured
    echo -e "${BLUE}📋 DNS Configuration Required:${NC}"
    echo -e "${YELLOW}Please configure these DNS records with your domain provider:${NC}"
    
    gcloud run domain-mappings describe "$DOMAIN" \
        --region="$REGION" \
        --project="$PROJECT_ID" \
        --format="table(spec.routePolicy.traffic.latestRevision:label=LATEST,status.resourceRecords[].name:label=NAME,status.resourceRecords[].rrdata:label=DATA,status.resourceRecords[].type:label=TYPE)"
    
    echo ""
    echo -e "${GREEN}✅ Domain mapping created${NC}"
}

# Function to verify deployment
verify_deployment() {
    echo -e "${BLUE}🔍 Verifying deployment...${NC}"
    
    # Get service URL
    SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
        --region="$REGION" \
        --project="$PROJECT_ID" \
        --format='value(status.url)')
    
    echo -e "${YELLOW}   Testing Cloud Run URL: $SERVICE_URL${NC}"
    
    # Wait for service to be ready
    sleep 30
    
    # Test health endpoint
    if curl -f "$SERVICE_URL/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Cloud Run service is healthy${NC}"
    else
        echo -e "${YELLOW}⚠️  Health check failed, but service may still be starting${NC}"
    fi
    
    echo -e "${BLUE}🌐 Testing custom domain: https://$DOMAIN${NC}"
    if curl -f "https://$DOMAIN/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Custom domain is working${NC}"
    else
        echo -e "${YELLOW}⚠️  Custom domain not ready yet (DNS propagation may take time)${NC}"
    fi
}

# Function to show final information
show_final_info() {
    echo -e "${GREEN}🎉 Deployment Summary${NC}"
    echo -e "${GREEN}===================${NC}"
    
    SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
        --region="$REGION" \
        --project="$PROJECT_ID" \
        --format='value(status.url)')
    
    echo -e "✅ Cloud Run Service: $SERVICE_URL"
    echo -e "✅ Custom Domain: https://$DOMAIN"
    echo -e "✅ Project: $PROJECT_ID"
    echo -e "✅ Region: $REGION"
    echo ""
    
    echo -e "${YELLOW}📝 Next Steps:${NC}"
    echo -e "1. Configure DNS records with your domain provider"
    echo -e "2. Wait for DNS propagation (can take up to 48 hours)"
    echo -e "3. Test the application at https://$DOMAIN"
    echo ""
    
    echo -e "${YELLOW}🔧 Useful Commands:${NC}"
    echo -e "View logs: gcloud run services logs read $SERVICE_NAME --region=$REGION --project=$PROJECT_ID"
    echo -e "Check domain: gcloud run domain-mappings describe $DOMAIN --region=$REGION --project=$PROJECT_ID"
    echo -e "Update service: gcloud run services update $SERVICE_NAME --region=$REGION --project=$PROJECT_ID"
}

# Main execution
main() {
    check_prerequisites
    setup_project
    create_secrets
    deploy_to_cloudrun
    setup_custom_domain
    verify_deployment
    show_final_info
    
    echo -e "${GREEN}🚀 GearGrab is now deployed to production!${NC}"
    echo -e "${BLUE}🌐 Visit: https://$DOMAIN${NC}"
}

# Run main function
main "$@"
