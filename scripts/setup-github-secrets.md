# GitHub Secrets Setup for GearGrab Deployment

## Required Secrets

To enable automatic deployment via GitHub Actions, you need to set up the following secrets in your GitHub repository:

### 1. GCP_PROJECT_ID
- **Value**: `geargrabco`
- **Description**: Google Cloud Project ID for deployment

### 2. GCP_SA_KEY
- **Description**: Google Cloud Service Account Key (JSON format)
- **How to get**: 
  1. Go to Google Cloud Console
  2. Navigate to IAM & Admin > Service Accounts
  3. Create a new service account or use existing one
  4. Download the JSON key file
  5. Copy the entire JSON content as the secret value

## How to Add Secrets

1. Go to your GitHub repository: https://github.com/Faitltd/GearGrab
2. Click on **Settings** tab
3. In the left sidebar, click **Secrets and variables** > **Actions**
4. Click **New repository secret**
5. Add each secret with the name and value specified above

## Service Account Permissions

The service account needs the following roles:
- Cloud Run Admin
- Storage Admin
- Container Registry Service Agent
- Service Account User

## Alternative: Manual Deployment

If you prefer to deploy manually instead of using GitHub Actions, you can use:

```bash
./scripts/manual-deploy.sh
```

This script will build and deploy the application directly from your local machine.
