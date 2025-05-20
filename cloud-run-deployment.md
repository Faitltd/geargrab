# Cloud Run Deployment for SvelteKit SSR

## Overview

SvelteKit's adapter-node enables server-side rendering, requiring a Node.js runtime environment. Google Cloud Run provides a serverless container platform that's ideal for hosting SvelteKit applications. This guide details the deployment process for GearGrab.

## Configuration Files

### 1. Dockerfile

Create a `Dockerfile` in the project root:

```dockerfile
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the SvelteKit app
RUN npm run build

# Production stage
FROM node:20-slim

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --production

# Copy built application from builder stage
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Set environment variables
ENV PORT=8080
ENV NODE_ENV=production

# Expose the port
EXPOSE 8080

# Start the application
CMD ["node", "build"]
```

### 2. .dockerignore

Create a `.dockerignore` file to exclude unnecessary files from the build context:

```
node_modules
npm-debug.log
.git
.github
.vscode
.DS_Store
.env
.env.*
!.env.example
/build
/functions/node_modules
/functions/lib
```

### 3. Cloud Build Configuration

Create a `cloudbuild.yaml` file for continuous deployment:

```yaml
steps:
  # Build the container image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/geargrab-app', '.']
  
  # Push the container image to Container Registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/geargrab-app']
  
  # Deploy container image to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'geargrab-app'
      - '--image'
      - 'gcr.io/$PROJECT_ID/geargrab-app'
      - '--region'
      - 'us-central1'
      - '--platform'
      - 'managed'
      - '--allow-unauthenticated'
      - '--memory'
      - '512Mi'
      - '--cpu'
      - '1'
      - '--min-instances'
      - '0'
      - '--max-instances'
      - '10'
      - '--set-env-vars'
      - 'NODE_ENV=production'

images:
  - 'gcr.io/$PROJECT_ID/geargrab-app'
```

### 4. Firebase Hosting Integration with Cloud Run

Update `firebase.json` to proxy requests to Cloud Run:

```json
{
  "hosting": {
    "public": "static",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "run": {
          "serviceId": "geargrab-app",
          "region": "us-central1"
        }
      }
    ]
  }
}
```

## Deployment Process

### 1. Manual Deployment

To manually deploy the application to Cloud Run:

```bash
# Build the Docker image
docker build -t gcr.io/[PROJECT_ID]/geargrab-app .

# Push the image to Container Registry
docker push gcr.io/[PROJECT_ID]/geargrab-app

# Deploy to Cloud Run
gcloud run deploy geargrab-app \
  --image gcr.io/[PROJECT_ID]/geargrab-app \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 512Mi
```

### 2. Continuous Deployment with GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloud Run

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Google Cloud SDK
      uses: google-github-actions/setup-gcloud@v1
      with:
        project_id: ${{ secrets.GCP_PROJECT_ID }}
        service_account_key: ${{ secrets.GCP_SA_KEY }}
        export_default_credentials: true
    
    - name: Build and push Docker image
      run: |
        gcloud builds submit --config cloudbuild.yaml
    
    - name: Deploy Firebase Hosting
      uses: FirebaseExtended/action-hosting-deploy@v0
      with:
        repoToken: '${{ secrets.GITHUB_TOKEN }}'
        firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
        channelId: live
        projectId: ${{ secrets.FIREBASE_PROJECT_ID }}
```

## Environment Configuration

### 1. Runtime Environment Variables

Set these environment variables in Cloud Run:

```
FIREBASE_API_KEY=xxxxx
FIREBASE_AUTH_DOMAIN=xxxxx
FIREBASE_PROJECT_ID=xxxxx
FIREBASE_STORAGE_BUCKET=xxxxx
FIREBASE_MESSAGING_SENDER_ID=xxxxx
FIREBASE_APP_ID=xxxxx
STRIPE_PUBLISHABLE_KEY=xxxxx
```

### 2. Secret Management

For sensitive keys (like Stripe secret keys), use Secret Manager:

```bash
# Create the secret
gcloud secrets create stripe-secret-key --reachable-from-project

# Store the secret value
echo -n "sk_test_..." | gcloud secrets versions add stripe-secret-key --data-file=-

# Grant access to the Cloud Run service
gcloud secrets add-iam-policy-binding stripe-secret-key \
  --member="serviceAccount:$PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Mount the secret in Cloud Run
gcloud run services update geargrab-app \
  --update-secrets=STRIPE_SECRET_KEY=stripe-secret-key:latest
```

## Optimizing Cloud Run Performance

### 1. Cold Start Optimization

To minimize cold starts, configure:

1. **Memory and CPU allocation**: Start with 512MB RAM and 1 CPU, adjust based on performance metrics.
2. **Minimum instances**: Configure min instances (1) to keep a warm instance available.
3. **Session affinity**: Enable session affinity for consistent user experience.

```bash
gcloud run services update geargrab-app \
  --min-instances=1 \
  --session-affinity \
  --memory=512Mi \
  --cpu=1
```

### 2. Static Assets Configuration

Serve static assets from Firebase Hosting to reduce load on Cloud Run:

```json
// firebase.json
{
  "hosting": {
    "public": "static",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "/_app/**",
        "destination": "/_app/**"
      },
      {
        "source": "/images/**",
        "destination": "/images/**"
      },
      {
        "source": "/favicon.ico",
        "destination": "/favicon.ico"
      },
      {
        "source": "**",
        "run": {
          "serviceId": "geargrab-app",
          "region": "us-central1"
        }
      }
    ]
  }
}
```

### 3. Caching Strategy

Configure caching headers for static assets:

```json
// firebase.json
{
  "hosting": {
    "headers": [
      {
        "source": "/_app/**",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      },
      {
        "source": "/images/**",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=86400"
          }
        ]
      }
    ]
  }
}
```

## Monitoring and Logging

### 1. Cloud Monitoring Setup

Set up Cloud Monitoring for the Cloud Run service:

1. Create an uptime check for the service URL
2. Configure alerting policies for:
   - Error rates above 1%
   - Latency above 500ms for p95
   - Instance count near maximum (capacity planning)

### 2. Custom Logging

Implement structured logging in your application:

```javascript
// src/hooks.server.js
export async function handle({ event, resolve }) {
  const startTime = Date.now();
  
  // Process the request
  const response = await resolve(event);
  
  // Log request details
  const duration = Date.now() - startTime;
  const logData = {
    path: event.url.pathname,
    method: event.request.method,
    duration,
    status: response.status,
    userAgent: event.request.headers.get('user-agent')
  };
  
  if (response.status >= 400) {
    console.error('Request error', logData);
  } else {
    console.log('Request processed', logData);
  }
  
  return response;
}
```

### 3. Error Tracking

Integrate with Error Reporting:

```javascript
// src/hooks.server.js
import { dev } from '$app/environment';

// Error handler
export function handleError({ error, event }) {
  // Log to Google Cloud Error Reporting
  const errorReport = {
    message: error.message,
    stack: error.stack,
    path: event.url.pathname,
    method: event.request.method,
    timestamp: new Date().toISOString()
  };
  
  if (!dev) {
    console.error(JSON.stringify(errorReport));
  }
  
  return {
    message: 'An unexpected error occurred',
    code: error.code || 'UNKNOWN'
  };
}
```

## Cost Optimization

1. **Instance scaling**: Configure appropriate min/max instances to control costs
2. **Request concurrency**: Increase concurrency to handle more requests per instance
3. **Resource allocation**: Monitor usage and adjust CPU/memory allocations

```bash
# Optimize for cost with higher concurrency
gcloud run services update geargrab-app \
  --concurrency=80 \
  --min-instances=0 \
  --max-instances=5 \
  --cpu=1 \
  --memory=512Mi
```

## Production Readiness Checklist

- [ ] Configure custom domain with SSL
- [ ] Set up IAM permissions for service accounts
- [ ] Enable Cloud Run Continuous Deployment
- [ ] Implement request logging and monitoring
- [ ] Configure appropriate timeout values
- [ ] Set up alerting for errors and performance issues
- [ ] Implement retry logic for transient failures
- [ ] Test scaling under load
- [ ] Configure proper VPC connectivity if needed
- [ ] Enable audit logging

This guide provides a comprehensive approach to deploying the GearGrab SvelteKit application to Google Cloud Run with optimal performance and reliability.
## Troubleshooting Cross-Project Container Images

If you deploy a Cloud Run service using a container image from a different Google Cloud project, the Cloud Run service account must have permission to read that image. A common error is:

```
Revision 'SERVICE-NAME-00001-xxx' is not ready and cannot serve traffic.
Google Cloud Run Service Agent SERVICE_ACCOUNT must have permission to read the image, gcr.io/OTHER-PROJECT/IMAGE.
```

To resolve this you can either:

1. **Use the same project** for both the container image and the Cloud Run service (recommended). Build and push your image to `gcr.io/$(gcloud config get-value project)/IMAGE` and deploy from there.
2. **Grant Artifact Registry access** to the Cloud Run service account if you must deploy across projects:

```bash
gcloud projects add-iam-policy-binding OTHER-PROJECT \
  --member="serviceAccount:SERVICE_NUMBER@serverless-robot-prod.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.reader"
```

Replace `OTHER-PROJECT` with the project hosting the image and `SERVICE_NUMBER` with the Cloud Run project's number. After permissions propagate, redeploy.
