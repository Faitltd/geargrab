#!/bin/bash

# Quick Authentication Test Script
# Tests the deployed GearGrab application for social-only authentication

echo "🧪 Quick Authentication Test for GearGrab"
echo "=========================================="

BASE_URL="https://geargrab.co"

# Function to test a URL for email/password fields
test_url() {
    local url=$1
    local description=$2
    
    echo ""
    echo "🔍 Testing: $description"
    echo "   URL: $url"
    
    # Use curl to fetch the page and check for forbidden elements
    response=$(curl -s -L "$url" 2>/dev/null)
    
    if [ $? -ne 0 ]; then
        echo "   ❌ Failed to fetch page"
        return 1
    fi
    
    # Check for email/password input fields
    email_inputs=$(echo "$response" | grep -i 'type="email"' | wc -l)
    password_inputs=$(echo "$response" | grep -i 'type="password"' | wc -l)
    email_placeholders=$(echo "$response" | grep -i 'placeholder.*email' | wc -l)
    password_placeholders=$(echo "$response" | grep -i 'placeholder.*password' | wc -l)
    
    # Check for social login buttons
    google_button=$(echo "$response" | grep -i 'google' | wc -l)
    apple_button=$(echo "$response" | grep -i 'apple' | wc -l)
    facebook_button=$(echo "$response" | grep -i 'facebook' | wc -l)
    github_button=$(echo "$response" | grep -i 'github' | wc -l)
    
    # Check for forbidden text
    email_text=$(echo "$response" | grep -i 'enter your email\|email address\|or continue with email' | wc -l)
    password_text=$(echo "$response" | grep -i 'enter your password\|password' | wc -l)
    
    # Results
    total_forbidden=$((email_inputs + password_inputs + email_placeholders + password_placeholders + email_text + password_text))
    total_social=$((google_button + apple_button + facebook_button + github_button))
    
    if [ $total_forbidden -eq 0 ]; then
        echo "   ✅ No email/password fields found"
    else
        echo "   ❌ Found $total_forbidden email/password elements"
        echo "      - Email inputs: $email_inputs"
        echo "      - Password inputs: $password_inputs"
        echo "      - Email placeholders: $email_placeholders"
        echo "      - Password placeholders: $password_placeholders"
        echo "      - Email text: $email_text"
        echo "      - Password text: $password_text"
    fi
    
    if [ $total_social -gt 0 ]; then
        echo "   ✅ Social login elements found ($total_social)"
    else
        echo "   ⚠️  No social login elements detected"
    fi
    
    return $total_forbidden
}

# Test main pages
echo "🚀 Starting tests..."

failed_tests=0

# Test homepage
test_url "$BASE_URL" "Homepage"
failed_tests=$((failed_tests + $?))

# Test login page
test_url "$BASE_URL/auth/login" "Login Page"
failed_tests=$((failed_tests + $?))

# Test signup page
test_url "$BASE_URL/auth/signup" "Signup Page"
failed_tests=$((failed_tests + $?))

# Test protected routes (these might redirect)
test_url "$BASE_URL/dashboard" "Dashboard (Protected Route)"
failed_tests=$((failed_tests + $?))

test_url "$BASE_URL/list-gear" "List Gear (Protected Route)"
failed_tests=$((failed_tests + $?))

# Summary
echo ""
echo "📊 TEST SUMMARY"
echo "==============="

if [ $failed_tests -eq 0 ]; then
    echo "✅ ALL TESTS PASSED - No email/password fields found!"
    echo "🎉 Authentication system is successfully social-only"
else
    echo "❌ $failed_tests tests failed - Email/password fields still present"
    echo "🔧 Authentication system needs further cleanup"
fi

echo ""
echo "🔗 Manual verification URLs:"
echo "   Homepage: $BASE_URL"
echo "   Login: $BASE_URL/auth/login"
echo "   Signup: $BASE_URL/auth/signup"
echo "   Dashboard: $BASE_URL/dashboard"

echo ""
echo "✅ Manual Checklist:"
echo "   □ Visit each URL above"
echo "   □ Verify only social login buttons are visible"
echo "   □ Confirm no email/password input fields exist"
echo "   □ Check that 'Welcome Back' message appears"
echo "   □ Verify GearGrab branding is present"
echo "   □ Test that social buttons are clickable"

exit $failed_tests
