#!/bin/bash

# Deployment Prevention Script
# Helps prevent unnecessary Cloud Run deployments to save costs

set -e

echo "🛡️  Deployment Prevention & Cost Control"
echo "======================================="

# Configuration
BRANCH_NAME=$(git branch --show-current)
LAST_COMMIT_MESSAGE=$(git log -1 --pretty=%B)

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

# Function to check if deployment is necessary
check_deployment_necessity() {
    print_info "Analyzing changes to determine if deployment is necessary..."
    
    # Get changed files in the last commit
    CHANGED_FILES=$(git diff --name-only HEAD~1 HEAD 2>/dev/null || echo "")
    
    if [ -z "$CHANGED_FILES" ]; then
        print_warning "No changed files detected"
        return 1
    fi
    
    echo "Changed files:"
    echo "$CHANGED_FILES" | sed 's/^/  - /'
    echo ""
    
    # Check for deployment-worthy changes
    DEPLOYMENT_WORTHY=false
    
    # Source code changes
    if echo "$CHANGED_FILES" | grep -E '\.(ts|js|svelte|json)$' > /dev/null; then
        print_info "Source code changes detected"
        DEPLOYMENT_WORTHY=true
    fi
    
    # Configuration changes
    if echo "$CHANGED_FILES" | grep -E '^(src/|static/|package\.json|svelte\.config\.js|vite\.config\.js|Dockerfile)' > /dev/null; then
        print_info "Configuration or asset changes detected"
        DEPLOYMENT_WORTHY=true
    fi
    
    # Skip deployment for these types of changes
    SKIP_PATTERNS=(
        "README\.md"
        "\.md$"
        "^docs/"
        "^scripts/"
        "^cypress/"
        "\.sh$"
        "\.txt$"
        "^\.github/workflows/"
    )
    
    ONLY_SKIP_FILES=true
    for file in $CHANGED_FILES; do
        SHOULD_SKIP=false
        for pattern in "${SKIP_PATTERNS[@]}"; do
            if echo "$file" | grep -E "$pattern" > /dev/null; then
                SHOULD_SKIP=true
                break
            fi
        done
        if [ "$SHOULD_SKIP" = false ]; then
            ONLY_SKIP_FILES=false
            break
        fi
    done
    
    if [ "$ONLY_SKIP_FILES" = true ]; then
        print_warning "Only documentation/script changes detected - deployment not necessary"
        DEPLOYMENT_WORTHY=false
    fi
    
    # Check commit message for deployment keywords
    if echo "$LAST_COMMIT_MESSAGE" | grep -iE "(deploy|production|release|hotfix|critical)" > /dev/null; then
        print_info "Deployment keyword found in commit message"
        DEPLOYMENT_WORTHY=true
    fi
    
    # Check for [skip-deploy] tag
    if echo "$LAST_COMMIT_MESSAGE" | grep -i "\[skip-deploy\]" > /dev/null; then
        print_warning "Skip deployment tag found in commit message"
        DEPLOYMENT_WORTHY=false
    fi
    
    return $([ "$DEPLOYMENT_WORTHY" = true ] && echo 0 || echo 1)
}

# Function to estimate deployment cost
estimate_deployment_cost() {
    print_info "Estimating deployment cost..."
    
    echo "Deployment Cost Breakdown:"
    echo "  - Cloud Build: ~$0.003 per build minute (est. 3-5 minutes = $0.01-0.02)"
    echo "  - Container Registry storage: ~$0.10/GB/month"
    echo "  - Cloud Run cold start: ~$0.000024 per request"
    echo "  - Cloud Run execution: ~$0.000024 per 100ms + memory costs"
    echo ""
    echo "Total estimated cost per deployment: $0.05-0.15"
    echo "With 50+ deployments: $2.50-7.50 in build costs alone"
    echo ""
    print_warning "Frequent deployments add up quickly!"
}

# Function to suggest alternatives
suggest_alternatives() {
    print_info "Cost-saving alternatives:"
    echo ""
    echo "1. 🏠 Local Development:"
    echo "   npm run dev"
    echo "   Test changes locally before deploying"
    echo ""
    echo "2. 🧪 Local Production Build:"
    echo "   npm run build && npm run preview"
    echo "   Test production build locally"
    echo ""
    echo "3. 🎯 Manual Deployment:"
    echo "   Use GitHub Actions manual trigger for intentional deployments"
    echo ""
    echo "4. 📝 Commit Message Tags:"
    echo "   Add [skip-deploy] to commit messages for non-deployment changes"
    echo "   Add [deploy] to force deployment when needed"
    echo ""
    echo "5. ⏸️  Pause Service:"
    echo "   ./scripts/optimize-cloud-run-costs.sh pause"
    echo "   Scale service to zero when not actively testing"
}

# Function to create a deployment decision
make_deployment_decision() {
    if check_deployment_necessity; then
        print_status "Deployment appears necessary based on changes"
        echo ""
        estimate_deployment_cost
        echo ""
        
        read -p "Do you want to proceed with deployment? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_status "Proceeding with deployment"
            return 0
        else
            print_warning "Deployment cancelled by user"
            suggest_alternatives
            return 1
        fi
    else
        print_warning "Deployment does not appear necessary"
        echo ""
        suggest_alternatives
        echo ""
        
        read -p "Force deployment anyway? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_warning "Forcing deployment despite recommendations"
            return 0
        else
            print_status "Deployment skipped - costs saved!"
            return 1
        fi
    fi
}

# Function to show deployment statistics
show_deployment_stats() {
    print_info "Recent deployment statistics:"
    
    # Count recent deployments (last 7 days)
    RECENT_DEPLOYMENTS=$(git log --since="7 days ago" --oneline | wc -l)
    TOTAL_DEPLOYMENTS=$(git log --oneline | wc -l)
    
    echo "  - Commits in last 7 days: $RECENT_DEPLOYMENTS"
    echo "  - Total commits: $TOTAL_DEPLOYMENTS"
    echo "  - Estimated cost (last 7 days): \$$(echo "$RECENT_DEPLOYMENTS * 0.10" | bc -l 2>/dev/null || echo "~1-5")"
    echo "  - Estimated total deployment costs: \$$(echo "$TOTAL_DEPLOYMENTS * 0.10" | bc -l 2>/dev/null || echo "~5-50")"
}

# Main execution
case "${1:-check}" in
    "check")
        show_deployment_stats
        echo ""
        make_deployment_decision
        ;;
    "force")
        print_warning "Forcing deployment without checks"
        estimate_deployment_cost
        ;;
    "stats")
        show_deployment_stats
        ;;
    "alternatives")
        suggest_alternatives
        ;;
    *)
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  check        - Check if deployment is necessary (default)"
        echo "  force        - Force deployment without checks"
        echo "  stats        - Show deployment statistics"
        echo "  alternatives - Show cost-saving alternatives"
        ;;
esac
