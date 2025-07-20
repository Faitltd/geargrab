# 🚀 GearGrab Local Development Setup

This guide will help you set up GearGrab for local development on your machine.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Git** - [Download here](https://git-scm.com/)
- **Firebase CLI** (optional) - `npm install -g firebase-tools`

## 🔧 Quick Start

### 1. Clone and Install Dependencies

```bash
# Clone the repository (if not already done)
git clone <repository-url>
cd GearGrab

# Install dependencies
npm install
```

### 2. Environment Configuration

```bash
# Copy the environment template
cp .env.example .env

# Edit the .env file with your configuration
nano .env  # or use your preferred editor
```

### 3. Firebase Setup

#### Option A: Use Existing Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project or create a new one
3. Get your configuration values:

**Public Configuration (Project Settings > General):**
```
PUBLIC_FIREBASE_API_KEY=your-api-key
PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
PUBLIC_FIREBASE_PROJECT_ID=your-project-id
PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

**Service Account (Project Settings > Service Accounts):**
1. Click "Generate new private key"
2. Download the JSON file
3. Copy the values to your .env:
```
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----"
```

#### Option B: Quick Development Setup
For quick local development, you can use Firebase emulators:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase (if not already done)
firebase init

# Start emulators
firebase emulators:start
```

### 4. Stripe Setup (Optional)

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Get your test API keys from Developers > API Keys
3. Add to your .env:
```
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

### 5. Launch the Application

```bash
# Start the development server
npm run dev

# The app will be available at:
# http://localhost:5173
```

## 🎯 Development Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test

# Open Cypress test runner
npm run test:open

# Type checking
npm run check

# Linting
npm run lint
npm run lint:fix

# Formatting
npm run format
npm run format:check
```

## 🔍 Troubleshooting

### Common Issues

#### 1. **Dependencies Installation Fails**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

#### 2. **Firebase Connection Issues**
- Verify your Firebase project ID is correct
- Check that your service account key is properly formatted
- Ensure Firebase Authentication and Firestore are enabled

#### 3. **Port Already in Use**
```bash
# Use a different port
PORT=3001 npm run dev
```

#### 4. **Environment Variables Not Loading**
- Ensure your .env file is in the project root
- Restart the development server after changing .env
- Check that variable names match exactly (case-sensitive)

### 5. **Build Errors**
```bash
# Clear SvelteKit cache
rm -rf .svelte-kit
npm run dev
```

## 🧪 Testing Setup

### Running Tests Locally

```bash
# Install test dependencies (if not already installed)
npm install

# Run all tests headlessly
npm run test

# Open Cypress test runner (interactive)
npm run test:open

# Run specific test suite
npx cypress run --spec "cypress/e2e/auth/**/*"

# Run tests with coverage
npm run test:coverage
```

### Test Configuration

The test suite includes:
- **Authentication tests** - User registration, login, logout
- **Listing management** - CRUD operations, search, filters
- **Rental flow** - Booking process, payments
- **Admin panel** - User management, disputes

## 🔒 Security Notes

### Development vs Production

- **Development**: HTTPS enforcement is disabled, rate limiting is relaxed
- **Production**: Full security measures are enabled

### Environment Variables

- Never commit your `.env` file to version control
- Use different Firebase projects for development and production
- Use Stripe test keys for development

## 📱 Mobile Development

To test on mobile devices:

```bash
# Find your local IP address
ipconfig getifaddr en0  # macOS
ip route get 1 | awk '{print $7}'  # Linux

# Start dev server on all interfaces
npm run dev -- --host 0.0.0.0

# Access from mobile device
# http://YOUR_LOCAL_IP:5173
```

## 🚀 Production Deployment

When ready to deploy:

```bash
# Build for production
npm run build

# Test production build locally
npm run preview

# Deploy to your hosting platform
# (See deploy/ directory for deployment scripts)
```

## 📚 Additional Resources

- [SvelteKit Documentation](https://kit.svelte.dev/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Cypress Documentation](https://docs.cypress.io/)

## 🆘 Getting Help

If you encounter issues:

1. Check the troubleshooting section above
2. Review the console logs for error messages
3. Check the Firebase Console for authentication/database issues
4. Verify your environment variables are correctly set

## 🎉 You're Ready!

Once you've completed the setup, you should have:

- ✅ GearGrab running locally at http://localhost:5173
- ✅ Firebase authentication and database connected
- ✅ Stripe payment processing (if configured)
- ✅ Test suite ready to run
- ✅ Development tools configured

Happy coding! 🚀
