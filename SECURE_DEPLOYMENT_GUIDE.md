# 🔐 Secure GearGrab Deployment Guide

## 🚀 Quick Deployment (3 Steps)

### **Step 1: Set Up Your Secrets**
```bash
# Copy the template
cp scripts/env-template.sh scripts/env-secrets.sh

# Edit with your actual keys (use your preferred editor)
nano scripts/env-secrets.sh
# OR
code scripts/env-secrets.sh
```

**Fill in your actual values:**
- Stripe live publishable key (`pk_live_...`)
- Stripe live secret key (`sk_live_...`)
- Stripe webhook secret (`whsec_...`)
- Firebase admin credentials
- Other API keys

### **Step 2: Deploy Everything**
```bash
# Make sure you're authenticated with Google Cloud
gcloud auth login

# Run the complete deployment
./scripts/deploy-all.sh
```

### **Step 3: Configure DNS**
After deployment, configure DNS records for geargrab.co:
- **A record**: `@` → `[IP from deployment output]`
- **CNAME record**: `www` → `ghs.googlehosted.com`

## 📋 Individual Scripts (If You Prefer Step-by-Step)

### **1. Authentication & Setup**
```bash
./scripts/01-setup-auth.sh
```

### **2. Build & Deploy**
```bash
./scripts/02-build-deploy.sh
```

### **3. Configure Firebase**
```bash
./scripts/03-set-firebase-env.sh
```

### **4. Configure Stripe**
```bash
./scripts/04-set-stripe-env.sh
```

### **5. Configure Domain**
```bash
./scripts/05-configure-domain.sh
```

### **6. Verify Deployment**
```bash
./scripts/06-verify-deployment.sh
```

## 🔐 Security Features

### **Secrets Management**
- ✅ **No secrets in code** - All credentials in separate file
- ✅ **Template-based** - Easy to set up without exposing keys
- ✅ **Gitignore protected** - `env-secrets.sh` won't be committed
- ✅ **Environment variables** - Secure Cloud Run configuration

### **What's Protected**
- Stripe live API keys
- Firebase admin credentials
- Webhook secrets
- Third-party API keys

## 🧪 Testing After Deployment

### **Basic Tests**
```bash
# Test site accessibility
curl -I https://geargrab.co

# Check service status
gcloud run services describe geargrab --region us-central1
```

### **Payment Flow Tests**
1. **Register/Login** at https://geargrab.co
2. **Browse gear** and select an item
3. **Test payment** with Stripe test cards:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`

## 📊 Monitoring

### **View Logs**
```bash
# Application logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=geargrab" --limit 50

# Error logs only
gcloud logging read "resource.type=cloud_run_revision AND severity>=ERROR" --limit 20
```

### **Service Health**
```bash
# Service details
gcloud run services describe geargrab --region us-central1

# Domain mapping status
gcloud run domain-mappings describe geargrab.co --region us-central1
```

## 🔧 Stripe Webhook Setup

After deployment, configure Stripe webhook:

1. **Go to**: [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. **Add endpoint**: `https://geargrab.co/api/webhooks/stripe`
3. **Select events**:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
4. **Copy webhook secret** and update your `env-secrets.sh`
5. **Re-run**: `./scripts/04-set-stripe-env.sh`

## 🚨 Troubleshooting

### **Common Issues**

**"env-secrets.sh not found"**
- Copy `scripts/env-template.sh` to `scripts/env-secrets.sh`
- Fill in your actual API keys

**"Authentication required"**
- Run `gcloud auth login`
- Verify project: `gcloud config get-value project`

**"Domain mapping failed"**
- May already exist (this is OK)
- Check: `gcloud run domain-mappings list`

**"Site not loading"**
- DNS may still be propagating (can take up to 48 hours)
- Test Cloud Run URL first (from deployment output)

### **Rollback**
```bash
# List revisions
gcloud run revisions list --service=geargrab --region=us-central1

# Rollback to previous
gcloud run services update-traffic geargrab --to-revisions REVISION-NAME=100 --region us-central1
```

## ✅ **Success Checklist**

- [ ] `env-secrets.sh` created with real keys
- [ ] All deployment scripts completed successfully
- [ ] Site loads at https://geargrab.co
- [ ] User registration/login works
- [ ] Payment flow works with test cards
- [ ] Webhooks configured in Stripe
- [ ] DNS records configured
- [ ] No errors in logs

## 🎉 **You're Live!**

Once all steps are complete, GearGrab is live and ready for real customers! 🚀

**Monitor the deployment and enjoy your live gear rental platform!**
