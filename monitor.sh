#!/bin/bash

# GearGrab Monitoring and Health Check Script
# This script monitors the deployed application and provides health status

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
DOMAIN="geargrab.co"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to test URL response
test_url() {
    local url="$1"
    local expected_status="${2:-200}"
    local timeout="${3:-10}"
    
    local response=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$timeout" "$url" 2>/dev/null || echo "000")
    
    if [ "$response" = "$expected_status" ]; then
        return 0
    else
        return 1
    fi
}

# Function to get response time
get_response_time() {
    local url="$1"
    local timeout="${2:-10}"
    
    curl -s -o /dev/null -w "%{time_total}" --max-time "$timeout" "$url" 2>/dev/null || echo "timeout"
}

print_status "🔍 GearGrab Application Health Monitor"
echo ""

# Check prerequisites
if ! command_exists gcloud; then
    print_error "Google Cloud CLI is not installed"
    exit 1
fi

if ! command_exists curl; then
    print_error "curl is not installed"
    exit 1
fi

# Check authentication
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n1 > /dev/null; then
    print_error "Not authenticated with Google Cloud. Run 'gcloud auth login' first."
    exit 1
fi

# Set project
gcloud config set project "$PROJECT_ID" >/dev/null 2>&1

# Get service information
print_status "Fetching service information..."

SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
    --region="$REGION" \
    --format="value(status.url)" 2>/dev/null || echo "")

if [ -z "$SERVICE_URL" ]; then
    print_error "Could not fetch service URL. Service may not be deployed."
    exit 1
fi

CURRENT_REVISION=$(gcloud run services describe "$SERVICE_NAME" \
    --region="$REGION" \
    --format="value(status.latestReadyRevisionName)" 2>/dev/null || echo "unknown")

print_success "Service URL: $SERVICE_URL"
print_success "Current Revision: $CURRENT_REVISION"
echo ""

# Health Checks
print_status "Performing health checks..."
echo ""

# 1. Basic connectivity test
print_status "1. Testing basic connectivity..."
if test_url "$SERVICE_URL"; then
    RESPONSE_TIME=$(get_response_time "$SERVICE_URL")
    print_success "✅ Service is reachable (${RESPONSE_TIME}s)"
else
    print_error "❌ Service is not reachable"
    HEALTH_ISSUES=true
fi

# 2. Health endpoint test
print_status "2. Testing health endpoint..."
if test_url "$SERVICE_URL/health"; then
    HEALTH_RESPONSE_TIME=$(get_response_time "$SERVICE_URL/health")
    print_success "✅ Health endpoint responding (${HEALTH_RESPONSE_TIME}s)"
else
    print_warning "⚠️  Health endpoint not available"
fi

# 3. Custom domain test (if configured)
if [ -n "$DOMAIN" ] && [ "$DOMAIN" != "geargrab.co" ]; then
    print_status "3. Testing custom domain..."
    if test_url "https://$DOMAIN"; then
        DOMAIN_RESPONSE_TIME=$(get_response_time "https://$DOMAIN")
        print_success "✅ Custom domain responding (${DOMAIN_RESPONSE_TIME}s)"
    else
        print_warning "⚠️  Custom domain not responding"
    fi
fi

# 4. API endpoints test
print_status "4. Testing API endpoints..."
API_ENDPOINTS=("/api/health" "/api/status")

for endpoint in "${API_ENDPOINTS[@]}"; do
    if test_url "$SERVICE_URL$endpoint"; then
        print_success "✅ $endpoint responding"
    else
        print_warning "⚠️  $endpoint not responding"
    fi
done

echo ""

# Service Metrics
print_status "📊 Service Metrics"
echo ""

# Get service metrics
print_status "Fetching service metrics..."

# Current traffic allocation
TRAFFIC_INFO=$(gcloud run services describe "$SERVICE_NAME" \
    --region="$REGION" \
    --format="table(status.traffic[].revisionName,status.traffic[].percent)" 2>/dev/null || echo "")

if [ -n "$TRAFFIC_INFO" ]; then
    print_status "Traffic allocation:"
    echo "$TRAFFIC_INFO"
else
    print_warning "Could not fetch traffic information"
fi

echo ""

# Recent logs
print_status "📋 Recent Logs (last 10 entries)"
echo ""

gcloud run logs read "$SERVICE_NAME" \
    --region="$REGION" \
    --limit=10 \
    --format="table(timestamp,severity,textPayload)" 2>/dev/null || print_warning "Could not fetch logs"

echo ""

# Performance metrics
print_status "⚡ Performance Summary"
echo ""

if [ -n "$RESPONSE_TIME" ] && [ "$RESPONSE_TIME" != "timeout" ]; then
    RESPONSE_MS=$(echo "$RESPONSE_TIME * 1000" | bc 2>/dev/null || echo "unknown")
    if [ "$RESPONSE_MS" != "unknown" ]; then
        echo "🌐 Main page response time: ${RESPONSE_MS}ms"
        
        # Performance assessment
        if (( $(echo "$RESPONSE_TIME < 1.0" | bc -l 2>/dev/null || echo 0) )); then
            print_success "🚀 Excellent performance"
        elif (( $(echo "$RESPONSE_TIME < 3.0" | bc -l 2>/dev/null || echo 0) )); then
            print_status "👍 Good performance"
        else
            print_warning "🐌 Slow performance - consider optimization"
        fi
    fi
fi

echo ""

# Revision history
print_status "📚 Recent Revisions"
echo ""

gcloud run revisions list \
    --service="$SERVICE_NAME" \
    --region="$REGION" \
    --format="table(metadata.name,status.conditions[0].lastTransitionTime,spec.template.spec.containers[0].image)" \
    --sort-by="~metadata.creationTimestamp" \
    --limit=5 2>/dev/null || print_warning "Could not fetch revision history"

echo ""

# Resource usage
print_status "💾 Resource Configuration"
echo ""

MEMORY_LIMIT=$(gcloud run services describe "$SERVICE_NAME" \
    --region="$REGION" \
    --format="value(spec.template.spec.containers[0].resources.limits.memory)" 2>/dev/null || echo "unknown")

CPU_LIMIT=$(gcloud run services describe "$SERVICE_NAME" \
    --region="$REGION" \
    --format="value(spec.template.spec.containers[0].resources.limits.cpu)" 2>/dev/null || echo "unknown")

MAX_INSTANCES=$(gcloud run services describe "$SERVICE_NAME" \
    --region="$REGION" \
    --format="value(spec.template.metadata.annotations['autoscaling.knative.dev/maxScale'])" 2>/dev/null || echo "unknown")

echo "Memory limit: $MEMORY_LIMIT"
echo "CPU limit: $CPU_LIMIT"
echo "Max instances: $MAX_INSTANCES"

echo ""

# Summary
print_status "📋 Health Summary"
echo "=================="

if [ -z "$HEALTH_ISSUES" ]; then
    print_success "🎉 All systems operational!"
    echo "✅ Service is healthy and responding"
    echo "✅ All endpoints are accessible"
    echo "✅ Performance is within acceptable range"
else
    print_warning "⚠️  Some issues detected"
    echo "❌ Service may have connectivity issues"
    echo "🔧 Check logs and service configuration"
fi

echo ""
echo "Service URL: $SERVICE_URL"
if [ -n "$DOMAIN" ] && [ "$DOMAIN" != "geargrab.co" ]; then
    echo "Custom domain: https://$DOMAIN"
fi
echo "Current revision: $CURRENT_REVISION"
echo "Monitoring completed at: $(date)"

echo ""
print_status "Available commands:"
echo "• View live logs: gcloud run logs tail $SERVICE_NAME --region=$REGION"
echo "• Service details: gcloud run services describe $SERVICE_NAME --region=$REGION"
echo "• Rollback: ./rollback.sh"
echo "• Redeploy: ./deploy.sh"
