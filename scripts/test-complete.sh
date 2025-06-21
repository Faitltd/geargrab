#!/bin/bash

# Complete Test Suite
# Comprehensive testing of all functionality

set -e

echo "🧪 Complete Test Suite"
echo "====================="

# Get deployment URL
DEPLOY_URL=$(gcloud run services describe geargrab --region=us-central1 --format="value(status.url)" 2>/dev/null)

if [ -z "$DEPLOY_URL" ]; then
    echo "❌ Could not get deployment URL"
    exit 1
fi

echo "📍 Testing URL: $DEPLOY_URL"
echo "🌐 Custom domain: https://geargrab.co"

# Test results tracking
TESTS_PASSED=0
TESTS_TOTAL=0

run_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo "🔍 $test_name..."
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    
    if eval "$test_command"; then
        echo "✅ $test_name - PASSED"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo "❌ $test_name - FAILED"
    fi
    echo ""
}

# Test 1: Basic connectivity
run_test "Basic site connectivity" "curl -s --head '$DEPLOY_URL' | head -n 1 | grep -q '200'"

# Test 2: Custom domain
run_test "Custom domain connectivity" "curl -s --head 'https://geargrab.co' | head -n 1 | grep -q '200'"

# Test 3: Authentication endpoints
run_test "Authentication endpoint" "curl -s -o /dev/null -w '%{http_code}' '$DEPLOY_URL/api/auth/session' | grep -E '^(200|401)$'"

# Test 4: Payment endpoints
run_test "Payment endpoint" "curl -s -o /dev/null -w '%{http_code}' '$DEPLOY_URL/api/payments/create-intent' | grep -E '^(401|405)$'"

# Test 5: Firebase configuration
run_test "Firebase configuration" "curl -s '$DEPLOY_URL' | grep -q 'firebase'"

# Test 6: Stripe configuration
run_test "Stripe configuration" "curl -s '$DEPLOY_URL' | grep -q 'stripe'"

# Test 7: Security headers
run_test "Security headers present" "curl -s -I '$DEPLOY_URL' | grep -i 'x-frame-options'"

# Test 8: Content loading
run_test "Page content loads" "curl -s '$DEPLOY_URL' | grep -q 'GearGrab'"

# Test 9: JavaScript assets
run_test "JavaScript assets load" "curl -s '$DEPLOY_URL' | grep -q '_app/immutable'"

# Test 10: CSS assets
run_test "CSS assets load" "curl -s '$DEPLOY_URL' | grep -q 'stylesheet'"

# Results summary
echo "📊 Test Results Summary"
echo "======================"
echo "Tests passed: $TESTS_PASSED/$TESTS_TOTAL"

if [ $TESTS_PASSED -eq $TESTS_TOTAL ]; then
    echo "🎉 All tests passed!"
    echo "✅ Application is ready for use"
    echo ""
    echo "🌐 Access your application at:"
    echo "   - Cloud Run: $DEPLOY_URL"
    echo "   - Custom domain: https://geargrab.co"
    exit 0
else
    echo "⚠️ Some tests failed. Check the output above."
    echo "🔧 You may need to run additional fix scripts."
    exit 1
fi
