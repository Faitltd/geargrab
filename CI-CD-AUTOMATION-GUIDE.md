# 🚀 GearGrab CI/CD Automation System

## 📋 **Overview**

Your comprehensive CI/CD automation system is now configured with safe deployment workflows, canary deployments, feature flags, and infrastructure as code.

## 🏗️ **Architecture**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Development   │    │     Staging     │    │   Production    │
│                 │    │                 │    │                 │
│ Feature Branch  │───▶│ Auto Deploy     │───▶│ Manual Promote  │
│ Pull Requests   │    │ Full Tests      │    │ Canary Deploy   │
│                 │    │ Auto Rollback   │    │ Traffic Split   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔄 **Workflows**

### 1. **Staging Deployment** (`.github/workflows/staging-deploy.yml`)

**Trigger**: Push to `staging` branch

**Process**:
- ✅ Checkout code and authenticate to GCP
- ✅ Build and push Docker image to `geargrabco-staging`
- ✅ Deploy to Cloud Run with 100% traffic
- ✅ Run comprehensive test suite:
  - Health checks
  - Integration tests (Comment API, Auth)
  - Performance tests (response time < 5s)
- ✅ Auto-rollback on any test failure
- ✅ Success/failure notifications

### 2. **Production Deployment** (`.github/workflows/production-deploy.yml`)

**Trigger**: Manual workflow dispatch

**Process**:
- ✅ Promote specific staging SHA to production
- ✅ Build and push to `geargrabco` project
- ✅ Deploy new revision with 0% traffic
- ✅ Canary deployment (10% traffic split)
- ✅ Monitor metrics for 5 minutes:
  - Health status (HTTP 200)
  - API functionality
  - Response time (< 3s)
  - 95% success rate threshold
- ✅ Auto-promote to 100% or rollback based on metrics

### 3. **Infrastructure Management** (`.github/workflows/terraform-deploy.yml`)

**Trigger**: Manual workflow dispatch

**Process**:
- ✅ Terraform plan/apply/destroy
- ✅ Environment-specific configurations
- ✅ Feature flag management
- ✅ Domain mappings and SSL certificates

## 🚩 **Feature Flags**

### **Management Script**: `scripts/manage-feature-flags.sh`

```bash
# List current flags
./scripts/manage-feature-flags.sh list staging
./scripts/manage-feature-flags.sh list production

# Enable/disable features
./scripts/manage-feature-flags.sh enable production FEATURE_PAYMENTS
./scripts/manage-feature-flags.sh disable staging FEATURE_ADMIN_PANEL

# Reset to defaults
./scripts/manage-feature-flags.sh reset staging
```

### **Available Flags**:
- `FEATURE_COMMENTS` - Comment system
- `FEATURE_PAYMENTS` - Payment processing
- `FEATURE_ADMIN_PANEL` - Admin functionality
- `FEATURE_ANALYTICS` - Analytics tracking
- `FEATURE_NOTIFICATIONS` - Push notifications
- `FEATURE_CHAT` - Real-time chat
- `FEATURE_REVIEWS` - Review system

### **Default Configuration**:

**Staging**:
- ✅ FEATURE_COMMENTS: true
- ❌ FEATURE_PAYMENTS: false
- ❌ FEATURE_ADMIN_PANEL: false
- ❌ FEATURE_ANALYTICS: false

**Production**:
- ✅ FEATURE_COMMENTS: true
- ✅ FEATURE_PAYMENTS: true
- ✅ FEATURE_ADMIN_PANEL: true
- ✅ FEATURE_ANALYTICS: true

## 🏗️ **Infrastructure as Code**

### **Terraform Structure**:
```
terraform/
├── main.tf                     # Main infrastructure
├── environments/
│   ├── staging.tfvars         # Staging config
│   └── production.tfvars      # Production config
```

### **Managed Resources**:
- ✅ Cloud Run services with auto-scaling
- ✅ IAM roles and service accounts
- ✅ Secret Manager integration
- ✅ Domain mappings and SSL certificates
- ✅ Environment-specific feature flags

## 🔐 **Required Secrets**

Configure these in GitHub repository settings:

### **Google Cloud**:
- `GCP_SA_KEY` - Service account JSON key

### **Database**:
- `DATABASE_URL` - Production database
- `DATABASE_URL_STAGING` - Staging database

### **Firebase** (9 secrets):
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_ADMIN_CLIENT_EMAIL`
- `FIREBASE_ADMIN_PRIVATE_KEY`

## 🚀 **Deployment Process**

### **1. Deploy to Staging**
```bash
# Create staging branch and push
git checkout -b staging
git push origin staging
```
**Result**: Automatic deployment to staging with full test suite

### **2. Promote to Production**
1. Go to GitHub Actions
2. Run "🌟 Production Deployment (Canary)"
3. Enter the staging SHA to promote
4. Monitor canary deployment
5. Automatic promotion or rollback

### **3. Manage Infrastructure**
```bash
# Plan infrastructure changes
# GitHub Actions → "🏗️ Terraform Infrastructure" → plan

# Apply infrastructure changes
# GitHub Actions → "🏗️ Terraform Infrastructure" → apply
```

## 📊 **Monitoring & Metrics**

### **Staging Tests**:
- Health check (HTTP 200)
- Comment API functionality
- Auth endpoint availability
- Performance (< 5s response time)

### **Production Canary**:
- Health status monitoring
- API functionality tests
- Response time (< 3s)
- 95% success rate threshold
- 5-minute monitoring window

### **Rollback Triggers**:
- Any test failure in staging
- < 95% success rate in production canary
- Response time > threshold
- API errors

## 🔧 **Usage Examples**

### **Deploy Feature to Staging**:
```bash
git checkout -b feature/new-payment-flow
# ... make changes ...
git commit -m "feat: add new payment flow"
git checkout staging
git merge feature/new-payment-flow
git push origin staging
# ✅ Auto-deploys to staging with tests
```

### **Promote to Production**:
1. Verify staging deployment successful
2. GitHub Actions → Production Deployment
3. Enter staging commit SHA
4. Monitor canary deployment
5. Automatic promotion if healthy

### **Toggle Feature Flag**:
```bash
# Enable payments in production
./scripts/manage-feature-flags.sh enable production FEATURE_PAYMENTS

# Disable admin panel in staging
./scripts/manage-feature-flags.sh disable staging FEATURE_ADMIN_PANEL
```

## 🎯 **Benefits**

✅ **Safe Deployments**: Automatic testing and rollback
✅ **Canary Releases**: Gradual traffic shifting with monitoring
✅ **Feature Flags**: Runtime feature control without deployments
✅ **Infrastructure as Code**: Versioned, reproducible infrastructure
✅ **Environment Parity**: Consistent staging and production
✅ **Automated Testing**: Comprehensive test coverage
✅ **Zero-Downtime**: Rolling deployments with health checks

## 🚨 **Emergency Procedures**

### **Manual Rollback**:
```bash
# Get previous revision
gcloud run revisions list --service=geargrab-app --region=us-central1

# Rollback to specific revision
gcloud run services update-traffic geargrab-app \
  --region=us-central1 \
  --to-revisions=REVISION_NAME=100
```

### **Disable Feature**:
```bash
# Quickly disable problematic feature
./scripts/manage-feature-flags.sh disable production FEATURE_NAME
```

---

**Your CI/CD automation system is now ready! Push to staging to see it in action.** 🚀
