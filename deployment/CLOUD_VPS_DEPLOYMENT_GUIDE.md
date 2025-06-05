# Wylloh Platform - Cloud VPS Deployment Guide

## ☁️ Cloud VPS Alternative to Local Hardware

### Why Cloud VPS for Wylloh Beta Launch?

**Perfect Solution When Local Hardware Insufficient:**
- ✅ **Immediate deployment**: No hardware purchase needed
- ✅ **Professional infrastructure**: Better uptime than home setup
- ✅ **Global accessibility**: Access your platform from anywhere
- ✅ **Scalable**: Easy to upgrade resources as you grow
- ✅ **Cost effective**: $20-40/month vs $1000+ new computer
- ✅ **Backup & monitoring**: Professional data center reliability

## 🖥️ Recommended VPS Providers & Specs

### **Tier 1: Premium Providers (Recommended)**

#### **DigitalOcean** ⭐⭐⭐⭐⭐
- **Droplet**: CPU-Optimized 4 vCPU, 8GB RAM, 80GB SSD
- **Cost**: ~$40/month
- **Advantages**: Excellent documentation, 1-click Docker, managed databases
- **Perfect for**: Production-ready Wylloh deployment

#### **Linode** ⭐⭐⭐⭐⭐
- **Instance**: Dedicated CPU 4 core, 8GB RAM, 80GB SSD
- **Cost**: ~$36/month
- **Advantages**: High performance, excellent support, competitive pricing
- **Perfect for**: High-performance blockchain applications

#### **Vultr** ⭐⭐⭐⭐
- **Instance**: High Performance 4 vCPU, 8GB RAM, 80GB SSD
- **Cost**: ~$32/month
- **Advantages**: Global locations, good performance/price ratio

### **Tier 2: Budget Options**

#### **Hetzner** ⭐⭐⭐⭐
- **Instance**: CPX31 4 vCPU, 8GB RAM, 80GB SSD
- **Cost**: ~$20/month
- **Advantages**: Excellent value, European data centers
- **Note**: May have limited global reach

## 🚀 Cloud Deployment Process

### Step 1: VPS Setup (15 minutes)

#### **Create VPS Instance**
```bash
# Recommended specifications:
OS: Ubuntu 22.04 LTS
CPU: 4 vCPUs
RAM: 8GB
Storage: 80GB SSD
Network: 1Gbps
```

#### **Initial Server Setup**
```bash
# Connect to your VPS
ssh root@YOUR_VPS_IP

# Update system
apt update && apt upgrade -y

# Create deployment user
adduser wylloh
usermod -aG sudo wylloh
usermod -aG docker wylloh

# Switch to deployment user
su - wylloh
```

### Step 2: Install Dependencies (10 minutes)

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install additional tools
sudo apt install -y git curl wget htop nano

# Logout and login to apply docker group
exit
ssh wylloh@YOUR_VPS_IP
```

### Step 3: Clone Repository (5 minutes)

```bash
# Clone Wylloh platform
cd ~
git clone https://github.com/your-username/wylloh-platform.git
cd wylloh-platform

# Verify files
ls -la scripts/
ls -la deployment/
```

### Step 4: Configure Environment (10 minutes)

```bash
# Copy environment template
cp deployment/env.production.template .env.production

# Edit with your credentials
nano .env.production
```

**Required Configuration Values:**
- `MONGO_ROOT_PASSWORD`: Strong database password
- `JWT_SECRET`: Generate with: `openssl rand -base64 64`
- `ETHEREUM_RPC_URL`: Infura/Alchemy Ethereum endpoint
- `POLYGON_RPC_URL`: Infura/Alchemy Polygon endpoint
- `PRIVATE_KEY`: Your wallet private key (without 0x prefix)
- `PINATA_API_KEY`: Pinata IPFS service API key
- `PINATA_SECRET_API_KEY`: Pinata secret API key

### Step 5: Deploy Platform (20 minutes)

```bash
# Make deployment script executable
chmod +x scripts/deploy-imac.sh

# Run deployment (works on any Linux system)
./scripts/deploy-imac.sh
```

**The script will automatically:**
- ✅ Check VPS system requirements
- ✅ Optimize Docker settings for cloud environment
- ✅ Build all 9 Docker services
- ✅ Deploy and verify service health
- ✅ Create monitoring tools

## 🌐 Cloudflare Tunnel Setup for VPS

### Install Cloudflared on VPS

```bash
# Install cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# Authenticate with Cloudflare
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create wylloh-vps-production
```

### Configure Tunnel

```bash
# Create config directory
mkdir -p ~/.cloudflared

# Copy and edit tunnel configuration
cp deployment/cloudflare-tunnel-config.yml ~/.cloudflared/config.yml
nano ~/.cloudflared/config.yml
```

**Update tunnel configuration:**
- Replace `YOUR_TUNNEL_ID_HERE` with your actual tunnel ID
- Replace `YOUR_USERNAME` with `wylloh` (VPS user)
- Verify all service ports match your deployment

### Start Tunnel Service

```bash
# Test tunnel
cloudflared tunnel run wylloh-vps-production

# Install as system service
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

## 📊 VPS Monitoring & Management

### System Monitoring

```bash
# Run system status check
./monitor-system.sh

# Monitor Docker resource usage
docker stats

# Check system resources
htop
df -h
```

### Remote Management from 2013 MacBook Pro

```bash
# SSH into your VPS from MacBook Pro
ssh wylloh@YOUR_VPS_IP

# Monitor services remotely
docker-compose ps
docker-compose logs -f api

# Update deployment remotely
git pull
docker-compose build --no-cache
docker-compose up -d
```

### VPS-Specific Optimizations

#### **Firewall Configuration**
```bash
# Configure UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

#### **Automatic Updates**
```bash
# Enable automatic security updates
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

#### **Backup Strategy**
```bash
# Create backup script
cat > ~/backup-wylloh.sh << 'EOF'
#!/bin/bash
# Backup Wylloh platform data

# Backup database
docker exec wylloh-mongodb mongodump --out /tmp/backup-$(date +%Y%m%d)

# Backup IPFS data
docker exec wylloh-ipfs tar -czf /tmp/ipfs-backup-$(date +%Y%m%d).tar.gz /data/ipfs

# Backup configuration
tar -czf /tmp/config-backup-$(date +%Y%m%d).tar.gz ~/.cloudflared/ ~/wylloh-platform/.env.production

echo "Backup completed: $(date)"
EOF

chmod +x ~/backup-wylloh.sh

# Schedule daily backups
(crontab -l 2>/dev/null; echo "0 2 * * * /home/wylloh/backup-wylloh.sh") | crontab -
```

## 💰 Cost Analysis

### **Monthly VPS Costs:**
- **DigitalOcean**: $40/month (CPU-Optimized)
- **Linode**: $36/month (Dedicated CPU)
- **Vultr**: $32/month (High Performance)
- **Hetzner**: $20/month (Budget option)

### **vs Hardware Purchase:**
- **New Mac Mini M2**: $600 (15 months of VPS cost)
- **Used MacBook Pro**: $800-1200 (20-30 months of VPS cost)
- **Raspberry Pi 4 + accessories**: $150 (4 months of VPS cost)

### **Break-even Analysis:**
- **If beta launch successful**: VPS pays for itself through user growth
- **If need to pivot**: No hardware investment lost
- **Future scaling**: Easy to upgrade VPS resources

## 🔧 VPS Troubleshooting

### **Common VPS Issues**

#### **High Memory Usage**
```bash
# Check memory usage
free -h
docker stats

# Reduce Docker memory if needed
# Edit docker-compose.yml to add memory limits
```

#### **Disk Space Issues**
```bash
# Clean Docker resources
docker system prune -a
docker volume prune

# Check disk usage
df -h
du -sh ~/wylloh-platform/*
```

#### **Network Connectivity**
```bash
# Test connectivity
ping 8.8.8.8
curl http://localhost:3000
curl http://localhost:3001/health

# Check firewall
sudo ufw status
```

### **Performance Optimization**

#### **Database Tuning**
```bash
# MongoDB optimization for VPS
# Add to docker-compose.yml mongodb service:
command: mongod --wiredTigerCacheSizeGB 2 --wiredTigerCollectionBlockCompressor snappy
```

#### **IPFS Optimization**
```bash
# Reduce IPFS memory usage
# Add to docker-compose.yml ipfs service:
environment:
  - IPFS_PROFILE=lowpower
```

## 🚀 Launch Strategy with VPS

### **Phase 1: Immediate Beta Launch (Week 1)**
1. ✅ Deploy to VPS within 24 hours
2. ✅ Configure Cloudflare tunnel
3. ✅ Launch beta at wylloh.com
4. ✅ Monitor from 2013 MacBook Pro via SSH

### **Phase 2: Optimization (Week 2-4)**
1. Monitor performance and user feedback
2. Optimize based on real usage patterns
3. Implement automated backups and monitoring
4. Scale VPS resources if needed

### **Phase 3: Growth Planning (Month 2+)**
1. Evaluate user growth and revenue
2. Consider dedicated server or multi-region deployment
3. Plan hardware purchase if revenue supports it
4. Implement advanced features and scaling

## 📞 VPS Deployment Support

### **Advantages of VPS Approach:**
✅ **Immediate launch capability**: Deploy within hours, not days  
✅ **Professional infrastructure**: Data center reliability and uptime  
✅ **Global accessibility**: Manage from anywhere with internet  
✅ **Scalable growth**: Easy resource upgrades as platform grows  
✅ **Cost predictable**: Fixed monthly cost, no surprise hardware failures  

### **Perfect for Wylloh Beta:**
- **Blockchain applications**: Require 24/7 uptime and reliability
- **IPFS nodes**: Benefit from data center bandwidth and connectivity
- **Global users**: Need consistent performance worldwide
- **Professional image**: wylloh.com hosted on professional infrastructure

**Recommendation: Start with DigitalOcean $40/month VPS for immediate beta launch, then evaluate hardware purchase after validating market demand and revenue.** 