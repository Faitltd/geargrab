#!/bin/bash

# GearGrab Deployment and Testing Script
# This script deploys to Cloud Run and runs comprehensive tests

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="https://geargrab.co"
PROJECT_ID="geargrabco"
SERVICE_NAME="geargrab"
REGION="us-central1"

echo -e "${BLUE}🚀 GearGrab Deployment and Testing Script${NC}"
echo -e "${BLUE}=========================================${NC}"

# Function to print status
print_status() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')] $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

print_status "Checking project structure..."
print_success "Project structure verified"

# Check gcloud authentication
print_status "Checking gcloud authentication..."
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    print_error "Not authenticated with gcloud. Please run:"
    echo "   gcloud auth login"
    echo "   gcloud config set project $PROJECT_ID"
    exit 1
fi

ACTIVE_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n1)
print_success "Authenticated as: $ACTIVE_ACCOUNT"

# Set project
print_status "Setting gcloud project..."
gcloud config set project $PROJECT_ID
print_success "Project set to: $PROJECT_ID"

# Get current deployment info
print_status "Getting current deployment info..."
CURRENT_REVISION=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.latestReadyRevisionName)" 2>/dev/null || echo "none")
print_success "Current revision: $CURRENT_REVISION"

# Build the application
print_status "Building application..."
npm run build

if [ $? -ne 0 ]; then
    print_error "Build failed. Please check for build errors."
    exit 1
fi

print_success "Build completed successfully"

# Check if build directory exists and has content
if [ ! -d "build" ] || [ -z "$(ls -A build)" ]; then
    print_error "Build directory is empty or missing"
    exit 1
fi

print_success "Build artifacts verified"

# Deploy to Cloud Run
print_status "Deploying to Cloud Run..."
echo -e "${YELLOW}This may take 5-10 minutes...${NC}"

gcloud run deploy $SERVICE_NAME \
    --source . \
    --region $REGION \
    --platform managed \
    --allow-unauthenticated \
    --port 8080 \
    --memory 2Gi \
    --cpu 2 \
    --max-instances 10 \
    --timeout 300 \
    --concurrency 80 \
    --set-env-vars NODE_ENV=production \
    --set-env-vars PORT=8080 \
    --set-env-vars HOST=0.0.0.0 \
    --set-env-vars VITE_USE_EMULATORS=false \
    --set-env-vars VITE_APP_URL=$DOMAIN \
    --set-env-vars FIREBASE_PROJECT_ID=$PROJECT_ID \
    --set-env-vars FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-fbsvc@geargrabco.iam.gserviceaccount.com \
    --quiet

DEPLOY_STATUS=$?

if [ $DEPLOY_STATUS -eq 0 ]; then
    print_success "Deployment completed successfully!"
else
    print_error "Deployment failed with status: $DEPLOY_STATUS"
    exit 1
fi

# Get new deployment info
print_status "Getting new deployment info..."
NEW_REVISION=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.latestReadyRevisionName)")
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")

print_success "New revision: $NEW_REVISION"
print_success "Service URL: $SERVICE_URL"

# Wait for deployment to settle
print_status "Waiting for deployment to settle..."
sleep 30

echo -e "${PURPLE}🧪 Starting Comprehensive Tests...${NC}"
echo -e "${PURPLE}===================================${NC}"

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run test
run_test() {
    local test_name="$1"
    local url="$2"
    local expected_status="$3"
    local expected_content="$4"
    
    print_status "Testing: $test_name"
    
    # Make request and capture both status and content
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" "$url")
    status_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    content=$(echo "$response" | sed 's/HTTPSTATUS:[0-9]*$//')
    
    # Check status code
    if [ "$status_code" = "$expected_status" ]; then
        # Check content if provided
        if [ -n "$expected_content" ]; then
            if echo "$content" | grep -q "$expected_content"; then
                print_success "$test_name - Status: $status_code ✓"
                ((TESTS_PASSED++))
                return 0
            else
                print_error "$test_name - Content check failed"
                echo "Expected: $expected_content"
                echo "Got: $(echo "$content" | head -c 200)..."
                ((TESTS_FAILED++))
                return 1
            fi
        else
            print_success "$test_name - Status: $status_code ✓"
            ((TESTS_PASSED++))
            return 0
        fi
    else
        print_error "$test_name - Expected: $expected_status, Got: $status_code"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Core Application Tests
echo -e "${BLUE}📱 Core Application Tests${NC}"
run_test "Homepage" "$DOMAIN/" "200" "GearGrab"
run_test "Browse Page" "$DOMAIN/browse" "200" 
run_test "About Page" "$DOMAIN/about" "200"
run_test "Contact Page" "$DOMAIN/contact" "200"

# API Health Tests
echo -e "${BLUE}🔧 API Health Tests${NC}"
run_test "Health Check" "$DOMAIN/health" "200" "healthy"
run_test "API Health" "$DOMAIN/api/health" "200"

# Admin Debug Tests (these should work without auth)
echo -e "${BLUE}🔍 Debug Endpoint Tests${NC}"
run_test "Debug Current User" "$DOMAIN/api/debug/current-user" "200"

# Static Asset Tests
echo -e "${BLUE}📦 Static Asset Tests${NC}"
run_test "Favicon" "$DOMAIN/favicon.ico" "200"

# Security Header Tests
echo -e "${BLUE}🔒 Security Header Tests${NC}"
print_status "Testing security headers..."
headers=$(curl -s -I "$DOMAIN/")
if echo "$headers" | grep -q "X-Content-Type-Options: nosniff"; then
    print_success "Security headers present ✓"
    ((TESTS_PASSED++))
else
    print_error "Security headers missing"
    ((TESTS_FAILED++))
fi

# Performance Test
echo -e "${BLUE}⚡ Performance Tests${NC}"
print_status "Testing response time..."
start_time=$(date +%s%N)
curl -s "$DOMAIN/" > /dev/null
end_time=$(date +%s%N)
response_time=$(( (end_time - start_time) / 1000000 ))

if [ $response_time -lt 3000 ]; then
    print_success "Response time: ${response_time}ms ✓"
    ((TESTS_PASSED++))
else
    print_warning "Response time: ${response_time}ms (>3s)"
    ((TESTS_FAILED++))
fi

# SSL/TLS Test
echo -e "${BLUE}🔐 SSL/TLS Tests${NC}"
print_status "Testing SSL certificate..."
if curl -s --head "$DOMAIN/" | grep -q "HTTP/2 200\|HTTP/1.1 200"; then
    print_success "SSL/HTTPS working ✓"
    ((TESTS_PASSED++))
else
    print_error "SSL/HTTPS issues detected"
    ((TESTS_FAILED++))
fi

# Test Results Summary
echo -e "${PURPLE}📊 Test Results Summary${NC}"
echo -e "${PURPLE}======================${NC}"
echo -e "${GREEN}✅ Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}❌ Tests Failed: $TESTS_FAILED${NC}"

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
SUCCESS_RATE=$((TESTS_PASSED * 100 / TOTAL_TESTS))

echo -e "${BLUE}📈 Success Rate: $SUCCESS_RATE%${NC}"

# Final Status
echo -e "${PURPLE}🎯 Deployment Summary${NC}"
echo -e "${PURPLE}=====================${NC}"
echo -e "${GREEN}✅ Deployment: SUCCESS${NC}"
echo -e "${GREEN}✅ Service URL: $SERVICE_URL${NC}"
echo -e "${GREEN}✅ Domain: $DOMAIN${NC}"
echo -e "${GREEN}✅ Revision: $NEW_REVISION${NC}"

if [ $SUCCESS_RATE -ge 80 ]; then
    echo -e "${GREEN}🎉 Deployment and testing completed successfully!${NC}"
    echo -e "${GREEN}🌐 Your application is live at: $DOMAIN${NC}"
else
    echo -e "${YELLOW}⚠️ Deployment completed but some tests failed.${NC}"
    echo -e "${YELLOW}Please review the failed tests above.${NC}"
fi

echo -e "${BLUE}📋 Next Steps:${NC}"
echo -e "   1. Visit $DOMAIN to verify the site loads"
echo -e "   2. Check admin panel at $DOMAIN/admin"
echo -e "   3. Test admin settings at $DOMAIN/admin/settings"
echo -e "   4. Test security dashboard at $DOMAIN/admin/security"
echo -e "   5. Use debug endpoint to set admin access:"
echo -e "      POST $DOMAIN/api/debug/setup-admin"

exit 0
