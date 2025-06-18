# 🚀 GearGrab Deployment Instructions

## ✅ Current Status
- ✅ **Code Pushed to GitHub**: All Product Catalog service code is now in the main branch
- ✅ **Build Successful**: Application builds without errors
- ✅ **Clean Architecture**: Complete CRUD operations with clean architecture principles
- ✅ **Deployment Scripts**: Ready-to-use deployment scripts available

## 🎯 Quick Deployment Options

### Option 1: One-Command Deployment (Recommended)

If you have gcloud CLI installed and authenticated:

```bash
# Clone the repository (if not already done)
git clone https://github.com/Faitltd/geargrab.git
cd geargrab

# Run the quick deployment script
chmod +x quick-deploy-geargrab.sh
./quick-deploy-geargrab.sh
```

### Option 2: Manual Cloud Console Deployment

1. **Go to Google Cloud Console**: https://console.cloud.google.com
2. **Select Project**: `geargrabco`
3. **Open Cloud Build**: Navigation → Cloud Build → Triggers
4. **Create Trigger**:
   - Name: `deploy-geargrab`
   - Event: Push to branch
   - Source: `Faitltd/geargrab` (main branch)
   - Configuration: Cloud Build configuration file
   - Location: `cloudbuild.yaml`

5. **Set Substitution Variables**:
   - `_FIREBASE_PROJECT_ID`: `geargrabco`
   - `_SESSION_SECRET`: Generate with `openssl rand -base64 32`
   - `_STRIPE_SECRET_KEY`: Your Stripe secret key
   - `_STRIPE_WEBHOOK_SECRET`: Your Stripe webhook secret
   - `_FIREBASE_ADMIN_CLIENT_EMAIL`: Your Firebase service account email
   - `_FIREBASE_ADMIN_PRIVATE_KEY`: Your Firebase private key

6. **Run Trigger**: Click "Run trigger" to deploy

### Option 3: GitHub Actions (Future)

The repository includes GitHub Actions workflow configuration, but requires:
- GitHub repository secrets configuration
- Service account key setup

## 🔧 Environment Variables Needed

### Required for Production:
```bash
# Firebase Configuration
FIREBASE_PROJECT_ID=geargrabco
FIREBASE_ADMIN_CLIENT_EMAIL=your-service-account@geargrabco.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Security
SESSION_SECRET=your-32-character-secret-key

# Stripe (if using payments)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Application
NODE_ENV=production
CORS_ORIGINS=https://geargrab.co,https://www.geargrab.co
```

### Optional:
```bash
# Logging and Monitoring
LOG_LEVEL=info
RATE_LIMITING_ENABLED=true

# Database (if using Supabase)
DATABASE_URL=postgresql://postgres:password@db.absmquyhavntfoojvskl.supabase.co:5432/postgres
```

## 🌐 Domain Configuration

After deployment, configure these DNS records with your domain provider:

### For geargrab.co:
- **Type**: A Record
- **Name**: @ (or leave blank)
- **Value**: Get from Cloud Run domain mapping

### For www.geargrab.co:
- **Type**: CNAME
- **Name**: www
- **Value**: Get from Cloud Run domain mapping

### Get DNS Values:
```bash
# After deployment, run these commands to get DNS values:
gcloud run domain-mappings describe geargrab.co --region=us-central1 --format="value(status.resourceRecords[0].rrdata)"
gcloud run domain-mappings describe www.geargrab.co --region=us-central1 --format="value(status.resourceRecords[0].rrdata)"
```

## 📊 What's Deployed

### Product Catalog Service Features:
- ✅ **Complete CRUD Operations**: Create, Read, Update, Delete products
- ✅ **Advanced Search & Filtering**: Category, price range, tags, text search
- ✅ **Inventory Management**: Quantity tracking, reservations, availability
- ✅ **Business Rule Validation**: Price rules, status transitions, authorization
- ✅ **SEO-Friendly URLs**: Automatic slug generation and management
- ✅ **Clean Architecture**: Domain, Application, Infrastructure, Presentation layers
- ✅ **Error Handling**: Comprehensive error types with proper HTTP status codes
- ✅ **Data Validation**: Input validation at multiple architectural layers
- ✅ **Authorization**: Role-based access control and ownership validation

### API Endpoints Available:
```
GET    /api/products              # List/search products
POST   /api/products              # Create product
GET    /api/products/{id}         # Get product by ID
PUT    /api/products/{id}         # Update product
DELETE /api/products/{id}         # Delete product
GET    /api/products/featured     # Get featured products
GET    /api/products/recent       # Get recent products
```

### Architecture Layers:
```
📁 src/lib/
├── 🎯 domain/                    # Business logic and rules
│   ├── entities/Product.ts       # Product entity with business rules
│   ├── repositories/             # Repository interfaces
│   └── services/                 # Domain services
├── 🏗️ infrastructure/            # Data access and external services
│   ├── repositories/             # Firestore implementations
│   └── database/                 # Data mappers
├── 🎮 application/               # Use cases and DTOs
│   ├── usecases/                 # Business use cases
│   └── dto/                      # Data transfer objects
├── 🌐 presentation/              # API controllers and validation
└── 🔧 container/                 # Dependency injection
```

## 🧪 Testing the Deployment

After deployment, test these endpoints:

```bash
# Get the service URL
SERVICE_URL="https://geargrab-app-[random].a.run.app"

# Test health check
curl "$SERVICE_URL/"

# Test product listing
curl "$SERVICE_URL/api/products"

# Test product creation (requires authentication)
curl -X POST "$SERVICE_URL/api/products" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Test Product",
    "description": "A test product for the catalog",
    "category": "outdoor_gear",
    "price": {
      "dailyRate": 25,
      "securityDeposit": 100,
      "currency": "USD"
    },
    "inventory": {
      "quantity": 5,
      "reserved": 0,
      "trackInventory": true,
      "allowBackorder": false
    },
    "images": ["https://example.com/image.jpg"],
    "tags": ["test", "outdoor"],
    "specifications": {"material": "aluminum"},
    "seo": {
      "metaTitle": "Test Product",
      "keywords": ["test", "product"]
    }
  }'
```

## 🔒 Security Features

The deployed application includes:
- ✅ **Firebase Authentication**: Real user authentication
- ✅ **Rate Limiting**: API rate limiting to prevent abuse
- ✅ **Input Validation**: Comprehensive input validation and sanitization
- ✅ **CORS Protection**: Configured for geargrab.co domains only
- ✅ **Security Headers**: CSP, HSTS, X-Frame-Options, etc.
- ✅ **Business Rule Enforcement**: Domain-level business rule validation
- ✅ **Authorization Checks**: Role-based access control

## 🎉 Expected Results

After successful deployment:
- ✅ **Immediate**: Cloud Run service live at direct URL
- ✅ **1-2 hours**: geargrab.co and www.geargrab.co accessible (DNS propagation)
- ✅ **24 hours**: SSL certificates fully provisioned
- ✅ **Product Catalog**: Full CRUD operations available via API
- ✅ **Clean Architecture**: Maintainable and testable codebase
- ✅ **Production Ready**: Security, monitoring, and error handling

## 🚨 Troubleshooting

### Common Issues:
1. **Authentication Errors**: Ensure Firebase credentials are correctly set
2. **Build Failures**: Check that all dependencies are properly installed
3. **Domain Mapping**: DNS propagation can take up to 48 hours
4. **CORS Errors**: Verify CORS_ORIGINS environment variable is set correctly

### Support:
- Check Cloud Build logs in Google Cloud Console
- Review Cloud Run service logs for runtime errors
- Verify environment variables are properly set
- Test API endpoints with proper authentication headers

Your complete GearGrab Product Catalog service is now ready for production! 🎊
