# 🚀 GearGrab Installation Guide

This guide will help you set up the GearGrab project with all dependencies and testing frameworks.

## 📋 Prerequisites

- **Node.js** 18+ (recommended: 20+)
- **npm** 9+ or **yarn** 1.22+
- **Git** for version control
- **Python 3** (for serving documentation)

## 🔧 Installation Steps

### 1. **Clean Installation**

```bash
# Navigate to project directory
cd GearGrab

# Clear npm cache (if you had previous issues)
npm cache clean --force

# Remove node_modules and package-lock.json if they exist
rm -rf node_modules package-lock.json

# Install all dependencies
npm install
```

### 2. **Install Additional Testing Dependencies**

```bash
# Install Jest and testing dependencies
npm install --save-dev jest @types/jest ts-jest jest-environment-node

# Install Cypress for e2e testing
npm install --save-dev cypress @types/cypress

# Install authentication testing dependencies
npm install bcrypt jsonwebtoken @types/bcrypt @types/jsonwebtoken

# Install API documentation dependencies
npm install js-yaml
```

### 3. **Verify Installation**

```bash
# Check if all dependencies are installed correctly
npm list --depth=0

# Validate package.json
node scripts/fix-package-json.js

# Test that scripts work
npm run build
npm run dev
```

## 🧪 Testing Setup

### **Jest Unit Tests**

```bash
# Run Jest unit tests
npm run test:unit

# Run with coverage
npm run test:unit:coverage

# Run in watch mode
npm run test:unit:watch

# Run authentication tests specifically
node scripts/run-auth-tests.js jest --coverage
```

### **Cypress E2E Tests**

```bash
# Run Cypress tests headlessly
npm run test

# Open Cypress UI
npm run cypress:open

# Run authentication flow tests
node scripts/run-auth-tests.js cypress
```

### **All Tests**

```bash
# Run all Jest and Cypress tests
node scripts/run-auth-tests.js all

# Generate comprehensive test report
node scripts/run-auth-tests.js report
```

## 📚 API Documentation

### **Generate Documentation**

```bash
# Generate all API documentation
npm run docs:api

# Generate interactive documentation
npm run docs:api:interactive

# Generate Postman collection
npm run docs:api:postman

# Validate OpenAPI specification
npm run docs:api:validate
```

### **View Documentation**

```bash
# Serve documentation locally
npm run docs:api:serve

# Then open: http://localhost:8080
```

## 🔒 Security Setup

### **Firebase Configuration**

```bash
# Deploy security rules
chmod +x scripts/deploy-security-rules.sh
./scripts/deploy-security-rules.sh

# Test security rules
npm run security:test
```

### **Security Auditing**

```bash
# Run security audit
npm run security:audit

# Check for security issues
npm run lint:security

# Build with security checks
npm run build:secure
```

## 🚨 Troubleshooting

### **Common Issues**

#### **1. npm install fails with "Invalid Version"**
```bash
# Fix package.json issues
node scripts/fix-package-json.js

# Clear cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

#### **2. bcrypt installation issues (especially on Apple Silicon)**
```bash
# For Apple Silicon Macs
npm install bcrypt --build-from-source

# Alternative: use bcryptjs
npm uninstall bcrypt
npm install bcryptjs
```

#### **3. Cypress installation issues**
```bash
# Clear Cypress cache
npx cypress cache clear

# Reinstall Cypress
npm uninstall cypress
npm install --save-dev cypress
```

#### **4. TypeScript compilation errors**
```bash
# Check TypeScript configuration
npx tsc --noEmit

# Install missing type definitions
npm install --save-dev @types/node @types/express
```

#### **5. Firebase authentication issues**
```bash
# Login to Firebase
firebase login

# Set project
firebase use --add

# Deploy rules
firebase deploy --only firestore:rules
```

### **Environment Variables**

Create a `.env.local` file with required variables:

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# API Configuration
VITE_API_BASE_URL=http://localhost:5173/api/v1

# Security
JWT_SECRET=your_jwt_secret_key
BCRYPT_ROUNDS=12

# Stripe (for payments)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

## 📦 Available Scripts

### **Development**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### **Testing**
- `npm run test:unit` - Jest unit tests
- `npm run test:unit:coverage` - Jest with coverage
- `npm run test` - Cypress e2e tests
- `npm run cypress:open` - Open Cypress UI

### **Authentication Testing**
- `node scripts/run-auth-tests.js jest` - Jest auth tests
- `node scripts/run-auth-tests.js cypress` - Cypress auth tests
- `node scripts/run-auth-tests.js all` - All auth tests

### **API Documentation**
- `npm run docs:api` - Generate all docs
- `npm run docs:api:interactive` - Interactive docs
- `npm run docs:api:postman` - Postman collection
- `npm run docs:api:serve` - Serve docs locally

### **Security**
- `npm run security:test` - Security tests
- `npm run security:audit` - Security audit
- `npm run build:secure` - Secure build

## ✅ Verification Checklist

After installation, verify everything works:

- [ ] `npm install` completes without errors
- [ ] `npm run build` succeeds
- [ ] `npm run dev` starts development server
- [ ] `npm run test:unit` runs Jest tests
- [ ] `npm run docs:api` generates documentation
- [ ] `node scripts/fix-package-json.js` shows no issues
- [ ] Firebase authentication is configured
- [ ] Environment variables are set

## 🆘 Getting Help

If you encounter issues:

1. **Check the logs** - npm provides detailed error logs
2. **Clear caches** - `npm cache clean --force`
3. **Update Node.js** - Ensure you're using Node 18+
4. **Check GitHub Issues** - Look for similar problems
5. **Run diagnostics** - `node scripts/fix-package-json.js`

## 🎯 Next Steps

Once installation is complete:

1. **Start development server**: `npm run dev`
2. **Run tests**: `npm run test:unit`
3. **View API docs**: `npm run docs:api:serve`
4. **Set up Firebase**: Configure authentication
5. **Deploy security rules**: `./scripts/deploy-security-rules.sh`

You're now ready to develop with the GearGrab platform! 🎉
