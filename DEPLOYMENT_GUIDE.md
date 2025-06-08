# 🚀 Wylloh Platform - First-Time VPS Deployment Guide

**Welcome to your first production deployment!** This guide will walk you through launching Wylloh Platform on a VPS with **$0 launch costs** and **rapid scaling capability**.

## 📋 **Pre-Deployment Checklist**

### **Required Accounts (All Free Tier)**
- [ ] **DigitalOcean Account** - $200 free credit
- [ ] **Domain Name** - ~$10-15/year (only real cost)
- [ ] **Infura Account** - 100K requests/day free
- [ ] **Pinata Account** - 1GB storage free
- [ ] **GitHub Account** - For code repository

### **Information You'll Need**
- [ ] Domain name (e.g., `wylloh.com`)
- [ ] Ethereum wallet private key (for contract deployment)
- [ ] Strong passwords for database and JWT

---

## 🏗️ **Step-by-Step Deployment**

### **Step 1: Create VPS Instance**

1. **Sign up for DigitalOcean**
   - Use referral link for $200 free credit
   - Verify email and add payment method (won't be charged with credit)

2. **Create Droplet**
   ```
   Image: Ubuntu 22.04 LTS
   Plan: Basic $4/month (1GB RAM, 1 vCPU, 25GB SSD)
   Region: Choose closest to your target audience
   Authentication: SSH Key (recommended) or Password
   Hostname: wylloh-production
   ```

3. **Note your VPS IP address** - You'll need this for DNS

### **Step 2: Configure Domain**

1. **Purchase domain** from Namecheap, GoDaddy, etc.
2. **Add DNS records** pointing to your VPS IP:
   ```
   Type    Name        Value           TTL
   A       @           YOUR_VPS_IP     300
   A       www         YOUR_VPS_IP     300  
   A       api         YOUR_VPS_IP     300
   A       storage     YOUR_VPS_IP     300
   A       ipfs        YOUR_VPS_IP     300
   ```

### **Step 3: Setup External Services**

#### **Infura Setup**
1. Go to [infura.io](https://infura.io) → Create account
2. Create new project → Copy Project ID
3. Enable Polygon network in project settings
4. Your URLs will be:
   ```
   Ethereum: https://mainnet.infura.io/v3/YOUR_PROJECT_ID
   Polygon: https://polygon-mainnet.infura.io/v3/YOUR_PROJECT_ID
   ```

#### **Pinata Setup**
1. Go to [pinata.cloud](https://pinata.cloud) → Create account
2. Go to API Keys → Generate new key
3. Select "Admin" permissions
4. Copy API Key and Secret API Key

### **Step 4: Prepare VPS**

1. **Connect to your VPS**
   ```bash
   ssh root@YOUR_VPS_IP
   # or
   ssh -i your-key.pem ubuntu@YOUR_VPS_IP
   ```

2. **Create non-root user** (if using root)
   ```bash
   adduser wylloh
   usermod -aG sudo wylloh
   su - wylloh
   ```

3. **Run VPS setup script**
   ```bash
   curl -fsSL https://raw.githubusercontent.com/YOUR_USERNAME/wylloh-platform/main/scripts/vps-setup.sh | bash
   ```

4. **Log out and back in** (for Docker group changes)
   ```bash
   exit
   ssh wylloh@YOUR_VPS_IP
   ```

### **Step 5: Deploy Wylloh Platform**

1. **Clone repository**
   ```bash
   cd /opt/wylloh
   git clone https://github.com/YOUR_USERNAME/wylloh-platform.git .
   ```

2. **Configure environment**
   ```bash
   cp env.production.template .env
   nano .env
   ```

3. **Fill in your actual values**
   ```env
   # Database
   MONGO_ROOT_PASSWORD=your-super-secure-password-here
   
   # Security
   JWT_SECRET=your-32-character-secret-key-here
   
   # Blockchain
   ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
   POLYGON_RPC_URL=https://polygon-mainnet.infura.io/v3/YOUR_PROJECT_ID
   PRIVATE_KEY=your-ethereum-private-key-here
   
   # IPFS
   PINATA_API_KEY=your-pinata-api-key
   PINATA_SECRET_API_KEY=your-pinata-secret-key
   
   # Domain
   CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
   REACT_APP_API_URL=https://api.yourdomain.com
   REACT_APP_STORAGE_URL=https://storage.yourdomain.com
   REACT_APP_IPFS_GATEWAY=https://ipfs.yourdomain.com
   ```

4. **Generate SSL certificates**
   ```bash
   sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com -d storage.yourdomain.com -d ipfs.yourdomain.com
   ```

5. **Copy SSL certificates**
   ```bash
   sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/yourdomain.com.crt
   sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/yourdomain.com.key
   sudo chown $USER:$USER nginx/ssl/*
   ```

6. **Deploy the platform**
   ```bash
   ./scripts/deploy-production.sh
   ```

### **Step 6: Verify Deployment**

1. **Check service status**
   ```bash
   docker-compose ps
   ./monitor.sh
   ```

2. **Test endpoints**
   ```bash
   curl -f https://yourdomain.com
   curl -f https://api.yourdomain.com/health
   curl -f https://storage.yourdomain.com/health
   ```

3. **View logs if needed**
   ```bash
   docker-compose logs -f api
   docker-compose logs -f client
   ```

---

## 💰 **Cost Breakdown**

### **Launch Costs (Month 1)**
- **VPS**: $0 (using $200 credit)
- **Domain**: $10-15 (annual)
- **Infura**: $0 (free tier)
- **Pinata**: $0 (free tier)
- **Total**: ~$10-15

### **Scaling Path**
```
Validation Phase:    $4/month  (1GB RAM)  → 100 users
Growth Phase:        $12/month (2GB RAM)  → 1,000 users  
Scale Phase:         $24/month (4GB RAM)  → 10,000 users
Enterprise Phase:    $48/month (8GB RAM)  → 100,000+ users
```

### **Revenue Sustainability**
With 2.5% platform fee:
- **100 users** × $10/month avg = $25 revenue → $1,000/month
- **Break-even**: ~40 active users
- **Profitable**: 100+ users

---

## 🔧 **Post-Deployment Management**

### **Daily Operations**
```bash
# Check status
./monitor.sh

# View logs
docker-compose logs -f

# Restart services
docker-compose restart api

# Update platform
git pull && docker-compose up -d --build
```

### **Backup & Security**
```bash
# Manual backup
./backup.sh

# View security logs
sudo fail2ban-client status

# Update SSL certificates (auto-renewal)
sudo certbot renew --dry-run
```

### **Scaling Up**
When you need more resources:
1. **Resize droplet** in DigitalOcean dashboard
2. **Restart services**: `docker-compose restart`
3. **No code changes needed**

---

## 🆘 **Troubleshooting**

### **Common Issues**

**Services won't start:**
```bash
# Check Docker
sudo systemctl status docker

# Check logs
docker-compose logs api
```

**SSL certificate issues:**
```bash
# Regenerate certificates
sudo certbot delete --cert-name yourdomain.com
sudo certbot certonly --standalone -d yourdomain.com
```

**Database connection issues:**
```bash
# Check MongoDB
docker-compose exec mongodb mongosh
```

### **Getting Help**
- **Platform logs**: `docker-compose logs -f`
- **System logs**: `sudo journalctl -f`
- **Resource usage**: `htop`
- **Disk space**: `df -h`

---

## 🎉 **Success Checklist**

- [ ] Website loads at `https://yourdomain.com`
- [ ] Beta indicator visible in navigation
- [ ] Wallet connection works
- [ ] API health check returns 200
- [ ] SSL certificates valid
- [ ] All Docker services running
- [ ] Monitoring dashboard accessible
- [ ] Backup script working

**Congratulations! Your Wylloh Platform is now live! 🚀**

---

## 📞 **Support**

If you encounter issues:
1. Check the troubleshooting section above
2. Review Docker logs: `docker-compose logs -f`
3. Check system resources: `./monitor.sh`
4. Verify environment variables in `.env`

**Remember**: You have $200 in DigitalOcean credits, so you can experiment freely without cost concerns! 