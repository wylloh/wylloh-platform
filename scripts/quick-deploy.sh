#!/bin/bash

# Wylloh Platform Quick Deployment Script
# This script quickly deploys the platform locally for testing

set -e

# Add Docker to PATH
export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log "🚀 Quick deploying Wylloh Platform for testing..."

# Create minimal .env if it doesn't exist
if [ ! -f ".env" ]; then
    log "📝 Creating minimal .env for testing..."
    cat > .env << 'EOF'
NODE_ENV=development
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=wylloh2024!
MONGO_DATABASE=wylloh
JWT_SECRET=wylloh-development-secret-key-for-testing-only-change-in-production
CORS_ORIGIN=http://localhost:3000
ETHEREUM_RPC_URL=https://polygon-mumbai.infura.io/v3/demo
POLYGON_RPC_URL=https://polygon-mumbai.infura.io/v3/demo
PRIVATE_KEY=0x0000000000000000000000000000000000000000000000000000000000000000
PINATA_API_KEY=demo
PINATA_SECRET_API_KEY=demo
REACT_APP_API_URL=http://localhost:3001
REACT_APP_STORAGE_URL=http://localhost:3002
REACT_APP_IPFS_GATEWAY=http://localhost:8080
REACT_APP_NETWORK_ID=80001
REACT_APP_CHAIN_NAME=Mumbai
GRAFANA_PASSWORD=wylloh2024!
EOF
    success "Development .env created"
fi

# Create necessary directories
log "📁 Creating directories..."
mkdir -p nginx/ssl nginx/logs monitoring api/uploads api/logs storage/temp storage/logs

# Generate self-signed SSL certificates
if [ ! -f "nginx/ssl/wylloh.com.crt" ]; then
    log "🔐 Generating SSL certificates..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout nginx/ssl/wylloh.com.key \
        -out nginx/ssl/wylloh.com.crt \
        -subj "/C=US/ST=CA/L=Hollywood/O=Wylloh/CN=localhost" 2>/dev/null
    success "SSL certificates generated"
fi

# Create MongoDB init script
cat > scripts/mongo-init.js << 'EOF'
db = db.getSiblingDB('wylloh');
db.createCollection('users');
db.createCollection('content');
print("MongoDB initialized for development");
EOF

# Create basic monitoring config
cat > monitoring/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
EOF

# Start services
log "🚀 Starting services..."
docker compose up -d --build

# Wait a bit for services to start
log "⏳ Waiting for services to start..."
sleep 20

# Check if services are running
log "🏥 Checking services..."
if docker compose ps | grep -q "Up"; then
    success "Services are starting up!"
else
    echo "Some services may have issues. Check with: docker compose logs"
fi

echo ""
echo "🎉 Quick deployment initiated!"
echo ""
echo "🌐 Frontend:  http://localhost:3000"
echo "🔌 API:       http://localhost:3001"
echo "💾 Storage:   http://localhost:3002"
echo "📊 IPFS:      http://localhost:8080"
echo "📈 Monitor:   http://localhost:9090"
echo ""
echo "📝 To check status: docker compose ps"
echo "📝 To view logs:    docker compose logs -f"
echo "📝 To stop:         docker compose down"
echo ""
success "Wylloh Platform is starting! 🎬✨" 