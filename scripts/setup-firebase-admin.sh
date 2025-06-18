#!/bin/bash

# 🔥 Setup Firebase Admin Environment Variables
# This script helps you configure Firebase Admin SDK credentials

set -e

echo "🔥 Firebase Admin Setup for GearGrab"
echo "===================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}This script will help you set up Firebase Admin SDK credentials.${NC}"
echo ""

# Check if .env file exists
if [ -f ".env" ]; then
    echo -e "${GREEN}✅ Found existing .env file${NC}"
    
    # Check if Firebase Admin vars are already set
    if grep -q "FIREBASE_PROJECT_ID" .env && grep -q "FIREBASE_ADMIN_CLIENT_EMAIL" .env && grep -q "FIREBASE_ADMIN_PRIVATE_KEY" .env; then
        echo -e "${GREEN}✅ Firebase Admin variables already configured in .env${NC}"
        echo ""
        echo "Current configuration:"
        echo "  FIREBASE_PROJECT_ID: $(grep FIREBASE_PROJECT_ID .env | cut -d'=' -f2)"
        echo "  FIREBASE_ADMIN_CLIENT_EMAIL: $(grep FIREBASE_ADMIN_CLIENT_EMAIL .env | cut -d'=' -f2 | cut -c1-30)..."
        echo "  FIREBASE_ADMIN_PRIVATE_KEY: [Present]"
        echo ""
        read -p "Do you want to update these values? (y/N): " update_vars
        if [[ ! $update_vars =~ ^[Yy]$ ]]; then
            echo "Keeping existing configuration."
            exit 0
        fi
    fi
else
    echo -e "${YELLOW}⚠️ No .env file found. Creating one...${NC}"
    touch .env
fi

echo ""
echo -e "${BLUE}To get your Firebase Admin credentials:${NC}"
echo "1. Go to: https://console.firebase.google.com/"
echo "2. Select your project: 'GearGrabCO'"
echo "3. Click the gear icon → Project settings"
echo "4. Go to 'Service accounts' tab"
echo "5. Click 'Generate new private key'"
echo "6. Download the JSON file"
echo ""

read -p "Have you downloaded the service account JSON file? (y/N): " has_json

if [[ ! $has_json =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${YELLOW}Please download the service account JSON file first, then run this script again.${NC}"
    exit 1
fi

echo ""
read -p "Enter the path to your service account JSON file: " json_path

# Validate JSON file exists
if [ ! -f "$json_path" ]; then
    echo -e "${RED}❌ File not found: $json_path${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}Extracting credentials from JSON file...${NC}"

# Extract values from JSON using basic tools
PROJECT_ID=$(grep -o '"project_id"[[:space:]]*:[[:space:]]*"[^"]*"' "$json_path" | cut -d'"' -f4)
CLIENT_EMAIL=$(grep -o '"client_email"[[:space:]]*:[[:space:]]*"[^"]*"' "$json_path" | cut -d'"' -f4)
PRIVATE_KEY=$(grep -o '"private_key"[[:space:]]*:[[:space:]]*"[^"]*"' "$json_path" | cut -d'"' -f4)

# Validate extracted values
if [ -z "$PROJECT_ID" ] || [ -z "$CLIENT_EMAIL" ] || [ -z "$PRIVATE_KEY" ]; then
    echo -e "${RED}❌ Failed to extract credentials from JSON file${NC}"
    echo "Please check that the file is a valid Firebase service account JSON."
    exit 1
fi

echo -e "${GREEN}✅ Successfully extracted credentials${NC}"
echo "  Project ID: $PROJECT_ID"
echo "  Client Email: $CLIENT_EMAIL"
echo "  Private Key: [Extracted]"

# Update or add to .env file
echo ""
echo -e "${BLUE}Updating .env file...${NC}"

# Remove existing Firebase Admin vars if they exist
sed -i.bak '/^FIREBASE_PROJECT_ID=/d' .env 2>/dev/null || true
sed -i.bak '/^FIREBASE_ADMIN_CLIENT_EMAIL=/d' .env 2>/dev/null || true
sed -i.bak '/^FIREBASE_ADMIN_PRIVATE_KEY=/d' .env 2>/dev/null || true

# Add new Firebase Admin vars
echo "" >> .env
echo "# Firebase Admin SDK Configuration" >> .env
echo "FIREBASE_PROJECT_ID=$PROJECT_ID" >> .env
echo "FIREBASE_ADMIN_CLIENT_EMAIL=$CLIENT_EMAIL" >> .env
echo "FIREBASE_ADMIN_PRIVATE_KEY=\"$PRIVATE_KEY\"" >> .env

echo -e "${GREEN}✅ Firebase Admin credentials added to .env file${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Run: source .env  (to load variables in current session)"
echo "2. Run: ./scripts/deploy-with-env.sh  (to deploy with environment variables)"
echo ""
echo -e "${BLUE}Security note:${NC}"
echo "- Never commit the .env file to version control"
echo "- The .env file should already be in .gitignore"
echo "- Keep your service account JSON file secure"

# Clean up backup file
rm -f .env.bak 2>/dev/null || true

echo ""
echo -e "${GREEN}🎉 Firebase Admin setup complete!${NC}"
