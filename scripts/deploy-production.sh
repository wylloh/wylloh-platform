#!/bin/bash

# Wylloh Platform Production Deployment Script
# This script deploys the complete Wylloh platform to production

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   error "This script should not be run as root for security reasons"
   exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

log "🚀 Starting Wylloh Platform Production Deployment"

# Check if .env file exists
if [ ! -f ".env" ]; then
    warning ".env file not found. Creating from template..."
    cp env.production.template .env
    warning "Please edit .env file with your actual configuration values before continuing."
    read -p "Press Enter after you've configured .env file..."
fi

# Validate environment variables
log "📋 Validating environment configuration..."

required_vars=(
    "MONGO_ROOT_PASSWORD"
    "JWT_SECRET"
    "ETHEREUM_RPC_URL"
    "POLYGON_RPC_URL"
    "PRIVATE_KEY"
    "PINATA_API_KEY"
    "PINATA_SECRET_API_KEY"
)

source .env

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ] || [[ "${!var}" == *"your-"* ]]; then
        error "Environment variable $var is not properly configured in .env file"
        exit 1
    fi
done

success "Environment configuration validated"

# Create necessary directories
log "📁 Creating necessary directories..."
mkdir -p nginx/ssl nginx/logs
mkdir -p monitoring/grafana/dashboards monitoring/grafana/datasources
mkdir -p api/uploads api/logs
mkdir -p storage/temp storage/logs

# Generate SSL certificates (self-signed for now)
if [ ! -f "nginx/ssl/wylloh.com.crt" ]; then
    log "🔐 Generating SSL certificates..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout nginx/ssl/wylloh.com.key \
        -out nginx/ssl/wylloh.com.crt \
        -subj "/C=US/ST=CA/L=Hollywood/O=Wylloh/CN=wylloh.com"
    success "SSL certificates generated"
fi

# Create MongoDB initialization script
log "🗄️ Creating MongoDB initialization script..."
cat > scripts/mongo-init.js << 'EOF'
// MongoDB initialization script for Wylloh Platform
db = db.getSiblingDB('wylloh');

// Create collections
db.createCollection('users');
db.createCollection('content');
db.createCollection('rights');
db.createCollection('transactions');
db.createCollection('analytics');

// Create indexes for performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "walletAddress": 1 }, { unique: true });
db.content.createIndex({ "contentId": 1 }, { unique: true });
db.content.createIndex({ "createdBy": 1 });
db.content.createIndex({ "tags": 1 });
db.rights.createIndex({ "contentId": 1 });
db.rights.createIndex({ "owner": 1 });
db.transactions.createIndex({ "transactionHash": 1 }, { unique: true });
db.transactions.createIndex({ "timestamp": -1 });
db.analytics.createIndex({ "timestamp": -1 });

print("MongoDB initialized successfully for Wylloh Platform");
EOF

# Create monitoring configuration
log "📊 Setting up monitoring configuration..."
cat > monitoring/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  # - "first_rules.yml"
  # - "second_rules.yml"

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'wylloh-api'
    static_configs:
      - targets: ['api:3001']
    metrics_path: '/metrics'

  - job_name: 'wylloh-storage'
    static_configs:
      - targets: ['storage:3002']
    metrics_path: '/metrics'

  - job_name: 'mongodb'
    static_configs:
      - targets: ['mongodb:27017']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']

  - job_name: 'ipfs'
    static_configs:
      - targets: ['ipfs:5001']
EOF

# Build and deploy
log "🔨 Building Docker images..."
docker-compose build --no-cache

log "🚀 Starting services..."
docker-compose up -d

# Wait for services to be healthy
log "⏳ Waiting for services to be healthy..."
sleep 30

# Check service health
log "🏥 Checking service health..."
services=("mongodb" "redis" "ipfs" "api" "storage" "client" "nginx")

for service in "${services[@]}"; do
    if docker-compose ps | grep -q "${service}.*Up"; then
        success "$service is running"
    else
        error "$service failed to start"
        docker-compose logs $service
        exit 1
    fi
done

# Deploy smart contracts
log "📜 Deploying smart contracts..."
cd contracts
if [ -f "package.json" ]; then
    npm install
    npm run deploy:polygon
    cd ..
    success "Smart contracts deployed"
else
    warning "No contracts package.json found, skipping contract deployment"
    cd ..
fi

# Run database migrations if needed
log "🗄️ Running database setup..."
docker-compose exec -T api node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongodb:27017/wylloh')
  .then(() => {
    console.log('Database connected successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Database connection failed:', err);
    process.exit(1);
  });
"

# Final health check
log "🔍 Performing final health checks..."

# Check API health
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    success "API health check passed"
else
    error "API health check failed"
    exit 1
fi

# Check client health
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    success "Client health check passed"
else
    error "Client health check failed"
    exit 1
fi

# Display deployment information
log "🎉 Deployment completed successfully!"
echo ""
echo "=== WYLLOH PLATFORM DEPLOYMENT SUMMARY ==="
echo ""
echo "🌐 Frontend:     http://localhost:3000"
echo "🔌 API:          http://localhost:3001"
echo "💾 Storage:      http://localhost:3002"
echo "🗄️ MongoDB:      localhost:27017"
echo "🔄 Redis:        localhost:6379"
echo "📊 IPFS:         http://localhost:8080"
echo "📈 Prometheus:   http://localhost:9090"
echo "📊 Grafana:      http://localhost:3003"
echo ""
echo "🔐 Default Grafana credentials:"
echo "   Username: admin"
echo "   Password: (check GRAFANA_PASSWORD in .env)"
echo ""
echo "📝 Next steps:"
echo "1. Configure your domain DNS to point to this server"
echo "2. Update SSL certificates with real certificates from Let's Encrypt"
echo "3. Configure monitoring alerts"
echo "4. Set up automated backups"
echo "5. Review security settings"
echo ""
success "Wylloh Platform is now live! 🎬✨"

# Save deployment info
cat > deployment-info.txt << EOF
Wylloh Platform Deployment
Deployed: $(date)
Version: $(git rev-parse HEAD 2>/dev/null || echo "unknown")
Services: ${services[*]}
Status: SUCCESS
EOF

log "📄 Deployment information saved to deployment-info.txt" 