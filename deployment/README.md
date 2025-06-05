# Wylloh Platform Deployment Guides

## Current Deployment Strategy

**Recommended Approach:** Cloud VPS Deployment

The Wylloh platform is designed for cloud VPS deployment on providers like DigitalOcean, Vultr, or Hetzner. This approach provides:

- ✅ **Move-friendly**: No physical hardware dependencies
- ✅ **Cost-effective**: $20-30/month operational costs
- ✅ **Scalable**: Easy resource upgrades as platform grows
- ✅ **Professional**: Enterprise-grade infrastructure and monitoring
- ✅ **No vendor lock-in**: Standard Ubuntu/Docker deployment

## Active Deployment Guides

### [Cloud VPS Deployment Guide](CLOUD_VPS_DEPLOYMENT_GUIDE.md)
**Status:** ✅ **CURRENT & RECOMMENDED**
- **Target**: Ubuntu 22.04 LTS on cloud VPS providers
- **Providers**: DigitalOcean, Vultr, Hetzner, Linode
- **Requirements**: 4GB RAM, 2 vCPU, 80GB SSD
- **Cost**: $20-30/month
- **Features**: Automated deployment, monitoring, backups, SSL

### Deployment Scripts
- **[`../scripts/deploy-vps.sh`](../scripts/deploy-vps.sh)**: Automated VPS deployment script
- **[`env.production.template`](env.production.template)**: Production environment template
- **[`cloudflare-tunnel-config.yml`](cloudflare-tunnel-config.yml)**: Cloudflare tunnel configuration

## Archived Deployment Guides

The following deployment guides have been archived as they are no longer recommended for production use:

### [archive/IMAC_DEPLOYMENT_GUIDE.md](archive/IMAC_DEPLOYMENT_GUIDE.md)
**Status:** ❌ **ARCHIVED**
- **Reason**: Hardware dependencies, move complications, limited scalability
- **Alternative**: Use Cloud VPS deployment instead

### [archive/RASPBERRY_PI_DEPLOYMENT_GUIDE.md](archive/RASPBERRY_PI_DEPLOYMENT_GUIDE.md)
**Status:** ❌ **ARCHIVED**
- **Reason**: Performance limitations, complexity for production use
- **Alternative**: Use Cloud VPS deployment for better performance and reliability

## Quick Start

1. **Choose a VPS Provider**: DigitalOcean (recommended), Vultr, or Hetzner
2. **Create Server**: Ubuntu 22.04 LTS, 4GB RAM, 2 vCPU, 80GB SSD
3. **Run Deployment**: `sudo ./scripts/deploy-vps.sh` on the server
4. **Configure Environment**: Edit `/opt/wylloh/.env.production`
5. **Go Live**: Point DNS to server IP and test

## Support

For deployment assistance:
- Review the [Cloud VPS Deployment Guide](CLOUD_VPS_DEPLOYMENT_GUIDE.md)
- Check the [main DEPLOYMENT.md](../DEPLOYMENT.md) for additional context
- Consult the [Legal Risk Mitigation](../docs/LEGAL_RISK_MITIGATION.md) for compliance

---

**Last Updated:** June 2025  
**Deployment Strategy:** Cloud VPS (Ubuntu 22.04 LTS) 