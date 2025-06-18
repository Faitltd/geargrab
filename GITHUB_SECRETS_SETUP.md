# GitHub Secrets Setup for GearGrab Deployment

This guide will help you configure the necessary GitHub Secrets for automated deployment to Google Cloud Run.

## 🔐 Required GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret

### 1. Google Cloud Service Account Key
**Secret Name**: `GCP_SA_KEY`

**How to get this**:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project (`geargrabco`)
3. Navigate to IAM & Admin → Service Accounts
4. Create a new service account or use existing one
5. Grant the following roles:
   - Cloud Run Admin
   - Cloud Build Editor
   - Storage Admin
   - Service Account User
6. Create a JSON key for the service account
7. Copy the entire JSON content and paste it as the secret value

### 2. Database Configuration
**Secret Name**: `DATABASE_URL`
**Value**: `postgresql://username:password@host:port/database_name`

Example: `postgresql://geargrab_user:your_password@34.123.45.67:5432/geargrab`

### 3. Firebase Client Configuration
These are your Firebase web app configuration values:

**Secret Name**: `VITE_FIREBASE_API_KEY`
**Value**: Your Firebase API key

**Secret Name**: `VITE_FIREBASE_AUTH_DOMAIN`
**Value**: `geargrabco.firebaseapp.com` (or your actual auth domain)

**Secret Name**: `VITE_FIREBASE_PROJECT_ID`
**Value**: `geargrabco` (or your actual project ID)

**Secret Name**: `VITE_FIREBASE_STORAGE_BUCKET`
**Value**: `geargrabco.appspot.com` (or your actual storage bucket)

**Secret Name**: `VITE_FIREBASE_MESSAGING_SENDER_ID`
**Value**: Your messaging sender ID

**Secret Name**: `VITE_FIREBASE_APP_ID`
**Value**: Your Firebase app ID

**Secret Name**: `VITE_FIREBASE_MEASUREMENT_ID`
**Value**: Your Google Analytics measurement ID (optional)

### 4. Firebase Admin Configuration
These are for server-side Firebase operations:

**Secret Name**: `FIREBASE_PROJECT_ID`
**Value**: `geargrabco` (same as client project ID)

**Secret Name**: `FIREBASE_ADMIN_CLIENT_EMAIL`
**Value**: `firebase-adminsdk-xxxxx@geargrabco.iam.gserviceaccount.com`

**Secret Name**: `FIREBASE_ADMIN_PRIVATE_KEY`
**Value**: The private key from your Firebase service account (including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`)

## 📋 How to Find Firebase Configuration Values

### Client Configuration (Web App Config):
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to Project Settings (gear icon)
4. Scroll down to "Your apps" section
5. Select your web app or create one
6. Copy the config values from the Firebase SDK snippet

### Admin Configuration (Service Account):
1. In Firebase Console, go to Project Settings
2. Click on "Service accounts" tab
3. Click "Generate new private key"
4. Download the JSON file
5. Use the values from this JSON file:
   - `client_email` → `FIREBASE_ADMIN_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_ADMIN_PRIVATE_KEY`
   - `project_id` → `FIREBASE_PROJECT_ID`

## 🗄️ Database Setup Options

### Option 1: Google Cloud SQL (Recommended)
```bash
# Create PostgreSQL instance
gcloud sql instances create geargrab-db \
    --database-version=POSTGRES_15 \
    --tier=db-f1-micro \
    --region=us-central1

# Create database and user
gcloud sql databases create geargrab --instance=geargrab-db
gcloud sql users create geargrab_user --instance=geargrab-db --password=YOUR_SECURE_PASSWORD

# Get connection details
gcloud sql instances describe geargrab-db
```

### Option 2: External Database Provider
- **Supabase**: Create a PostgreSQL database
- **PlanetScale**: MySQL (requires schema changes)
- **Railway**: PostgreSQL
- **Neon**: PostgreSQL

## ✅ Verification Checklist

Before triggering deployment, ensure you have:

- [ ] **GCP_SA_KEY**: Valid service account JSON with proper permissions
- [ ] **DATABASE_URL**: Valid PostgreSQL connection string
- [ ] **Firebase Client Config**: All 7 VITE_FIREBASE_* secrets
- [ ] **Firebase Admin Config**: All 3 FIREBASE_* secrets
- [ ] **Database**: PostgreSQL database is created and accessible
- [ ] **Domain**: You own geargrab.co and can modify DNS records

## 🚀 Triggering Deployment

Once all secrets are configured:

1. **Automatic**: Push to main branch triggers deployment
2. **Manual**: Go to Actions tab → Deploy to Google Cloud Run → Run workflow

## 🔍 Monitoring Deployment

1. Go to GitHub Actions tab in your repository
2. Click on the running workflow
3. Monitor each step for any errors
4. Check Google Cloud Console for Cloud Run service status

## 🐛 Troubleshooting

### Common Issues:

1. **Invalid Service Account**: Ensure the service account has all required permissions
2. **Database Connection**: Test the DATABASE_URL format and accessibility
3. **Firebase Config**: Verify all Firebase values are correct
4. **Domain Verification**: Ensure you own the domains being mapped

### Getting Help:

1. Check GitHub Actions logs for specific error messages
2. Check Google Cloud Console logs
3. Verify each secret value individually
4. Test database connection separately

## 🔄 Next Steps After Deployment

1. **DNS Configuration**: Set up A and CNAME records as shown in deployment output
2. **Database Migration**: Run Prisma migrations on production database
3. **Testing**: Verify all functionality works on the deployed site
4. **Monitoring**: Set up monitoring and alerting

---

**Important**: Keep all secrets secure and never commit them to your repository. Use GitHub Secrets for all sensitive configuration values.
