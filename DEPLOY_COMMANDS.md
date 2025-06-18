# 🚀 DEPLOY GEARGRAB NOW - Copy & Paste Commands

## ⚡ **OPTION 1: Automated GitHub Actions (Recommended)**

### Step 1: Add the GitHub Workflow
```bash
# Create the workflow directory and file
mkdir -p .github/workflows
cp deploy-workflow.yml .github/workflows/deploy.yml
git add .github/workflows/deploy.yml
git commit -m "Add automated deployment workflow"
git push origin main
```

### Step 2: Configure GitHub Secrets
Go to: https://github.com/Faitltd/geargrab/settings/secrets/actions

Add these secrets:

**GCP_SA_KEY**: Your Google Cloud service account JSON key
**DATABASE_URL**: `postgresql://postgres:YOUR_SUPABASE_PASSWORD@db.absmquyhavntfoojvskl.supabase.co:5432/postgres`

**Firebase Secrets** (get from Firebase Console):
- VITE_FIREBASE_API_KEY
- VITE_FIREBASE_AUTH_DOMAIN  
- VITE_FIREBASE_PROJECT_ID
- VITE_FIREBASE_STORAGE_BUCKET
- VITE_FIREBASE_MESSAGING_SENDER_ID
- VITE_FIREBASE_APP_ID
- VITE_FIREBASE_MEASUREMENT_ID
- FIREBASE_PROJECT_ID
- FIREBASE_ADMIN_CLIENT_EMAIL
- FIREBASE_ADMIN_PRIVATE_KEY

### Step 3: Trigger Deployment
```bash
# Push any change to trigger deployment
git commit --allow-empty -m "Trigger deployment"
git push origin main
```

---

## ⚡ **OPTION 2: Manual Deployment (Immediate)**

### Prerequisites
```bash
# Install gcloud CLI if not installed
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init
```

### Step 1: Set Environment Variables
```bash
# Set your Supabase password
export SUPABASE_PASSWORD="your_supabase_password"

# Set your project
export PROJECT_ID="geargrabco"
export REGION="us-central1"
export SERVICE_NAME="geargrab-app"

# Database URL
export DATABASE_URL="postgresql://postgres:$SUPABASE_PASSWORD@db.absmquyhavntfoojvskl.supabase.co:5432/postgres"
```

### Step 2: Authenticate and Enable APIs
```bash
# Authenticate
gcloud auth login
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
```

### Step 3: Deploy Using Cloud Build
```bash
# Clone and enter the repository
git clone https://github.com/Faitltd/geargrab.git
cd geargrab

# Deploy using Cloud Build
gcloud builds submit --config cloudbuild.yaml \
    --substitutions=_DATABASE_URL="$DATABASE_URL",_FIREBASE_PROJECT_ID="geargrabco",_FIREBASE_ADMIN_CLIENT_EMAIL="your-firebase-email",_FIREBASE_ADMIN_PRIVATE_KEY="your-firebase-key"
```

### Step 4: Set Up Domain Mapping
```bash
# Map geargrab.co
gcloud run domain-mappings create \
    --service=$SERVICE_NAME \
    --domain=geargrab.co \
    --region=$REGION

# Map www.geargrab.co
gcloud run domain-mappings create \
    --service=$SERVICE_NAME \
    --domain=www.geargrab.co \
    --region=$REGION
```

### Step 5: Get DNS Configuration
```bash
# Get the DNS records you need to configure
echo "Configure these DNS records with your domain provider:"

echo "A Record for geargrab.co:"
gcloud run domain-mappings describe --domain=geargrab.co --region=$REGION --format="value(status.resourceRecords[0].rrdata)"

echo "CNAME Record for www.geargrab.co:"
gcloud run domain-mappings describe --domain=www.geargrab.co --region=$REGION --format="value(status.resourceRecords[0].rrdata)"
```

---

## 🔧 **OPTION 3: One-Command Deploy Script**

```bash
# Make the script executable and run
chmod +x scripts/deploy.sh

# Set your Supabase password and run
export SUPABASE_PASSWORD="your_password"
./scripts/deploy.sh
```

---

## 🧪 **Verify Deployment**

After deployment, run:
```bash
# Check deployment status
./scripts/verify-deployment.sh

# Test the API
curl "https://geargrab-app-[random].a.run.app/api/comments?articleId=article_001"
```

---

## 🌐 **DNS Configuration**

After deployment, configure these DNS records with your domain provider:

### For geargrab.co:
- **Type**: A
- **Name**: @
- **Value**: [IP from domain mapping command]

### For www.geargrab.co:
- **Type**: CNAME
- **Name**: www  
- **Value**: [CNAME from domain mapping command]

---

## 🎯 **Expected Results**

✅ **Immediate**: Cloud Run service live at direct URL
✅ **1-2 hours**: geargrab.co and www.geargrab.co accessible (DNS propagation)
✅ **24 hours**: SSL certificates fully provisioned

## 🚨 **Quick Test URLs**

After deployment:
- **Health Check**: `https://[cloud-run-url]/`
- **Comment API**: `https://[cloud-run-url]/api/comments?articleId=article_001`
- **Sample Data**: Database has admin user and welcome article ready

---

## 💡 **Recommended Approach**

**For fastest deployment**: Use Option 2 (Manual) if you have gcloud CLI
**For automated future deployments**: Set up Option 1 (GitHub Actions)

Your GearGrab platform with the complete Prisma comment system will be live at geargrab.co and www.geargrab.co!
