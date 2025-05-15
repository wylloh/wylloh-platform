#!/bin/bash
# Wylloh Platform Security Check Script
# 
# This script runs security checks on the codebase and generates a report.
# It's meant to be run by developers before submitting PRs and during regular development.

set -e

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}     Wylloh Platform Security Check     ${NC}"
echo -e "${BLUE}=========================================${NC}"
echo

# Save current directory
CURRENT_DIR=$(pwd)
# Get base directory (repository root)
BASE_DIR="$( cd "$(dirname "$0")/.." && pwd )"

cd "$BASE_DIR"
echo -e "${BLUE}Running security checks from:${NC} $BASE_DIR"
echo

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}Warning: jq is not installed. JSON parsing will be limited.${NC}"
    echo "Install jq for better results: https://stedolan.github.io/jq/download/"
    echo
    JQ_AVAILABLE=false
else
    JQ_AVAILABLE=true
fi

# Function to run npm audit and generate report
run_npm_audit() {
    local PROJECT_DIR=$1
    local PROJECT_NAME=$2
    
    echo -e "${BLUE}Checking ${PROJECT_NAME}...${NC}"
    
    cd "$BASE_DIR/$PROJECT_DIR"
    
    # Create reports directory if it doesn't exist
    mkdir -p "$BASE_DIR/reports"
    
    # Run npm audit and save output
    npm audit --json > "$BASE_DIR/reports/audit-$PROJECT_NAME.json" || true
    
    # Parse results if jq is available
    if [ "$JQ_AVAILABLE" = true ]; then
        echo -e "${BLUE}Results for ${PROJECT_NAME}:${NC}"
        
        # Get vulnerability counts by severity
        CRITICAL=$(jq -r '.metadata.vulnerabilities.critical // 0' "$BASE_DIR/reports/audit-$PROJECT_NAME.json")
        HIGH=$(jq -r '.metadata.vulnerabilities.high // 0' "$BASE_DIR/reports/audit-$PROJECT_NAME.json")
        MODERATE=$(jq -r '.metadata.vulnerabilities.moderate // 0' "$BASE_DIR/reports/audit-$PROJECT_NAME.json")
        LOW=$(jq -r '.metadata.vulnerabilities.low // 0' "$BASE_DIR/reports/audit-$PROJECT_NAME.json")
        
        # Display results with color coding
        if [ "$CRITICAL" -gt 0 ]; then
            echo -e "${RED}Critical: $CRITICAL${NC}"
        else
            echo -e "${GREEN}Critical: $CRITICAL${NC}"
        fi
        
        if [ "$HIGH" -gt 0 ]; then
            echo -e "${RED}High: $HIGH${NC}"
        else
            echo -e "${GREEN}High: $HIGH${NC}"
        fi
        
        if [ "$MODERATE" -gt 0 ]; then
            echo -e "${YELLOW}Moderate: $MODERATE${NC}"
        else
            echo -e "${GREEN}Moderate: $MODERATE${NC}"
        fi
        
        if [ "$LOW" -gt 0 ]; then
            echo -e "${YELLOW}Low: $LOW${NC}"
        else
            echo -e "${GREEN}Low: $LOW${NC}"
        fi
    else
        echo "Results saved to: $BASE_DIR/reports/audit-$PROJECT_NAME.json"
    fi
    
    echo
}

# Create reports directory
mkdir -p "$BASE_DIR/reports"

# Run security checks on each project
echo "Running npm audit on all projects..."
run_npm_audit "." "root"
run_npm_audit "client" "client"
run_npm_audit "api" "api"

echo -e "${BLUE}Security check completed.${NC}"
echo -e "Report files are available in: ${BLUE}$BASE_DIR/reports/${NC}"
echo

# If there are any high or critical vulnerabilities, display a warning
if [ "$JQ_AVAILABLE" = true ]; then
    ROOT_HIGH=$(jq -r '.metadata.vulnerabilities.high // 0' "$BASE_DIR/reports/audit-root.json")
    ROOT_CRITICAL=$(jq -r '.metadata.vulnerabilities.critical // 0' "$BASE_DIR/reports/audit-root.json")
    CLIENT_HIGH=$(jq -r '.metadata.vulnerabilities.high // 0' "$BASE_DIR/reports/audit-client.json")
    CLIENT_CRITICAL=$(jq -r '.metadata.vulnerabilities.critical // 0' "$BASE_DIR/reports/audit-client.json")
    API_HIGH=$(jq -r '.metadata.vulnerabilities.high // 0' "$BASE_DIR/reports/audit-api.json")
    API_CRITICAL=$(jq -r '.metadata.vulnerabilities.critical // 0' "$BASE_DIR/reports/audit-api.json")
    
    TOTAL_HIGH=$((ROOT_HIGH + CLIENT_HIGH + API_HIGH))
    TOTAL_CRITICAL=$((ROOT_CRITICAL + CLIENT_CRITICAL + API_CRITICAL))
    
    if [ "$TOTAL_HIGH" -gt 0 ] || [ "$TOTAL_CRITICAL" -gt 0 ]; then
        echo -e "${RED}⚠️  WARNING: High or critical vulnerabilities found!${NC}"
        echo -e "${RED}These will need to be addressed before production launch.${NC}"
        echo -e "See security plan at: ${BLUE}.github/security-plan.md${NC}"
    else
        echo -e "${GREEN}✅ No high or critical vulnerabilities found.${NC}"
    fi
fi

# Return to original directory
cd "$CURRENT_DIR" 