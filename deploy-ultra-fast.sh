#!/bin/bash

# Ultra-fast deployment script that creates a minimal deployment package
# This approach creates a clean deployment directory with only necessary files

set -e

echo "🚀 Starting ultra-fast deployment process..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Create a temporary deployment directory
DEPLOY_DIR="deploy-temp"
echo "📁 Creating clean deployment directory..."

# Remove existing deploy directory if it exists
rm -rf "$DEPLOY_DIR"
mkdir "$DEPLOY_DIR"

# Copy only essential files for deployment
echo "📋 Copying essential files..."

# Copy package files
cp package.json "$DEPLOY_DIR/"
cp package-lock.json "$DEPLOY_DIR/" 2>/dev/null || echo "No package-lock.json found"

# Copy source code (excluding node_modules and build artifacts)
rsync -av --exclude='node_modules' \
          --exclude='build' \
          --exclude='.svelte-kit' \
          --exclude='dist' \
          --exclude='.git' \
          --exclude='.github' \
          --exclude='cypress' \
          --exclude='test-results' \
          --exclude='playwright-report' \
          --exclude='*.log' \
          --exclude='*.md' \
          --exclude='deploy-*' \
          --exclude='.env*' \
          src/ "$DEPLOY_DIR/src/"

# Copy essential config files
cp svelte.config.js "$DEPLOY_DIR/" 2>/dev/null || echo "No svelte.config.js found"
cp vite.config.js "$DEPLOY_DIR/" 2>/dev/null || echo "No vite.config.js found"
cp tsconfig.json "$DEPLOY_DIR/" 2>/dev/null || echo "No tsconfig.json found"
cp tailwind.config.js "$DEPLOY_DIR/" 2>/dev/null || echo "No tailwind.config.js found"
cp postcss.config.js "$DEPLOY_DIR/" 2>/dev/null || echo "No postcss.config.js found"

# Copy static directory if it exists
if [ -d "static" ]; then
    cp -r static "$DEPLOY_DIR/"
fi

# Copy Dockerfile and ignore files
cp Dockerfile "$DEPLOY_DIR/"
cp .dockerignore "$DEPLOY_DIR/"

# Create optimized .gcloudignore in deploy directory
cat > "$DEPLOY_DIR/.gcloudignore" << 'EOF'
# Ignore everything not needed for deployment
*.md
*.log
.git/
.github/
.vscode/
.idea/
.DS_Store
.env*
!.env.example
/test-results/
/playwright-report/
/cypress/
/scripts/
/docs/
deploy-*/
EOF

echo "✅ Clean deployment directory created with $(du -sh $DEPLOY_DIR | cut -f1) of files"

# Change to deploy directory and deploy
cd "$DEPLOY_DIR"

echo "🚀 Deploying from clean directory..."

gcloud run deploy geargrab \
    --source . \
    --region us-central1 \
    --platform managed \
    --allow-unauthenticated \
    --port 8080 \
    --memory 1Gi \
    --cpu 1 \
    --max-instances 10 \
    --timeout 300 \
    --concurrency 80 \
    --set-env-vars NODE_ENV=production \
    --set-env-vars PORT=8080 \
    --set-env-vars VITE_USE_EMULATORS=false \
    --set-env-vars VITE_APP_URL=https://geargrab.co \
    --quiet

DEPLOY_STATUS=$?

# Return to original directory
cd ..

if [ $DEPLOY_STATUS -eq 0 ]; then
    echo "✅ Deployment completed successfully!"
    echo "🌐 Your app is now live at: https://geargrab-227444442028.us-central1.run.app"
    
    # Test the deployment
    echo "🧪 Testing deployment..."
    curl -s -o /dev/null -w "%{http_code}" https://geargrab-227444442028.us-central1.run.app > /tmp/status_code
    STATUS_CODE=$(cat /tmp/status_code)
    
    if [ "$STATUS_CODE" = "200" ]; then
        echo "✅ Deployment test passed - site is responding"
    else
        echo "⚠️  Deployment test warning - received status code: $STATUS_CODE"
    fi
else
    echo "❌ Deployment failed"
fi

# Clean up deploy directory
echo "🧹 Cleaning up temporary files..."
rm -rf "$DEPLOY_DIR"

if [ $DEPLOY_STATUS -eq 0 ]; then
    echo "🎉 Ultra-fast deployment complete!"
else
    exit 1
fi
