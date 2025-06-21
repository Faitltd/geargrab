#!/bin/bash

# Environment Variables Template
# Copy this file to 'env-secrets.sh' and fill in your actual values
# DO NOT commit env-secrets.sh to git!

# Stripe Configuration (REPLACE WITH YOUR ACTUAL KEYS)
export STRIPE_PUBLISHABLE_KEY="pk_live_YOUR_PUBLISHABLE_KEY_HERE"
export STRIPE_SECRET_KEY="sk_live_YOUR_SECRET_KEY_HERE"
export STRIPE_WEBHOOK_SECRET="whsec_YOUR_WEBHOOK_SECRET_HERE"

# Firebase Admin (REPLACE WITH YOUR ACTUAL VALUES)
export FIREBASE_ADMIN_CLIENT_EMAIL="your-service-account@geargrabco.iam.gserviceaccount.com"
export FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
YOUR_PRIVATE_KEY_HERE
-----END PRIVATE KEY-----"

# Other secrets
export SENDGRID_API_KEY="SG.YOUR_SENDGRID_KEY_HERE"
export TWILIO_AUTH_TOKEN="your_twilio_auth_token_here"

echo "Environment variables loaded from env-secrets.sh"
