#!/bin/bash

# GearGrab Deployment Setup Script
# This script sets up the deployment environment and configuration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_status "🚀 Setting up GearGrab deployment environment..."

# Function to prompt for input with default value
prompt_with_default() {
    local prompt="$1"
    local default="$2"
    local result
    
    read -p "$prompt [$default]: " result
    echo "${result:-$default}"
}

# Collect configuration
print_status "Please provide the following configuration details:"
echo ""

PROJECT_ID=$(prompt_with_default "Google Cloud Project ID" "geargrab-production")
SERVICE_NAME=$(prompt_with_default "Cloud Run Service Name" "geargrab")
REGION=$(prompt_with_default "Google Cloud Region" "us-central1")
DOMAIN=$(prompt_with_default "Custom Domain (leave empty if none)" "geargrab.co")
GITHUB_REPO=$(prompt_with_default "GitHub Repository" "Faitltd/geargrab")

# Application Configuration
print_status "Application Configuration:"
API_URL=$(prompt_with_default "API URL" "https://api.geargrab.co")

echo ""
print_status "Configuration Summary:"
echo "======================"
echo "Project ID: $PROJECT_ID"
echo "Service Name: $SERVICE_NAME"
echo "Region: $REGION"
echo "Domain: ${DOMAIN:-'None'}"
echo "GitHub Repo: $GITHUB_REPO"
echo "API URL: $API_URL"
echo ""

read -p "Is this configuration correct? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_error "Configuration cancelled. Please run the script again."
    exit 1
fi

# Update deploy.sh with the configuration
print_status "Updating deploy.sh with your configuration..."

# Use a different delimiter for sed to avoid issues with forward slashes
sed -i.bak \
    -e "s|PROJECT_ID=\"geargrabco\"|PROJECT_ID=\"$PROJECT_ID\"|" \
    -e "s|SERVICE_NAME=\"geargrab\"|SERVICE_NAME=\"$SERVICE_NAME\"|" \
    -e "s|REGION=\"us-central1\"|REGION=\"$REGION\"|" \
    -e "s|DOMAIN=\"geargrab.co\"|DOMAIN=\"$DOMAIN\"|" \
    -e "s|GITHUB_REPO=\"Faitltd/geargrab\"|GITHUB_REPO=\"$GITHUB_REPO\"|" \
    deploy.sh

print_success "deploy.sh updated successfully"

# Create production environment file
print_status "Creating production environment configuration..."

cat > .env.production << EOF
# Production Environment Configuration
NODE_ENV=production
VITE_NODE_ENV=production

# API Configuration
VITE_API_URL=$API_URL

# Application Configuration
VITE_APP_NAME=GearGrab
VITE_APP_VERSION=1.0.0
VITE_APP_ENVIRONMENT=production

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_REPORTING=true
VITE_ENABLE_PERFORMANCE_MONITORING=true

# Build Configuration
GENERATE_SOURCEMAP=false
EOF

print_success ".env.production created"

# Create Dockerfile for Cloud Run
print_status "Creating Dockerfile for Cloud Run deployment..."

cat > Dockerfile << EOF
# Use Node.js 18 Alpine as base image
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 8080 (Cloud Run requirement)
EXPOSE 8080

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
EOF

print_success "Dockerfile created"

# Create nginx configuration
print_status "Creating nginx configuration..."

cat > nginx.conf << EOF
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    server {
        listen 8080;
        server_name _;
        root /usr/share/nginx/html;
        index index.html;
        
        # Handle client-side routing
        location / {
            try_files \$uri \$uri/ /index.html;
        }
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
EOF

print_success "nginx.conf created"

# Create Cloud Run service configuration
print_status "Creating Cloud Run service configuration..."

cat > service.yaml << EOF
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: $SERVICE_NAME
  annotations:
    run.googleapis.com/ingress: all
    run.googleapis.com/ingress-status: all
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/maxScale: "10"
        autoscaling.knative.dev/minScale: "0"
        run.googleapis.com/cpu-throttling: "true"
        run.googleapis.com/memory: "512Mi"
        run.googleapis.com/cpu: "1000m"
    spec:
      containerConcurrency: 80
      timeoutSeconds: 300
      containers:
      - image: gcr.io/$PROJECT_ID/$SERVICE_NAME
        ports:
        - name: http1
          containerPort: 8080
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "8080"
        resources:
          limits:
            cpu: 1000m
            memory: 512Mi
  traffic:
  - percent: 100
    latestRevision: true
EOF

print_success "service.yaml created"

# Create GitHub Actions workflow
print_status "Creating GitHub Actions workflow..."

mkdir -p .github/workflows

cat > .github/workflows/deploy.yml << EOF
name: Deploy to Production

on:
  push:
    branches: [ main ]
  workflow_dispatch:

env:
  PROJECT_ID: $PROJECT_ID
  SERVICE_NAME: $SERVICE_NAME
  REGION: $REGION

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Build application
      run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Google Cloud CLI
      uses: google-github-actions/setup-gcloud@v1
      with:
        service_account_key: \${{ secrets.GCP_SA_KEY }}
        project_id: \${{ env.PROJECT_ID }}
    
    - name: Configure Docker
      run: gcloud auth configure-docker
    
    - name: Build and push Docker image
      run: |
        docker build -t gcr.io/\$PROJECT_ID/\$SERVICE_NAME .
        docker push gcr.io/\$PROJECT_ID/\$SERVICE_NAME
    
    - name: Deploy to Cloud Run
      run: |
        gcloud run deploy \$SERVICE_NAME \
          --image gcr.io/\$PROJECT_ID/\$SERVICE_NAME \
          --region \$REGION \
          --platform managed \
          --allow-unauthenticated \
          --memory 512Mi \
          --cpu 1 \
          --max-instances 10
EOF

print_success "GitHub Actions workflow created"

# Make deploy script executable
chmod +x deploy.sh

print_success "deploy.sh made executable"

# Create deployment documentation
print_status "Creating deployment documentation..."

cat > DEPLOYMENT.md << EOF
# GearGrab Deployment Guide

## Overview
This document describes the deployment process for GearGrab to Google Cloud Run.

## Configuration
- **Project ID**: $PROJECT_ID
- **Service Name**: $SERVICE_NAME
- **Region**: $REGION
- **Domain**: ${DOMAIN:-'Not configured'}

## Manual Deployment

### Prerequisites
1. Google Cloud CLI installed and authenticated
2. Docker installed (for container builds)
3. Node.js 18+ installed
4. Git repository access

### Deploy Command
\`\`\`bash
./deploy.sh
\`\`\`

## Automated Deployment (GitHub Actions)
Pushes to the main branch will automatically trigger deployment via GitHub Actions.

### Required Secrets
Add these secrets to your GitHub repository:
- \`GCP_SA_KEY\`: Google Cloud Service Account key (JSON)

## Environment Variables
Production environment variables are configured in \`.env.production\`.

## Monitoring
- **Logs**: \`gcloud run logs tail $SERVICE_NAME --region=$REGION\`
- **Metrics**: Google Cloud Console > Cloud Run > $SERVICE_NAME

## Rollback
To rollback to a previous version:
\`\`\`bash
gcloud run services update-traffic $SERVICE_NAME --to-revisions=REVISION_NAME=100 --region=$REGION
\`\`\`

## Custom Domain Setup
If using a custom domain, ensure DNS is configured:
1. Add CNAME record pointing to ghs.googlehosted.com
2. Verify domain ownership in Google Cloud Console
3. Domain mapping is handled automatically by the deployment script

## Support
For deployment issues, check:
1. Google Cloud Console logs
2. GitHub Actions workflow logs
3. Application health endpoint: https://${DOMAIN:-$SERVICE_NAME-$PROJECT_ID.a.run.app}/health
EOF

print_success "DEPLOYMENT.md created"

print_status "🎉 Deployment setup completed!"
echo ""
print_success "Files created:"
echo "✅ deploy.sh - Main deployment script"
echo "✅ .env.production - Production environment variables"
echo "✅ Dockerfile - Container configuration"
echo "✅ nginx.conf - Web server configuration"
echo "✅ service.yaml - Cloud Run service definition"
echo "✅ .github/workflows/deploy.yml - GitHub Actions workflow"
echo "✅ DEPLOYMENT.md - Deployment documentation"
echo ""
print_status "Next steps:"
echo "1. Review and update .env.production with your actual values"
echo "2. Commit all files to your repository"
echo "3. Run ./deploy.sh to deploy to production"
echo "4. Set up GitHub Actions secrets for automated deployment"
echo ""
print_warning "Important: Make sure to update Base44 App ID and other sensitive values in .env.production"
