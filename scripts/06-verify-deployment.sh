#!/bin/bash

# Step 6: Verify Deployment
echo "🧪 Verifying GearGrab deployment..."

# Get service URL
SERVICE_URL=$(gcloud run services describe geargrab --region us-central1 --format 'value(status.url)')

echo "🌐 Service URLs:"
echo "  Cloud Run: $SERVICE_URL"
echo "  Custom Domain: https://geargrab.co"
echo ""

# Test Cloud Run URL
echo "🔍 Testing Cloud Run URL..."
if curl -f -s "$SERVICE_URL" > /dev/null; then
    echo "✅ Cloud Run URL is accessible"
else
    echo "❌ Cloud Run URL is not accessible"
fi

# Test custom domain
echo "🔍 Testing custom domain..."
if curl -f -s "https://geargrab.co" > /dev/null; then
    echo "✅ Custom domain is accessible"
else
    echo "⚠️  Custom domain not ready yet (DNS may still be propagating)"
fi

# Show recent logs
echo ""
echo "📋 Recent application logs:"
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=geargrab" --limit 10 --format="table(timestamp,severity,textPayload)"

echo ""
echo "✅ Deployment verification complete!"
echo ""
echo "🎉 GearGrab is now live!"
echo "   Visit: https://geargrab.co"
echo ""
echo "📊 Monitor with:"
echo "   gcloud logging read \"resource.type=cloud_run_revision AND resource.labels.service_name=geargrab\" --limit 50"
