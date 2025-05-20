#!/bin/bash

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
