# GearGrab Deployment Guide

## Overview
This document describes the deployment process for GearGrab to Google Cloud Run.

## Configuration
- **Project ID**: geargrabco
- **Service Name**: geargrab
- **Region**: us-central1
- **Domain**: geargrab.co

## Manual Deployment

### Prerequisites
1. Google Cloud CLI installed and authenticated
2. Docker installed (for container builds)
3. Node.js 18+ installed
4. Git repository access

### Deploy Command
```bash
./deploy.sh
```

## Automated Deployment (GitHub Actions)
Pushes to the main branch will automatically trigger deployment via GitHub Actions.

### Required Secrets
Add these secrets to your GitHub repository:
- `GCP_SA_KEY`: Google Cloud Service Account key (JSON)

## Environment Variables
Production environment variables are configured in `.env.production`.

## Monitoring
- **Logs**: `gcloud run logs tail geargrab --region=us-central1`
- **Metrics**: Google Cloud Console > Cloud Run > geargrab

## Rollback
To rollback to a previous version:
```bash
gcloud run services update-traffic geargrab --to-revisions=REVISION_NAME=100 --region=us-central1
```

## Custom Domain Setup
If using a custom domain, ensure DNS is configured:
1. Add CNAME record pointing to ghs.googlehosted.com
2. Verify domain ownership in Google Cloud Console
3. Domain mapping is handled automatically by the deployment script

## Support
For deployment issues, check:
1. Google Cloud Console logs
2. GitHub Actions workflow logs
3. Application health endpoint: https://geargrab.co/health
