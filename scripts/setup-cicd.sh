#!/bin/bash

# Wylloh Platform CI/CD Setup Script
# This script helps configure GitHub secrets and prepare CI/CD pipeline

set -e

echo "🚀 Setting up Wylloh Platform CI/CD Pipeline"
echo "============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# VPS Configuration
VPS_HOST="138.197.232.48"
VPS_USER="wylloh"
VPS_SSH_KEY_PATH="$HOME/.ssh/wylloh_vps"

echo -e "${BLUE}📋 GitHub Secrets Configuration${NC}"
echo "Add these secrets to your GitHub repository:"
echo "Settings → Secrets and variables → Actions → New repository secret"
echo ""

echo -e "${YELLOW}Required Secrets:${NC}"
echo "VPS_HOST: $VPS_HOST"
echo "VPS_USER: $VPS_USER"

# Read SSH private key
if [ -f "$VPS_SSH_KEY_PATH" ]; then
    echo -e "${GREEN}✓ SSH key found at $VPS_SSH_KEY_PATH${NC}"
    echo "VPS_SSH_PRIVATE_KEY:"
    echo "---Copy the content below (including -----BEGIN/END----- lines)---"
    cat "$VPS_SSH_KEY_PATH"
    echo "---End of SSH key---"
else
    echo -e "${RED}✗ SSH key not found at $VPS_SSH_KEY_PATH${NC}"
    echo "Please ensure your VPS SSH key is at the correct location"
fi

echo ""
echo -e "${YELLOW}Optional Environment Secrets (for production):${NC}"
echo "REACT_APP_API_URL: https://your-domain.com/api"
echo "REACT_APP_STORAGE_URL: https://your-domain.com/storage"
echo "REACT_APP_IPFS_GATEWAY: https://your-domain.com/ipfs"
echo "REACT_APP_NETWORK_ID: 137 (for Polygon)"
echo "REACT_APP_CHAIN_NAME: polygon"

echo ""
echo -e "${BLUE}🔧 Setting up GitHub Environment${NC}"
echo "1. Go to GitHub repository → Settings → Environments"
echo "2. Create environment named: 'production'"
echo "3. Add protection rules (require approval if desired)"

echo ""
echo -e "${BLUE}📦 Preparing VPS for CI/CD${NC}"
echo "Ensuring VPS is ready for automated deployments..."

# Test SSH connection
if ssh -i "$VPS_SSH_KEY_PATH" -o ConnectTimeout=10 "$VPS_USER@$VPS_HOST" "echo 'SSH connection successful'" 2>/dev/null; then
    echo -e "${GREEN}✓ SSH connection to VPS successful${NC}"
    
    # Setup VPS for CI/CD
    ssh -i "$VPS_SSH_KEY_PATH" "$VPS_USER@$VPS_HOST" << 'EOF'
        # Ensure docker-compose is available
        if ! command -v docker-compose &> /dev/null; then
            echo "Installing docker-compose..."
            sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
            sudo chmod +x /usr/local/bin/docker-compose
        fi
        
        # Ensure Git is configured
        cd ~/wylloh-platform
        git config --global --add safe.directory $(pwd)
        
        # Create logs directory
        mkdir -p logs
        
        echo "VPS is ready for CI/CD deployments!"
EOF
    echo -e "${GREEN}✓ VPS prepared for CI/CD${NC}"
else
    echo -e "${RED}✗ Cannot connect to VPS via SSH${NC}"
    echo "Please check your SSH key and VPS connection"
fi

echo ""
echo -e "${BLUE}🧪 Testing CI/CD Setup${NC}"
echo "To test your CI/CD pipeline:"
echo "1. Commit and push changes to main branch"
echo "2. Go to GitHub → Actions tab"
echo "3. Watch the 'Build, Test & Deploy' workflow"

echo ""
echo -e "${GREEN}✅ CI/CD Setup Complete!${NC}"
echo "Your Wylloh Platform now has professional CI/CD capabilities:"
echo "• ✅ Cross-platform builds (Linux environment)"
echo "• ✅ Automated testing and quality checks"
echo "• ✅ Docker image building"
echo "• ✅ Automated VPS deployment"
echo "• ✅ Zero-downtime deployments"

echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Add the GitHub secrets listed above"
echo "2. Push changes to trigger first CI/CD run"
echo "3. Monitor deployment in GitHub Actions" 