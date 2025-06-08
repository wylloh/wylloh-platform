#!/bin/bash

# Wylloh Platform VPS Setup Script
# This script prepares a fresh Ubuntu 22.04 server for Wylloh deployment

set -e  # Exit on any error

echo "🚀 Starting Wylloh Platform VPS Setup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}
╔══════════════════════════════════════════════════════════════╗
║                    WYLLOH PLATFORM SETUP                    ║
║              VPS Preparation & Deployment                   ║
╚══════════════════════════════════════════════════════════════╝
${NC}"
}

print_header

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons"
   print_status "Please run as a regular user with sudo privileges"
   exit 1
fi

# Update system packages
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install essential packages
print_status "Installing essential packages..."
sudo apt install -y \
    curl \
    wget \
    git \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    ufw \
    fail2ban \
    htop \
    nano \
    vim

# Install Docker
print_status "Installing Docker..."
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose (standalone)
print_status "Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Node.js (for contract deployment)
print_status "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Configure firewall
print_status "Configuring firewall..."
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# Configure fail2ban
print_status "Configuring fail2ban..."
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Create application directory
print_status "Creating application directory..."
sudo mkdir -p /opt/wylloh
sudo chown $USER:$USER /opt/wylloh

# Install SSL certificate tool (Certbot)
print_status "Installing Certbot for SSL certificates..."
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot
sudo ln -sf /snap/bin/certbot /usr/bin/certbot

# Create swap file (important for small VPS)
print_status "Creating swap file..."
if [ ! -f /swapfile ]; then
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

# Optimize system for Docker
print_status "Optimizing system for Docker..."
echo 'vm.max_map_count=262144' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Create systemd service for Wylloh
print_status "Creating systemd service..."
sudo tee /etc/systemd/system/wylloh.service > /dev/null <<EOF
[Unit]
Description=Wylloh Platform
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/wylloh
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0
User=$USER
Group=docker

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable wylloh

# Create monitoring script
print_status "Creating monitoring script..."
tee /opt/wylloh/monitor.sh > /dev/null <<'EOF'
#!/bin/bash
# Simple monitoring script for Wylloh Platform

echo "=== Wylloh Platform Status ==="
echo "Date: $(date)"
echo ""

echo "=== Docker Services ==="
docker-compose ps

echo ""
echo "=== System Resources ==="
echo "Memory Usage:"
free -h
echo ""
echo "Disk Usage:"
df -h /
echo ""
echo "CPU Load:"
uptime

echo ""
echo "=== Service Health Checks ==="
echo "Frontend: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "DOWN")"
echo "API: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health || echo "DOWN")"
echo "Storage: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/health || echo "DOWN")"
EOF

chmod +x /opt/wylloh/monitor.sh

# Create backup script
print_status "Creating backup script..."
tee /opt/wylloh/backup.sh > /dev/null <<'EOF'
#!/bin/bash
# Backup script for Wylloh Platform

BACKUP_DIR="/opt/wylloh/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

echo "Starting backup at $(date)"

# Backup MongoDB
docker-compose exec -T mongodb mongodump --archive=/tmp/backup_$DATE.archive
docker cp wylloh-mongodb:/tmp/backup_$DATE.archive $BACKUP_DIR/

# Backup environment and configs
cp .env $BACKUP_DIR/env_$DATE.backup
cp docker-compose.yml $BACKUP_DIR/docker-compose_$DATE.yml

# Clean old backups (keep last 7 days)
find $BACKUP_DIR -name "*.archive" -mtime +7 -delete
find $BACKUP_DIR -name "*.backup" -mtime +7 -delete

echo "Backup completed at $(date)"
EOF

chmod +x /opt/wylloh/backup.sh

# Setup log rotation
print_status "Setting up log rotation..."
sudo tee /etc/logrotate.d/wylloh > /dev/null <<EOF
/opt/wylloh/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    copytruncate
}
EOF

print_status "VPS setup completed successfully!"
print_warning "IMPORTANT: You need to log out and log back in for Docker group changes to take effect"

echo -e "${GREEN}
╔══════════════════════════════════════════════════════════════╗
║                     SETUP COMPLETE!                         ║
║                                                              ║
║  Next steps:                                                 ║
║  1. Log out and log back in                                  ║
║  2. Clone your repository to /opt/wylloh                     ║
║  3. Configure environment variables                          ║
║  4. Run the deployment script                                ║
║                                                              ║
║  Useful commands:                                            ║
║  - Monitor: /opt/wylloh/monitor.sh                          ║
║  - Backup: /opt/wylloh/backup.sh                            ║
║  - Logs: docker-compose logs -f                             ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
${NC}" 