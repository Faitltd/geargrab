#!/bin/bash

# Step 5: Configure Custom Domain
echo "🌐 Configuring custom domain for geargrab.co..."

# Map domain to service
gcloud run domain-mappings create \
  --service geargrab \
  --domain geargrab.co \
  --region us-central1

# Get domain mapping details
echo "📋 Domain mapping configuration:"
gcloud run domain-mappings describe geargrab.co --region us-central1

echo ""
echo "✅ Domain mapping configured!"
echo ""
echo "🔧 Next steps:"
echo "1. Configure DNS records at your domain registrar:"
echo "   - Add A record: @ → [IP from domain mapping above]"
echo "   - Add CNAME record: www → ghs.googlehosted.com"
echo ""
echo "2. Run ./scripts/06-verify-deployment.sh to test"
