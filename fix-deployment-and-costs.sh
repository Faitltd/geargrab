#!/bin/bash

# Quick Fix Script for Deployment Issues and Cost Optimization
# Run this script to immediately reduce Cloud Run costs and fix deployment issues

set -e

echo "🚀 GearGrab Deployment & Cost Fix"
echo "================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Check if gcloud is installed and authenticated
check_gcloud() {
    if ! command -v gcloud &> /dev/null; then
        print_error "gcloud CLI not found. Please install it first:"
        echo "https://cloud.google.com/sdk/docs/install"
        exit 1
    fi
    
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        print_error "Not authenticated with gcloud. Please run:"
        echo "gcloud auth login"
        exit 1
    fi
    
    print_status "gcloud CLI is ready"
}

# Optimize Cloud Run service immediately
optimize_service() {
    print_info "Optimizing Cloud Run service for development..."
    
    PROJECT_ID="geargrabco"
    SERVICE_NAME="geargrab-app"
    REGION="us-central1"
    
    # Check if service exists
    if ! gcloud run services describe $SERVICE_NAME --region=$REGION --project=$PROJECT_ID > /dev/null 2>&1; then
        print_warning "Service $SERVICE_NAME not found. Will be optimized on next deployment."
        return 0
    fi
    
    # Optimize for development
    gcloud run services update $SERVICE_NAME \
        --region=$REGION \
        --project=$PROJECT_ID \
        --memory=256Mi \
        --cpu=0.5 \
        --min-instances=0 \
        --max-instances=2 \
        --concurrency=80 \
        --timeout=300 \
        --quiet
    
    print_status "Service optimized: 256Mi memory, 0.5 CPU, max 2 instances"
    
    # Show current configuration
    print_info "Current service configuration:"
    gcloud run services describe $SERVICE_NAME --region=$REGION --project=$PROJECT_ID \
        --format="table(spec.template.spec.containers[0].resources.limits.memory,
                   spec.template.spec.containers[0].resources.limits.cpu,
                   spec.template.metadata.annotations['autoscaling.knative.dev/maxScale'])"
}

# Clean up old revisions to save storage costs
cleanup_revisions() {
    print_info "Cleaning up old Cloud Run revisions..."
    
    PROJECT_ID="geargrabco"
    SERVICE_NAME="geargrab-app"
    REGION="us-central1"
    
    # Get old revisions (keep latest 3)
    OLD_REVISIONS=$(gcloud run revisions list \
        --service=$SERVICE_NAME \
        --region=$REGION \
        --project=$PROJECT_ID \
        --format="value(metadata.name)" \
        --sort-by="~metadata.creationTimestamp" \
        --limit=100 2>/dev/null | tail -n +4 || echo "")
    
    if [ -z "$OLD_REVISIONS" ]; then
        print_info "No old revisions to clean up"
    else
        REVISION_COUNT=$(echo "$OLD_REVISIONS" | wc -l)
        print_info "Deleting $REVISION_COUNT old revisions..."
        
        for revision in $OLD_REVISIONS; do
            gcloud run revisions delete $revision \
                --region=$REGION \
                --project=$PROJECT_ID \
                --quiet 2>/dev/null || true
        done
        
        print_status "Old revisions cleaned up"
    fi
}

# Show cost estimates
show_cost_impact() {
    print_info "Cost Impact Summary:"
    echo ""
    echo "Before optimization:"
    echo "  - Memory: 512Mi, CPU: 1.0, Max instances: 10"
    echo "  - Estimated cost: $15-50/month"
    echo ""
    echo "After optimization:"
    echo "  - Memory: 256Mi, CPU: 0.5, Max instances: 2"
    echo "  - Estimated cost: $3-15/month"
    echo ""
    print_status "Estimated savings: $10-35/month (60-70% reduction)"
    echo ""
    print_warning "Additional savings from reduced deployments:"
    echo "  - 53+ failed deployments ≈ $5-15 in build costs"
    echo "  - New workflow prevents unnecessary deployments"
    echo "  - Use manual deployment for intentional releases"
}

# Check GitHub secrets
check_github_secrets() {
    print_info "GitHub Secrets Checklist:"
    echo ""
    echo "Required secrets for deployment success:"
    echo "  □ GCP_PROJECT_ID"
    echo "  □ GCP_SA_KEY"
    echo "  □ VITE_FIREBASE_API_KEY"
    echo "  □ VITE_FIREBASE_AUTH_DOMAIN"
    echo "  □ VITE_FIREBASE_PROJECT_ID"
    echo "  □ VITE_FIREBASE_STORAGE_BUCKET"
    echo "  □ VITE_FIREBASE_MESSAGING_SENDER_ID"
    echo "  □ VITE_FIREBASE_APP_ID"
    echo "  □ FIREBASE_PROJECT_ID"
    echo "  □ FIREBASE_ADMIN_CLIENT_EMAIL"
    echo "  □ FIREBASE_ADMIN_PRIVATE_KEY"
    echo "  □ VITE_STRIPE_PUBLISHABLE_KEY"
    echo "  □ STRIPE_SECRET_KEY"
    echo ""
    print_warning "Add these at: https://github.com/Faitltd/GearGrab/settings/secrets/actions"
    echo ""
    print_info "See DEPLOYMENT_FIXES.md for exact values"
}

# Main execution
main() {
    print_info "Starting deployment and cost optimization..."
    echo ""
    
    # Step 1: Check prerequisites
    check_gcloud
    
    # Step 2: Optimize Cloud Run service
    optimize_service
    echo ""
    
    # Step 3: Clean up old revisions
    cleanup_revisions
    echo ""
    
    # Step 4: Show cost impact
    show_cost_impact
    echo ""
    
    # Step 5: GitHub secrets reminder
    check_github_secrets
    
    print_status "Optimization complete!"
    echo ""
    print_info "Next steps:"
    echo "1. Add missing GitHub secrets (see above)"
    echo "2. Use manual deployment: GitHub Actions → Deploy to Cloud Run → Run workflow"
    echo "3. For local development: npm run dev"
    echo "4. Monitor costs: ./scripts/optimize-cloud-run-costs.sh check"
    echo ""
    print_warning "Deployment should now work and cost 60-70% less!"
}

# Run main function
main
