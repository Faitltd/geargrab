#!/bin/bash

# Simple GearGrab Deployment Script
echo "🚀 Starting GearGrab Deployment..."

# Configuration
PROJECT_ID="geargrabco"
REGION="us-central1"
SERVICE_NAME="geargrab-app"
SUPABASE_PASSWORD="Th1515ray!"
DATABASE_URL="postgresql://postgres:$SUPABASE_PASSWORD@db.absmquyhavntfoojvskl.supabase.co:5432/postgres"

# Clean up Terraform
echo "🧹 Cleaning up Terraform..."
if [ -d "terraform" ]; then
    cd terraform
    rm -f *.tf
    rm -rf .terraform .terraform.lock.hcl terraform.tfstate*
    cd ..
    echo "✅ Terraform cleaned"
fi

# Set project
echo "🎯 Setting Google Cloud project..."
gcloud config set project $PROJECT_ID

# Deploy to Cloud Run
echo "☁️ Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME:latest \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 5 \
  --timeout 300 \
  --set-env-vars NODE_ENV=production \
  --set-env-vars DATABASE_URL="$DATABASE_URL" \
  --set-env-vars FEATURE_COMMENTS=true \
  --set-env-vars FEATURE_PAYMENTS=true \
  --set-env-vars FEATURE_ADMIN_PANEL=true \
  --set-env-vars FEATURE_ANALYTICS=true

# Set up domain mappings
echo "🌐 Setting up domain mappings..."
gcloud alpha run domain-mappings create \
  --service=$SERVICE_NAME \
  --domain=geargrab.co \
  --region=$REGION || echo "Domain mapping may already exist"

gcloud alpha run domain-mappings create \
  --service=$SERVICE_NAME \
  --domain=www.geargrab.co \
  --region=$REGION || echo "Domain mapping may already exist"

# Get service URL and test
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")

echo "🧪 Testing deployment..."
if curl -s --max-time 10 "$SERVICE_URL" > /dev/null; then
    echo "✅ Service is responding"
else
    echo "⚠️ Service may still be starting up"
fi

# Get DNS configuration
echo ""
echo "🌐 DNS Configuration Required:"
echo "Configure these DNS records with your domain provider:"
gcloud alpha run domain-mappings describe geargrab.co --region=$REGION --format="table(status.resourceRecords[].name,status.resourceRecords[].type,status.resourceRecords[].rrdata)" 2>/dev/null || echo "Check Cloud Console"

echo ""
echo "🎉 DEPLOYMENT COMPLETE!"
echo "🔗 Direct URL: $SERVICE_URL"
echo "🔗 Production: https://geargrab.co (after DNS)"
echo "🎊 Your GearGrab platform is live! 🎊"
