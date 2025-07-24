#!/bin/bash

# GearGrab Deployment Setup Verification Script
# This script verifies that all deployment components are properly configured

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if file exists and is executable
check_executable() {
    local file="$1"
    if [ -f "$file" ] && [ -x "$file" ]; then
        return 0
    else
        return 1
    fi
}

print_status "🔍 GearGrab Deployment Setup Verification"
echo ""

ISSUES_FOUND=0

# Check required commands
print_status "Checking required commands..."

REQUIRED_COMMANDS=("git" "gcloud" "npm" "node" "curl")

for cmd in "${REQUIRED_COMMANDS[@]}"; do
    if command_exists "$cmd"; then
        VERSION=$($cmd --version 2>/dev/null | head -n1 || echo "unknown")
        print_success "✅ $cmd: $VERSION"
    else
        print_error "❌ $cmd: Not installed"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
done

echo ""

# Check deployment scripts
print_status "Checking deployment scripts..."

SCRIPTS=("setup-deployment.sh" "deploy.sh" "rollback.sh" "monitor.sh")

for script in "${SCRIPTS[@]}"; do
    if check_executable "$script"; then
        print_success "✅ $script: Executable"
    else
        print_error "❌ $script: Missing or not executable"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
done

echo ""

# Check configuration files
print_status "Checking configuration files..."

CONFIG_FILES=("package.json" "jest.config.js" "cypress.config.js" "vite.config.js")

for file in "${CONFIG_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_success "✅ $file: Present"
    else
        print_warning "⚠️  $file: Missing"
    fi
done

echo ""

# Check test infrastructure
print_status "Checking test infrastructure..."

TEST_DIRS=("src/services/__tests__" "src/components/__tests__" "src/utils/__tests__" "cypress/e2e")

for dir in "${TEST_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        TEST_COUNT=$(find "$dir" -name "*.test.js" -o -name "*.test.jsx" -o -name "*.cy.js" | wc -l)
        print_success "✅ $dir: $TEST_COUNT test files"
    else
        print_warning "⚠️  $dir: Missing"
    fi
done

echo ""

# Check Google Cloud authentication
print_status "Checking Google Cloud authentication..."

if command_exists gcloud; then
    if gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n1 > /dev/null 2>&1; then
        ACTIVE_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n1)
        print_success "✅ Google Cloud: Authenticated as $ACTIVE_ACCOUNT"
        
        # Check project
        CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null || echo "not-set")
        if [ "$CURRENT_PROJECT" != "not-set" ]; then
            print_success "✅ Project: $CURRENT_PROJECT"
        else
            print_warning "⚠️  Project: Not set"
        fi
    else
        print_warning "⚠️  Google Cloud: Not authenticated"
        print_status "Run 'gcloud auth login' to authenticate"
    fi
else
    print_error "❌ Google Cloud CLI not available"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

echo ""

# Check Git repository
print_status "Checking Git repository..."

if [ -d ".git" ]; then
    print_success "✅ Git repository: Initialized"
    
    # Check remote
    if git remote get-url origin >/dev/null 2>&1; then
        REMOTE_URL=$(git remote get-url origin)
        print_success "✅ Git remote: $REMOTE_URL"
    else
        print_warning "⚠️  Git remote: Not configured"
    fi
    
    # Check current branch
    CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
    print_success "✅ Current branch: $CURRENT_BRANCH"
    
else
    print_error "❌ Git repository: Not initialized"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

echo ""

# Check Node.js and npm
print_status "Checking Node.js environment..."

if command_exists node; then
    NODE_VERSION=$(node --version)
    NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d'.' -f1 | sed 's/v//')
    
    if [ "$NODE_MAJOR" -ge 18 ]; then
        print_success "✅ Node.js: $NODE_VERSION (compatible)"
    else
        print_warning "⚠️  Node.js: $NODE_VERSION (recommend v18+)"
    fi
fi

if [ -f "package.json" ]; then
    print_success "✅ package.json: Present"
    
    if [ -d "node_modules" ]; then
        print_success "✅ Dependencies: Installed"
    else
        print_warning "⚠️  Dependencies: Not installed (run 'npm install')"
    fi
fi

echo ""

# Check environment files
print_status "Checking environment configuration..."

ENV_FILES=(".env" ".env.local" ".env.production")

for file in "${ENV_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_success "✅ $file: Present"
    else
        print_status "ℹ️  $file: Not present (optional)"
    fi
done

echo ""

# Test npm scripts
print_status "Testing npm scripts..."

NPM_SCRIPTS=("test" "build" "deploy:setup" "deploy" "deploy:monitor")

for script in "${NPM_SCRIPTS[@]}"; do
    if npm run "$script" --silent >/dev/null 2>&1; then
        print_success "✅ npm run $script: Available"
    else
        # Check if script exists in package.json
        if grep -q "\"$script\":" package.json 2>/dev/null; then
            print_warning "⚠️  npm run $script: Configured but may have issues"
        else
            print_error "❌ npm run $script: Not configured"
            ISSUES_FOUND=$((ISSUES_FOUND + 1))
        fi
    fi
done

echo ""

# Summary
print_status "📋 Verification Summary"
echo "======================="

if [ $ISSUES_FOUND -eq 0 ]; then
    print_success "🎉 All checks passed! Deployment setup is ready."
    echo ""
    print_status "Next steps:"
    echo "1. Run 'npm run deploy:setup' to configure deployment"
    echo "2. Run 'npm run deploy' to deploy to production"
    echo "3. Run 'npm run deploy:monitor' to check health"
else
    print_warning "⚠️  $ISSUES_FOUND issues found. Please resolve them before deploying."
    echo ""
    print_status "Common fixes:"
    echo "• Install missing commands (gcloud, git, node, npm)"
    echo "• Run 'gcloud auth login' to authenticate"
    echo "• Run 'npm install' to install dependencies"
    echo "• Initialize git repository if needed"
fi

echo ""
print_status "Available commands:"
echo "• Setup deployment: npm run deploy:setup"
echo "• Deploy to production: npm run deploy"
echo "• Monitor health: npm run deploy:monitor"
echo "• Emergency rollback: npm run deploy:rollback"
echo "• View logs: npm run deploy:logs"

echo ""
print_status "Documentation:"
echo "• Deployment guide: DEPLOYMENT_README.md"
echo "• Detailed docs: DEPLOYMENT.md"

if [ $ISSUES_FOUND -eq 0 ]; then
    exit 0
else
    exit 1
fi
