#!/bin/bash

# Quick Deploy Script for GearGrab
# This script provides a simple interface to the PushDeploy CLI

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

# Check if commit message is provided
if [ $# -eq 0 ]; then
    print_error "Please provide a commit message"
    echo "Usage: ./deploy.sh 'Your commit message'"
    exit 1
fi

COMMIT_MESSAGE="$1"

print_info "🚀 Starting GearGrab deployment..."
print_info "Commit message: $COMMIT_MESSAGE"

# Check if pushdeploy directory exists
if [ ! -d "pushdeploy" ]; then
    print_warning "PushDeploy CLI not found. Setting up..."
    if [ -f "setup-pushdeploy.sh" ]; then
        ./setup-pushdeploy.sh
    else
        print_error "setup-pushdeploy.sh not found. Please run the setup first."
        exit 1
    fi
fi

# Navigate to pushdeploy directory
cd pushdeploy

# Check if CLI is available
if command -v pushdeploy &> /dev/null; then
    print_info "Using globally installed pushdeploy CLI"
    cd ..
    pushdeploy deploy "$COMMIT_MESSAGE"
else
    print_info "Using local pushdeploy CLI"
    node src/index.js deploy "$COMMIT_MESSAGE"
    cd ..
fi

print_success "🎉 Deployment completed!"
print_info "Your application should be available at:"
print_info "- https://geargrab.co"
print_info "- https://www.geargrab.co"
