#!/bin/bash

# Step 4: Set Stripe Environment Variables
echo "💳 Setting Stripe environment variables..."

# Check if secrets file exists
if [ ! -f "scripts/env-secrets.sh" ]; then
    echo "❌ Error: scripts/env-secrets.sh not found!"
    echo "Please copy scripts/env-template.sh to scripts/env-secrets.sh and fill in your actual keys"
    exit 1
fi

# Load environment variables
source scripts/env-secrets.sh

# Validate required variables
if [ -z "$STRIPE_PUBLISHABLE_KEY" ] || [ -z "$STRIPE_SECRET_KEY" ] || [ -z "$STRIPE_WEBHOOK_SECRET" ]; then
    echo "❌ Error: Missing required Stripe environment variables"
    echo "Please check your scripts/env-secrets.sh file"
    exit 1
fi

# Set Stripe environment variables
gcloud run services update geargrab --region us-central1 \
  --set-env-vars "VITE_STRIPE_PUBLISHABLE_KEY=$STRIPE_PUBLISHABLE_KEY" \
  --set-env-vars "STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY" \
  --set-env-vars "STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET"

echo "✅ Stripe environment variables set!"
echo "Next: Run ./scripts/05-configure-domain.sh"