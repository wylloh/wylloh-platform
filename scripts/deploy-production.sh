#!/bin/bash

# Production Deployment Script for Wylloh Platform
# Deploys using pre-built client assets to avoid TypeScript compilation on VPS

set -e  # Exit on any error

echo "🚀 Starting Wylloh Platform Production Deployment..."

# Check if we're running on VPS (Linux) or development machine
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "🐧 Detected Linux environment (VPS)"
    IS_VPS=true
else
    echo "💻 Detected development environment"
    IS_VPS=false
fi

# Ensure we're in the project root
cd "$(dirname "$0")/.."

# Check if build files exist
if [ ! -d "client/build" ]; then
    echo "❌ Client build files not found!"
    echo "Please run ./scripts/build-client-for-production.sh on your development machine first."
    exit 1
fi

echo "✅ Client build files found"

# Create production environment file if it doesn't exist
if [ ! -f .env.production ]; then
    echo "📝 Creating production environment file..."
    cp env.production.template .env.production
    echo "⚠️  Please edit .env.production with your actual production values"
fi

# Load environment variables
source .env.production

echo "🐳 Starting Docker services in production mode..."

# Stop any running services
docker-compose down --remove-orphans

# Build and start services with production profile
docker-compose --profile production up -d

echo "⏳ Waiting for services to be ready..."
sleep 30

# Health check
echo "🏥 Performing health checks..."

# Check API health
if curl -f http://localhost:5000/health > /dev/null 2>&1; then
    echo "✅ API service is healthy"
else
    echo "❌ API service is not responding"
fi

# Check client health
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Client service is healthy"
else
    echo "❌ Client service is not responding"
fi

# Check database connection
if docker-compose exec -T api node -e "const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongo:27017/wylloh').then(() => { console.log('DB connected'); process.exit(0); }).catch(() => process.exit(1));" > /dev/null 2>&1; then
    echo "✅ Database connection is healthy"
else
    echo "❌ Database connection failed"
fi

echo ""
echo "🎉 Production deployment complete!"
echo ""
echo "Services running:"
echo "- Client: http://localhost:3000 (pre-built static files)"
echo "- API: http://localhost:5000"
echo "- MongoDB: mongodb://localhost:27017"
echo "- Redis: redis://localhost:6379"
echo ""
echo "Logs: docker-compose logs -f"
echo "Stop: docker-compose --profile production down" 