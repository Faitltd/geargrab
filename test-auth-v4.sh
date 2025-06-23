#!/bin/bash

echo "🚀 NUCLEAR CACHE BUST TEST - Testing new auth-v4 page..."
echo "=================================================="

# Test the new auth-v4 page
echo ""
echo "🔍 Testing /auth-v4 page..."
curl -s "https://geargrab.co/auth-v4" | grep -E "(email-address|password|Social-Only|Cache-Bust)" | head -10

echo ""
echo "🔍 Testing old /auth/login page..."
curl -s "https://geargrab.co/auth/login" | grep -E "(email-address|password|Social-Only|Cache-Bust)" | head -10

echo ""
echo "🔍 Testing old /auth/signup page..."
curl -s "https://geargrab.co/auth/signup" | grep -E "(email-address|password|Social-Only|Cache-Bust)" | head -10

echo ""
echo "=================================================="
echo "✅ Test complete!"
echo ""
echo "Expected results:"
echo "- /auth-v4 should show 'Social-Only' and 'Cache-Bust' indicators"
echo "- /auth-v4 should NOT show 'email-address' or 'password' fields"
echo "- Old pages may still show old content until cache clears"
