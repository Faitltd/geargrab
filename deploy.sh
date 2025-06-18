#!/bin/bash

<<<<<<< HEAD
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
=======
# Exit on error
set -e

echo "=== GearGrab Deployment Script ==="
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "Error: Git is not installed. Please install git first."
    exit 1
fi

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "Error: Google Cloud SDK is not installed. Please install it first."
    echo "Visit: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Get GitHub username
read -p "Enter your GitHub username: " GITHUB_USERNAME

# Get GCP project ID
read -p "Enter your Google Cloud Platform project ID: " PROJECT_ID

echo ""
echo "=== Step 1: Pushing to GitHub ==="

# Check if remote origin exists
if git remote | grep -q "^origin$"; then
    echo "Remote 'origin' already exists. Updating it..."
    git remote set-url origin "https://github.com/$GITHUB_USERNAME/GearGrab.git"
else
    echo "Adding remote 'origin'..."
    git remote add origin "https://github.com/$GITHUB_USERNAME/GearGrab.git"
fi

# Commit any changes
echo "Committing changes..."
git add .
git commit -m "Deployment update" || echo "No changes to commit"

# Push to GitHub
echo "Pushing to GitHub..."
git push -u origin main || {
    echo "Failed to push to main branch. Trying master branch..."
    git push -u origin master || {
        echo "Error: Failed to push to GitHub. Make sure you have created the repository on GitHub and have the correct permissions."
        exit 1
    }
}

echo ""
echo "=== Step 2: Deploying to Google Cloud Run ==="

# Set up Google Cloud project
echo "Setting up Google Cloud project..."
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "Enabling required APIs..."
gcloud services enable cloudbuild.googleapis.com run.googleapis.com containerregistry.googleapis.com

# Build the application
echo "Building the application..."
npm run build

# Build and deploy to Cloud Run
echo "Building and deploying to Cloud Run..."
gcloud builds submit --tag gcr.io/$PROJECT_ID/geargrab
gcloud run deploy geargrab --image gcr.io/$PROJECT_ID/geargrab --platform managed --region us-central1 --allow-unauthenticated

echo ""
echo "=== Deployment Complete! ==="
echo "Your application should be available at the URL provided above."
>>>>>>> beb3d1682105fb60c57c754c76bfdd353748209a
