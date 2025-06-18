#!/bin/bash

# Environment Setup Helper for GearGrab Production Deployment
# This script helps you set up all required environment variables

echo "🔧 GearGrab Environment Setup Helper"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }

# Function to generate session secret
generate_session_secret() {
    if command -v openssl &> /dev/null; then
        openssl rand -base64 32
    else
        # Fallback for systems without openssl
        head -c 32 /dev/urandom | base64
    fi
}

# Function to validate email format
validate_email() {
    local email="$1"
    if [[ "$email" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
        return 0
    else
        return 1
    fi
}

# Function to setup Firebase environment variables
setup_firebase() {
    echo ""
    print_info "Setting up Firebase Admin credentials..."
    echo ""
    
    # Firebase Project ID
    echo "1. Firebase Project ID:"
    echo "   Find this in Firebase Console > Project Settings > General"
    read -p "   Enter your Firebase Project ID: " firebase_project_id
    
    if [[ -z "$firebase_project_id" ]]; then
        echo "   Error: Firebase Project ID is required"
        return 1
    fi
    
    # Firebase Admin Client Email
    echo ""
    echo "2. Firebase Admin Client Email:"
    echo "   Find this in Firebase Console > Project Settings > Service Accounts"
    echo "   Generate a new private key if you don't have one"
    read -p "   Enter your Firebase Admin Client Email: " firebase_client_email
    
    if [[ -z "$firebase_client_email" ]] || ! validate_email "$firebase_client_email"; then
        echo "   Error: Valid Firebase Admin Client Email is required"
        return 1
    fi
    
    # Firebase Admin Private Key
    echo ""
    echo "3. Firebase Admin Private Key:"
    echo "   This is the private key from the service account JSON file"
    echo "   It should start with -----BEGIN PRIVATE KEY-----"
    echo "   Paste the entire private key (including BEGIN/END lines):"
    echo ""
    
    # Read multi-line private key
    private_key=""
    echo "   (Press Ctrl+D when finished pasting)"
    while IFS= read -r line; do
        private_key+="$line"$'\n'
    done
    
    # Remove trailing newline
    private_key="${private_key%$'\n'}"
    
    if [[ -z "$private_key" ]] || [[ ! "$private_key" =~ "BEGIN PRIVATE KEY" ]]; then
        echo "   Error: Valid Firebase Admin Private Key is required"
        return 1
    fi
    
    # Export Firebase variables
    export FIREBASE_PROJECT_ID="$firebase_project_id"
    export FIREBASE_ADMIN_CLIENT_EMAIL="$firebase_client_email"
    export FIREBASE_ADMIN_PRIVATE_KEY="$private_key"
    
    print_success "Firebase credentials configured"
}

# Function to setup Stripe environment variables
setup_stripe() {
    echo ""
    print_info "Setting up Stripe credentials..."
    echo ""
    
    # Stripe Secret Key
    echo "1. Stripe Secret Key:"
    echo "   Find this in Stripe Dashboard > Developers > API Keys"
    echo "   Use your LIVE secret key (starts with sk_live_)"
    read -p "   Enter your Stripe Secret Key: " stripe_secret_key
    
    if [[ -z "$stripe_secret_key" ]] || [[ ! "$stripe_secret_key" =~ ^sk_live_ ]]; then
        echo "   Error: Valid Stripe Live Secret Key is required (starts with sk_live_)"
        return 1
    fi
    
    # Stripe Webhook Secret
    echo ""
    echo "2. Stripe Webhook Secret:"
    echo "   Find this in Stripe Dashboard > Developers > Webhooks"
    echo "   Create a webhook endpoint if you don't have one"
    read -p "   Enter your Stripe Webhook Secret: " stripe_webhook_secret
    
    if [[ -z "$stripe_webhook_secret" ]] || [[ ! "$stripe_webhook_secret" =~ ^whsec_ ]]; then
        echo "   Error: Valid Stripe Webhook Secret is required (starts with whsec_)"
        return 1
    fi
    
    # Export Stripe variables
    export STRIPE_SECRET_KEY="$stripe_secret_key"
    export STRIPE_WEBHOOK_SECRET="$stripe_webhook_secret"
    
    print_success "Stripe credentials configured"
}

# Function to setup security variables
setup_security() {
    echo ""
    print_info "Setting up security configuration..."
    echo ""
    
    # Generate session secret
    session_secret=$(generate_session_secret)
    export SESSION_SECRET="$session_secret"
    
    print_success "Session secret generated (32+ characters)"
    echo "   SESSION_SECRET: ${session_secret:0:10}... (truncated for security)"
}

# Function to display environment variables
display_environment() {
    echo ""
    print_info "Environment Variables Summary:"
    echo ""
    echo "export FIREBASE_PROJECT_ID=\"$FIREBASE_PROJECT_ID\""
    echo "export FIREBASE_ADMIN_CLIENT_EMAIL=\"$FIREBASE_ADMIN_CLIENT_EMAIL\""
    echo "export FIREBASE_ADMIN_PRIVATE_KEY=\"$FIREBASE_ADMIN_PRIVATE_KEY\""
    echo "export SESSION_SECRET=\"$SESSION_SECRET\""
    echo "export STRIPE_SECRET_KEY=\"$STRIPE_SECRET_KEY\""
    echo "export STRIPE_WEBHOOK_SECRET=\"$STRIPE_WEBHOOK_SECRET\""
    echo ""
    print_warning "Save these variables securely! You'll need them for deployment."
}

# Function to save environment to file
save_environment() {
    echo ""
    read -p "Save environment variables to .env file? (y/N): " save_env
    
    if [[ "$save_env" =~ ^[Yy]$ ]]; then
        cat > .env << EOF
# GearGrab Production Environment Variables
# Generated on $(date)

# Firebase Admin Configuration
FIREBASE_PROJECT_ID="$FIREBASE_PROJECT_ID"
FIREBASE_ADMIN_CLIENT_EMAIL="$FIREBASE_ADMIN_CLIENT_EMAIL"
FIREBASE_ADMIN_PRIVATE_KEY="$FIREBASE_ADMIN_PRIVATE_KEY"

# Security Configuration
SESSION_SECRET="$SESSION_SECRET"

# Stripe Configuration
STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY"
STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK_SECRET"

# Google Cloud Configuration
PROJECT_ID="geargrabco"
EOF
        
        print_success "Environment variables saved to .env file"
        print_warning "Add .env to .gitignore to keep credentials secure!"
        
        # Add to .gitignore if it exists
        if [[ -f ".gitignore" ]] && ! grep -q "^\.env$" .gitignore; then
            echo ".env" >> .gitignore
            print_success "Added .env to .gitignore"
        fi
    fi
}

# Function to test environment
test_environment() {
    echo ""
    print_info "Testing environment configuration..."
    
    # Check all required variables
    required_vars=(
        "FIREBASE_PROJECT_ID"
        "FIREBASE_ADMIN_CLIENT_EMAIL"
        "FIREBASE_ADMIN_PRIVATE_KEY"
        "SESSION_SECRET"
        "STRIPE_SECRET_KEY"
        "STRIPE_WEBHOOK_SECRET"
    )
    
    all_set=true
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            echo "   ❌ $var is not set"
            all_set=false
        else
            echo "   ✅ $var is set"
        fi
    done
    
    if [[ "$all_set" == true ]]; then
        print_success "All environment variables are configured correctly!"
        echo ""
        print_info "You're ready to deploy! Run:"
        echo "   ./deploy-to-production.sh"
    else
        echo ""
        print_warning "Some environment variables are missing. Please run this script again."
    fi
}

# Main setup process
main() {
    echo "This script will help you set up all required environment variables"
    echo "for deploying GearGrab to production."
    echo ""
    
    # Setup each component
    setup_firebase || exit 1
    setup_stripe || exit 1
    setup_security
    
    # Display and save
    display_environment
    save_environment
    test_environment
    
    echo ""
    print_success "Environment setup completed!"
    echo ""
    print_info "Next steps:"
    echo "  1. Review the environment variables above"
    echo "  2. Run: ./deploy-to-production.sh"
    echo "  3. Wait for deployment to complete"
    echo "  4. Update DNS records as instructed"
    echo ""
}

# Run setup
main "$@"
