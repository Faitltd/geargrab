#!/bin/bash

# Setup Environment Variables for GearGrab Cloud Run Service
# This script configures the production environment variables

set -e

SERVICE_NAME="geargrab"
REGION="us-central1"

echo "🔧 Setting up environment variables for GearGrab Cloud Run service..."

# Update the Cloud Run service with environment variables
gcloud run services update $SERVICE_NAME \
    --region $REGION \
    --set-env-vars \
NODE_ENV=production,\
VITE_USE_EMULATORS=false,\
VITE_APP_URL=https://geargrab.co,\
VITE_FIREBASE_API_KEY=AIzaSyANV1v2FhD2ktXxBUsfGrDm9442dGGCuYs,\
VITE_FIREBASE_AUTH_DOMAIN=geargrabco.firebaseapp.com,\
VITE_FIREBASE_PROJECT_ID=geargrabco,\
VITE_FIREBASE_STORAGE_BUCKET=geargrabco.firebasestorage.app,\
VITE_FIREBASE_MESSAGING_SENDER_ID=227444442028,\
VITE_FIREBASE_APP_ID=1:227444442028:web:6eeaed1e136d07f5b73009,\
FIREBASE_PROJECT_ID=geargrabco,\
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-fbsvc@geargrabco.iam.gserviceaccount.com,\
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC6HrIYQnK32r8c\nMIuYoFYTUWglGEFMbCjIg35QkhMH3pi25Xd0fjqcDmYw0zQxSeIYhXJwJX5hFd+k\niKWNneSKhTW4sDxiDJU2o8f6+kFa0aChSHNq4HYA0wbmyzVglJju5RavqRfCWoOO\n8HGWFpMpWAYPxCVYLsAVsHKUCEDd4bQuCWpY9ShicFqgPH+n/F6GalQLVRQ4rJN/\nDVWYudUUmGTLz4BZIL3ZTDvRRD6xlbaeJAQtwvrB/RPy7HgJFcac8ubCJEsKiqZu\n6bUMxTeJQn4FXVzSi8E42eKZ2V3wlW5C7xjJKZMkfrKb+rLrqSYaDs8prKTg65FQ\nGIPXtTFlAgMBAAECggEAG6Xmr+rjDsPMgvwFKLmcv8bmkSgevyMMFelOsNpaQF+F\nURoaWjBMNZWAAb3GMZI3p4vfWaCAOxzcOZ1g9n4fjqJGPjbT6X7UBadj1Dkrzzl3\nwq24E4bfkLTIgC1ssvmwFEDs01Brqp/2jhvSy8hzuP8N+3aYU5aySyaIhswJEsyt\nIZcmDfns5XOQ9jb5OtuDu/kXjrpeWMj1OPviISLQH9Hz6cA2Jvi2Xhmogy8Z60j3\nAtSSlZ2e3V1fSMyKf2Nd0Rv0Ek9yjWOuXyk/1Z9Rrrw1MhjzaQMjzPc5XBuMtmeM\n53Uwwkeo8lQ9ztn1zk1zMag4s48VMMykF8zAnIY+oQKBgQDlB4c/rpj13dFi61v+\nDZUIriQ5JFGcRP36MkRl6cLZw0mNtp86z0EsPji/NQSGTYoH/vvcjkHRKyZrfJ9z\nGy+vhT/qOQlkya88t54lEJzCNN4H0bPXeyzynh/aXYbANr13fvpEnRrEuKP80z23\n6TwEudyEyxuYgasfUEk75ZL+cQKBgQDQCZbUxJPKFrGMM/2/kq3zFEWJ91uwJDBy\nJb8V6qg4RGG21s/0Ji1rvsIqN63AS6w4uywqxgkEzVsk41Of8Xck3z+tBi3gEKa5\nF9lf0KKKVp4GQPbAJvV/mMRblW1t2y3t0yO4nXxVl/yFxB3FKZmR5DcelHpjX7dh\n/KHKyPjENQKBgQDZbVk32sB6AbiLiVcPC8PltrTKzrDvgwv+X4RRoCeMZnpIoAvw\nX9vGbdefpmyCN9CHoMlobGENe0KBHpGdTDzsC7tO2BET7uh+4u6uz2OSd3Alyi5K\nrjRQrE8fFlUb25vpetGLG/7SrVt5ZO2d0D1bWzt/kfbDxK45DxZHV75B8QKBgFC/\nyBniC3Nfh57h91ZKutYlQjChIKeoBF3qJNd+87iTYlIz4xfjUbIGoxr77ac8OCb1\nD9mycIG6q+wPiMAGW7amKPMh+OCF1hD2HtvAAbcsk73drWk8NgJG68CYqZcAgj1T\nvQPFrSMUEWJikyOaWA92w6ZM/4xe9LFF/A7YHycZAoGAMlHOAksYPLTRa5p9tQ24\nW9+1OvKssod//abisI//7hIqzKdsCfkGiS7zOv04ZyEmTpttvCxvlWQryFZR1Vny\n5CtKPMKWWGr0iHr5k5cOqhAzq1UXcs9T4jfZn5CqwJXOHXZ9/DcybhDVVSP59TdV\n2CaTrGlniuXZscrwhlLjdM0=\n-----END PRIVATE KEY-----",\
GOOGLE_CLOUD_PROJECT_ID=geargrabco,\
GOOGLE_CLOUD_REGION=us-central1,\
FROM_EMAIL=bookings@geargrab.co,\
COMPANY_FROM_EMAIL=no-reply@geargrab.co,\
ALERT_EMAIL=alerts@geargrab.co,\
SECURITY_ALERT_EMAIL=security@geargrab.co \
    --quiet

echo "✅ Environment variables updated successfully!"
echo "🔗 Service URL: https://geargrab-227444442028.us-central1.run.app"
echo "🌐 Production URL: https://geargrab.co"
