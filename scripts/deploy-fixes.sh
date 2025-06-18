#!/bin/bash

# Master Deployment Script
# Runs all fix scripts in sequence with error handling

set -e

echo "🚀 GearGrab Production Fixes Deployment"
echo "======================================="

# Make all scripts executable
chmod +x scripts/*.sh

# Track overall progress
STEP=1
TOTAL_STEPS=4

run_step() {
    local step_name="$1"
    local script_path="$2"
    
    echo ""
    echo "📋 Step $STEP/$TOTAL_STEPS: $step_name"
    echo "$(printf '=%.0s' {1..50})"
    
    if [ -f "$script_path" ]; then
        if bash "$script_path"; then
            echo "✅ Step $STEP completed successfully"
        else
            echo "❌ Step $STEP failed"
            echo "🛑 Stopping deployment process"
            exit 1
        fi
    else
        echo "❌ Script not found: $script_path"
        exit 1
    fi
    
    STEP=$((STEP + 1))
    sleep 2
}

# Step 1: Deploy auth fixes
run_step "Deploy Authentication Fixes" "scripts/quick-auth-fix.sh"

# Step 2: Test authentication
run_step "Test Authentication" "scripts/test-auth.sh"

# Step 3: Deploy security header fixes
run_step "Deploy Security Header Fixes" "scripts/fix-security-headers.sh"

# Step 4: Run complete test suite
run_step "Complete Test Suite" "scripts/test-complete.sh"

echo ""
echo "🎉 All deployment steps completed successfully!"
echo "✅ GearGrab is now live with all fixes applied"
echo ""
echo "🌐 Your application is available at:"
echo "   - https://geargrab.co"
echo ""
echo "🔧 Next steps:"
echo "   1. Test the authentication flow manually"
echo "   2. Test payment processing"
echo "   3. Monitor logs for any issues"
echo "   4. Set up monitoring alerts"
