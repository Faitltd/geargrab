#!/bin/bash

# Firebase Deployment Script for GearGrab Production
# Run this after enabling all Firebase services in the console

echo "🚀 Starting Firebase deployment for GearGrab..."

# Check if we're authenticated
echo "📋 Checking Firebase authentication..."
firebase projects:list > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Not authenticated with Firebase. Run: firebase login --reauth"
    exit 1
fi

# Verify we're using the correct project
echo "📋 Verifying project..."
firebase use geargrabco
CURRENT_PROJECT=$(firebase use | grep "geargrabco" | head -1 | awk '{print $2}')
if [ -z "$CURRENT_PROJECT" ]; then
    echo "❌ Could not verify project. Please ensure geargrabco project is accessible."
    exit 1
fi

echo "✅ Using project: $CURRENT_PROJECT"

# Deploy Firestore rules and indexes
echo "📋 Deploying Firestore rules and indexes..."
firebase deploy --only firestore:rules,firestore:indexes
if [ $? -ne 0 ]; then
    echo "❌ Failed to deploy Firestore rules/indexes"
    exit 1
fi

# Deploy Storage rules (only if Storage is enabled)
echo "📋 Deploying Storage rules..."
firebase deploy --only storage:rules
if [ $? -ne 0 ]; then
    echo "⚠️  Storage rules deployment failed. Make sure Storage is enabled in Firebase Console."
    echo "   Go to: https://console.firebase.google.com/project/geargrabco/storage"
    echo "   Click 'Get Started' to enable Storage"
fi

# Deploy Functions (if they exist)
if [ -f "functions/package.json" ]; then
    echo "📋 Deploying Functions..."
    firebase deploy --only functions
    if [ $? -ne 0 ]; then
        echo "⚠️  Functions deployment failed"
    fi
else
    echo "📋 No Functions to deploy"
fi

echo ""
echo "🎉 Firebase deployment completed!"
echo ""
echo "📋 Next steps:"
echo "1. Test your application with the production Firebase"
echo "2. Verify authentication works"
echo "3. Test database operations"
echo "4. Test file uploads (if Storage is enabled)"
echo ""
echo "🔗 Firebase Console: https://console.firebase.google.com/project/geargrabco/overview"
