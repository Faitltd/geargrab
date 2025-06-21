#!/bin/bash

# GearGrab Deployment Setup Script
# This script helps configure Google Cloud Platform and GitHub secrets for automated deployment

set -e

echo "🚀 GearGrab Deployment Setup"
echo "=============================="

# Configuration
PROJECT_ID="geargrabco"
SERVICE_ACCOUNT_NAME="github-actions-deploy"
SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
KEY_FILE="github-actions-key.json"

echo "📋 Configuration:"
echo "  Project ID: $PROJECT_ID"
echo "  Service Account: $SERVICE_ACCOUNT_EMAIL"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: gcloud CLI is not installed."
    echo "Please install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ Error: Not authenticated with gcloud."
    echo "Please run: gcloud auth login"
    exit 1
fi

echo "✅ gcloud CLI is installed and authenticated"

# Set the project
echo "🔧 Setting up Google Cloud project..."
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "🔧 Enabling required Google Cloud APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable iam.googleapis.com

# Create service account if it doesn't exist
echo "🔧 Creating service account for GitHub Actions..."
if gcloud iam service-accounts describe $SERVICE_ACCOUNT_EMAIL &>/dev/null; then
    echo "  Service account already exists"
else
    gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME \
        --display-name="GitHub Actions Deploy" \
        --description="Service account for GitHub Actions to deploy to Cloud Run"
fi

# Grant necessary roles
echo "🔧 Granting IAM roles..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/storage.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/iam.serviceAccountUser"

# Create and download service account key
echo "🔧 Creating service account key..."
gcloud iam service-accounts keys create $KEY_FILE \
    --iam-account=$SERVICE_ACCOUNT_EMAIL

echo "✅ Service account key created: $KEY_FILE"

# Display the key content for GitHub secrets
echo ""
echo "🔑 GitHub Secrets Configuration"
echo "================================"
echo ""
echo "You need to add these secrets to your GitHub repository:"
echo "Go to: https://github.com/Faitltd/GearGrab/settings/secrets/actions"
echo ""
echo "1. GCP_PROJECT_ID"
echo "   Value: $PROJECT_ID"
echo ""
echo "2. GCP_SA_KEY"
echo "   Value: (copy the entire content below)"
echo "   ----------------------------------------"
cat $KEY_FILE
echo "   ----------------------------------------"
echo ""

# Clean up the key file for security
rm $KEY_FILE
echo "🗑️  Service account key file deleted for security"

echo ""
echo "📝 Next Steps:"
echo "1. Copy the GCP_SA_KEY content above"
echo "2. Go to GitHub repository settings > Secrets and variables > Actions"
echo "3. Add the two secrets: GCP_PROJECT_ID and GCP_SA_KEY"
echo "4. Push a new commit to trigger deployment"
echo ""
echo "🌐 After deployment, your app will be available at:"
echo "   https://geargrab-app-[hash]-uc.a.run.app"
echo ""
echo "✅ Setup complete!"
