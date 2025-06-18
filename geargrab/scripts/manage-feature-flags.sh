#!/bin/bash

# GearGrab Feature Flag Management Script
set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

SERVICE_NAME="geargrab-app"
REGION="us-central1"

AVAILABLE_FLAGS=(
    "FEATURE_COMMENTS"
    "FEATURE_PAYMENTS"
    "FEATURE_ADMIN_PANEL"
    "FEATURE_ANALYTICS"
)

get_project_id() {
    if [ "$1" = "staging" ]; then
        echo "geargrabco-staging"
    elif [ "$1" = "production" ]; then
        echo "geargrabco"
    else
        print_error "Invalid environment: $1"
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
        echo "⚠️  No environment variables found or service doesn't exist"
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

usage() {
    echo "GearGrab Feature Flag Management"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  list [ENV]              List current feature flags"
    echo "  enable [ENV] [FLAG]     Enable a feature flag"
    echo "  disable [ENV] [FLAG]    Disable a feature flag"
    echo ""
    echo "Environments: staging, production"
    echo "Available Flags: ${AVAILABLE_FLAGS[*]}"
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
    *)
        usage
        exit 1
        ;;
esac
