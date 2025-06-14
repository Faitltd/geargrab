#!/bin/bash

# Step 3: Set Firebase Environment Variables
echo "🔥 Setting Firebase environment variables..."

# Load secrets
source scripts/env-secrets.sh

# Set client-side Firebase config
gcloud run services update geargrab --region us-central1 \
  --set-env-vars "VITE_FIREBASE_API_KEY=AIzaSyANV1v2FhD2ktXxBUsfGrDm9442dGGCuYs" \
  --set-env-vars "VITE_FIREBASE_AUTH_DOMAIN=geargrabco.firebaseapp.com" \
  --set-env-vars "VITE_FIREBASE_PROJECT_ID=geargrabco" \
  --set-env-vars "VITE_FIREBASE_STORAGE_BUCKET=geargrabco.firebasestorage.app" \
  --set-env-vars "VITE_FIREBASE_MESSAGING_SENDER_ID=227444442028" \
  --set-env-vars "VITE_FIREBASE_APP_ID=1:227444442028:web:6eeaed1e136d07f5b73009" \
  --set-env-vars "FIREBASE_PROJECT_ID=geargrabco" \
  --set-env-vars "FIREBASE_ADMIN_CLIENT_EMAIL=${FIREBASE_ADMIN_CLIENT_EMAIL}" \
  --set-env-vars "FIREBASE_ADMIN_PRIVATE_KEY=${FIREBASE_ADMIN_PRIVATE_KEY}"

echo "✅ Firebase environment variables set!"
echo "Next: Run ./scripts/04-set-stripe-env.sh"
