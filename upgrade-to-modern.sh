#!/bin/bash

# GearGrab Modern Upgrade Script
# Upgrades to SvelteKit v2.x with modern dependencies while keeping Firebase

echo "🚀 Upgrading GearGrab to modern SvelteKit v2.x + Firebase v10..."

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

# Check if Node.js is installed and version
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18 or higher is required. Current version: $(node --version)"
    exit 1
fi

print_success "Node.js $(node --version) detected"

# Step 1: Backup current configuration
print_status "Creating backup of current configuration..."
mkdir -p .backup
cp package.json .backup/package.json.backup 2>/dev/null || true
cp .env .backup/.env.backup 2>/dev/null || true
cp svelte.config.js .backup/svelte.config.js.backup 2>/dev/null || true
cp vite.config.ts .backup/vite.config.ts.backup 2>/dev/null || true
print_success "Backup created in .backup/ directory"

# Step 2: Clean up old dependencies
print_status "Cleaning up old dependencies and cache..."
rm -rf node_modules package-lock.json .svelte-kit .vite

# Step 3: Update to modern package.json
print_status "Updating to modern package.json with SvelteKit v2.x..."
cp package-modern.json package.json

# Step 4: Install modern dependencies
print_status "Installing modern dependencies..."
npm install

if [ $? -ne 0 ]; then
    print_error "Failed to install dependencies. Trying with legacy peer deps..."
    npm install --legacy-peer-deps
    
    if [ $? -ne 0 ]; then
        print_error "Failed to install dependencies even with legacy peer deps"
        print_warning "Restoring backup..."
        cp .backup/package.json.backup package.json 2>/dev/null || true
        exit 1
    fi
fi

print_success "Dependencies installed successfully"

# Step 5: Update environment configuration
print_status "Updating environment configuration..."
if [ ! -f .env ]; then
    print_status "Creating modern .env file from Firebase template..."
    cp .env.firebase.example .env
    print_success "Created .env file with modern Firebase configuration"
else
    print_warning ".env file already exists. Please manually update it using .env.firebase.example as reference"
fi

# Step 6: Create modern configuration files
print_status "Creating modern configuration files..."

# Create PostCSS config if it doesn't exist
if [ ! -f postcss.config.js ]; then
    cat > postcss.config.js << 'EOF'
export default {
	plugins: {
		tailwindcss: {},
		autoprefixer: {}
	}
};
EOF
    print_success "Created postcss.config.js"
fi

# Create Playwright config
if [ ! -f playwright.config.ts ]; then
    cat > playwright.config.ts << 'EOF'
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: './tests',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: 'html',
	use: {
		baseURL: 'http://localhost:4173',
		trace: 'on-first-retry'
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] }
		},
		{
			name: 'firefox',
			use: { ...devices['Desktop Firefox'] }
		},
		{
			name: 'webkit',
			use: { ...devices['Desktop Safari'] }
		}
	],
	webServer: {
		command: 'npm run build && npm run preview',
		port: 4173
	}
});
EOF
    print_success "Created playwright.config.ts"
fi

# Create Vitest config
if [ ! -f vitest.config.ts ]; then
    cat > vitest.config.ts << 'EOF'
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		environment: 'jsdom'
	}
});
EOF
    print_success "Created vitest.config.ts"
fi

# Step 7: Update app.html for modern SvelteKit
print_status "Updating app.html for SvelteKit v2..."
if [ -f src/app.html ]; then
    # Check if it needs updating
    if ! grep -q "%sveltekit.assets%" src/app.html; then
        print_status "Updating app.html with modern SvelteKit v2 syntax..."
        cat > src/app.html << 'EOF'
<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<link rel="icon" href="%sveltekit.assets%/favicon.png" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		%sveltekit.head%
	</head>
	<body data-sveltekit-preload-data="hover">
		<div style="display: contents">%sveltekit.body%</div>
	</body>
</html>
EOF
        print_success "Updated app.html"
    fi
else
    print_status "Creating app.html..."
    mkdir -p src
    cat > src/app.html << 'EOF'
<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<link rel="icon" href="%sveltekit.assets%/favicon.png" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		%sveltekit.head%
	</head>
	<body data-sveltekit-preload-data="hover">
		<div style="display: contents">%sveltekit.body%</div>
	</body>
</html>
EOF
    print_success "Created app.html"
fi

# Step 8: Run SvelteKit sync
print_status "Running SvelteKit sync..."
npx svelte-kit sync

if [ $? -eq 0 ]; then
    print_success "SvelteKit sync completed successfully"
else
    print_warning "SvelteKit sync had issues, but continuing..."
fi

# Step 9: Type check
print_status "Running type check..."
npm run check

if [ $? -eq 0 ]; then
    print_success "Type check passed"
else
    print_warning "Type check had issues. You may need to fix TypeScript errors."
fi

# Step 10: Final verification
print_status "Running final verification..."

# Check if critical files exist
CRITICAL_FILES=("src/app.html" "svelte.config.js" "vite.config.ts" "package.json")
for file in "${CRITICAL_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        print_error "Critical file missing: $file"
        exit 1
    fi
done

print_success "All critical files present"

# Final success message
echo ""
echo "🎉 ${GREEN}Upgrade to modern SvelteKit v2.x completed successfully!${NC}"
echo ""
echo "📋 ${BLUE}What's new:${NC}"
echo "   ✅ SvelteKit v2.x with latest features"
echo "   ✅ Firebase v10 with modern API"
echo "   ✅ Stripe v14 with latest features"
echo "   ✅ Vite v5 for faster builds"
echo "   ✅ Playwright for E2E testing"
echo "   ✅ Vitest for unit testing"
echo "   ✅ Modern TypeScript configuration"
echo "   ✅ Enhanced Tailwind CSS setup"
echo ""
echo "🚀 ${GREEN}Ready to launch:${NC}"
echo "   npm run dev    - Start development server"
echo "   npm run build  - Build for production"
echo "   npm run test   - Run unit tests"
echo "   npm run test:e2e - Run E2E tests"
echo ""
echo "⚠️  ${YELLOW}Next steps:${NC}"
echo "   1. Update your .env file with actual Firebase credentials"
echo "   2. Review and update any custom code for SvelteKit v2 compatibility"
echo "   3. Test your application thoroughly"
echo "   4. Update your deployment configuration if needed"
echo ""
echo "📚 ${BLUE}Documentation:${NC}"
echo "   - SvelteKit v2: https://kit.svelte.dev/docs"
echo "   - Firebase v10: https://firebase.google.com/docs/web/setup"
echo "   - Stripe v14: https://stripe.com/docs/js"
echo ""

# Start development server
read -p "Would you like to start the development server now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Starting development server..."
    npm run dev
fi
