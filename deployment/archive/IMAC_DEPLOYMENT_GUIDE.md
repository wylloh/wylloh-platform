# Wylloh Platform - iMac Deployment Guide

## 🖥️ Hardware Requirements & Optimization

### Recommended iMac Specifications
- **2013 iMac or newer** (recommended over Raspberry Pi 4)
- **Minimum 8GB RAM** (16GB+ preferred)
- **50GB+ free disk space**
- **Stable internet connection** for Cloudflare Tunnel

### Pre-Deployment System Preparation

1. **Update macOS**
   ```bash
   # Check current version
   sw_vers -productVersion
   
   # Update to latest compatible version
   # Go to System Preferences > Software Update
   ```

2. **Free Up Disk Space**
   ```bash
   # Check available space
   df -h /
   
   # Clean up if needed
   sudo rm -rf ~/.Trash/*
   docker system prune -a  # If Docker already installed
   ```

3. **Install Homebrew** (if not already installed)
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

## 🐳 Docker Installation & Configuration

### 1. Install Docker Desktop
```bash
# Download from https://www.docker.com/products/docker-desktop
# Or install via Homebrew
brew install --cask docker
```

### 2. Configure Docker for iMac Performance
Open Docker Desktop → Settings → Resources:

- **CPUs**: 4 cores (leave 1-2 for macOS)
- **Memory**: 8GB (adjust based on total RAM)
- **Disk**: 40GB minimum
- **Swap**: 2GB

### 3. Enable BuildKit for Faster Builds
```bash
# Add to ~/.docker/daemon.json
{
  "features": {
    "buildkit": true
  },
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m",
    "max-file": "5"
  }
}
```

## 🚀 Deployment Process

### Step 1: Clone Repository
```bash
cd ~/Documents
git clone https://github.com/your-username/wylloh-platform.git
cd wylloh-platform
```

### Step 2: Configure Environment
```bash
# Copy environment template
cp deployment/env.production.template .env.production

# Edit with your actual values
nano .env.production
```

**Required Configuration Values:**
- `MONGO_ROOT_PASSWORD`: Strong database password
- `JWT_SECRET`: Long random string for JWT signing
- `ETHEREUM_RPC_URL`: Infura/Alchemy Ethereum endpoint
- `POLYGON_RPC_URL`: Infura/Alchemy Polygon endpoint
- `PRIVATE_KEY`: Wallet private key (without 0x prefix)
- `PINATA_API_KEY`: Pinata IPFS service API key
- `PINATA_SECRET_API_KEY`: Pinata secret key

### Step 3: Run Deployment Script
```bash
# Make script executable
chmod +x scripts/deploy-imac.sh

# Run deployment
./scripts/deploy-imac.sh
```

The script will:
- ✅ Check system requirements
- ✅ Optimize Docker settings
- ✅ Set up environment configuration
- ✅ Install Cloudflare tunnel
- ✅ Build and deploy all services
- ✅ Verify service health
- ✅ Create monitoring tools

## 🌐 Cloudflare Tunnel Setup

### 1. Install Cloudflared
```bash
brew install cloudflare/cloudflare/cloudflared
```

### 2. Authenticate with Cloudflare
```bash
cloudflared tunnel login
```

### 3. Create Tunnel
```bash
cloudflared tunnel create wylloh-production
```

### 4. Configure Tunnel Routing
```bash
# Copy template configuration
cp deployment/cloudflare-tunnel-config.yml ~/.cloudflared/config.yml

# Edit with your tunnel ID and username
nano ~/.cloudflared/config.yml
```

### 5. Configure DNS Records
In Cloudflare Dashboard, add CNAME records:
- `wylloh.com` → `YOUR_TUNNEL_ID.cfargotunnel.com`
- `www.wylloh.com` → `YOUR_TUNNEL_ID.cfargotunnel.com`
- `api.wylloh.com` → `YOUR_TUNNEL_ID.cfargotunnel.com`
- `storage.wylloh.com` → `YOUR_TUNNEL_ID.cfargotunnel.com`
- `ipfs.wylloh.com` → `YOUR_TUNNEL_ID.cfargotunnel.com`

### 6. Start Tunnel
```bash
# Test tunnel
cloudflared tunnel run wylloh-production

# Install as service (auto-start on boot)
sudo cloudflared service install
```

## 📊 Monitoring & Maintenance

### System Monitoring
```bash
# Run system status check
./monitor-system.sh

# Check Docker resource usage
docker stats

# Monitor system resources
top -o cpu
```

### Service Management
```bash
# View all services
docker-compose ps

# View logs
docker-compose logs -f [service_name]

# Restart specific service
docker-compose restart [service_name]

# Update and redeploy
git pull
docker-compose build --no-cache
docker-compose up -d
```

### Access Points
- **Frontend**: http://localhost:3000 (or https://wylloh.com)
- **API**: http://localhost:3001 (or https://api.wylloh.com)
- **Storage**: http://localhost:3002 (or https://storage.wylloh.com)
- **IPFS Gateway**: http://localhost:8080 (or https://ipfs.wylloh.com)
- **Grafana**: http://localhost:3003 (admin/wylloh2024!)
- **Prometheus**: http://localhost:9090

## 🔧 Troubleshooting

### Common Issues

#### 1. Docker Build Fails
```bash
# Clean Docker cache
docker system prune -a
docker builder prune

# Increase Docker memory allocation
# Docker Desktop → Settings → Resources → Memory: 8GB+
```

#### 2. Services Won't Start
```bash
# Check logs
docker-compose logs [service_name]

# Check available ports
lsof -i :3000
lsof -i :3001
lsof -i :3002

# Restart Docker Desktop
```

#### 3. High CPU/Memory Usage
```bash
# Monitor resource usage
docker stats

# Reduce container limits in docker-compose.yml
# Close unnecessary macOS applications
```

#### 4. Disk Space Issues
```bash
# Clean Docker resources
docker system prune -a
docker volume prune

# Clean macOS cache
sudo rm -rf ~/Library/Caches/*
```

#### 5. Cloudflare Tunnel Issues
```bash
# Check tunnel status
cloudflared tunnel info wylloh-production

# Test local connectivity
curl http://localhost:3000

# Restart tunnel service
sudo launchctl unload /Library/LaunchDaemons/com.cloudflare.cloudflared.plist
sudo launchctl load /Library/LaunchDaemons/com.cloudflare.cloudflared.plist
```

### Performance Optimization

#### 1. iMac-Specific Optimizations
- **Thermal Management**: Ensure proper ventilation
- **Background Apps**: Close unnecessary applications
- **Storage**: Use external SSD for Docker volumes if needed
- **Memory**: Allocate maximum available RAM to Docker

#### 2. Docker Optimizations
```bash
# Enable experimental features
echo '{"experimental": true}' > ~/.docker/daemon.json

# Use multi-stage builds for smaller images
# Implement in Dockerfiles

# Regular cleanup
docker system prune -f
```

#### 3. Database Optimization
```bash
# MongoDB performance tuning
# Add to docker-compose.yml mongodb service:
command: mongod --wiredTigerCacheSizeGB 2
```

## 🔒 Security Considerations

### 1. Environment Variables
- Never commit `.env.production` to version control
- Use strong, unique passwords
- Rotate secrets regularly

### 2. Firewall Configuration
```bash
# macOS firewall (optional)
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate on
```

### 3. SSL/TLS
- Cloudflare provides automatic SSL termination
- Ensure "Full (Strict)" SSL mode in Cloudflare

### 4. Access Control
- Limit admin access to monitoring endpoints
- Use strong Grafana passwords
- Consider VPN for admin access

## 📋 Maintenance Schedule

### Daily
- Monitor system resources
- Check service health
- Review error logs

### Weekly
- Update Docker images
- Clean unused Docker resources
- Backup database

### Monthly
- Update macOS and dependencies
- Review security settings
- Performance optimization review

## 🆘 Emergency Procedures

### Service Outage
1. Check system resources: `./monitor-system.sh`
2. Restart affected services: `docker-compose restart [service]`
3. Check Cloudflare tunnel: `cloudflared tunnel info wylloh-production`
4. Review logs: `docker-compose logs -f`

### Data Recovery
1. Database backup: `docker exec wylloh-mongodb mongodump`
2. IPFS data: Located in Docker volume `ipfs_data`
3. Configuration backup: `.env.production` and `~/.cloudflared/`

### Complete System Recovery
1. Stop all services: `docker-compose down`
2. Restore from backup
3. Redeploy: `./scripts/deploy-imac.sh`
4. Reconfigure Cloudflare tunnel

---

## 📞 Support

For deployment issues:
1. Check this guide first
2. Review Docker and Cloudflare documentation
3. Monitor system resources and logs
4. Consider hardware limitations of 2013 iMac

**Remember**: The 2013 iMac provides significantly better performance than Raspberry Pi 4 for this multi-service blockchain platform, but proper resource management is still essential for optimal performance. 