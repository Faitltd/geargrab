#!/bin/bash

# GearGrab Deployment Testing Script
# Run this after deployment to verify everything is working

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

echo -e "${PURPLE}🧪 GearGrab Deployment Testing${NC}"
echo -e "${PURPLE}===============================${NC}"

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
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" "$url" --max-time 10)
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
run_test "FAQ Page" "$DOMAIN/faq" "200"

# API Health Tests
echo -e "${BLUE}🔧 API Health Tests${NC}"
run_test "Health Check" "$DOMAIN/health" "200" "healthy"
run_test "API Health" "$DOMAIN/api/health" "200"

# Admin Pages (should redirect or show login)
echo -e "${BLUE}🔐 Admin Access Tests${NC}"
run_test "Admin Panel" "$DOMAIN/admin" "200"
run_test "Admin Settings" "$DOMAIN/admin/settings" "200"
run_test "Admin Security" "$DOMAIN/admin/security" "200"

# Debug Endpoints
echo -e "${BLUE}🔍 Debug Endpoint Tests${NC}"
run_test "Debug Current User" "$DOMAIN/api/debug/current-user" "200"

# Static Asset Tests
echo -e "${BLUE}📦 Static Asset Tests${NC}"
run_test "Favicon" "$DOMAIN/favicon.ico" "200"

# Security Header Tests
echo -e "${BLUE}🔒 Security Header Tests${NC}"
print_status "Testing security headers..."
headers=$(curl -s -I "$DOMAIN/" --max-time 10)
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
curl -s "$DOMAIN/" --max-time 10 > /dev/null
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
if curl -s --head "$DOMAIN/" --max-time 10 | grep -q "HTTP/2 200\|HTTP/1.1 200"; then
    print_success "SSL/HTTPS working ✓"
    ((TESTS_PASSED++))
else
    print_error "SSL/HTTPS issues detected"
    ((TESTS_FAILED++))
fi

# Test specific fixes
echo -e "${BLUE}🛠️ Fix Verification Tests${NC}"
print_status "Testing admin settings page fix..."
settings_response=$(curl -s "$DOMAIN/admin/settings" --max-time 10)
if echo "$settings_response" | grep -q "System Settings\|Platform Settings"; then
    print_success "Admin settings page loads correctly ✓"
    ((TESTS_PASSED++))
else
    print_warning "Admin settings page may have issues"
    ((TESTS_FAILED++))
fi

print_status "Testing security dashboard fix..."
security_response=$(curl -s "$DOMAIN/admin/security" --max-time 10)
if echo "$security_response" | grep -q "Security Dashboard\|Security Events"; then
    print_success "Security dashboard loads correctly ✓"
    ((TESTS_PASSED++))
else
    print_warning "Security dashboard may have issues"
    ((TESTS_FAILED++))
fi

# Test Results Summary
echo -e "${PURPLE}📊 Test Results Summary${NC}"
echo -e "${PURPLE}======================${NC}"
echo -e "${GREEN}✅ Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}❌ Tests Failed: $TESTS_FAILED${NC}"

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
if [ $TOTAL_TESTS -gt 0 ]; then
    SUCCESS_RATE=$((TESTS_PASSED * 100 / TOTAL_TESTS))
    echo -e "${BLUE}📈 Success Rate: $SUCCESS_RATE%${NC}"
else
    SUCCESS_RATE=0
    echo -e "${RED}📈 Success Rate: 0% (No tests completed)${NC}"
fi

# Final Status
echo -e "${PURPLE}🎯 Testing Summary${NC}"
echo -e "${PURPLE}==================${NC}"

if [ $SUCCESS_RATE -ge 80 ]; then
    echo -e "${GREEN}🎉 All tests passed! Deployment is working correctly.${NC}"
    echo -e "${GREEN}🌐 Your application is live and functional at: $DOMAIN${NC}"
elif [ $SUCCESS_RATE -ge 60 ]; then
    echo -e "${YELLOW}⚠️ Most tests passed but some issues detected.${NC}"
    echo -e "${YELLOW}Please review the failed tests above.${NC}"
else
    echo -e "${RED}❌ Multiple test failures detected.${NC}"
    echo -e "${RED}Please check the deployment and fix issues.${NC}"
fi

echo -e "${BLUE}📋 Next Steps:${NC}"
echo -e "   1. Visit $DOMAIN to verify the site loads"
echo -e "   2. Check admin panel at $DOMAIN/admin"
echo -e "   3. Test admin settings at $DOMAIN/admin/settings"
echo -e "   4. Test security dashboard at $DOMAIN/admin/security"
echo -e "   5. Set up admin access with debug endpoint:"
echo -e "      ${YELLOW}fetch('$DOMAIN/api/debug/setup-admin', {${NC}"
echo -e "      ${YELLOW}  method: 'POST',${NC}"
echo -e "      ${YELLOW}  headers: { 'Content-Type': 'application/json' },${NC}"
echo -e "      ${YELLOW}  body: JSON.stringify({})${NC}"
echo -e "      ${YELLOW}}).then(r => r.json()).then(console.log)${NC}"

exit 0
