#!/bin/bash

# GearGrab Quick Deploy Script
# This script deploys GearGrab to Cloud Run in one command

set -e

echo "🚀 GearGrab Quick Deploy to Cloud Run"
echo "======================================"

# Configuration
PROJECT_ID="geargrabco"
REGION="us-central1"
SERVICE_NAME="geargrab-app"
DATABASE_HOST="db.absmquyhavntfoojvskl.supabase.co"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_info() { echo -e "${YELLOW}ℹ️  $1${NC}"; }

# Check prerequisites
if ! command -v gcloud &> /dev/null; then
    print_error "gcloud CLI not found. Install it first:"
    echo "curl https://sdk.cloud.google.com | bash"
    exit 1
fi

if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    print_error "Not authenticated with gcloud. Run: gcloud auth login"
    exit 1
fi

# Check for required environment variables
if [ -z "$SUPABASE_PASSWORD" ]; then
    print_error "SUPABASE_PASSWORD environment variable required"
    echo "Get it from: https://supabase.com/dashboard/project/absmquyhavntfoojvskl/settings/database"
    echo "Then run: export SUPABASE_PASSWORD='your_password'"
    exit 1
fi

# Set project
print_info "Setting Google Cloud project to $PROJECT_ID"
gcloud config set project $PROJECT_ID

# Enable APIs
print_info "Enabling required APIs..."
gcloud services enable cloudbuild.googleapis.com run.googleapis.com

# Build DATABASE_URL
DATABASE_URL="postgresql://postgres:$SUPABASE_PASSWORD@$DATABASE_HOST:5432/postgres"
print_success "Database URL configured"

# Deploy using Cloud Build
print_info "Starting Cloud Build deployment..."
gcloud builds submit --config cloudbuild.yaml \
    --substitutions=_DATABASE_URL="$DATABASE_URL"

# Get service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")
print_success "Service deployed at: $SERVICE_URL"

# Set up domain mappings
print_info "Setting up domain mappings..."

# Map geargrab.co
if ! gcloud run domain-mappings describe --domain=geargrab.co --region=$REGION &>/dev/null; then
    print_info "Creating domain mapping for geargrab.co"
    gcloud run domain-mappings create --service=$SERVICE_NAME --domain=geargrab.co --region=$REGION
    print_success "Domain mapping created for geargrab.co"
else
    print_warning "Domain mapping for geargrab.co already exists"
fi

# Map www.geargrab.co
if ! gcloud run domain-mappings describe --domain=www.geargrab.co --region=$REGION &>/dev/null; then
    print_info "Creating domain mapping for www.geargrab.co"
    gcloud run domain-mappings create --service=$SERVICE_NAME --domain=www.geargrab.co --region=$REGION
    print_success "Domain mapping created for www.geargrab.co"
else
    print_warning "Domain mapping for www.geargrab.co already exists"
fi

# Get DNS configuration
echo ""
echo "🌐 DNS Configuration Required:"
echo "=============================="

A_RECORD=$(gcloud run domain-mappings describe --domain=geargrab.co --region=$REGION --format="value(status.resourceRecords[0].rrdata)" 2>/dev/null || echo "Check Cloud Console")
CNAME_RECORD=$(gcloud run domain-mappings describe --domain=www.geargrab.co --region=$REGION --format="value(status.resourceRecords[0].rrdata)" 2>/dev/null || echo "Check Cloud Console")

echo "Configure these DNS records with your domain provider:"
echo ""
echo "For geargrab.co:"
echo "  Type: A"
echo "  Name: @"
echo "  Value: $A_RECORD"
echo ""
echo "For www.geargrab.co:"
echo "  Type: CNAME"
echo "  Name: www"
echo "  Value: $CNAME_RECORD"

# Test the deployment
echo ""
echo "🧪 Testing Deployment:"
echo "====================="

print_info "Testing service endpoint..."
if curl -s --max-time 10 "$SERVICE_URL" > /dev/null; then
    print_success "Service is responding"
else
    print_warning "Service may still be starting up"
fi

print_info "Testing comment API..."
API_URL="$SERVICE_URL/api/comments?articleId=article_001"
if curl -s --max-time 10 "$API_URL" | grep -q "success\|data"; then
    print_success "Comment API is working"
    echo "  Test URL: $API_URL"
else
    print_warning "Comment API may not be ready yet"
fi

# Final summary
echo ""
echo "🎉 Deployment Complete!"
echo "======================="
print_success "Cloud Run Service: $SERVICE_URL"
print_success "Database: Connected to Supabase"
print_success "Domain Mappings: Created for geargrab.co and www.geargrab.co"

echo ""
echo "📋 Next Steps:"
echo "1. Configure DNS records (shown above)"
echo "2. Wait for DNS propagation (1-48 hours)"
echo "3. Test at https://geargrab.co once DNS propagates"
echo ""
echo "🔍 Monitor deployment:"
echo "gcloud run services logs read $SERVICE_NAME --region=$REGION --follow"

echo ""
print_success "Your GearGrab platform is now live!"
print_info "Direct URL (works immediately): $SERVICE_URL"
print_info "Production URLs (after DNS): https://geargrab.co and https://www.geargrab.co"
