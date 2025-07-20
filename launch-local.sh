#!/bin/bash

# GearGrab Local Launch Script
# This script sets up and launches GearGrab for local development

echo "🚀 Setting up GearGrab for local development..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18 or higher is required. Current version: $(node --version)"
    exit 1
fi

print_success "Node.js $(node --version) detected"

# Clean up previous installations
print_status "Cleaning up previous installations..."
rm -rf node_modules package-lock.json .svelte-kit

# Create minimal environment file if it doesn't exist
if [ ! -f .env ]; then
    print_status "Creating minimal .env file..."
    cat > .env << EOF
# GearGrab Development Environment
NODE_ENV=development
PORT=5173
HOST=localhost
PUBLIC_APP_URL=http://localhost:5173

# Firebase Configuration (Development - Replace with your values)
PUBLIC_FIREBASE_API_KEY=demo-api-key
PUBLIC_FIREBASE_AUTH_DOMAIN=demo-project.firebaseapp.com
PUBLIC_FIREBASE_PROJECT_ID=demo-project
PUBLIC_FIREBASE_STORAGE_BUCKET=demo-project.appspot.com
PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
PUBLIC_FIREBASE_APP_ID=1:123456789:web:demo123456

# Firebase Admin SDK (Development)
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-demo@demo-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nDEMO_PRIVATE_KEY\n-----END PRIVATE KEY-----"

# Stripe Configuration (Development)
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_demo_key
STRIPE_SECRET_KEY=sk_test_demo_key

# Security
SESSION_SECRET=dev-session-secret-change-in-production
EOF
    print_success "Created .env file with development defaults"
else
    print_success ".env file already exists"
fi

# Use simplified package.json for initial setup
print_status "Setting up simplified package.json..."
cp package-simple.json package.json

# Install dependencies
print_status "Installing dependencies..."
npm install --legacy-peer-deps

if [ $? -ne 0 ]; then
    print_error "Failed to install dependencies"
    exit 1
fi

print_success "Dependencies installed successfully"

# Create basic app.html if it doesn't exist
if [ ! -f src/app.html ]; then
    print_status "Creating basic app.html..."
    mkdir -p src
    cat > src/app.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<link rel="icon" href="%sveltekit.assets%/favicon.png" />
		<meta name="viewport" content="width=device-width" />
		%sveltekit.head%
	</head>
	<body data-sveltekit-preload-data="hover">
		<div style="display: contents">%sveltekit.body%</div>
	</body>
</html>
EOF
    print_success "Created basic app.html"
fi

# Create basic route if it doesn't exist
if [ ! -f src/routes/+page.svelte ]; then
    print_status "Creating basic home page..."
    mkdir -p src/routes
    cat > src/routes/+page.svelte << 'EOF'
<script>
  let name = 'GearGrab';
</script>

<svelte:head>
  <title>Welcome to {name}</title>
  <meta name="description" content="GearGrab - Your outdoor gear marketplace" />
</svelte:head>

<main class="container mx-auto px-4 py-8">
  <div class="text-center">
    <h1 class="text-4xl font-bold text-blue-600 mb-4">
      Welcome to {name}! 🎒
    </h1>
    
    <p class="text-xl text-gray-600 mb-8">
      Your outdoor gear marketplace is running locally
    </p>
    
    <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-8">
      <strong>Success!</strong> GearGrab is running in development mode.
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
      <div class="bg-white p-6 rounded-lg shadow-md">
        <h2 class="text-xl font-semibold mb-2">🔧 Development</h2>
        <p class="text-gray-600">
          You're running in development mode with hot reloading enabled.
        </p>
      </div>
      
      <div class="bg-white p-6 rounded-lg shadow-md">
        <h2 class="text-xl font-semibold mb-2">🔥 Firebase</h2>
        <p class="text-gray-600">
          Configure your Firebase project in the .env file to enable authentication.
        </p>
      </div>
      
      <div class="bg-white p-6 rounded-lg shadow-md">
        <h2 class="text-xl font-semibold mb-2">💳 Stripe</h2>
        <p class="text-gray-600">
          Add your Stripe test keys to enable payment processing.
        </p>
      </div>
    </div>
    
    <div class="mt-8">
      <a 
        href="/auth" 
        class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-4"
      >
        Authentication
      </a>
      <a 
        href="/listings" 
        class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
      >
        Listings
      </a>
    </div>
  </div>
</main>

<style>
  :global(body) {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    background-color: #f7fafc;
  }
  
  .container {
    max-width: 1200px;
  }
</style>
EOF
    print_success "Created basic home page"
fi

# Start the development server
print_success "🎉 Setup complete! Starting development server..."
print_status "GearGrab will be available at: http://localhost:5173"
print_warning "To configure Firebase and Stripe, edit the .env file with your actual credentials"

echo ""
echo "🚀 Launching GearGrab..."
echo "   Press Ctrl+C to stop the server"
echo ""

npm run dev
