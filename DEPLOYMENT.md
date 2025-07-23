# GearGrab SvelteKit Deployment Guide

This guide covers deploying the SvelteKit version of GearGrab to Google Cloud Run and setting up the custom domain at geargrab.co.

## 🚀 Quick Start

The SvelteKit version is in the `sveltekit-version` branch and is ready for production deployment.

### Prerequisites

1. **Google Cloud Project** with billing enabled
2. **GitHub Repository** access to https://github.com/Faitltd/geargrab
3. **Domain Control** for geargrab.co
4. **Base44 SDK** configuration

## 📋 Deployment Steps

### 1. Set Up Google Cloud

```bash
# Install gcloud CLI if not already installed
# https://cloud.google.com/sdk/docs/install

# Authenticate and set project
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

### 2. Configure GitHub Secrets

In your GitHub repository settings, add these secrets:

- `GCP_PROJECT_ID`: Your Google Cloud Project ID
- `GCP_SA_KEY`: Service Account Key JSON (see below for creation)

#### Create Service Account

```bash
# Create service account
gcloud iam service-accounts create geargrab-deployer \
    --description="Service account for GearGrab deployment" \
    --display-name="GearGrab Deployer"

# Grant necessary permissions
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:geargrab-deployer@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/run.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:geargrab-deployer@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/storage.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:geargrab-deployer@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/iam.serviceAccountUser"

# Create and download key
gcloud iam service-accounts keys create key.json \
    --iam-account=geargrab-deployer@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

### 3. Automatic Deployment

Push to the `sveltekit-version` branch to trigger automatic deployment:

```bash
git checkout sveltekit-version
git push origin sveltekit-version
```

The GitHub Actions workflow will:
- Run tests and build checks
- Build and push Docker image
- Deploy to Cloud Run
- Run smoke tests

### 4. Manual Deployment

Alternatively, deploy manually using the provided script:

```bash
# Make sure you're in the sveltekit version directory
cd gear-grab-svelte

# Run deployment script
./deploy.sh production YOUR_PROJECT_ID
```

### 5. Set Up Custom Domain

After successful deployment, map your custom domain:

```bash
# Map domain to Cloud Run service
gcloud run domain-mappings create \
    --service geargrab-svelte \
    --domain geargrab.co \
    --region us-central1

# Get the DNS records to configure
gcloud run domain-mappings describe \
    --domain geargrab.co \
    --region us-central1
```

Update your DNS settings with the provided records.

## 🔧 Configuration

### Environment Variables

The application uses these environment variables:

- `NODE_ENV=production`
- `PORT=3000`
- `BASE44_APP_ID` (configure in Google Cloud Console)
- `BASE44_SERVER_URL=https://base44.app`
- `BASE44_ENV=prod`

### Base44 SDK Configuration

Update the Base44 client configuration in `src/lib/api/base44Client.js`:

```javascript
export const base44 = createClient({
    appId: process.env.BASE44_APP_ID || 'your-app-id',
    serverUrl: 'https://base44.app',
    env: 'prod'
});
```

## 📊 Monitoring and Health Checks

### Health Check Endpoint

The application includes a health check endpoint at `/health` that returns:

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.45,
  "environment": "production",
  "version": "1.0.0",
  "services": {
    "database": "connected",
    "base44": "connected"
  }
}
```

### Cloud Run Monitoring

Monitor your deployment in the Google Cloud Console:
- **Cloud Run**: https://console.cloud.google.com/run
- **Logs**: https://console.cloud.google.com/logs
- **Monitoring**: https://console.cloud.google.com/monitoring

## 🔒 Security

The deployment includes:
- Non-root user in Docker container
- Proper signal handling with dumb-init
- Resource limits and scaling controls
- Health checks and probes
- Secure environment variable handling

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**: Check GitHub Actions logs
2. **Deployment Errors**: Verify service account permissions
3. **Domain Issues**: Confirm DNS propagation
4. **Base44 Connection**: Verify API credentials

### Useful Commands

```bash
# Check service status
gcloud run services describe geargrab-svelte --region us-central1

# View logs
gcloud logs read --service geargrab-svelte --region us-central1

# Update service
gcloud run services update geargrab-svelte --region us-central1

# Delete service (if needed)
gcloud run services delete geargrab-svelte --region us-central1
```

## 📈 Scaling Configuration

Current configuration:
- **Min Instances**: 1 (always warm)
- **Max Instances**: 100
- **Concurrency**: 1000 requests per instance
- **Memory**: 1GB
- **CPU**: 2 vCPU
- **Timeout**: 300 seconds

Adjust in `cloud-run.yaml` or deployment scripts as needed.

## 🔄 Updates and Rollbacks

### Deploy Updates
Push to `sveltekit-version` branch for automatic deployment.

### Rollback
```bash
# List revisions
gcloud run revisions list --service geargrab-svelte --region us-central1

# Rollback to previous revision
gcloud run services update-traffic geargrab-svelte \
    --to-revisions REVISION_NAME=100 \
    --region us-central1
```

## 📞 Support

For deployment issues:
1. Check GitHub Actions logs
2. Review Cloud Run logs
3. Verify configuration settings
4. Contact support if needed

---

**Repository**: https://github.com/Faitltd/geargrab  
**Branch**: `sveltekit-version`  
**Production URL**: Will be available after deployment  
**Custom Domain**: https://geargrab.co (after DNS configuration)
