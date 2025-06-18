#!/bin/bash

# Cloud Run Cost Optimization Script
# This script helps reduce Google Cloud Run costs during development

set -e

echo "🚀 Cloud Run Cost Optimization"
echo "=============================="

# Configuration
PROJECT_ID="geargrabco"
SERVICE_NAME="geargrab-app"
REGION="us-central1"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Function to check current service configuration
check_current_config() {
    print_info "Checking current Cloud Run configuration..."
    
    if gcloud run services describe $SERVICE_NAME --region=$REGION --project=$PROJECT_ID > /dev/null 2>&1; then
        echo "Current configuration:"
        gcloud run services describe $SERVICE_NAME --region=$REGION --project=$PROJECT_ID \
            --format="table(spec.template.spec.containers[0].resources.limits.memory,
                           spec.template.spec.containers[0].resources.limits.cpu,
                           spec.template.metadata.annotations['autoscaling.knative.dev/minScale'],
                           spec.template.metadata.annotations['autoscaling.knative.dev/maxScale'],
                           spec.template.spec.containerConcurrency)"
    else
        print_warning "Service $SERVICE_NAME not found in region $REGION"
        return 1
    fi
}

# Function to optimize service for development (minimal costs)
optimize_for_development() {
    print_info "Optimizing Cloud Run service for development (minimal costs)..."
    
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
    
    print_status "Service optimized for development"
    print_info "New configuration: 256Mi memory, 0.5 CPU, 0-2 instances"
}

# Function to optimize service for production
optimize_for_production() {
    print_info "Optimizing Cloud Run service for production..."
    
    gcloud run services update $SERVICE_NAME \
        --region=$REGION \
        --project=$PROJECT_ID \
        --memory=512Mi \
        --cpu=1 \
        --min-instances=0 \
        --max-instances=5 \
        --concurrency=100 \
        --timeout=300 \
        --quiet
    
    print_status "Service optimized for production"
    print_info "New configuration: 512Mi memory, 1 CPU, 0-5 instances"
}

# Function to pause service (scale to zero and keep it there)
pause_service() {
    print_info "Pausing Cloud Run service (scaling to zero)..."
    
    gcloud run services update $SERVICE_NAME \
        --region=$REGION \
        --project=$PROJECT_ID \
        --min-instances=0 \
        --max-instances=0 \
        --quiet
    
    print_status "Service paused (scaled to zero)"
    print_warning "Service will not respond to requests until resumed"
}

# Function to resume service
resume_service() {
    print_info "Resuming Cloud Run service..."
    
    gcloud run services update $SERVICE_NAME \
        --region=$REGION \
        --project=$PROJECT_ID \
        --min-instances=0 \
        --max-instances=2 \
        --quiet
    
    print_status "Service resumed"
}

# Function to show cost estimates
show_cost_estimates() {
    print_info "Cloud Run Cost Estimates (per month):"
    echo ""
    echo "Development Configuration (256Mi, 0.5 CPU, 0-2 instances):"
    echo "  - Light usage (10 requests/day): ~$1-3/month"
    echo "  - Medium usage (100 requests/day): ~$5-10/month"
    echo "  - Heavy usage (1000 requests/day): ~$15-25/month"
    echo ""
    echo "Production Configuration (512Mi, 1 CPU, 0-5 instances):"
    echo "  - Light usage: ~$5-10/month"
    echo "  - Medium usage: ~$15-30/month"
    echo "  - Heavy usage: ~$50-100/month"
    echo ""
    print_warning "Actual costs depend on request volume, execution time, and cold starts"
}

# Function to clean up old revisions
cleanup_old_revisions() {
    print_info "Cleaning up old Cloud Run revisions..."
    
    # Get all revisions except the latest 3
    OLD_REVISIONS=$(gcloud run revisions list \
        --service=$SERVICE_NAME \
        --region=$REGION \
        --project=$PROJECT_ID \
        --format="value(metadata.name)" \
        --sort-by="~metadata.creationTimestamp" \
        --limit=100 | tail -n +4)
    
    if [ -z "$OLD_REVISIONS" ]; then
        print_info "No old revisions to clean up"
    else
        echo "Deleting old revisions:"
        for revision in $OLD_REVISIONS; do
            echo "  - $revision"
            gcloud run revisions delete $revision \
                --region=$REGION \
                --project=$PROJECT_ID \
                --quiet
        done
        print_status "Old revisions cleaned up"
    fi
}

# Main menu
case "${1:-menu}" in
    "check")
        check_current_config
        ;;
    "dev")
        optimize_for_development
        check_current_config
        ;;
    "prod")
        optimize_for_production
        check_current_config
        ;;
    "pause")
        pause_service
        ;;
    "resume")
        resume_service
        ;;
    "cleanup")
        cleanup_old_revisions
        ;;
    "costs")
        show_cost_estimates
        ;;
    "menu"|*)
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  check    - Check current service configuration"
        echo "  dev      - Optimize for development (minimal costs)"
        echo "  prod     - Optimize for production"
        echo "  pause    - Pause service (scale to zero)"
        echo "  resume   - Resume service"
        echo "  cleanup  - Clean up old revisions"
        echo "  costs    - Show cost estimates"
        echo ""
        show_cost_estimates
        ;;
esac
