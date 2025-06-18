#!/bin/bash

# GearGrab Deployment Script
# This script handles the complete deployment process to Google Cloud Run

set -e  # Exit on any error

echo "🚀 Starting GearGrab deployment process..."

# Configuration
PROJECT_ID="geargrabco"  # Update with your actual project ID
REGION="us-central1"
SERVICE_NAME="geargrab-app"
DOMAIN="geargrab.co"
WWW_DOMAIN="www.geargrab.co"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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

# Check if gcloud is installed and authenticated
if ! command -v gcloud &> /dev/null; then
    print_error "gcloud CLI is not installed. Please install it first."
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    print_error "Not authenticated with gcloud. Please run 'gcloud auth login'"
    exit 1
fi

# Set the project
print_status "Setting Google Cloud project to $PROJECT_ID"
gcloud config set project $PROJECT_ID

# Enable required APIs
print_status "Enabling required Google Cloud APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable sql-component.googleapis.com
gcloud services enable sqladmin.googleapis.com

# Build and deploy using Cloud Build
print_status "Starting Cloud Build deployment..."
gcloud builds submit --config cloudbuild.yaml \
    --substitutions=_DATABASE_URL="$DATABASE_URL",_FIREBASE_PROJECT_ID="$FIREBASE_PROJECT_ID",_FIREBASE_ADMIN_CLIENT_EMAIL="$FIREBASE_ADMIN_CLIENT_EMAIL",_FIREBASE_ADMIN_PRIVATE_KEY="$FIREBASE_ADMIN_PRIVATE_KEY"

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")
print_status "Service deployed at: $SERVICE_URL"

# Configure domain mapping
print_status "Configuring domain mappings..."

# Map geargrab.co
if gcloud run domain-mappings describe --domain=$DOMAIN --region=$REGION 2>/dev/null; then
    print_warning "Domain mapping for $DOMAIN already exists"
else
    print_status "Creating domain mapping for $DOMAIN"
    gcloud run domain-mappings create --service=$SERVICE_NAME --domain=$DOMAIN --region=$REGION
fi

# Map www.geargrab.co
if gcloud run domain-mappings describe --domain=$WWW_DOMAIN --region=$REGION 2>/dev/null; then
    print_warning "Domain mapping for $WWW_DOMAIN already exists"
else
    print_status "Creating domain mapping for $WWW_DOMAIN"
    gcloud run domain-mappings create --service=$SERVICE_NAME --domain=$WWW_DOMAIN --region=$REGION
fi

# Get domain mapping status
print_status "Domain mapping status:"
gcloud run domain-mappings describe --domain=$DOMAIN --region=$REGION --format="table(spec.routeSettings.service,status.conditions[0].type,status.conditions[0].status)"

print_status "Domain mapping status for www:"
gcloud run domain-mappings describe --domain=$WWW_DOMAIN --region=$REGION --format="table(spec.routeSettings.service,status.conditions[0].type,status.conditions[0].status)"

# Display DNS configuration instructions
echo ""
print_status "🌐 DNS Configuration Required:"
echo "Please configure the following DNS records with your domain provider:"
echo ""
echo "For $DOMAIN:"
echo "  Type: A"
echo "  Name: @"
echo "  Value: $(gcloud run domain-mappings describe --domain=$DOMAIN --region=$REGION --format="value(status.resourceRecords[0].rrdata)")"
echo ""
echo "For $WWW_DOMAIN:"
echo "  Type: CNAME"
echo "  Name: www"
echo "  Value: $(gcloud run domain-mappings describe --domain=$WWW_DOMAIN --region=$REGION --format="value(status.resourceRecords[0].rrdata)")"
echo ""

print_status "🎉 Deployment completed successfully!"
print_status "Your application will be available at:"
print_status "  - https://$DOMAIN"
print_status "  - https://$WWW_DOMAIN"
print_status "  - $SERVICE_URL (direct Cloud Run URL)"

echo ""
print_warning "Note: DNS propagation may take up to 48 hours. You can test the direct Cloud Run URL immediately."
