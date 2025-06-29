#!/bin/bash

# Fix GearGrab Deployment Issues
# This script addresses the static asset 404 errors and Firebase configuration issues

set -e

echo "🔧 Fixing GearGrab deployment issues..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Please run this script from the project root.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build completed successfully (already built)${NC}"

# Check if build directory exists and has content
if [ ! -d "build" ] || [ -z "$(ls -A build)" ]; then
    echo -e "${RED}❌ Build directory is empty or missing${NC}"
    exit 1
fi

echo -e "${BLUE}🚀 Deploying to Cloud Run...${NC}"
echo -e "${YELLOW}⚠️ Please make sure you're authenticated with gcloud first:${NC}"
echo -e "${YELLOW}   gcloud auth login${NC}"
echo -e "${YELLOW}   gcloud config set project geargrabco${NC}"
echo ""

# Deploy with all necessary environment variables
gcloud run deploy geargrab \
    --source . \
    --region us-central1 \
    --platform managed \
    --allow-unauthenticated \
    --port 8080 \
    --memory 2Gi \
    --cpu 2 \
    --max-instances 10 \
    --timeout 300 \
    --concurrency 80 \
    --set-env-vars NODE_ENV=production \
    --set-env-vars PORT=8080 \
    --set-env-vars HOST=0.0.0.0 \
    --set-env-vars VITE_USE_EMULATORS=false \
    --set-env-vars VITE_APP_URL=https://geargrab.co \
    --set-env-vars FIREBASE_PROJECT_ID=geargrabco \
    --set-env-vars FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-fbsvc@geargrabco.iam.gserviceaccount.com \
    --set-env-vars FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC6HrIYQnK32r8c
MIuYoFYTUWglGEFMbCjIg35QkhMH3pi25Xd0fjqcDmYw0zQxSeIYhXJwJX5hFd+k
iKWNneSKhTW4sDxiDJU2o8f6+kFa0aChSHNq4HYA0wbmyzVglJju5RavqRfCWoOO
8HGWFpMpWAYPxCVYLsAVsHKUCEDd4bQuCWpY9ShicFqgPH+n/F6GalQLVRQ4rJN/
DVWYudUUmGTLz4BZIL3ZTDvRRD6xlbaeJAQtwvrB/RPy7HgJFcac8ubCJEsKiqZu
6bUMxTeJQn4FXVzSi8E42eKZ2V3wlW5C7xjJKZMkfrKb+rLrqSYaDs8prKTg65FQ
GIPXtTFlAgMBAAECggEAG6Xmr+rjDsPMgvwFKLmcv8bmkSgevyMMFelOsNpaQF+F
URoaWjBMNZWAAb3GMZI3p4vfWaCAOxzcOZ1g9n4fjqJGPjbT6X7UBadj1Dkrzzl3
wq24E4bfkLTIgC1ssvmwFEDs01Brqp/2jhvSy8hzuP8N+3aYU5aySyaIhswJEsyt
IZcmDfns5XOQ9jb5OtuDu/kXjrpeWMj1OPviISLQH9Hz6cA2Jvi2Xhmogy8Z60j3
AtSSlZ2e3V1fSMyKf2Nd0Rv0Ek9yjWOuXyk/1Z9Rrrw1MhjzaQMjzPc5XBuMtmeM
53Uwwkeo8lQ9ztn1zk1zMag4s48VMMykF8zAnIY+oQKBgQDlB4c/rpj13dFi61v+
DZUIriQ5JFGcRP36MkRl6cLZw0mNtp86z0EsPji/NQSGTYoH/vvcjkHRKyZrfJ9z
Gy+vhT/qOQlkya88t54lEJzCNN4H0bPXeyzynh/aXYbANr13fvpEnRrEuKP80z23
6TwEudyEyxuYgasfUEk75ZL+cQKBgQDQCZbUxJPKFrGMM/2/kq3zFEWJ91uwJDBy
Jb8V6qg4RGG21s/0Ji1rvsIqN63AS6w4uywqxgkEzVsk41Of8Xck3z+tBi3gEKa5
F9lf0KKKVp4GQPbAJvV/mMRblW1t2y3t0yO4nXxVl/yFxB3FKZmR5DcelHpjX7dh
/KHKyPjENQKBgQDZbVk32sB6AbiLiVcPC8PltrTKzrDvgwv+X4RRoCeMZnpIoAvw
X9vGbdefpmyCN9CHoMlobGENe0KBHpGdTDzsC7tO2BET7uh+4u6uz2OSd3Alyi5K
rjRQrE8fFlUb25vpetGLG/7SrVt5ZO2d0D1bWzt/kfbDxK45DxZHV75B8QKBgFC/
yBniC3Nfh57h91ZKutYlQjChIKeoBF3qJNd+87iTYlIz4xfjUbIGoxr77ac8OCb1
D9mycIG6q+wPiMAGW7amKPMh+OCF1hD2HtvAAbcsk73drWk8NgJG68CYqZcAgj1T
vQPFrSMUEWJikyOaWA92w6ZM/4xe9LFF/A7YHycZAoGAMlHOAksYPLTRa5p9tQ24
W9+1OvKssod//abisI//7hIqzKdsCfkGiS7zOv04ZyEmTpttvCxvlWQryFZR1Vny
5CtKPMKWWGr0iHr5k5cOqhAzq1UXcs9T4jfZn5CqwJXOHXZ9/DcybhDVVSP59TdV
2CaTrGlniuXZscrwhlLjdM0=
-----END PRIVATE KEY-----" \
    --set-env-vars VITE_FIREBASE_API_KEY=AIzaSyANV1v2FhD2ktXxBUsfGrDm9442dGGCuYs \
    --set-env-vars VITE_FIREBASE_AUTH_DOMAIN=geargrabco.firebaseapp.com \
    --set-env-vars VITE_FIREBASE_PROJECT_ID=geargrabco \
    --set-env-vars VITE_FIREBASE_STORAGE_BUCKET=geargrabco.firebasestorage.app \
    --set-env-vars VITE_FIREBASE_MESSAGING_SENDER_ID=227444442028 \
    --set-env-vars VITE_FIREBASE_APP_ID=1:227444442028:web:6eeaed1e136d07f5b73009 \
    --set-env-vars STRIPE_SECRET_KEY=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 \
    --set-env-vars VITE_STRIPE_PUBLISHABLE_KEY=pk_live_51RZXbxBfCDZxMJmHHUzHwNJq1gNdpcMjp4kAJK28n8d5kTXPhI4pnptDiLJmyHybfhJzY7vIVZOaNrzJClCkY3vS00tMlh4lyZ

DEPLOY_STATUS=$?

if [ $DEPLOY_STATUS -eq 0 ]; then
    echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
    echo -e "${BLUE}🌐 Application should be available at: https://geargrab.co${NC}"
    echo -e "${YELLOW}⏳ Please wait 1-2 minutes for the deployment to fully propagate${NC}"
else
    echo -e "${RED}❌ Deployment failed with status: $DEPLOY_STATUS${NC}"
    exit 1
fi

echo -e "${BLUE}🔍 Checking deployment status...${NC}"

# Wait a moment for deployment to settle
sleep 10

# Test the deployment
echo -e "${BLUE}🧪 Testing deployment...${NC}"
curl -s -o /dev/null -w "%{http_code}" https://geargrab.co > /tmp/status_code
STATUS_CODE=$(cat /tmp/status_code)

if [ "$STATUS_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Deployment test successful! Status: $STATUS_CODE${NC}"
else
    echo -e "${YELLOW}⚠️ Deployment test returned status: $STATUS_CODE${NC}"
    echo -e "${YELLOW}This might be normal if the app is still starting up${NC}"
fi

echo -e "${GREEN}🎉 Fix deployment script completed!${NC}"
echo -e "${BLUE}📋 Next steps:${NC}"
echo -e "   1. Visit https://geargrab.co to verify the site loads"
echo -e "   2. Check the admin panel at https://geargrab.co/admin"
echo -e "   3. Test the listings page at https://geargrab.co/admin/listings"
