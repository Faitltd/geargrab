#!/bin/bash

# GearGrab Test Environment Setup Script
set -e

echo "🚀 Setting up GearGrab test environment..."

# Update system packages
sudo apt-get update -y

# Install Node.js 18 (required for SvelteKit)
echo "📦 Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify Node.js installation
node --version
npm --version

# Install global dependencies
echo "🔧 Installing global dependencies..."
sudo npm install -g typescript ts-node

# Navigate to project directory
cd /mnt/persist/workspace

# Clear npm cache to avoid conflicts
echo "🧹 Clearing npm cache..."
npm cache clean --force

# Install project dependencies
echo "📦 Installing project dependencies..."
npm install --include=dev --no-audit --no-fund

# Install Cypress dependencies for headless mode
echo "🎭 Installing Cypress system dependencies..."
sudo apt-get install -y \
    libgtk2.0-0 \
    libgtk-3-0 \
    libgbm-dev \
    libnotify-dev \
    libgconf-2-4 \
    libnss3 \
    libxss1 \
    libasound2 \
    libxtst6 \
    xauth \
    xvfb

# Set up environment variables for testing
echo "⚙️ Setting up test environment variables..."
export NODE_ENV=test
export JWT_SECRET=test-jwt-secret-key-for-testing-only
export FIREBASE_PROJECT_ID=geargrabco
export VITE_FIREBASE_PROJECT_ID=geargrabco

# Add environment variables to profile
echo 'export NODE_ENV=test' >> $HOME/.profile
echo 'export JWT_SECRET=test-jwt-secret-key-for-testing-only' >> $HOME/.profile
echo 'export FIREBASE_PROJECT_ID=geargrabco' >> $HOME/.profile
echo 'export VITE_FIREBASE_PROJECT_ID=geargrabco' >> $HOME/.profile

# Create test directories if they don't exist
echo "📁 Creating test directories..."
mkdir -p tests/auth tests/unit tests/integration
mkdir -p cypress/e2e/auth

# Verify TypeScript configuration
echo "🔍 Verifying TypeScript configuration..."
npx tsc --noEmit --project tsconfig.json

# Build the project to ensure everything compiles
echo "🏗️ Building project..."
npm run build

echo "✅ Setup complete! Environment is ready for testing."