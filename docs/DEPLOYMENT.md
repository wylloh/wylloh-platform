# Wylloh Platform - Deployment Guide

## 🚀 Production Deployment

The Wylloh Platform uses **automated CI/CD deployment** to a DigitalOcean VPS with **Docker orchestration**.

## 🏗️ Infrastructure Overview

### **Production Environment**
- **VPS**: DigitalOcean Droplet (2 vCPU, 4GB RAM)
- **OS**: Ubuntu 22.04 LTS
- **Container Platform**: Docker + Docker Compose
- **Reverse Proxy**: nginx with SSL/TLS
- **Domain**: wylloh.com (Cloudflare DNS)

### **Service Architecture**
```
Internet → Cloudflare → nginx (80/443) → Docker Services
                          ├── Client (React) :3000
                          ├── API (Node.js) :3001
                          ├── Storage (IPFS) :3002
                          ├── MongoDB :27017
                          ├── Redis :6379
                          └── IPFS Node :5001/:8080
```

## 🤖 CI/CD Pipeline

### **Automated Deployment**
- **Trigger**: Push to `main` branch
- **Workflow**: `.github/workflows/build-and-test.yml`
- **Process**: Code → Build → Test → Docker → VPS Deploy
- **Monitoring**: https://github.com/wylloh/wylloh-platform/actions

### **Deployment Stages**
1. **Quality Checks**: ESLint, TypeScript compilation
2. **Service Builds**: Compile all TypeScript services  
3. **Docker Images**: Build with root context pattern
4. **VPS Transfer**: Copy images to production server
5. **Container Deploy**: docker-compose deployment
6. **Health Checks**: Verify service startup

## 🔧 VPS Management

### **SSH Access**
```bash
# Connect to VPS
ssh -i ~/.ssh/wylloh_vps wylloh@138.197.232.48

# Check service status
docker ps
docker-compose ps
```

### **Service Management**
```bash
# View all containers
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Check service logs
docker logs wylloh-client
docker logs wylloh-api
docker logs wylloh-storage
docker logs wylloh-nginx

# Restart services
docker-compose restart [service]
docker-compose restart api storage

# Full restart
docker-compose down && docker-compose up -d
```

### **Monitoring Commands**
```bash
# Resource usage
docker stats

# Disk usage
df -h
docker system df

# Service health
curl http://localhost:3001/health  # API health
curl http://localhost:3002/health  # Storage health
curl http://localhost/             # Frontend check
```

## 🔍 Troubleshooting

### **Common Issues**

#### **Container Restart Loops**
```bash
# Check logs for errors
docker logs wylloh-[service] --tail 50

# Common causes:
# - Missing environment variables
# - Port conflicts
# - DNS resolution errors
# - TypeScript compilation failures
```

#### **Build Failures**
```bash
# Check GitHub Actions logs
# Look for:
# - Docker build context errors
# - Package manager conflicts (npm vs yarn)
# - Missing dependencies
# - TypeScript compilation errors
```

#### **DNS/nginx Issues**
```bash
# Test nginx config
docker exec wylloh-nginx nginx -t

# Check upstream resolution
docker exec wylloh-nginx nslookup wylloh-api
docker exec wylloh-nginx nslookup wylloh-client

# Restart nginx
docker-compose restart nginx
```

#### **Database Connection Issues**
```bash
# Check MongoDB status
docker logs wylloh-mongodb

# Test connection
docker exec wylloh-mongodb mongosh --eval "db.stats()"

# Check Redis
docker exec wylloh-redis redis-cli ping
```

### **Performance Issues**

#### **High CPU/Memory**
```bash
# Check resource usage
htop
docker stats

# Common causes:
# - IPFS initial sync (temporary)
# - Database indexing
# - Multiple TypeScript compilations
```

#### **Disk Space**
```bash
# Clean Docker cache
docker system prune -a

# Clean old images
docker image prune -a

# Check largest directories
du -sh /* | sort -hr
```

## 🛡️ Security & Maintenance

### **Environment Variables**
- **Storage**: GitHub Secrets (secure)
- **Deployment**: Automated transfer to VPS
- **Never**: Commit secrets to repository

### **SSL/TLS Certificates**
- **Provider**: Cloudflare (automatic renewal)
- **Backup**: Let's Encrypt (manual fallback)
- **Monitoring**: Certificate expiration alerts

### **Updates & Patches**
```bash
# Update system packages
sudo apt update && sudo apt upgrade

# Update Docker images
docker-compose pull
docker-compose up -d

# Monitor for security advisories
npm audit (local development)
```

## 📊 Monitoring & Alerting

### **Health Checks**
- **API**: `/health` endpoint
- **Storage**: `/health` endpoint  
- **Client**: HTTP 200 response
- **Database**: Connection tests

### **Key Metrics**
- **Response Time**: < 500ms for API calls
- **Uptime**: 99.9% target
- **Resource Usage**: < 80% CPU/Memory
- **Disk Space**: < 80% full

### **Alert Channels**
- **GitHub Actions**: Build/deploy failures
- **VPS Monitoring**: Resource alerts
- **External**: UptimeRobot (website monitoring)

## 🚨 Emergency Procedures

### **Service Outage**
1. **Check VPS Status**: SSH connectivity
2. **Restart Services**: `docker-compose restart`
3. **Check Logs**: Identify root cause
4. **Rollback**: Deploy previous working commit
5. **DNS**: Verify Cloudflare configuration

### **Data Recovery**
- **MongoDB**: Daily automated backups
- **IPFS**: Distributed content (redundant)
- **Application**: Stateless (no local data)

### **Rollback Deployment**
```bash
# Revert to previous commit
git revert [commit-hash]
git push origin main

# Manual rollback
docker-compose down
# Deploy previous working images
docker-compose up -d
```

---

**Need Help?** Check [docs/DEVELOPMENT.md](DEVELOPMENT.md) for build patterns or `.cursor/scratchpad.md` for latest session context. 