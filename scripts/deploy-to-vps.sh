#!/bin/bash

# Deploy Wylloh Platform to VPS
# This script copies the project (including pre-built client) to VPS and deploys

set -e

# VPS Configuration
VPS_IP="138.197.232.48"
VPS_USER="wylloh"
SSH_KEY="$HOME/.ssh/wylloh_vps"
REMOTE_PATH="/opt/wylloh-platform"

echo "🚀 Deploying Wylloh Platform to VPS..."

# Ensure we're in the project root
cd "$(dirname "$0")/.."

# Check if build exists
if [ ! -d "client/build" ]; then
    echo "❌ Client build not found! Running build script..."
    ./scripts/build-client-for-production.sh
fi

echo "📦 Compressing project files..."
tar -czf wylloh-platform.tar.gz \
    --exclude=node_modules \
    --exclude=.git \
    --exclude="*.log" \
    --exclude=".DS_Store" \
    .

echo "📤 Uploading to VPS..."
scp -i $SSH_KEY wylloh-platform.tar.gz $VPS_USER@$VPS_IP:/tmp/

echo "🔧 Deploying on VPS..."
ssh -i $SSH_KEY $VPS_USER@$VPS_IP << 'EOF'
    # Clean up any previous deployments
    if [ -d "/opt/wylloh-platform" ]; then
        echo "🧹 Cleaning up previous deployment..."
        cd /opt/wylloh-platform
        sudo docker-compose down --remove-orphans 2>/dev/null || true
        sudo docker system prune -f 2>/dev/null || true
    fi
    
    # Create fresh deployment directory
    sudo rm -rf /opt/wylloh-platform
    sudo mkdir -p /opt/wylloh-platform
    cd /opt/wylloh-platform
    
    # Extract project
    sudo tar -xzf /tmp/wylloh-platform.tar.gz
    sudo chown -R $USER:$USER /opt/wylloh-platform
    
    # Make scripts executable
    chmod +x scripts/*.sh
    
    # Run production deployment
    ./scripts/deploy-production.sh
EOF

# Cleanup
rm wylloh-platform.tar.gz

echo ""
echo "🎉 DEPLOYMENT COMPLETE!"
echo ""
echo "Your Wylloh Platform is now live at:"
echo "🌐 http://$VPS_IP:3000"
echo ""
echo "Services:"
echo "- Frontend: http://$VPS_IP:3000"
echo "- API: http://$VPS_IP:5000"
echo ""
echo "To check status: ssh -i $SSH_KEY $VPS_USER@$VPS_IP 'cd /opt/wylloh-platform && docker-compose logs -f'" 