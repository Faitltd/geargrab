#!/bin/bash

# Step 1: Authentication and Project Setup
echo "🔐 Setting up Google Cloud authentication and project..."

# Set project
gcloud config set project geargrabco

# Verify project is set
PROJECT=$(gcloud config get-value project)
echo "✅ Project set to: $PROJECT"

# Enable required APIs
echo "🔧 Enabling required APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

echo "✅ Authentication and project setup complete!"
echo "Next: Run ./scripts/02-build-deploy.sh"
