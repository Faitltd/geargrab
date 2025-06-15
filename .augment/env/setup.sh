#!/bin/bash

# Update system packages
sudo apt-get update

# Install Node.js 20 (required for the project)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify Node.js and npm installation
node --version
npm --version

# Add Node.js to PATH in user profile
echo 'export PATH="/usr/bin:$PATH"' >> $HOME/.profile

# Install project dependencies
npm ci

# Install Cypress dependencies for headless mode
sudo apt-get install -y libgtk2.0-0 libgtk-3-0 libgbm-dev libnotify-dev libgconf-2-4 libnss3 libxss1 libasound2 libxtst6 xauth xvfb

# Build the SvelteKit application
npm run build

# Start the development server in background for testing
npm run dev &
DEV_PID=$!

# Wait for the development server to start
echo "Waiting for development server to start..."
sleep 10

# Check if server is running
curl -f http://localhost:5173 > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "Development server is running on port 5173"
else
    echo "Development server failed to start"
    kill $DEV_PID 2>/dev/null
    exit 1
fi

# Keep the server running for tests
echo "Setup complete. Development server is running for tests."