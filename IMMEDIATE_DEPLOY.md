# 🚀 IMMEDIATE DEPLOYMENT INSTRUCTIONS

## ✅ **STATUS: READY TO DEPLOY**
- ✅ Code pushed to GitHub
- ✅ Database created in Supabase  
- ✅ GitHub Actions workflow created
- ✅ Docker configuration ready

## 🔑 **REQUIRED: Configure GitHub Secrets**

**Go to:** https://github.com/Faitltd/geargrab/settings/secrets/actions

**Add these secrets (MINIMUM REQUIRED):**

### 1. Google Cloud Service Account
**Secret Name:** `GCP_SA_KEY`
**Value:** Your Google Cloud service account JSON key

**How to get it:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select project `geargrabco`
3. Go to IAM & Admin → Service Accounts
4. Create service account with roles: Cloud Run Admin, Cloud Build Editor, Storage Admin
5. Create JSON key and copy entire content

### 2. Database Connection
**Secret Name:** `SUPABASE_PASSWORD`
**Value:** Your Supabase database password

**How to get it:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/absmquyhavntfoojvskl/settings/database)
2. Copy your database password (or reset it)

### 3. Firebase Configuration (Use placeholder values for now)
**Secret Name:** `VITE_FIREBASE_API_KEY`
**Value:** `demo-api-key`

**Secret Name:** `VITE_FIREBASE_AUTH_DOMAIN`
**Value:** `geargrabco.firebaseapp.com`

**Secret Name:** `VITE_FIREBASE_PROJECT_ID`
**Value:** `geargrabco`

**Secret Name:** `VITE_FIREBASE_STORAGE_BUCKET`
**Value:** `geargrabco.appspot.com`

**Secret Name:** `VITE_FIREBASE_MESSAGING_SENDER_ID`
**Value:** `123456789`

**Secret Name:** `VITE_FIREBASE_APP_ID`
**Value:** `1:123456789:web:demo`

**Secret Name:** `VITE_FIREBASE_MEASUREMENT_ID`
**Value:** `G-DEMO123`

**Secret Name:** `FIREBASE_PROJECT_ID`
**Value:** `geargrabco`

**Secret Name:** `FIREBASE_ADMIN_CLIENT_EMAIL`
**Value:** `firebase-adminsdk@geargrabco.iam.gserviceaccount.com`

**Secret Name:** `FIREBASE_ADMIN_PRIVATE_KEY`
**Value:** `demo-private-key`

## 🚀 **DEPLOY NOW**

After adding the secrets above:

### Option 1: Automatic Deployment
The GitHub Actions workflow will automatically deploy when you push to main.

### Option 2: Manual Trigger
1. Go to: https://github.com/Faitltd/geargrab/actions
2. Click "Deploy GearGrab to Cloud Run"
3. Click "Run workflow"
4. Click "Run workflow" button

## 🌐 **DNS Configuration**

After deployment succeeds, configure these DNS records:

**For geargrab.co:**
- Type: A
- Name: @
- Value: [IP from deployment output]

**For www.geargrab.co:**
- Type: CNAME
- Name: www
- Value: [CNAME from deployment output]

## 🧪 **Test After Deployment**

1. **Direct Cloud Run URL:** Check GitHub Actions output
2. **Comment API:** `https://[cloud-run-url]/api/comments?articleId=article_001`
3. **Production URLs:** `https://geargrab.co` (after DNS)

## ⚡ **Quick Start (5 minutes)**

1. **Add GCP_SA_KEY secret** (most important)
2. **Add SUPABASE_PASSWORD secret**
3. **Add Firebase secrets** (use placeholder values above)
4. **Trigger deployment** from GitHub Actions
5. **Configure DNS** with provided records

**Your site will be live at geargrab.co and www.geargrab.co!**

---

## 🔧 **Alternative: Local Deployment**

If you prefer to deploy locally:

```bash
git clone https://github.com/Faitltd/geargrab.git
cd geargrab
export SUPABASE_PASSWORD="your_password"
./quick-deploy.sh
```

---

**Database is ready with sample data. Comment system will work immediately after deployment!**
