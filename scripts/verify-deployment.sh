#!/bin/bash

# GearGrab Deployment Verification Script
# This script verifies that the deployment was successful

set -e

echo "🔍 Verifying GearGrab Deployment..."

# Configuration
PROJECT_ID="geargrabco"
REGION="us-central1"
SERVICE_NAME="geargrab-app"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if gcloud is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    print_error "Not authenticated with gcloud. Please run 'gcloud auth login'"
    exit 1
fi

# Set the project
gcloud config set project $PROJECT_ID

echo "📊 Deployment Status Check:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if Cloud Run service exists and is running
print_status() {
    echo -e "${GREEN}🔍 $1${NC}"
}

print_status "Checking Cloud Run service..."
if gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)" > /dev/null 2>&1; then
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")
    print_success "Cloud Run service is running"
    echo "   Service URL: $SERVICE_URL"
    
    # Check if service is ready
    READY_CONDITION=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.conditions[0].status)")
    if [ "$READY_CONDITION" = "True" ]; then
        print_success "Service is ready and healthy"
    else
        print_warning "Service exists but may not be ready"
    fi
else
    print_error "Cloud Run service not found"
    echo "Run the deployment script first: ./scripts/deploy.sh"
    exit 1
fi

# Test the service endpoint
print_status "Testing service endpoint..."
if curl -s --max-time 10 "$SERVICE_URL" > /dev/null; then
    print_success "Service endpoint is responding"
else
    print_warning "Service endpoint is not responding (may still be starting up)"
fi

# Check domain mappings
print_status "Checking domain mappings..."

# Check geargrab.co
if gcloud run domain-mappings describe --domain=geargrab.co --region=$REGION > /dev/null 2>&1; then
    print_success "Domain mapping exists for geargrab.co"
    
    # Get DNS record info
    DNS_RECORD=$(gcloud run domain-mappings describe --domain=geargrab.co --region=$REGION --format="value(status.resourceRecords[0].rrdata)" 2>/dev/null)
    if [ ! -z "$DNS_RECORD" ]; then
        echo "   DNS A Record needed: $DNS_RECORD"
    fi
else
    print_warning "Domain mapping for geargrab.co not found"
fi

# Check www.geargrab.co
if gcloud run domain-mappings describe --domain=www.geargrab.co --region=$REGION > /dev/null 2>&1; then
    print_success "Domain mapping exists for www.geargrab.co"
    
    # Get DNS record info
    DNS_RECORD=$(gcloud run domain-mappings describe --domain=www.geargrab.co --region=$REGION --format="value(status.resourceRecords[0].rrdata)" 2>/dev/null)
    if [ ! -z "$DNS_RECORD" ]; then
        echo "   DNS CNAME Record needed: $DNS_RECORD"
    fi
else
    print_warning "Domain mapping for www.geargrab.co not found"
fi

# Test API endpoint
print_status "Testing API endpoints..."
API_URL="$SERVICE_URL/api/comments?articleId=article_001"
if curl -s --max-time 10 "$API_URL" | grep -q "success\|data"; then
    print_success "Comment API is working"
else
    print_warning "Comment API may not be responding correctly"
fi

# Check recent logs for errors
print_status "Checking recent logs for errors..."
ERROR_COUNT=$(gcloud run services logs read $SERVICE_NAME --region=$REGION --limit=50 --format="value(textPayload)" 2>/dev/null | grep -i error | wc -l)
if [ "$ERROR_COUNT" -eq 0 ]; then
    print_success "No recent errors in logs"
else
    print_warning "Found $ERROR_COUNT error(s) in recent logs"
    echo "   Check logs with: gcloud run services logs read $SERVICE_NAME --region=$REGION"
fi

echo ""
echo "🌐 DNS Configuration Status:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Test domain accessibility
test_domain() {
    local domain=$1
    if curl -s --max-time 5 "https://$domain" > /dev/null 2>&1; then
        print_success "$domain is accessible"
        return 0
    else
        print_warning "$domain is not yet accessible (DNS may still be propagating)"
        return 1
    fi
}

test_domain "geargrab.co"
test_domain "www.geargrab.co"

echo ""
echo "📋 Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ ! -z "$SERVICE_URL" ]; then
    echo "✅ Cloud Run Service: DEPLOYED"
    echo "   Direct URL: $SERVICE_URL"
else
    echo "❌ Cloud Run Service: NOT DEPLOYED"
fi

echo ""
echo "🚀 Next Steps:"
if curl -s --max-time 5 "https://geargrab.co" > /dev/null 2>&1; then
    echo "🎉 Your site is live at https://geargrab.co!"
    echo "🎉 Your site is also available at https://www.geargrab.co!"
    echo ""
    echo "✅ Test the comment system:"
    echo "   https://geargrab.co/api/comments?articleId=article_001"
else
    echo "⏳ Waiting for DNS propagation..."
    echo "   Your site will be available at https://geargrab.co once DNS propagates"
    echo "   This can take up to 48 hours, but usually happens within 1-2 hours"
    echo ""
    echo "🔧 Configure these DNS records with your domain provider:"
    
    if [ ! -z "$DNS_RECORD" ]; then
        echo "   A Record: @ → (IP from domain mapping above)"
        echo "   CNAME Record: www → (CNAME from domain mapping above)"
    fi
    
    echo ""
    echo "🧪 You can test immediately using the direct Cloud Run URL:"
    echo "   $SERVICE_URL"
fi

echo ""
echo "📊 Monitor your deployment:"
echo "   gcloud run services logs read $SERVICE_NAME --region=$REGION --follow"
