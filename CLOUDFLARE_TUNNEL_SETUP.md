# Wylloh Platform - Cloudflare Tunnel Setup Guide

## Overview
This guide will help you set up Cloudflare Tunnel to expose your Wylloh platform running on your iMac to the internet via `wylloh.com` without needing a static IP address.

## Prerequisites
- Domain: `wylloh.com` (already owned)
- Cloudflare account with `wylloh.com` added
- iMac with Docker installed
- Wylloh platform repository cloned

## Step 1: Install Cloudflare Tunnel (cloudflared)

### On macOS:
```bash
# Install via Homebrew
brew install cloudflare/cloudflare/cloudflared

# Or download directly
curl -L --output cloudflared.pkg https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-amd64.pkg
sudo installer -pkg cloudflared.pkg -target /
```

### Verify Installation:
```bash
cloudflared --version
```

## Step 2: Authenticate with Cloudflare

```bash
# This will open a browser window to authenticate
cloudflared tunnel login
```

## Step 3: Create a Tunnel

```bash
# Create a tunnel named 'wylloh-platform'
cloudflared tunnel create wylloh-platform

# Note the tunnel ID that gets generated
```

## Step 4: Configure DNS Records

Add CNAME records in Cloudflare DNS:

```bash
# Main domain
cloudflared tunnel route dns wylloh-platform wylloh.com

# API subdomain
cloudflared tunnel route dns wylloh-platform api.wylloh.com

# Storage subdomain
cloudflared tunnel route dns wylloh-platform storage.wylloh.com

# IPFS subdomain
cloudflared tunnel route dns wylloh-platform ipfs.wylloh.com

# Monitoring subdomain
cloudflared tunnel route dns wylloh-platform monitor.wylloh.com
```

## Step 5: Create Tunnel Configuration

Create `~/.cloudflared/config.yml`:

```yaml
tunnel: wylloh-platform
credentials-file: ~/.cloudflared/[TUNNEL-ID].json

ingress:
  # Main website
  - hostname: wylloh.com
    service: http://localhost:3000
    
  # API endpoints
  - hostname: api.wylloh.com
    service: http://localhost:3001
    
  # Storage service
  - hostname: storage.wylloh.com
    service: http://localhost:3002
    
  # IPFS gateway
  - hostname: ipfs.wylloh.com
    service: http://localhost:8080
    
  # Monitoring (Prometheus)
  - hostname: monitor.wylloh.com
    service: http://localhost:9090
    
  # Catch-all rule (required)
  - service: http_status:404
```

## Step 6: Test the Configuration

```bash
# Test the tunnel configuration
cloudflared tunnel ingress validate

# Test connectivity
cloudflared tunnel ingress rule wylloh.com
cloudflared tunnel ingress rule api.wylloh.com
```

## Step 7: Start the Tunnel

### Manual Start (for testing):
```bash
cloudflared tunnel run wylloh-platform
```

### Install as System Service (recommended):
```bash
# Install the service
sudo cloudflared service install

# Start the service
sudo launchctl start com.cloudflare.cloudflared
```

## Step 8: Deploy Wylloh Platform

On your iMac, navigate to the Wylloh platform directory and start the services:

```bash
cd /path/to/wylloh-platform
./scripts/quick-deploy.sh
```

## Step 9: Update Environment Variables

Update your `.env` file to use the new domains:

```env
# Frontend URLs
REACT_APP_API_URL=https://api.wylloh.com
REACT_APP_STORAGE_URL=https://storage.wylloh.com
REACT_APP_IPFS_GATEWAY=https://ipfs.wylloh.com

# CORS Origins
CORS_ORIGIN=https://wylloh.com
```

## Step 10: Restart Services

```bash
# Restart with new environment
docker compose down
docker compose up -d --build
```

## Verification

After setup, verify these URLs work:
- https://wylloh.com (Main platform)
- https://api.wylloh.com/health (API health check)
- https://storage.wylloh.com/health (Storage health check)
- https://ipfs.wylloh.com (IPFS gateway)
- https://monitor.wylloh.com (Prometheus monitoring)

## Troubleshooting

### Common Issues:

1. **Tunnel not connecting:**
   ```bash
   # Check tunnel status
   cloudflared tunnel info wylloh-platform
   
   # Check logs
   cloudflared tunnel run wylloh-platform --loglevel debug
   ```

2. **DNS not resolving:**
   - Verify CNAME records in Cloudflare dashboard
   - Wait for DNS propagation (up to 24 hours)
   - Test with: `dig wylloh.com`

3. **Service not accessible:**
   - Ensure Docker services are running: `docker compose ps`
   - Check service logs: `docker compose logs [service-name]`
   - Verify ports are correct in config.yml

4. **SSL/TLS Issues:**
   - Cloudflare automatically provides SSL
   - Ensure SSL/TLS mode is set to "Full" in Cloudflare dashboard

## Security Considerations

1. **Firewall:** No need to open ports on your router
2. **DDoS Protection:** Cloudflare provides automatic protection
3. **SSL:** End-to-end encryption via Cloudflare
4. **Access Control:** Consider adding Cloudflare Access for admin areas

## Monitoring

Monitor tunnel health:
```bash
# Check tunnel status
cloudflared tunnel info wylloh-platform

# View metrics
curl http://localhost:8080/metrics
```

## Beta Launch Checklist

- [ ] Cloudflare Tunnel installed and authenticated
- [ ] DNS records configured
- [ ] Tunnel configuration created
- [ ] Wylloh platform deployed and running
- [ ] Environment variables updated
- [ ] All services accessible via HTTPS
- [ ] SSL certificates working
- [ ] Performance testing completed
- [ ] Monitoring setup verified

## Support

For issues:
1. Check Cloudflare Tunnel documentation
2. Review Docker service logs
3. Verify network connectivity
4. Contact Cloudflare support if needed

---

**Note:** This setup provides a production-ready deployment suitable for 0-100 users during the beta phase. The tunnel will automatically handle SSL, DDoS protection, and global CDN distribution through Cloudflare's network. 