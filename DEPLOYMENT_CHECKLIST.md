# GearGrab Production Deployment Checklist

## 🚀 Pre-Deployment Requirements

### 1. Database Setup
- [ ] **PostgreSQL Database**: Set up Cloud SQL PostgreSQL instance or external database
- [ ] **Database URL**: Obtain connection string in format: `postgresql://user:password@host:port/database`
- [ ] **Database Migration**: Run Prisma migrations on production database

### 2. Environment Variables
Configure the following environment variables in Google Cloud Run:

#### Required Variables:
```bash
# Database
DATABASE_URL="postgresql://user:password@host:port/geargrab"

# Firebase Configuration
VITE_FIREBASE_API_KEY="your-api-key"
VITE_FIREBASE_AUTH_DOMAIN="geargrabco.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="geargrabco"
VITE_FIREBASE_STORAGE_BUCKET="geargrabco.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
VITE_FIREBASE_APP_ID="your-app-id"
VITE_FIREBASE_MEASUREMENT_ID="your-measurement-id"

# Firebase Admin (Server-side)
FIREBASE_PROJECT_ID="geargrabco"
FIREBASE_ADMIN_CLIENT_EMAIL="firebase-adminsdk@geargrabco.iam.gserviceaccount.com"
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Application
NODE_ENV="production"
PORT="8080"
```

### 3. Google Cloud Setup
- [ ] **Project ID**: Ensure project ID is `geargrabco`
- [ ] **APIs Enabled**: Cloud Build, Cloud Run, Cloud SQL Admin
- [ ] **Service Account**: Configure with necessary permissions
- [ ] **Billing**: Ensure billing is enabled

### 4. Domain Configuration
- [ ] **Domain Ownership**: Verify ownership of geargrab.co
- [ ] **DNS Access**: Ensure you can modify DNS records

## 📋 Deployment Steps

### Step 1: Database Setup

#### Option A: Cloud SQL (Recommended)
```bash
# Create Cloud SQL PostgreSQL instance
gcloud sql instances create geargrab-db \
    --database-version=POSTGRES_15 \
    --tier=db-f1-micro \
    --region=us-central1 \
    --storage-type=SSD \
    --storage-size=10GB

# Create database
gcloud sql databases create geargrab --instance=geargrab-db

# Create user
gcloud sql users create geargrab-user \
    --instance=geargrab-db \
    --password=YOUR_SECURE_PASSWORD
```

#### Option B: External Database
- Set up PostgreSQL on your preferred provider
- Ensure it's accessible from Google Cloud Run
- Note the connection details

### Step 2: Environment Variables Setup
```bash
# Set environment variables in Cloud Run (will be done during deployment)
# These are configured in the cloudbuild.yaml file
```

### Step 3: Deploy to Cloud Run
```bash
# Run the deployment script
./scripts/deploy.sh
```

### Step 4: Database Migration
```bash
# After deployment, run migrations
# This needs to be done manually or via Cloud Build
npx prisma migrate deploy
npx prisma db seed  # Optional: seed with initial data
```

### Step 5: Domain Configuration

#### DNS Records to Configure:
1. **A Record for geargrab.co**:
   - Type: A
   - Name: @
   - Value: [IP from Cloud Run domain mapping]

2. **CNAME Record for www.geargrab.co**:
   - Type: CNAME
   - Name: www
   - Value: [CNAME from Cloud Run domain mapping]

## 🔧 Manual Configuration Steps

### 1. Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select project `geargrabco`
3. Navigate to Cloud Run
4. Configure environment variables
5. Set up domain mappings

### 2. Firebase Console Setup
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project `GearGrabCO`
3. Add domain `geargrab.co` to authorized domains
4. Configure authentication settings

### 3. Database Migration
```bash
# Connect to your database and run:
npx prisma migrate deploy
node scripts/init-database.js
```

## 🧪 Testing Checklist

### Pre-Production Testing
- [ ] **Local Testing**: All features work locally
- [ ] **Database Connection**: Can connect to production database
- [ ] **Environment Variables**: All variables are set correctly
- [ ] **Firebase Integration**: Authentication works
- [ ] **API Endpoints**: All endpoints respond correctly

### Post-Deployment Testing
- [ ] **Health Check**: Service responds at Cloud Run URL
- [ ] **Database**: Can read/write to database
- [ ] **Comments System**: Can create and fetch comments
- [ ] **Authentication**: Login/logout works
- [ ] **Domain Access**: Site loads at geargrab.co and www.geargrab.co
- [ ] **SSL Certificate**: HTTPS works correctly

## 🚨 Troubleshooting

### Common Issues:

1. **Database Connection Errors**:
   - Check DATABASE_URL format
   - Verify database is accessible from Cloud Run
   - Check firewall rules

2. **Build Failures**:
   - Check Dockerfile syntax
   - Verify all dependencies are installed
   - Check Cloud Build logs

3. **Domain Mapping Issues**:
   - Verify domain ownership
   - Check DNS propagation (can take up to 48 hours)
   - Ensure SSL certificate is provisioned

4. **Environment Variable Issues**:
   - Check variable names and values
   - Verify Firebase configuration
   - Test with Cloud Run direct URL first

## 📞 Support

If you encounter issues:
1. Check Cloud Build logs in Google Cloud Console
2. Check Cloud Run logs for runtime errors
3. Verify all environment variables are set
4. Test individual components (database, Firebase, etc.)

## 🔄 Rollback Plan

If deployment fails:
1. Previous version remains active until new deployment succeeds
2. Can rollback via Cloud Run console
3. Database migrations may need manual rollback

## 📈 Monitoring

After deployment, monitor:
- Cloud Run metrics (requests, latency, errors)
- Database performance
- Application logs
- User feedback

---

**Next Steps**: Follow this checklist step by step to ensure a successful deployment to production.
