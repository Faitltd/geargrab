# 🚀 GearGrab Production Deployment Guide

This guide walks you through deploying the security-enhanced GearGrab application to Google Cloud Run and configuring it for geargrab.co and www.geargrab.co.

## 📋 Pre-Deployment Checklist

### ✅ Required Environment Variables

Set these environment variables before deployment:

```bash
# Firebase Admin (Required)
export FIREBASE_PROJECT_ID="your-firebase-project-id"
export FIREBASE_ADMIN_CLIENT_EMAIL="your-service-account@project.iam.gserviceaccount.com"
export FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Security (Required)
export SESSION_SECRET="your-32-character-or-longer-secret-key"

# Stripe (Required for payments)
export STRIPE_SECRET_KEY="sk_live_..."
export STRIPE_WEBHOOK_SECRET="whsec_..."
```

### ✅ Google Cloud Setup

1. **Install Google Cloud SDK**:
   ```bash
   # macOS
   brew install google-cloud-sdk
   
   # Ubuntu/Debian
   sudo apt-get install google-cloud-sdk
   ```

2. **Authenticate with Google Cloud**:
   ```bash
   gcloud auth login
   gcloud config set project geargrab-production
   ```

3. **Enable required APIs**:
   ```bash
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable run.googleapis.com
   gcloud services enable containerregistry.googleapis.com
   ```

## 🚀 Deployment Methods

### Method 1: Automated Deployment Script (Recommended)

```bash
# Run the automated deployment script
./scripts/deploy-production.sh
```

This script will:
- ✅ Validate all environment variables
- ✅ Run security audit
- ✅ Build application with security checks
- ✅ Build and push Docker image
- ✅ Deploy to Cloud Run
- ✅ Run health checks
- ✅ Provide domain configuration instructions

### Method 2: Manual Deployment

1. **Build the application**:
   ```bash
   npm run build:secure
   ```

2. **Build Docker image**:
   ```bash
   docker build -t gcr.io/geargrab-production/geargrab-app .
   docker push gcr.io/geargrab-production/geargrab-app
   ```

3. **Deploy to Cloud Run**:
   ```bash
   gcloud run deploy geargrab-app \
     --image gcr.io/geargrab-production/geargrab-app \
     --region us-central1 \
     --platform managed \
     --allow-unauthenticated \
     --memory 1Gi \
     --cpu 2 \
     --min-instances 0 \
     --max-instances 10 \
     --timeout 300 \
     --set-env-vars "NODE_ENV=production,FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID,FIREBASE_ADMIN_CLIENT_EMAIL=$FIREBASE_ADMIN_CLIENT_EMAIL,FIREBASE_ADMIN_PRIVATE_KEY=$FIREBASE_ADMIN_PRIVATE_KEY,SESSION_SECRET=$SESSION_SECRET,CORS_ORIGINS=https://geargrab.co,https://www.geargrab.co,STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY,STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET,RATE_LIMITING_ENABLED=true,LOG_LEVEL=info"
   ```

### Method 3: Cloud Build (CI/CD)

1. **Trigger Cloud Build**:
   ```bash
   gcloud builds submit --config cloudbuild.yaml
   ```

2. **Set up substitution variables** in Cloud Build:
   ```bash
   gcloud builds submit \
     --config cloudbuild.yaml \
     --substitutions _FIREBASE_PROJECT_ID="$FIREBASE_PROJECT_ID",_FIREBASE_ADMIN_CLIENT_EMAIL="$FIREBASE_ADMIN_CLIENT_EMAIL",_FIREBASE_ADMIN_PRIVATE_KEY="$FIREBASE_ADMIN_PRIVATE_KEY",_SESSION_SECRET="$SESSION_SECRET",_STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY",_STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK_SECRET"
   ```

## 🌐 Domain Configuration

### Configure Custom Domains

1. **Map geargrab.co**:
   ```bash
   gcloud run domain-mappings create \
     --service geargrab-app \
     --domain geargrab.co \
     --region us-central1
   ```

2. **Map www.geargrab.co**:
   ```bash
   gcloud run domain-mappings create \
     --service geargrab-app \
     --domain www.geargrab.co \
     --region us-central1
   ```

3. **Update DNS Records**:
   - Get the CNAME targets from the domain mapping commands
   - Update your DNS provider with the CNAME records
   - Wait for DNS propagation (can take up to 48 hours)

### SSL Certificate

Google Cloud Run automatically provisions SSL certificates for custom domains. The certificates will be active once DNS propagation is complete.

## 🔍 Post-Deployment Verification

### 1. Health Check

```bash
# Check service health
curl https://geargrab.co/api/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "environment": "production",
  "services": {
    "database": {"status": "healthy", "responseTime": 150},
    "auth": {"status": "healthy", "responseTime": 100}
  },
  "uptime": 3600
}
```

### 2. Security Headers

```bash
# Check security headers
curl -I https://geargrab.co/

# Expected headers:
# x-frame-options: DENY
# x-content-type-options: nosniff
# referrer-policy: strict-origin-when-cross-origin
# x-xss-protection: 1; mode=block
# content-security-policy: default-src 'self'; ...
# strict-transport-security: max-age=31536000; includeSubDomains
```

### 3. Authentication

```bash
# Test protected endpoint
curl https://geargrab.co/api/bookings

# Expected response:
# HTTP 401 Unauthorized
# {"error":"Authentication required","code":"AUTHENTICATION_ERROR"}
```

### 4. Rate Limiting

```bash
# Test rate limiting (make multiple rapid requests)
for i in {1..10}; do
  curl -s -o /dev/null -w "Request $i: %{http_code}\n" https://geargrab.co/api/health
done

# Should eventually return 429 Too Many Requests
```

## 📊 Monitoring & Alerts

### Set Up Monitoring

1. **Cloud Run Metrics**:
   - Go to Cloud Console > Cloud Run > geargrab-app > Metrics
   - Monitor request count, latency, and error rate

2. **Health Check Monitoring**:
   ```bash
   # Set up uptime check
   gcloud monitoring uptime-checks create \
     --display-name="GearGrab Health Check" \
     --http-check-path="/api/health" \
     --hostname="geargrab.co" \
     --port=443 \
     --use-ssl
   ```

3. **Log Monitoring**:
   ```bash
   # View logs
   gcloud logs read "resource.type=cloud_run_revision AND resource.labels.service_name=geargrab-app" --limit 50
   ```

### Set Up Alerts

1. **Error Rate Alert**:
   - Alert when error rate > 5%
   - Notification via email/Slack

2. **Response Time Alert**:
   - Alert when 95th percentile > 2 seconds
   - Notification via email/Slack

3. **Health Check Alert**:
   - Alert when health check fails
   - Immediate notification

## 🔒 Security Monitoring

### Security Logs

Monitor these security events:
- Authentication failures
- Rate limit violations
- Input validation errors
- Payment processing errors

### Security Alerts

Set up alerts for:
- Unusual authentication patterns
- High error rates
- Rate limit violations
- Payment fraud attempts

## 🛠️ Troubleshooting

### Common Issues

1. **Environment Variables Not Set**:
   ```bash
   # Check current environment variables
   gcloud run services describe geargrab-app --region us-central1 --format="value(spec.template.spec.template.spec.containers[0].env[].name,spec.template.spec.template.spec.containers[0].env[].value)"
   ```

2. **Firebase Connection Issues**:
   - Verify Firebase project ID
   - Check service account permissions
   - Validate private key format

3. **Domain Mapping Issues**:
   ```bash
   # Check domain mapping status
   gcloud run domain-mappings list --region us-central1
   ```

4. **SSL Certificate Issues**:
   - Wait for DNS propagation
   - Check domain ownership verification
   - Verify CNAME records

### Debug Commands

```bash
# View service details
gcloud run services describe geargrab-app --region us-central1

# View recent logs
gcloud logs read "resource.type=cloud_run_revision" --limit 100

# Check service URL
gcloud run services list --filter="metadata.name=geargrab-app"
```

## 📈 Performance Optimization

### Scaling Configuration

Current configuration:
- **Memory**: 1Gi
- **CPU**: 2 vCPU
- **Min instances**: 0 (cost-effective)
- **Max instances**: 10
- **Timeout**: 300 seconds

### Optimization Tips

1. **Monitor resource usage** and adjust memory/CPU as needed
2. **Set min instances to 1** if cold starts are an issue
3. **Enable CPU throttling** for cost optimization
4. **Use Cloud CDN** for static assets

## 🎯 Success Criteria

Deployment is successful when:
- ✅ Service responds at https://geargrab.co and https://www.geargrab.co
- ✅ Health check returns "healthy" status
- ✅ Security headers are present
- ✅ Authentication is working
- ✅ Rate limiting is active
- ✅ SSL certificates are valid
- ✅ All functionality works as expected

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Cloud Run logs
3. Verify environment variables
4. Check DNS configuration
5. Contact support if needed

---

**🎉 Congratulations!** Your security-enhanced GearGrab application is now running in production with enterprise-level security features.
