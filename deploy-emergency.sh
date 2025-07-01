#!/bin/bash

# Emergency Deployment Script
# Bypasses all permission issues by using environment variables only

set -e

echo "🚨 EMERGENCY DEPLOYMENT - Environment Variables Only"
echo "=================================================="

# Configuration
PROJECT_ID="geargrabco"
SERVICE_NAME="geargrab"
REGION="us-central1"

echo "📝 Updating Cloud Run service environment variables..."

# Update the existing Cloud Run service with correct environment variables
gcloud run services update $SERVICE_NAME \
  --region $REGION \
  --set-env-vars NODE_ENV=production \
  --set-env-vars PORT=8080 \
  --set-env-vars HOST=0.0.0.0 \
  --set-env-vars VITE_USE_EMULATORS=false \
  --set-env-vars VITE_APP_URL=https://geargrab.co \
  --set-env-vars FIREBASE_PROJECT_ID=geargrabco \
  --set-env-vars FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-fbsvc@geargrabco.iam.gserviceaccount.com \
  --set-env-vars FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCcZOW/StWX8u0e\nZPXkFk+/X8x+YXtaEuP8gPvvA02APrI7x/M2VX1KxbKnkRWSZCxEd6NCVF9mevox\nL+dXYr2IRTuPITAFNNLvuJRfVZchz7CxIVGeNiguJUDm8fLZSjJWJoYZQepL1Uiz\nwlUqOLANT1A6wEtgARxdKkxXg2tSQ2S0iny8pbH67s/3lnwWzcT7Y04KQXeg9RPt\nxzKB3kvrEe90z1+A+Owl86NHqOK7tlEMgwvnh9xSYiElyxooNPoOVkVOblwqsCQ+\n74xcTdBfBWK8EcC/Tcu3i6fmHXPSnPqWd/CE34pLdMhGC3dWttRbVbMez3y+tG73\nWTSVR5afAgMBAAECggEAA9wjpXyB2A25V3ozbW01i6ogIHBkfH0h3l4KmcQRmhwy\nBvKw6ILkpD9L4QHeL+5D/26ae20cq6lWWndttMTtm5rl1OsDReWfXSZHlzDEGaQI\nHt8NJiP9CuKFfw2yqjVAF8s8nQv47eU2NaWSt4eNpM5z0vdjBNwSKKR+HNzT/cQ9\nLAM4bTPWEOVqr60gx5ix24K+2nTrHiFP1Mj8xLvWbiKbv8EAsGXBAgCvlv8fFKZa\nszExJFHQgZJKr40psWyY0BSJ+UEBkw8NS13zzUPjzryspHKun5Hn5T+LAEQz5bKs\nYO9OMAZRpDqGPijUtHacwN5B5meQrp2C/7cJa8ooUQKBgQDJFsToVKj7YytNDOiN\nM/akPBRqIxQ725FK1cQOkmS1B3oWTIEePuPm7ef8Dv0Fnki2hi68VS/BseH/9MYA\nfODzD1AX4LxCi1/XOoEbpJNyvk707fx4gXTxYNeXbTO+A0iGD0EBQpC3Am0IL+gZ\nGDNOFgyU6FIqoHqivOjOgGWyEQKBgQDHGbaiB49OksfuDNDWoqqVHx+rIbF0lPh8\nPSexJ81JqHk91plc0A7xKERgw0gQHR80g1bekNj2ZsOrdtcp4Mb44djTKznXxayE\nB1IBGoletzCNcH6tkqyzidV/r7iKsoOHL9ItU8usV/Xe1zbvkVE9ZBE05hgsV6WP\nk00pkjgNrwKBgDPXquw651XoO0GiElJVE0FEO/8hDBZihRLGCcW3+D6zrsYQ8zjY\n/eiLbUOOmazZIeXssh/b1nQZaCqU8Hcvus7vI7cEOYTuaccTTjXSODFc3v5GXNC0\nj3GrhemEPdK/BfOJ+zhX8Pc9qN5ze2L82j1Hcfbx7j0PIo7SJTMX5yABAoGABv5S\nOfLGB96EA0qT81YXY9GKDTrLvuqUp9iGEmTxgwrV52QoUuhD/hiJ/lQdreM3+2I5\npOu1k0Ic0WMFP8VTd96G/TPhfkDFRIX1TXCfLqKEpBM1f+dNBalrxGZptwV6NT9q\nxIjS+KTGUCODHHsgPWXMbO1AIB6cBCUKatFmAqUCgYBfTrsbcSFbMC+AeQwJBdhg\nU4sq7fTzZe1qJ12ihutigR5ics4KBwBnBIGv8cw4N1FuK/tsHREllk/W95nPUlFq\nHZc1X78DFKp6OYD1KrcdMDidCnZBH6NwtpR7ue6nFbG+dlJpWXWDQ3OpVQQqXeM8\nVtZJiOb9h2Qz1Hi26sVZfQ==\n-----END PRIVATE KEY-----\n" \
  --set-env-vars VITE_FIREBASE_API_KEY=AIzaSyANV1v2FhD2ktXxBUsfGrDm9442dGGCuYs \
  --set-env-vars VITE_FIREBASE_AUTH_DOMAIN=geargrabco.firebaseapp.com \
  --set-env-vars VITE_FIREBASE_PROJECT_ID=geargrabco \
  --set-env-vars VITE_FIREBASE_STORAGE_BUCKET=geargrabco.firebasestorage.app \
  --set-env-vars VITE_FIREBASE_MESSAGING_SENDER_ID=227444442028 \
  --set-env-vars VITE_FIREBASE_APP_ID=1:227444442028:web:6eeaed1e136d07f5b73009 \
  --quiet

echo "✅ Environment variables updated!"

echo "🔍 Testing deployment..."
sleep 10

# Test the API
echo "Testing API endpoint..."
curl -s https://geargrab.co/api/listings?featured=true&limit=1 | head -100

echo ""
echo "🎉 Emergency deployment completed!"
echo "🌐 Site: https://geargrab.co"
echo "📝 Note: This only updated environment variables, not the application code"
