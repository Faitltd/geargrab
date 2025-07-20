#!/bin/bash

# GearGrab Deployment Script for geargrabco project
# Deploys to Google Cloud Run and configures geargrab.co domain

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Your project configuration
PROJECT_ID="geargrabco"
PROJECT_NUMBER="227444442028"
REGION="us-central1"
SERVICE_NAME="geargrab"
DOMAIN="geargrab.co"

echo -e "${PURPLE}🚀 Deploying GearGrab to geargrabco${NC}"
echo -e "${PURPLE}===================================${NC}"
echo -e "Project ID: $PROJECT_ID"
echo -e "Project Number: $PROJECT_NUMBER"
echo -e "Region: $REGION"
echo -e "Domain: $DOMAIN"
echo ""

# Function to check prerequisites
check_prerequisites() {
    echo -e "${BLUE}🔍 Checking prerequisites...${NC}"
    
    if ! command -v gcloud &> /dev/null; then
        echo -e "${RED}❌ gcloud CLI not found${NC}"
        echo -e "${YELLOW}Install: https://cloud.google.com/sdk/docs/install${NC}"
        exit 1
    fi
    
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        echo -e "${RED}❌ Not authenticated with gcloud${NC}"
        echo -e "${YELLOW}Run: gcloud auth login${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Prerequisites OK${NC}"
}

# Function to setup project
setup_project() {
    echo -e "${BLUE}🔧 Setting up project...${NC}"
    
    gcloud config set project "$PROJECT_ID"
    
    echo -e "${YELLOW}   Enabling APIs...${NC}"
    gcloud services enable \
        cloudbuild.googleapis.com \
        run.googleapis.com \
        containerregistry.googleapis.com \
        secretmanager.googleapis.com \
        domains.googleapis.com \
        --project="$PROJECT_ID" \
        --quiet
    
    echo -e "${GREEN}✅ Project setup complete${NC}"
}

# Function to deploy
deploy() {
    echo -e "${BLUE}🚀 Deploying to Cloud Run...${NC}"
    
    # Get git commit for tagging
    if git rev-parse --git-dir > /dev/null 2>&1; then
        GIT_SHA=$(git rev-parse --short HEAD)
        echo -e "${YELLOW}   Git SHA: $GIT_SHA${NC}"
    else
        GIT_SHA="latest"
    fi
    
    # Deploy with Cloud Build
    echo -e "${PURPLE}📦 Starting Cloud Build...${NC}"
    gcloud builds submit \
        --config=cloudbuild.yaml \
        --substitutions="_REGION=$REGION,_PUBLIC_FIREBASE_PROJECT_ID=$PROJECT_ID,_PUBLIC_APP_URL=https://$DOMAIN" \
        --project="$PROJECT_ID" \
        .
    
    echo -e "${GREEN}✅ Deployment complete${NC}"
}

# Function to setup domain
setup_domain() {
    echo -e "${BLUE}🌐 Setting up geargrab.co domain...${NC}"
    
    # Create domain mapping
    gcloud run domain-mappings create \
        --service="$SERVICE_NAME" \
        --domain="$DOMAIN" \
        --region="$REGION" \
        --project="$PROJECT_ID" \
        --quiet 2>/dev/null || echo -e "${YELLOW}   Domain mapping may already exist${NC}"
    
    echo -e "${BLUE}📋 DNS Configuration Required:${NC}"
    echo -e "${YELLOW}Configure these DNS records with your domain provider:${NC}"
    
    gcloud run domain-mappings describe "$DOMAIN" \
        --region="$REGION" \
        --project="$PROJECT_ID" \
        --format="table(status.resourceRecords[].name:label=NAME,status.resourceRecords[].rrdata:label=VALUE,status.resourceRecords[].type:label=TYPE)" \
        2>/dev/null || echo -e "${YELLOW}   Domain mapping not ready yet${NC}"
    
    echo -e "${GREEN}✅ Domain mapping created${NC}"
}

# Function to verify
verify() {
    echo -e "${BLUE}🔍 Verifying deployment...${NC}"
    
    SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
        --region="$REGION" \
        --project="$PROJECT_ID" \
        --format='value(status.url)' 2>/dev/null)
    
    if [[ -n "$SERVICE_URL" ]]; then
        echo -e "${YELLOW}   Service URL: $SERVICE_URL${NC}"
        
        # Wait and test
        echo -e "${YELLOW}   Waiting for service...${NC}"
        sleep 30
        
        if curl -f "$SERVICE_URL/health" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Service is healthy${NC}"
        else
            echo -e "${YELLOW}⚠️  Service may still be starting${NC}"
        fi
    else
        echo -e "${RED}❌ Could not get service URL${NC}"
    fi
}

# Function to show results
show_results() {
    echo -e "${GREEN}🎉 Deployment Complete!${NC}"
    echo -e "${GREEN}======================${NC}"
    
    SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
        --region="$REGION" \
        --project="$PROJECT_ID" \
        --format='value(status.url)' 2>/dev/null)
    
    echo -e "✅ Project: $PROJECT_ID"
    echo -e "✅ Service: $SERVICE_URL"
    echo -e "✅ Domain: https://$DOMAIN (after DNS setup)"
    echo ""
    
    echo -e "${YELLOW}📝 Next Steps:${NC}"
    echo -e "1. Configure DNS records for geargrab.co"
    echo -e "2. Wait for DNS propagation (up to 48 hours)"
    echo -e "3. Test at https://geargrab.co"
    echo ""
    
    echo -e "${YELLOW}🔧 Useful Commands:${NC}"
    echo -e "Logs: gcloud run services logs read $SERVICE_NAME --region=$REGION --project=$PROJECT_ID"
    echo -e "Domain: gcloud run domain-mappings describe $DOMAIN --region=$REGION --project=$PROJECT_ID"
}

# Main execution
main() {
    check_prerequisites
    setup_project
    deploy
    setup_domain
    verify
    show_results
    
    echo -e "${GREEN}🚀 GearGrab is live on Cloud Run!${NC}"
    echo -e "${BLUE}🌐 Configure DNS to access at geargrab.co${NC}"
}

# Run main function
main "$@"
