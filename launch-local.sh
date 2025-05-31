#!/bin/bash

# Exit on error
set -e

echo "=== GearGrab SvelteKit Development Launcher ==="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed. Please install npm first."
    exit 1
fi

# Check SvelteKit version
SVELTEKIT_VERSION=$(grep -o '"@sveltejs/kit": "\^[0-9.]*"' package.json | grep -o '[0-9.]*')
echo "SvelteKit version: $SVELTEKIT_VERSION"

# Check if Firebase CLI is installed (optional for emulators)
if ! command -v firebase &> /dev/null; then
    echo "Warning: Firebase CLI is not installed. Firebase emulators will not be available."
    echo "To install: npm install -g firebase-tools"
    USE_EMULATORS=false
else
    read -p "Do you want to use Firebase emulators for local development? (y/n): " use_emulators
    if [[ $use_emulators =~ ^[Yy]$ ]]; then
        USE_EMULATORS=true
    else
        USE_EMULATORS=false
    fi
fi

# Install dependencies if node_modules doesn't exist or if requested
if [ ! -d "node_modules" ]; then
    echo "Node modules not found. Installing dependencies..."
    npm install
else
    read -p "Do you want to update dependencies? (y/n): " update_deps
    if [[ $update_deps =~ ^[Yy]$ ]]; then
        echo "Updating dependencies..."
        npm install
    fi
fi

# Run SvelteKit sync and check
echo "Running SvelteKit sync and type checking..."
npm run check

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating default .env file..."
    cat > .env << EOL
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# Environment
VITE_USE_EMULATORS=true
VITE_DEV_MODE=true
EOL
    echo "Created .env file with placeholder values. Please update with your actual Firebase configuration."
fi

# Start Firebase emulators if requested
if [ "$USE_EMULATORS" = true ]; then
    echo "Starting Firebase emulators..."
    
    # Check if firebase.json exists
    if [ ! -f "firebase.json" ]; then
        echo "Warning: firebase.json not found. Creating a basic configuration..."
        cat > firebase.json << EOL
{
  "emulators": {
    "auth": {
      "port": 9099
    },
    "firestore": {
      "port": 8080
    },
    "storage": {
      "port": 9199
    },
    "ui": {
      "enabled": true,
      "port": 4000
    }
  }
}
EOL
    fi
    
    # Run Firebase emulators in the background
    firebase emulators:start &
    EMULATOR_PID=$!
    
    # Give emulators time to start
    echo "Waiting for emulators to start..."
    sleep 5
    
    # Function to kill emulators on script exit
    function cleanup {
        echo "Stopping Firebase emulators..."
        kill $EMULATOR_PID 2>/dev/null || true
    }
    
    # Register the cleanup function to be called on exit
    trap cleanup EXIT
    
    # Set environment variables for emulators
    export VITE_USE_EMULATORS=true
    
    echo "Firebase emulators running at http://localhost:4000"
fi

# Check if Vite config exists
if [ ! -f "vite.config.js" ] && [ ! -f "vite.config.ts" ]; then
    echo "Warning: Vite configuration not found. SvelteKit might not work properly."
fi

# Start the development server with hot module replacement
echo "Starting SvelteKit development server..."
echo "The application will be available at http://localhost:5173"
echo "Press Ctrl+C to stop the server"
echo ""

# Check for static assets directory
if [ ! -d "static" ]; then
    echo "Creating static assets directory..."
    mkdir -p static
    echo "Created static directory for assets"
fi

# Check for public directory (for favicon and other public files)
if [ ! -f "static/favicon.ico" ]; then
    echo "Creating basic favicon..."
    # Create a simple placeholder favicon if it doesn't exist
    touch static/favicon.ico
fi

# Launch the development server with error handling
echo "Launching SvelteKit development server..."
if npm run dev -- --open; then
    echo "Development server started successfully!"
else
    echo "Error: Failed to start development server."
    echo "Check the error messages above for more information."
    exit 1
fi

# Note: The cleanup function will be called automatically when the script exits