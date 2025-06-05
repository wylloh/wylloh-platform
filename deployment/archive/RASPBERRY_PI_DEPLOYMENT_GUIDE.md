# Wylloh Platform - Raspberry Pi 4 Deployment Guide

## 🍓 Raspberry Pi 4 Test Deployment

### Why Raspberry Pi 4 for Test Phase?

**Perfect for Immediate Test Deployment:**
- ✅ **No code changes needed**: Existing Docker Compose works on ARM64
- ✅ **Immediate deployment**: No waiting, no monthly VPS costs
- ✅ **Real testing**: Full multi-service deployment experience
- ✅ **Learning opportunity**: Understand platform resource requirements
- ✅ **Risk-free**: Test before committing to VPS or hardware purchase

### **Hardware Requirements**
- **Raspberry Pi 4 (8GB RAM)** - Recommended for all 9 services
- **External SSD**: 128GB+ USB 3.0 SSD (CRITICAL for performance)
- **Quality Power Supply**: Official Pi 4 power adapter
- **Ethernet Connection**: Wired internet for stability
- **Active Cooling**: Fan or heatsink for sustained loads

## 🔧 Raspberry Pi 4 Setup (No Code Changes)

### Step 1: Operating System Setup (20 minutes)

#### **Install Raspberry Pi OS 64-bit**
```bash
# Use Raspberry Pi Imager to install:
# Raspberry Pi OS (64-bit) - Full desktop version
# Enable SSH in advanced options
# Set username: wylloh, password: [your choice]
```

#### **Initial System Configuration**
```bash
# SSH into your Pi
ssh wylloh@YOUR_PI_IP

# Update system
sudo apt update && sudo apt upgrade -y

# Configure memory split (reduce GPU memory)
sudo raspi-config
# Advanced Options > Memory Split > Set to 16MB

# Enable container features
echo 'cgroup_enable=cpuset cgroup_enable=memory cgroup_memory=1' | sudo tee -a /boot/cmdline.txt

# Reboot to apply changes
sudo reboot
```

### Step 2: Storage Optimization (15 minutes)

#### **Mount External SSD (CRITICAL)**
```bash
# Connect USB 3.0 SSD to Pi
# Identify the SSD
lsblk

# Format SSD (assuming /dev/sda)
sudo mkfs.ext4 /dev/sda1

# Create mount point
sudo mkdir /mnt/ssd

# Mount SSD
sudo mount /dev/sda1 /mnt/ssd

# Add to fstab for permanent mount
echo '/dev/sda1 /mnt/ssd ext4 defaults 0 2' | sudo tee -a /etc/fstab

# Create Docker data directory on SSD
sudo mkdir -p /mnt/ssd/docker
sudo chown wylloh:wylloh /mnt/ssd/docker
```

### Step 3: Docker Installation (10 minutes)

```bash
# Install Docker (ARM64 compatible)
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo usermod -aG docker wylloh

# Install Docker Compose
sudo pip3 install docker-compose

# Configure Docker to use SSD
sudo mkdir -p /etc/docker
cat << EOF | sudo tee /etc/docker/daemon.json
{
  "data-root": "/mnt/ssd/docker",
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2"
}
EOF

# Restart Docker
sudo systemctl restart docker

# Logout and login to apply docker group
exit
ssh wylloh@YOUR_PI_IP
```

### Step 4: Clone Repository (5 minutes)

```bash
# Clone Wylloh platform to SSD
cd /mnt/ssd
git clone https://github.com/your-username/wylloh-platform.git
cd wylloh-platform

# Verify all files present
ls -la scripts/
ls -la deployment/
```

### Step 5: Pi-Specific Environment Configuration (10 minutes)

```bash
# Copy environment template
cp deployment/env.production.template .env.production

# Edit with your credentials
nano .env.production
```

**Pi-Specific Environment Additions:**
```bash
# Add these Pi optimizations to .env.production
DOCKER_CPU_LIMIT=3
DOCKER_MEMORY_LIMIT=6g
LOG_MAX_SIZE=10m
LOG_MAX_FILES=2

# Reduce resource usage
MONGODB_CACHE_SIZE=512
IPFS_PROFILE=lowpower
```

### Step 6: Pi-Optimized Docker Compose (No Code Changes)

Create a Pi-specific override file:

```bash
# Create docker-compose.pi.yml
cat > docker-compose.pi.yml << 'EOF'
version: '3.8'

services:
  # MongoDB with reduced cache
  mongodb:
    command: mongod --wiredTigerCacheSizeGB 0.5 --wiredTigerCollectionBlockCompressor snappy
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M

  # Redis with memory limit
  redis:
    deploy:
      resources:
        limits:
          memory: 256M

  # IPFS with low-power profile
  ipfs:
    environment:
      - IPFS_PROFILE=lowpower
    deploy:
      resources:
        limits:
          memory: 512M

  # API with memory limit
  api:
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M

  # Storage service with memory limit
  storage:
    deploy:
      resources:
        limits:
          memory: 512M

  # Frontend with memory limit
  client:
    deploy:
      resources:
        limits:
          memory: 256M

  # Skip Prometheus and Grafana for Pi deployment
  prometheus:
    profiles: ["monitoring"]
    
  grafana:
    profiles: ["monitoring"]
EOF
```

### Step 7: Deploy on Raspberry Pi (30 minutes)

```bash
# Deploy with Pi optimizations
docker-compose -f docker-compose.yml -f docker-compose.pi.yml up -d

# Monitor deployment progress
docker-compose logs -f

# Check service status
docker-compose ps
```

## 📊 Pi Performance Monitoring

### **Resource Monitoring**
```bash
# Create Pi monitoring script
cat > monitor-pi.sh << 'EOF'
#!/bin/bash
echo "=== Raspberry Pi 4 - Wylloh Platform Status ==="
echo "Timestamp: $(date)"
echo ""

echo "=== System Resources ==="
echo "CPU Temperature: $(vcgencmd measure_temp)"
echo "CPU Usage:"
top -bn1 | grep "Cpu(s)"

echo ""
echo "Memory Usage:"
free -h

echo ""
echo "Disk Usage:"
df -h /mnt/ssd

echo ""
echo "=== Docker Container Status ==="
docker-compose ps

echo ""
echo "=== Docker Resource Usage ==="
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"

echo ""
echo "=== Service Health ==="
curl -s http://localhost:3001/health 2>/dev/null || echo "API: Not responding"
curl -s http://localhost:3002/health 2>/dev/null || echo "Storage: Not responding"
curl -s http://localhost:3000 2>/dev/null | head -1 || echo "Frontend: Not responding"
EOF

chmod +x monitor-pi.sh
```

### **Temperature Management**
```bash
# Monitor CPU temperature
watch -n 5 vcgencmd measure_temp

# If temperature > 70°C, consider:
# 1. Adding active cooling (fan)
# 2. Reducing container resource limits
# 3. Improving ventilation
```

## 🌐 Cloudflare Tunnel on Pi

### **Install Cloudflared (ARM64)**
```bash
# Download ARM64 version
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb
sudo dpkg -i cloudflared-linux-arm64.deb

# Configure tunnel (same process as other platforms)
cloudflared tunnel login
cloudflared tunnel create wylloh-pi-test
```

## 🔧 Pi-Specific Troubleshooting

### **Common Pi Issues**

#### **1. Memory Pressure**
```bash
# If containers are killed (OOMKilled)
# Reduce memory limits in docker-compose.pi.yml
# Or disable monitoring services:
docker-compose --profile monitoring down
```

#### **2. Storage Performance**
```bash
# Verify SSD is being used
df -h
lsblk

# Test SSD speed
sudo hdparm -t /dev/sda1
# Should show >100 MB/s for decent SSD
```

#### **3. ARM64 Image Issues**
```bash
# If specific service fails to start
docker-compose logs [service_name]

# Most modern images support ARM64, but if not:
# Check Docker Hub for ARM64 variants
```

#### **4. Overheating**
```bash
# Monitor temperature
vcgencmd measure_temp

# If >80°C, add cooling or reduce load
# Temporary fix: reduce CPU limit
```

### **Performance Optimization**

#### **1. Disable Unnecessary Services**
```bash
# For testing, you can disable monitoring
docker-compose --profile monitoring down

# This saves ~500MB RAM
```

#### **2. Optimize Container Startup**
```bash
# Start services sequentially to reduce initial load
docker-compose up -d mongodb redis
sleep 30
docker-compose up -d ipfs
sleep 30
docker-compose up -d api storage
sleep 30
docker-compose up -d client nginx
```

## 🎯 Pi Test Deployment Strategy

### **Phase 1: Basic Functionality Test (Week 1)**
- ✅ Deploy all core services
- ✅ Test wallet connection and basic functionality
- ✅ Monitor resource usage and performance
- ✅ Identify bottlenecks and limitations

### **Phase 2: Load Testing (Week 2)**
- Test with multiple concurrent users
- Monitor system stability under load
- Document performance characteristics
- Plan optimizations or VPS migration

### **Phase 3: Decision Point (Week 3)**
- **If Pi performs adequately**: Continue with Pi for extended testing
- **If Pi struggles**: Migrate to VPS with confidence in requirements
- **If Pi works well**: Consider Pi cluster or upgrade to more powerful hardware

## 💡 **Pi Deployment Advantages**

### **For Test Phase:**
- ✅ **Immediate deployment**: Start testing today
- ✅ **No monthly costs**: One-time hardware investment
- ✅ **Real-world testing**: Understand actual resource needs
- ✅ **Learning experience**: Gain deployment and optimization skills
- ✅ **Fallback ready**: VPS deployment guide already prepared

### **Performance Expectations:**
- **Build Time**: 20-30 minutes (slower than x86)
- **Service Startup**: 2-3 minutes for all containers
- **Memory Usage**: 4-5GB for all services
- **CPU Usage**: 70-90% during builds, 30-50% during operation
- **Suitable for**: 1-10 concurrent users for testing

## 📞 **Pi Deployment Recommendation**

**YES, deploy on Pi 4 immediately!** Here's why:

1. **No code changes needed** - Your existing Docker Compose works
2. **Immediate testing** - Start validating your platform today
3. **Real resource understanding** - Learn what your platform actually needs
4. **Risk-free** - If it doesn't work well, VPS is ready as backup
5. **Cost-effective** - No monthly fees during test phase

**Timeline**: You could have Wylloh running on your Pi within 2-3 hours!

Would you like me to walk you through the Pi deployment process, or do you have questions about any specific steps? 