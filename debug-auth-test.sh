#!/bin/bash

# Debug Authentication Test for GearGrab
# This script provides detailed analysis of what email/password elements are being detected

echo "🔍 Debug Authentication Test for GearGrab"
echo "========================================"
echo "🚀 Starting detailed analysis..."

# Function to analyze a page in detail
analyze_page() {
    local url="$1"
    local page_name="$2"
    
    echo ""
    echo "🔍 Analyzing: $page_name"
    echo "   URL: $url"
    
    # Get the full page content
    content=$(curl -s "$url")
    
    # Save content to temp file for analysis
    temp_file="/tmp/geargrab_${page_name// /_}.html"
    echo "$content" > "$temp_file"
    
    echo "   📄 Page content saved to: $temp_file"
    echo "   📊 Page size: $(echo "$content" | wc -c) characters"
    
    # Check for email/password elements with context
    echo "   🔍 Email/Password Element Analysis:"
    
    # Email inputs
    email_inputs=$(echo "$content" | grep -i 'type="email"' | wc -l)
    if [ "$email_inputs" -gt 0 ]; then
        echo "      ❌ Email inputs found: $email_inputs"
        echo "$content" | grep -i -n -A2 -B2 'type="email"' | head -20
    else
        echo "      ✅ No email inputs found"
    fi
    
    # Password inputs
    password_inputs=$(echo "$content" | grep -i 'type="password"' | wc -l)
    if [ "$password_inputs" -gt 0 ]; then
        echo "      ❌ Password inputs found: $password_inputs"
        echo "$content" | grep -i -n -A2 -B2 'type="password"' | head -20
    else
        echo "      ✅ No password inputs found"
    fi
    
    # Email placeholders
    email_placeholders=$(echo "$content" | grep -i 'placeholder.*email' | wc -l)
    if [ "$email_placeholders" -gt 0 ]; then
        echo "      ❌ Email placeholders found: $email_placeholders"
        echo "$content" | grep -i -n -A1 -B1 'placeholder.*email' | head -10
    else
        echo "      ✅ No email placeholders found"
    fi
    
    # Password placeholders
    password_placeholders=$(echo "$content" | grep -i 'placeholder.*password' | wc -l)
    if [ "$password_placeholders" -gt 0 ]; then
        echo "      ❌ Password placeholders found: $password_placeholders"
        echo "$content" | grep -i -n -A1 -B1 'placeholder.*password' | head -10
    else
        echo "      ✅ No password placeholders found"
    fi
    
    # Text containing "email"
    email_text=$(echo "$content" | grep -i '>.*email.*<' | wc -l)
    if [ "$email_text" -gt 0 ]; then
        echo "      ⚠️  Text containing 'email': $email_text"
        echo "$content" | grep -i -n '>.*email.*<' | head -5
    else
        echo "      ✅ No email text found"
    fi
    
    # Text containing "password"
    password_text=$(echo "$content" | grep -i '>.*password.*<' | wc -l)
    if [ "$password_text" -gt 0 ]; then
        echo "      ⚠️  Text containing 'password': $password_text"
        echo "$content" | grep -i -n '>.*password.*<' | head -5
    else
        echo "      ✅ No password text found"
    fi
    
    # Social login elements
    social_elements=$(echo "$content" | grep -i -E '(google|facebook|apple|github|twitter)' | wc -l)
    echo "      ✅ Social login elements found: $social_elements"
    
    # Check for forms
    forms=$(echo "$content" | grep -i '<form' | wc -l)
    if [ "$forms" -gt 0 ]; then
        echo "      📝 Forms found: $forms"
        echo "$content" | grep -i -n -A5 '<form' | head -20
    else
        echo "      ✅ No forms found"
    fi
    
    echo "   📋 Analysis complete for $page_name"
}

# Test pages
analyze_page "https://geargrab.co" "Homepage"
analyze_page "https://geargrab.co/auth/login" "Login Page"
analyze_page "https://geargrab.co/auth/signup" "Signup Page"
analyze_page "https://geargrab.co/dashboard" "Dashboard"

echo ""
echo "📊 DEBUG SUMMARY"
echo "==============="
echo "✅ Detailed analysis complete"
echo "📁 Temp files created in /tmp/ for manual inspection"
echo ""
echo "🔧 Next Steps:"
echo "   1. Review the temp files to see exact HTML content"
echo "   2. Check for any hidden or dynamically loaded content"
echo "   3. Verify browser cache is cleared"
echo "   4. Test with different browsers"
echo ""
echo "📂 Temp files:"
ls -la /tmp/geargrab_*.html 2>/dev/null || echo "   No temp files created"
