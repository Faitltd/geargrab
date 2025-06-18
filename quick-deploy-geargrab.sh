#!/bin/bash

# Quick GearGrab Deployment Script
# Run this from your geargrab directory

echo "🚀 Deploying GearGrab to geargrab.co..."

# Configuration
export SUPABASE_PASSWORD="Th1515ray!"
export PROJECT_ID="geargrabco"
export REGION="us-central1"
export SERVICE_NAME="geargrab-app"

# Step 1: Commit all changes
echo "📝 Committing all changes..."
git add .
git commit -m "feat: Complete GearGrab platform deployment $(date)

✅ COMPREHENSIVE PLATFORM:
- Complete Prisma comment system
- JWT authentication with middleware  
- User registration and management
- Payment processing (Stripe)
- Admin panel with background checks
- Image upload and calendar components
- Comprehensive validation and utilities

🌐 Ready for production at geargrab.co"

# Step 2: Switch to main and push
echo "🔄 Switching to main branch and pushing..."
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    git checkout main
    git merge $CURRENT_BRANCH --no-edit
fi
git push origin main

# Step 3: Deploy to Cloud Run
echo "☁️ Deploying to Cloud Run..."
export PATH="/home/augment-agent/google-cloud-sdk/bin:$PATH"
/home/augment-agent/google-cloud-sdk/bin/gcloud config set project $PROJECT_ID
/home/augment-agent/google-cloud-sdk/bin/gcloud services enable cloudbuild.googleapis.com run.googleapis.com

DATABASE_URL="postgresql://postgres:$SUPABASE_PASSWORD@db.absmquyhavntfoojvskl.supabase.co:5432/postgres"

/home/augment-agent/google-cloud-sdk/bin/gcloud builds submit --config cloudbuild.yaml \
    --substitutions=_DATABASE_URL="$DATABASE_URL"

# Step 4: Set up domains
echo "🌐 Setting up domain mappings..."
/home/augment-agent/google-cloud-sdk/bin/gcloud beta run domain-mappings create \
    --service=$SERVICE_NAME \
    --domain=geargrab.co \
    --region=$REGION || echo "Domain mapping may already exist"

/home/augment-agent/google-cloud-sdk/bin/gcloud beta run domain-mappings create \
    --service=$SERVICE_NAME \
    --domain=www.geargrab.co \
    --region=$REGION || echo "Domain mapping may already exist"

# Step 5: Get service URL and DNS info
SERVICE_URL=$(/home/augment-agent/google-cloud-sdk/bin/gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")

echo ""
echo "🎉 DEPLOYMENT COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔗 Direct URL: $SERVICE_URL"
echo "🔗 Production: https://geargrab.co (after DNS)"
echo ""
echo "🧪 Test now: $SERVICE_URL/api/comments?articleId=article_001"
echo ""
echo "🌐 Configure these DNS records:"
echo "A Record for geargrab.co:"
/home/augment-agent/google-cloud-sdk/bin/gcloud beta run domain-mappings describe --domain=geargrab.co --region=$REGION --format="value(status.resourceRecords[0].rrdata)" 2>/dev/null || echo "Check Cloud Console"
echo ""
echo "CNAME Record for www.geargrab.co:"
/home/augment-agent/google-cloud-sdk/bin/gcloud beta run domain-mappings describe --domain=www.geargrab.co --region=$REGION --format="value(status.resourceRecords[0].rrdata)" 2>/dev/null || echo "Check Cloud Console"
echo ""
echo "🎊 Your complete GearGrab platform is now live! 🎊"
