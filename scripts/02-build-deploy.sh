#!/bin/bash

# Step 2: Build and Deploy to Cloud Run
echo "🚀 Building and deploying GearGrab to Cloud Run..."

# Build and push Docker image
echo "📦 Building Docker image..."
gcloud builds submit --tag gcr.io/geargrabco/geargrab .

# Deploy to Cloud Run
echo "🌐 Deploying to Cloud Run..."
gcloud run deploy geargrab \
  --image gcr.io/geargrabco/geargrab \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --set-env-vars "NODE_ENV=production" \
  --set-env-vars "VITE_APP_URL=https://geargrab.co" \
  --set-env-vars "VITE_USE_EMULATORS=false"

echo "✅ Build and deployment complete!"
echo "Next: Run ./scripts/03-set-firebase-env.sh"
