#!/bin/bash

# GearGrab Rollback Script
# This script handles emergency rollbacks to previous deployments

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

# Configuration (will be updated by setup-deployment.sh)
PROJECT_ID="geargrabco"
SERVICE_NAME="geargrab"
REGION="us-central1"

print_warning "🚨 EMERGENCY ROLLBACK SCRIPT 🚨"
echo ""
print_status "This script will rollback the GearGrab service to a previous revision."
echo ""

# Check authentication
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n1 > /dev/null; then
    print_error "Not authenticated with Google Cloud. Run 'gcloud auth login' first."
    exit 1
fi

# Set project
gcloud config set project "$PROJECT_ID" >/dev/null 2>&1

# Get current service information
print_status "Fetching current service information..."

CURRENT_REVISION=$(gcloud run services describe "$SERVICE_NAME" \
    --region="$REGION" \
    --format="value(status.latestReadyRevisionName)")

if [ -z "$CURRENT_REVISION" ]; then
    print_error "Could not fetch current revision information"
    exit 1
fi

print_status "Current revision: $CURRENT_REVISION"

# List available revisions
print_status "Available revisions:"
echo ""

gcloud run revisions list \
    --service="$SERVICE_NAME" \
    --region="$REGION" \
    --format="table(metadata.name,status.conditions[0].lastTransitionTime,spec.template.metadata.annotations['run.googleapis.com/execution-environment']:label=ENV)" \
    --sort-by="~metadata.creationTimestamp" \
    --limit=10

echo ""

# Get list of revisions for selection
REVISIONS=($(gcloud run revisions list \
    --service="$SERVICE_NAME" \
    --region="$REGION" \
    --format="value(metadata.name)" \
    --sort-by="~metadata.creationTimestamp" \
    --limit=10))

if [ ${#REVISIONS[@]} -lt 2 ]; then
    print_error "Not enough revisions available for rollback"
    exit 1
fi

# Show rollback options
echo "Rollback options:"
for i in "${!REVISIONS[@]}"; do
    if [ "${REVISIONS[$i]}" = "$CURRENT_REVISION" ]; then
        echo "$((i+1)). ${REVISIONS[$i]} (CURRENT)"
    else
        echo "$((i+1)). ${REVISIONS[$i]}"
    fi
done

echo ""
read -p "Select revision number to rollback to (1-${#REVISIONS[@]}): " SELECTION

# Validate selection
if ! [[ "$SELECTION" =~ ^[0-9]+$ ]] || [ "$SELECTION" -lt 1 ] || [ "$SELECTION" -gt ${#REVISIONS[@]} ]; then
    print_error "Invalid selection"
    exit 1
fi

SELECTED_REVISION="${REVISIONS[$((SELECTION-1))]}"

if [ "$SELECTED_REVISION" = "$CURRENT_REVISION" ]; then
    print_error "Cannot rollback to the current revision"
    exit 1
fi

print_warning "You are about to rollback from:"
print_warning "  Current: $CURRENT_REVISION"
print_warning "  To: $SELECTED_REVISION"
echo ""

read -p "Are you sure you want to proceed with the rollback? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    print_status "Rollback cancelled"
    exit 0
fi

# Perform rollback
print_status "Performing rollback to $SELECTED_REVISION..."

if gcloud run services update-traffic "$SERVICE_NAME" \
    --to-revisions="$SELECTED_REVISION=100" \
    --region="$REGION"; then
    print_success "Rollback completed successfully!"
else
    print_error "Rollback failed"
    exit 1
fi

# Verify rollback
print_status "Verifying rollback..."
sleep 5

NEW_CURRENT=$(gcloud run services describe "$SERVICE_NAME" \
    --region="$REGION" \
    --format="value(status.latestReadyRevisionName)")

if [ "$NEW_CURRENT" = "$SELECTED_REVISION" ]; then
    print_success "Rollback verified successfully"
    print_success "Service is now running revision: $NEW_CURRENT"
else
    print_warning "Rollback may not have completed. Current revision: $NEW_CURRENT"
fi

# Get service URL for testing
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
    --region="$REGION" \
    --format="value(status.url)")

print_status "Testing rolled back service..."
if curl -f -s "$SERVICE_URL/health" > /dev/null; then
    print_success "Service is responding correctly at $SERVICE_URL"
else
    print_warning "Service may not be responding. Please check manually: $SERVICE_URL"
fi

print_status "Rollback Summary:"
echo "=================="
echo "✅ Rolled back from: $CURRENT_REVISION"
echo "✅ Rolled back to: $SELECTED_REVISION"
echo "✅ Service URL: $SERVICE_URL"
echo ""
print_success "🎯 Rollback completed!"
echo ""
print_status "Next steps:"
echo "1. Test the application thoroughly"
echo "2. Monitor logs: gcloud run logs tail $SERVICE_NAME --region=$REGION"
echo "3. If issues persist, consider rolling back further or investigating the problem"
echo "4. Once stable, plan a proper fix and redeploy"
