#!/bin/bash

# Update system packages
sudo apt-get update

# Install Node.js 20 (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify Node.js and npm installation
node --version
npm --version

# Install dependencies for Cypress (GUI dependencies)
sudo apt-get install -y \
    libgtk2.0-0 \
    libgtk-3-0 \
    libgbm-dev \
    libnotify-dev \
    libgconf-2-4 \
    libnss3-dev \
    libxss1 \
    libasound2-dev \
    libxtst6 \
    xauth \
    xvfb

# Navigate to project directory
cd /mnt/persist/workspace

# Install project dependencies (using install instead of ci due to lock file sync issues)
npm install

# Fix TypeScript configuration issues by updating tsconfig.json
cat > tsconfig.json << 'EOL'
{
	"extends": "./.svelte-kit/tsconfig.json",
	"compilerOptions": {
		"allowJs": true,
		"checkJs": true,
		"esModuleInterop": true,
		"forceConsistentCasingInFileNames": true,
		"resolveJsonModule": true,
		"skipLibCheck": true,
		"sourceMap": true,
		"strict": true,
		"verbatimModuleSyntax": false
	}
}
EOL

# Convert Cypress config from TypeScript to JavaScript to avoid compilation issues
cat > cypress.config.js << 'EOL'
const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    specPattern: 'cypress/e2e/**/*.{cy,spec}.{js,ts}',
    supportFile: 'cypress/support/e2e.js'
  }
});
EOL

# Remove the TypeScript version of the config
rm -f cypress.config.ts

# Update Cypress support file to use .js extension
mv cypress/support/e2e.ts cypress/support/e2e.js 2>/dev/null || true

# Build the SvelteKit application
npm run build

# Add Node.js and npm to PATH in user profile
echo 'export PATH="/usr/bin:$PATH"' >> $HOME/.profile

# Set environment variables for Cypress
export CYPRESS_CACHE_FOLDER=/tmp/.cypress
export DISPLAY=:99

# Start virtual display for headless Cypress
Xvfb :99 -screen 0 1024x768x24 > /dev/null 2>&1 &

# Wait for Xvfb to start
sleep 3