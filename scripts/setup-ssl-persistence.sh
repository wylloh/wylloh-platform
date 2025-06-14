#!/bin/bash

# Setup SSL Certificate Persistence for Single VPS
# This script creates a protected directory for SSL certificates
# that won't be affected by CI/CD deployments

set -e

echo "🔒 Setting up SSL Certificate Persistence for Wylloh Platform"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if running on VPS
if [[ ! "$OSTYPE" == "linux-gnu"* ]]; then
    print_error "This script should be run on your VPS server"
    exit 1
fi

# Check if running as the correct user
if [[ "$USER" != "wylloh" ]]; then
    print_warning "This script should be run as the 'wylloh' user"
    print_warning "Run: sudo su - wylloh"
fi

print_status "Creating protected SSL directory structure..."

# Create protected SSL directory
sudo mkdir -p /etc/wylloh/ssl
sudo mkdir -p /etc/wylloh/scripts
sudo mkdir -p /etc/wylloh/backups

# Set proper ownership
sudo chown -R wylloh:wylloh /etc/wylloh
sudo chmod 700 /etc/wylloh/ssl
sudo chmod 755 /etc/wylloh/scripts
sudo chmod 700 /etc/wylloh/backups

print_success "Protected directories created"

# Check if Let's Encrypt certificates exist
if [[ -f "/etc/letsencrypt/live/wylloh.com-0001/fullchain.pem" ]]; then
    print_status "Found existing Let's Encrypt certificates, copying to protected directory..."
    
    # Backup existing certificates
    sudo cp /etc/letsencrypt/live/wylloh.com-0001/fullchain.pem /etc/wylloh/backups/wylloh.com.crt.backup
    sudo cp /etc/letsencrypt/live/wylloh.com-0001/privkey.pem /etc/wylloh/backups/wylloh.com.key.backup
    
    # Copy to protected directory
    sudo cp /etc/letsencrypt/live/wylloh.com-0001/fullchain.pem /etc/wylloh/ssl/wylloh.com.crt
    sudo cp /etc/letsencrypt/live/wylloh.com-0001/privkey.pem /etc/wylloh/ssl/wylloh.com.key
    
    # Set proper permissions
    sudo chown wylloh:wylloh /etc/wylloh/ssl/*
    sudo chmod 644 /etc/wylloh/ssl/wylloh.com.crt
    sudo chmod 600 /etc/wylloh/ssl/wylloh.com.key
    
    print_success "SSL certificates copied to protected directory"
else
    print_warning "No existing Let's Encrypt certificates found"
    print_warning "You'll need to generate SSL certificates first"
fi

print_status "Creating SSL renewal script..."

# Create SSL renewal script
cat > /tmp/renew-ssl.sh << 'EOF'
#!/bin/bash

# SSL Certificate Renewal Script for Wylloh Platform
# This script checks for Let's Encrypt renewals and updates the protected directory

echo "🔄 $(date): Checking SSL certificate renewal..."

# Renew Let's Encrypt certificate
sudo certbot renew --quiet

# Check if renewal happened (certificates are newer than 1 hour)
if [ $(find /etc/letsencrypt/live/wylloh.com-0001/ -name "*.pem" -newermt "1 hour ago" 2>/dev/null | wc -l) -gt 0 ]; then
    echo "✅ $(date): Certificate renewed, updating protected directory..."
    
    # Backup old certificates
    sudo cp /etc/wylloh/ssl/wylloh.com.crt /etc/wylloh/backups/wylloh.com.crt.$(date +%Y%m%d_%H%M%S)
    sudo cp /etc/wylloh/ssl/wylloh.com.key /etc/wylloh/backups/wylloh.com.key.$(date +%Y%m%d_%H%M%S)
    
    # Copy renewed certificates to protected directory
    sudo cp /etc/letsencrypt/live/wylloh.com-0001/fullchain.pem /etc/wylloh/ssl/wylloh.com.crt
    sudo cp /etc/letsencrypt/live/wylloh.com-0001/privkey.pem /etc/wylloh/ssl/wylloh.com.key
    sudo chown wylloh:wylloh /etc/wylloh/ssl/*
    sudo chmod 644 /etc/wylloh/ssl/wylloh.com.crt
    sudo chmod 600 /etc/wylloh/ssl/wylloh.com.key
    
    # Reload nginx if running
    if docker ps | grep -q wylloh-nginx; then
        cd /opt/wylloh-platform && docker-compose exec nginx nginx -s reload
        echo "🎉 $(date): SSL certificates updated and nginx reloaded!"
    else
        echo "⚠️ $(date): SSL certificates updated but nginx not running"
    fi
    
    # Clean up old backups (keep last 10)
    sudo find /etc/wylloh/backups/ -name "*.crt.*" -type f | sort | head -n -10 | xargs -r sudo rm
    sudo find /etc/wylloh/backups/ -name "*.key.*" -type f | sort | head -n -10 | xargs -r sudo rm
    
else
    echo "ℹ️ $(date): No certificate renewal needed"
fi
EOF

# Move script to protected directory
sudo mv /tmp/renew-ssl.sh /etc/wylloh/scripts/renew-ssl.sh
sudo chown wylloh:wylloh /etc/wylloh/scripts/renew-ssl.sh
sudo chmod +x /etc/wylloh/scripts/renew-ssl.sh

print_success "SSL renewal script created"

print_status "Setting up automated renewal cron job..."

# Add cron job for SSL renewal (runs daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /etc/wylloh/scripts/renew-ssl.sh >> /var/log/ssl-renewal.log 2>&1") | crontab -

print_success "Cron job added for daily SSL renewal check"

# Test the renewal script
print_status "Testing SSL renewal script..."
/etc/wylloh/scripts/renew-ssl.sh

print_status "Updating docker-compose.yml configuration..."

# Check if we're in the project directory
if [[ ! -f "docker-compose.yml" ]]; then
    print_error "docker-compose.yml not found. Please run this script from the project root directory."
    exit 1
fi

# Backup current docker-compose.yml
cp docker-compose.yml docker-compose.yml.backup

# Update docker-compose.yml to use protected SSL directory
sed -i 's|./nginx/ssl:/etc/nginx/ssl:ro|/etc/wylloh/ssl:/etc/nginx/ssl:ro|g' docker-compose.yml

print_success "docker-compose.yml updated to use protected SSL directory"

print_status "Cleaning up repository SSL certificates..."

# Remove SSL certificates from repository (security best practice)
if [[ -d "nginx/ssl" ]]; then
    # Create .gitignore for ssl directory if it doesn't exist
    echo "# SSL certificates should not be in repository" > nginx/ssl/.gitignore
    echo "*.crt" >> nginx/ssl/.gitignore
    echo "*.key" >> nginx/ssl/.gitignore
    echo "*.pem" >> nginx/ssl/.gitignore
    
    # Remove actual certificate files (they're now in protected directory)
    find nginx/ssl/ -name "*.crt" -delete 2>/dev/null || true
    find nginx/ssl/ -name "*.key" -delete 2>/dev/null || true
    find nginx/ssl/ -name "*.pem" -delete 2>/dev/null || true
    
    print_success "SSL certificates removed from repository"
fi

echo ""
print_success "🎉 SSL Certificate Persistence Setup Complete!"
echo ""
echo -e "${BLUE}Summary of changes:${NC}"
echo "• ✅ Protected SSL directory created: /etc/wylloh/ssl/"
echo "• ✅ SSL certificates copied to protected location"
echo "• ✅ Automated renewal script installed"
echo "• ✅ Daily cron job configured (2 AM)"
echo "• ✅ docker-compose.yml updated"
echo "• ✅ Repository SSL certificates cleaned up"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Test deployment: docker-compose down && docker-compose up -d"
echo "2. Verify SSL: curl -I https://wylloh.com"
echo "3. Check renewal logs: tail -f /var/log/ssl-renewal.log"
echo ""
echo -e "${GREEN}Your SSL certificates are now persistent across CI/CD deployments!${NC}" 