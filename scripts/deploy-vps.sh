#!/bin/bash

# Wylloh Platform - Cloud VPS Deployment Script
# Optimized for Ubuntu 22.04 LTS on DigitalOcean, Vultr, Hetzner, or similar VPS providers
# Version: 1.0
# Date: January 2025

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="wylloh.com"
PROJECT_DIR="/opt/wylloh"
BACKUP_DIR="/opt/wylloh-backups"
LOG_FILE="/var/log/wylloh-deployment.log"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a $LOG_FILE
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a $LOG_FILE
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a $LOG_FILE
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a $LOG_FILE
}

# Function to check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_error "This script must be run as root (use sudo)"
        exit 1
    fi
}

# Function to check system requirements
check_system() {
    print_status "Checking system requirements..."
    
    # Check Ubuntu version
    if ! grep -q "Ubuntu 22.04" /etc/os-release; then
        print_warning "This script is optimized for Ubuntu 22.04 LTS"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    # Check available memory (minimum 3GB for 4GB VPS)
    AVAILABLE_MEM=$(free -m | awk 'NR==2{printf "%.0f", $7}')
    if [ "$AVAILABLE_MEM" -lt 3000 ]; then
        print_warning "Available memory is ${AVAILABLE_MEM}MB. Recommended: 3GB+"
    fi
    
    # Check available disk space (minimum 60GB)
    AVAILABLE_DISK=$(df / | awk 'NR==2{printf "%.0f", $4/1024/1024}')
    if [ "$AVAILABLE_DISK" -lt 60 ]; then
        print_warning "Available disk space is ${AVAILABLE_DISK}GB. Recommended: 60GB+"
    fi
    
    print_success "System requirements check completed"
}

# Function to update system packages
update_system() {
    print_status "Updating system packages..."
    
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -y
    apt-get upgrade -y
    apt-get install -y \
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
    
    print_success "System packages updated"
}

# Function to install Docker
install_docker() {
    print_status "Installing Docker..."
    
    # Remove old Docker versions
    apt-get remove -y docker docker-engine docker.io containerd runc || true
    
    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Add Docker repository
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker
    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    # Start and enable Docker
    systemctl start docker
    systemctl enable docker
    
    # Add current user to docker group (if not root)
    if [ "$SUDO_USER" ]; then
        usermod -aG docker $SUDO_USER
        print_status "Added $SUDO_USER to docker group"
    fi
    
    # Install Docker Compose standalone
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    
    print_success "Docker installed successfully"
}

# Function to configure firewall
configure_firewall() {
    print_status "Configuring firewall..."
    
    # Reset UFW to defaults
    ufw --force reset
    
    # Set default policies
    ufw default deny incoming
    ufw default allow outgoing
    
    # Allow SSH (important!)
    ufw allow ssh
    ufw allow 22/tcp
    
    # Allow HTTP and HTTPS
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # Allow Wylloh services
    ufw allow 3000/tcp  # Client
    ufw allow 3001/tcp  # API
    ufw allow 3002/tcp  # Storage
    
    # Allow IPFS
    ufw allow 4001/tcp  # IPFS P2P
    ufw allow 5001/tcp  # IPFS API (local only)
    ufw allow 8080/tcp  # IPFS Gateway
    
    # Allow MongoDB and Redis (local only)
    ufw allow from 127.0.0.1 to any port 27017
    ufw allow from 127.0.0.1 to any port 6379
    
    # Enable firewall
    ufw --force enable
    
    print_success "Firewall configured"
}

# Function to configure fail2ban
configure_fail2ban() {
    print_status "Configuring fail2ban..."
    
    # Create custom jail for SSH
    cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
EOF
    
    systemctl restart fail2ban
    systemctl enable fail2ban
    
    print_success "Fail2ban configured"
}

# Function to create project directories
create_directories() {
    print_status "Creating project directories..."
    
    mkdir -p $PROJECT_DIR
    mkdir -p $BACKUP_DIR
    mkdir -p /var/log/wylloh
    
    # Set proper permissions
    chmod 755 $PROJECT_DIR
    chmod 700 $BACKUP_DIR
    
    print_success "Project directories created"
}

# Function to clone repository
clone_repository() {
    print_status "Cloning Wylloh repository..."
    
    if [ -d "$PROJECT_DIR/.git" ]; then
        print_status "Repository already exists, pulling latest changes..."
        cd $PROJECT_DIR
        git pull origin main
    else
        git clone https://github.com/wylloh/wylloh-platform.git $PROJECT_DIR
        cd $PROJECT_DIR
    fi
    
    print_success "Repository cloned/updated"
}

# Function to setup environment variables
setup_environment() {
    print_status "Setting up environment variables..."
    
    if [ ! -f "$PROJECT_DIR/.env.production" ]; then
        if [ -f "$PROJECT_DIR/env.production.template" ]; then
            cp $PROJECT_DIR/env.production.template $PROJECT_DIR/.env.production
            print_warning "Environment template copied to .env.production"
            print_warning "Please edit $PROJECT_DIR/.env.production with your actual values"
        else
            print_error "Environment template not found!"
            exit 1
        fi
    else
        print_status "Environment file already exists"
    fi
    
    # Set proper permissions
    chmod 600 $PROJECT_DIR/.env.production
    
    print_success "Environment setup completed"
}

# Function to install Node.js and dependencies
install_nodejs() {
    print_status "Installing Node.js..."
    
    # Install Node.js 18.x
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    
    # Install Yarn
    npm install -g yarn
    
    print_success "Node.js and Yarn installed"
}

# Function to build and deploy services
deploy_services() {
    print_status "Building and deploying services..."
    
    cd $PROJECT_DIR
    
    # Copy environment file for Docker Compose
    cp .env.production .env
    
    # Build and start services
    docker-compose -f docker-compose.yml down || true
    docker-compose -f docker-compose.yml build --no-cache
    docker-compose -f docker-compose.yml up -d
    
    print_success "Services deployed"
}

# Function to setup SSL with Let's Encrypt
setup_ssl() {
    print_status "Setting up SSL certificates..."
    
    # Install Certbot
    apt-get install -y certbot python3-certbot-nginx
    
    # Stop nginx temporarily
    docker-compose -f $PROJECT_DIR/docker-compose.yml stop nginx || true
    
    # Get certificate
    certbot certonly --standalone -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
    
    # Start nginx again
    docker-compose -f $PROJECT_DIR/docker-compose.yml start nginx
    
    # Setup auto-renewal
    echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -
    
    print_success "SSL certificates configured"
}

# Function to setup monitoring
setup_monitoring() {
    print_status "Setting up monitoring..."
    
    # Create monitoring script
    cat > /usr/local/bin/wylloh-monitor.sh << 'EOF'
#!/bin/bash
cd /opt/wylloh
docker-compose ps | grep -q "Up" || {
    echo "$(date): Services down, restarting..." >> /var/log/wylloh/monitor.log
    docker-compose up -d
}
EOF
    
    chmod +x /usr/local/bin/wylloh-monitor.sh
    
    # Add to crontab
    echo "*/5 * * * * /usr/local/bin/wylloh-monitor.sh" | crontab -
    
    print_success "Monitoring configured"
}

# Function to setup backups
setup_backups() {
    print_status "Setting up automated backups..."
    
    # Create backup script
    cat > /usr/local/bin/wylloh-backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/wylloh-backups"
DATE=$(date +%Y%m%d_%H%M%S)
cd /opt/wylloh

# Backup database
docker-compose exec -T mongodb mongodump --out /tmp/backup_$DATE
docker cp wylloh-mongodb:/tmp/backup_$DATE $BACKUP_DIR/

# Backup environment and configs
tar -czf $BACKUP_DIR/config_$DATE.tar.gz .env.production docker-compose.yml nginx/

# Clean old backups (keep 7 days)
find $BACKUP_DIR -name "backup_*" -mtime +7 -delete
find $BACKUP_DIR -name "config_*" -mtime +7 -delete

echo "$(date): Backup completed" >> /var/log/wylloh/backup.log
EOF
    
    chmod +x /usr/local/bin/wylloh-backup.sh
    
    # Add to crontab (daily at 2 AM)
    echo "0 2 * * * /usr/local/bin/wylloh-backup.sh" | crontab -
    
    print_success "Backup system configured"
}

# Function to perform health checks
health_check() {
    print_status "Performing health checks..."
    
    sleep 30  # Wait for services to start
    
    # Check Docker services
    if docker-compose -f $PROJECT_DIR/docker-compose.yml ps | grep -q "Up"; then
        print_success "Docker services are running"
    else
        print_error "Some Docker services are not running"
        docker-compose -f $PROJECT_DIR/docker-compose.yml ps
    fi
    
    # Check web accessibility
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        print_success "Web interface is accessible"
    else
        print_warning "Web interface may not be ready yet"
    fi
    
    # Check API
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        print_success "API is responding"
    else
        print_warning "API may not be ready yet"
    fi
    
    print_success "Health checks completed"
}

# Function to display final information
display_final_info() {
    print_success "Wylloh Platform deployment completed!"
    echo
    echo -e "${GREEN}=== DEPLOYMENT SUMMARY ===${NC}"
    echo -e "Domain: ${BLUE}$DOMAIN${NC}"
    echo -e "Project Directory: ${BLUE}$PROJECT_DIR${NC}"
    echo -e "Backup Directory: ${BLUE}$BACKUP_DIR${NC}"
    echo -e "Log File: ${BLUE}$LOG_FILE${NC}"
    echo
    echo -e "${GREEN}=== NEXT STEPS ===${NC}"
    echo -e "1. Edit environment file: ${BLUE}$PROJECT_DIR/.env.production${NC}"
    echo -e "2. Configure DNS to point to this server's IP"
    echo -e "3. Setup Cloudflare tunnel (optional)"
    echo -e "4. Test the platform at: ${BLUE}http://$DOMAIN${NC}"
    echo
    echo -e "${GREEN}=== USEFUL COMMANDS ===${NC}"
    echo -e "View logs: ${BLUE}docker-compose -f $PROJECT_DIR/docker-compose.yml logs -f${NC}"
    echo -e "Restart services: ${BLUE}docker-compose -f $PROJECT_DIR/docker-compose.yml restart${NC}"
    echo -e "Update platform: ${BLUE}cd $PROJECT_DIR && git pull && docker-compose build && docker-compose up -d${NC}"
    echo
}

# Main deployment function
main() {
    print_status "Starting Wylloh Platform VPS deployment..."
    
    check_root
    check_system
    update_system
    install_docker
    install_nodejs
    configure_firewall
    configure_fail2ban
    create_directories
    clone_repository
    setup_environment
    deploy_services
    setup_monitoring
    setup_backups
    health_check
    display_final_info
    
    print_success "Deployment completed successfully!"
}

# Run main function
main "$@" 