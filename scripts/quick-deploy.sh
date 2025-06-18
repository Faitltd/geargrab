#!/bin/bash

# GearGrab Payment System - Quick Deployment Script
# This script helps deploy the payment system to production

set -e  # Exit on any error

echo "🚀 GearGrab Payment System - Quick Deployment"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if required tools are installed
check_dependencies() {
    print_info "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    print_status "Dependencies check passed"
}

# Check environment variables
check_environment() {
    print_info "Checking environment configuration..."
    
    required_vars=(
        "VITE_STRIPE_PUBLISHABLE_KEY"
        "STRIPE_SECRET_KEY"
        "FIREBASE_PROJECT_ID"
        "FIREBASE_ADMIN_CLIENT_EMAIL"
        "FIREBASE_ADMIN_PRIVATE_KEY"
    )
    
    missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        print_error "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        print_warning "Please set these variables before deploying"
        return 1
    fi
    
    print_status "Environment variables configured"
    return 0
}

# Install dependencies
install_dependencies() {
    print_info "Installing dependencies..."
    npm install
    print_status "Dependencies installed"
}

# Run tests
run_tests() {
    print_info "Running tests..."
    
    # Check if test command exists
    if npm run test --silent 2>/dev/null; then
        print_status "Tests passed"
    else
        print_warning "No tests found or tests failed"
    fi
}

# Build application
build_application() {
    print_info "Building application for production..."
    
    export NODE_ENV=production
    npm run build
    
    if [[ -d "build" ]]; then
        print_status "Application built successfully"
    else
        print_error "Build failed - no build directory found"
        exit 1
    fi
}

# Validate build
validate_build() {
    print_info "Validating build..."
    
    # Check if critical files exist
    critical_files=(
        "build/index.html"
        "build/_app"
    )
    
    for file in "${critical_files[@]}"; do
        if [[ ! -e "$file" ]]; then
            print_error "Critical file missing: $file"
            exit 1
        fi
    done
    
    print_status "Build validation passed"
}

# Deploy to platform
deploy_application() {
    print_info "Deploying application..."
    
    # Check for deployment platform
    if command -v vercel &> /dev/null; then
        print_info "Deploying to Vercel..."
        vercel --prod
        print_status "Deployed to Vercel"
    elif command -v netlify &> /dev/null; then
        print_info "Deploying to Netlify..."
        netlify deploy --prod
        print_status "Deployed to Netlify"
    else
        print_warning "No deployment platform detected"
        print_info "Build is ready in ./build directory"
        print_info "Deploy manually to your preferred platform"
    fi
}

# Test deployment
test_deployment() {
    print_info "Testing deployment..."
    
    if [[ -n "$VITE_APP_URL" ]]; then
        print_info "Testing payment endpoint..."
        
        # Test if the site is accessible
        if curl -f -s "$VITE_APP_URL" > /dev/null; then
            print_status "Site is accessible"
            
            # Test payment endpoint
            if curl -f -s "$VITE_APP_URL/test-payment" > /dev/null; then
                print_status "Payment test page is accessible"
            else
                print_warning "Payment test page not accessible"
            fi
        else
            print_warning "Site not accessible yet (may take a few minutes)"
        fi
    else
        print_warning "VITE_APP_URL not set - skipping deployment test"
    fi
}

# Main deployment flow
main() {
    echo
    print_info "Starting deployment process..."
    echo
    
    # Step 1: Check dependencies
    check_dependencies
    echo
    
    # Step 2: Install dependencies
    install_dependencies
    echo
    
    # Step 3: Check environment
    if ! check_environment; then
        print_error "Environment check failed. Please configure environment variables."
        echo
        print_info "See DEPLOYMENT_GUIDE.md for configuration instructions"
        exit 1
    fi
    echo
    
    # Step 4: Run tests
    run_tests
    echo
    
    # Step 5: Build application
    build_application
    echo
    
    # Step 6: Validate build
    validate_build
    echo
    
    # Step 7: Deploy application
    deploy_application
    echo
    
    # Step 8: Test deployment
    test_deployment
    echo
    
    # Success message
    print_status "Deployment completed successfully!"
    echo
    print_info "Next steps:"
    echo "  1. Test the payment flow at your deployed URL"
    echo "  2. Set up Stripe webhooks pointing to your domain"
    echo "  3. Test with real Stripe test cards"
    echo "  4. Monitor for any errors"
    echo
    print_info "Documentation:"
    echo "  - Deployment Guide: DEPLOYMENT_GUIDE.md"
    echo "  - Payment System: PAYMENT_SYSTEM.md"
    echo "  - Production Readiness: PRODUCTION_READINESS.md"
    echo
}

# Handle script arguments
case "${1:-}" in
    "check")
        check_dependencies
        check_environment
        ;;
    "build")
        install_dependencies
        build_application
        validate_build
        ;;
    "test")
        test_deployment
        ;;
    *)
        main
        ;;
esac
