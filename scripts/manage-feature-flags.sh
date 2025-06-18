#!/bin/bash

# GearGrab Feature Flag Management Script
# Manage feature flags via Cloud Run environment variables

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

# Configuration
SERVICE_NAME="geargrab-app"
REGION="us-central1"

# Available feature flags
AVAILABLE_FLAGS=(
    "FEATURE_COMMENTS"
    "FEATURE_PAYMENTS"
    "FEATURE_ADMIN_PANEL"
    "FEATURE_ANALYTICS"
    "FEATURE_NOTIFICATIONS"
    "FEATURE_CHAT"
    "FEATURE_REVIEWS"
)

usage() {
    echo "GearGrab Feature Flag Management"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  list [ENV]              List current feature flags"
    echo "  set [ENV] [FLAG] [VALUE] Set a feature flag"
    echo "  enable [ENV] [FLAG]     Enable a feature flag"
    echo "  disable [ENV] [FLAG]    Disable a feature flag"
    echo "  reset [ENV]             Reset to default flags"
    echo ""
    echo "Environments:"
    echo "  staging                 geargrabco-staging"
    echo "  production              geargrabco"
    echo ""
    echo "Available Flags:"
    for flag in "${AVAILABLE_FLAGS[@]}"; do
        echo "  $flag"
    done
    echo ""
    echo "Examples:"
    echo "  $0 list staging"
    echo "  $0 enable production FEATURE_PAYMENTS"
    echo "  $0 set staging FEATURE_COMMENTS true"
    echo "  $0 disable production FEATURE_ANALYTICS"
}

get_project_id() {
    local env=$1
    if [ "$env" = "staging" ]; then
        echo "geargrabco-staging"
    elif [ "$env" = "production" ]; then
        echo "geargrabco"
    else
        print_error "Invalid environment: $env"
        exit 1
    fi
}

list_flags() {
    local env=$1
    local project_id=$(get_project_id $env)
    
    print_info "Listing feature flags for $env environment..."
    gcloud config set project $project_id
    
    echo ""
    echo "🚩 Current Feature Flags ($env):"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Get current environment variables
    ENV_VARS=$(gcloud run services describe $SERVICE_NAME \
        --region=$REGION \
        --format="value(spec.template.spec.template.spec.containers[0].env[].name,spec.template.spec.template.spec.containers[0].env[].value)" \
        2>/dev/null || echo "")
    
    if [ -z "$ENV_VARS" ]; then
        print_warning "No environment variables found or service doesn't exist"
        return
    fi
    
    # Parse and display feature flags
    echo "$ENV_VARS" | while IFS=$'\t' read -r name value; do
        if [[ $name == FEATURE_* ]]; then
            if [ "$value" = "true" ]; then
                echo -e "${GREEN}✅ $name: $value${NC}"
            else
                echo -e "${RED}❌ $name: $value${NC}"
            fi
        fi
    done
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

set_flag() {
    local env=$1
    local flag=$2
    local value=$3
    local project_id=$(get_project_id $env)
    
    # Validate flag name
    if [[ ! " ${AVAILABLE_FLAGS[@]} " =~ " ${flag} " ]]; then
        print_error "Invalid flag: $flag"
        echo "Available flags: ${AVAILABLE_FLAGS[*]}"
        exit 1
    fi
    
    # Validate value
    if [[ "$value" != "true" && "$value" != "false" ]]; then
        print_error "Invalid value: $value (must be 'true' or 'false')"
        exit 1
    fi
    
    print_info "Setting $flag=$value in $env environment..."
    gcloud config set project $project_id
    
    # Update the environment variable
    gcloud run services update $SERVICE_NAME \
        --region=$REGION \
        --set-env-vars="$flag=$value" \
        --quiet
    
    if [ "$value" = "true" ]; then
        print_success "Enabled $flag in $env"
    else
        print_success "Disabled $flag in $env"
    fi
    
    print_info "Deployment will take a few moments to propagate..."
}

enable_flag() {
    set_flag $1 $2 "true"
}

disable_flag() {
    set_flag $1 $2 "false"
}

reset_flags() {
    local env=$1
    local project_id=$(get_project_id $env)
    
    print_warning "Resetting feature flags to defaults for $env environment..."
    gcloud config set project $project_id
    
    # Default flags based on environment
    if [ "$env" = "staging" ]; then
        ENV_VARS="FEATURE_COMMENTS=true,FEATURE_PAYMENTS=false,FEATURE_ADMIN_PANEL=false,FEATURE_ANALYTICS=false,FEATURE_NOTIFICATIONS=false,FEATURE_CHAT=false,FEATURE_REVIEWS=false"
    else
        ENV_VARS="FEATURE_COMMENTS=true,FEATURE_PAYMENTS=true,FEATURE_ADMIN_PANEL=true,FEATURE_ANALYTICS=true,FEATURE_NOTIFICATIONS=true,FEATURE_CHAT=false,FEATURE_REVIEWS=true"
    fi
    
    gcloud run services update $SERVICE_NAME \
        --region=$REGION \
        --set-env-vars="$ENV_VARS" \
        --quiet
    
    print_success "Reset feature flags to defaults for $env"
    print_info "New deployment will take a few moments to propagate..."
}

# Main script logic
case "$1" in
    "list")
        if [ -z "$2" ]; then
            print_error "Environment required"
            usage
            exit 1
        fi
        list_flags $2
        ;;
    "set")
        if [ -z "$2" ] || [ -z "$3" ] || [ -z "$4" ]; then
            print_error "Environment, flag name, and value required"
            usage
            exit 1
        fi
        set_flag $2 $3 $4
        ;;
    "enable")
        if [ -z "$2" ] || [ -z "$3" ]; then
            print_error "Environment and flag name required"
            usage
            exit 1
        fi
        enable_flag $2 $3
        ;;
    "disable")
        if [ -z "$2" ] || [ -z "$3" ]; then
            print_error "Environment and flag name required"
            usage
            exit 1
        fi
        disable_flag $2 $3
        ;;
    "reset")
        if [ -z "$2" ]; then
            print_error "Environment required"
            usage
            exit 1
        fi
        reset_flags $2
        ;;
    *)
        usage
        exit 1
        ;;
esac
