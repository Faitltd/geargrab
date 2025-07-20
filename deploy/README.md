# GearGrab Deployment Guide

This guide covers the complete deployment process for the GearGrab SvelteKit application to Google Cloud Run using Docker containers and Cloud Build.

## 🏗️ Architecture Overview

- **Application**: SvelteKit SSR application
- **Container**: Multi-stage Docker build optimized for production
- **Platform**: Google Cloud Run (serverless containers)
- **CI/CD**: Cloud Build with GitHub Actions integration
- **Secrets**: Google Secret Manager for secure environment variables
- **Monitoring**: Built-in health checks and logging

## 📋 Prerequisites

### Required Tools
- [Google Cloud CLI](https://cloud.google.com/sdk/docs/install)
- [Docker](https://docs.docker.com/get-docker/)
- [Node.js 18+](https://nodejs.org/)
- [Git](https://git-scm.com/)

### Google Cloud Setup
1. Create a Google Cloud Project
2. Enable billing for the project
3. Install and authenticate gcloud CLI:
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```

## 🚀 Quick Start

### 1. Environment Setup
Run the environment setup script to configure secrets and service accounts:

```bash
chmod +x deploy/env-setup.sh
./deploy/env-setup.sh
```

This script will:
- Enable required Google Cloud APIs
- Create service accounts with proper IAM roles
- Set up secrets in Secret Manager
- Configure authentication

### 2. Deploy Application
Use the deployment script for automated deployment:

```bash
chmod +x deploy/deploy.sh
./deploy/deploy.sh -p YOUR_PROJECT_ID
```

Or deploy manually with Cloud Build:

```bash
gcloud builds submit --config cloudbuild.yaml \
  --substitutions="_REGION=us-central1,_PUBLIC_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID"
```

## 🔧 Configuration

### Environment Variables

#### Public Variables (Build-time)
These are embedded in the client-side code:

- `PUBLIC_FIREBASE_API_KEY`: Firebase Web API key
- `PUBLIC_FIREBASE_AUTH_DOMAIN`: Firebase auth domain
- `PUBLIC_FIREBASE_PROJECT_ID`: Firebase project ID
- `PUBLIC_FIREBASE_STORAGE_BUCKET`: Firebase storage bucket
- `PUBLIC_FIREBASE_MESSAGING_SENDER_ID`: Firebase messaging sender ID
- `PUBLIC_FIREBASE_APP_ID`: Firebase app ID
- `PUBLIC_STRIPE_PUBLISHABLE_KEY`: Stripe publishable key
- `PUBLIC_APP_URL`: Application URL

#### Secret Variables (Runtime)
These are stored in Secret Manager:

- `FIREBASE_PRIVATE_KEY`: Firebase service account private key
- `FIREBASE_CLIENT_EMAIL`: Firebase service account email
- `STRIPE_SECRET_KEY`: Stripe secret key
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook secret
- `SESSION_SECRET`: Session encryption secret

### Cloud Build Substitutions

Update `cloudbuild.yaml` substitutions section with your values:

```yaml
substitutions:
  _REGION: 'us-central1'
  _PUBLIC_FIREBASE_API_KEY: 'your-firebase-api-key'
  _PUBLIC_FIREBASE_MESSAGING_SENDER_ID: 'your-sender-id'
  _PUBLIC_FIREBASE_APP_ID: 'your-app-id'
  _PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_live_...'
```

## 🐳 Docker Configuration

### Multi-stage Build
The Dockerfile uses a 3-stage build process:

1. **Dependencies Stage**: Installs production dependencies
2. **Builder Stage**: Builds the application with all dependencies
3. **Runtime Stage**: Creates minimal production image

### Image Optimization
- Uses Alpine Linux for smaller image size
- Non-root user for security
- Health checks for reliability
- Proper signal handling with dumb-init

### Local Development
Test the Docker build locally:

```bash
# Build the image
docker build -t geargrab .

# Run locally
docker run -p 8080:8080 \
  -e NODE_ENV=production \
  -e PORT=8080 \
  geargrab
```

Or use Docker Compose:

```bash
docker-compose up --build
```

## ☁️ Cloud Run Configuration

### Service Configuration
- **Memory**: 1GB
- **CPU**: 1 vCPU
- **Concurrency**: 80 requests per instance
- **Min Instances**: 0 (scales to zero)
- **Max Instances**: 10
- **Timeout**: 300 seconds

### Scaling
Cloud Run automatically scales based on:
- Incoming request volume
- CPU utilization
- Memory usage
- Custom metrics (if configured)

### Security
- Service account with minimal required permissions
- Secrets managed through Secret Manager
- Non-root container execution
- VPC connector support (optional)

## 🔐 Security Best Practices

### Service Accounts
- Dedicated service account for Cloud Run
- Minimal IAM permissions
- Separate service account for Cloud Build

### Secrets Management
- All sensitive data in Secret Manager
- Automatic secret rotation support
- Audit logging for secret access

### Container Security
- Non-root user execution
- Read-only root filesystem (where possible)
- Minimal base image (Alpine Linux)
- Regular security scanning

## 📊 Monitoring & Logging

### Health Checks
The application includes comprehensive health checks:

```bash
curl https://your-app-url/health
```

Response includes:
- Service status
- Memory usage
- Environment validation
- Uptime information

### Logging
View application logs:

```bash
gcloud run services logs read geargrab \
  --region=us-central1 \
  --project=YOUR_PROJECT_ID
```

### Monitoring
Set up monitoring with:
- Cloud Monitoring for metrics
- Cloud Logging for centralized logs
- Error Reporting for error tracking
- Cloud Trace for performance monitoring

## 🔄 CI/CD Pipeline

### GitHub Actions
The repository includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that:

1. Runs tests and linting
2. Builds and deploys on push to main
3. Performs security scanning
4. Verifies deployment health

### Required Secrets
Add these secrets to your GitHub repository:

- `GCP_PROJECT_ID`: Google Cloud project ID
- `GCP_SA_KEY`: Service account key JSON
- `FIREBASE_API_KEY`: Firebase API key
- `FIREBASE_MESSAGING_SENDER_ID`: Firebase messaging sender ID
- `FIREBASE_APP_ID`: Firebase app ID
- `STRIPE_PUBLISHABLE_KEY`: Stripe publishable key

### Manual Deployment
For manual deployments:

```bash
# Deploy to production
./deploy/deploy.sh -p YOUR_PROJECT_ID -e production

# Deploy to staging
./deploy/deploy.sh -p YOUR_PROJECT_ID -e staging

# Dry run
./deploy/deploy.sh -p YOUR_PROJECT_ID --dry-run
```

## 🛠️ Troubleshooting

### Common Issues

#### Build Failures
- Check Cloud Build logs: `gcloud builds log BUILD_ID`
- Verify all substitution variables are set
- Ensure service account has required permissions

#### Deployment Issues
- Check Cloud Run logs for startup errors
- Verify secrets are properly configured
- Test health endpoint accessibility

#### Performance Issues
- Monitor memory usage and adjust limits
- Check CPU utilization
- Review concurrency settings

### Useful Commands

```bash
# View service details
gcloud run services describe geargrab --region=us-central1

# Update service configuration
gcloud run services update geargrab --memory=2Gi --region=us-central1

# View recent deployments
gcloud run revisions list --service=geargrab --region=us-central1

# Roll back to previous revision
gcloud run services update-traffic geargrab --to-revisions=REVISION_NAME=100 --region=us-central1
```

## 📚 Additional Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud Build Documentation](https://cloud.google.com/build/docs)
- [Secret Manager Documentation](https://cloud.google.com/secret-manager/docs)
- [SvelteKit Deployment Guide](https://kit.svelte.dev/docs/adapters)

## 🆘 Support

For deployment issues:
1. Check the troubleshooting section above
2. Review Cloud Build and Cloud Run logs
3. Verify all configuration values
4. Test locally with Docker first
