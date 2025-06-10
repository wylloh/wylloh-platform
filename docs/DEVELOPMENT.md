# Wylloh Platform - Development Guide

## 🏗️ Architecture Overview

The Wylloh Platform is a **monorepo** with **yarn workspaces**, designed for blockchain-based content management. All services use **consistent build patterns** and **root build contexts**.

## 📦 Monorepo Structure

```
wylloh-platform/
├── client/           # React frontend (nginx)
├── api/              # Node.js TypeScript backend  
├── storage/          # IPFS storage service
├── contracts/        # Smart contracts
├── nginx/            # Reverse proxy configuration
├── .github/workflows/ # CI/CD automation
├── package.json      # Root workspace config
└── yarn.lock         # Unified dependency lock
```

## 🛠️ Development Setup

### **Prerequisites**
- Node.js 18+ (use `.nvmrc`)
- Yarn package manager
- Docker & Docker Compose
- Git with SSH keys

### **Initial Setup**
```bash
# Clone repository
git clone git@github.com:wylloh/wylloh-platform.git
cd wylloh-platform

# Install all workspace dependencies
yarn install

# Set up environment files
cp .env.example .env
cp .env.production.template .env.production
```

### **Local Development**
```bash
# Run all services locally
yarn dev

# Individual services
yarn dev:client    # React dev server
yarn dev:api       # Node.js with hot reload

# Docker development
yarn dev:docker    # Full stack with Docker
```

## 🐳 Docker Build Patterns

### **CRITICAL: Root Build Context**

All services use **root build context** for yarn workspace access:

```bash
# ✅ CORRECT (matches CI/CD)
docker build -f ./api/Dockerfile .
docker build -f ./client/Dockerfile .
docker build -f ./storage/Dockerfile .

# ❌ WRONG (can't access yarn.lock)
docker build ./api
```

### **Why Root Context?**
- **Monorepo access**: Services need root `yarn.lock`
- **Workspace consistency**: Unified dependency resolution
- **CI/CD alignment**: Same pattern as GitHub Actions

### **Docker Compose**
```bash
# Build and start all services
docker-compose up --build

# Individual services
docker-compose up client api storage
```

## 🤖 CI/CD Workflow

### **GitHub Actions Pipeline**
- **File**: `.github/workflows/build-and-test.yml`
- **Trigger**: Push to `main` branch
- **Stages**: Lint → Test → Build → Docker → Deploy

### **Deployment Process**
1. **Code Quality**: ESLint + TypeScript checks
2. **Service Builds**: Compile all TypeScript services
3. **Docker Images**: Build with root context pattern
4. **VPS Deployment**: Automated container deployment

### **Monitoring Deployments**
- **GitHub Actions**: https://github.com/wylloh/wylloh-platform/actions
- **VPS Access**: `ssh -i ~/.ssh/wylloh_vps wylloh@138.197.232.48`

## 📋 Service Details

### **Client (React Frontend)**
- **Port**: 3000 (Docker), 3000 (dev)
- **Build**: `yarn build` → nginx static files
- **Package Manager**: yarn (consistent with workspace)

### **API (Node.js Backend)**
- **Port**: 3001
- **Build**: TypeScript → `dist/index.js`
- **Health Check**: `/health` endpoint
- **Package Manager**: yarn (workspace consistency)

### **Storage (IPFS Service)**
- **Port**: 3002
- **Build**: TypeScript → `dist/index.js`
- **Integration**: IPFS nodes + MongoDB
- **Package Manager**: yarn (workspace consistency)

## 🔧 Troubleshooting

### **Build Failures**
```bash
# Check build context
docker build -f ./api/Dockerfile . --no-cache

# Verify yarn workspace
yarn install --frozen-lockfile

# Clear Docker cache
docker builder prune -a
```

### **Service Issues**
```bash
# Check container logs
docker logs wylloh-api
docker logs wylloh-client
docker logs wylloh-storage

# Restart services
docker-compose restart [service]
```

### **Common Problems**

**❌ Mixed Package Managers**
- **Problem**: npm in Dockerfile, yarn in workspace
- **Solution**: Use yarn consistently across all services

**❌ Wrong Build Context**
- **Problem**: `docker build ./api` (can't find yarn.lock)
- **Solution**: `docker build -f ./api/Dockerfile .`

**❌ TypeScript Compilation**
- **Problem**: Copying source instead of building
- **Solution**: Use `yarn build` → `dist/index.js`

## 🎯 Best Practices

### **Code Quality**
- **ESLint**: Strategic warnings vs errors
- **TypeScript**: Proper compilation, not source copying
- **Testing**: Run before commits

### **Docker**
- **Consistent contexts**: Always use root build context
- **Layer caching**: Copy package.json before source
- **Multi-stage builds**: Build → Production separation

### **Collaboration**
- **Branch protection**: Require PR reviews
- **CI/CD checks**: All builds must pass
- **Documentation**: Update this guide with changes

## 🚀 Contributing

1. **Create feature branch**: `git checkout -b feature/your-feature`
2. **Make changes**: Follow build patterns above
3. **Test locally**: `yarn test` + `docker-compose up --build`
4. **Submit PR**: CI/CD will validate build patterns
5. **Deploy**: Merge to `main` triggers automated deployment

---

**Questions?** Check the scratchpad (`.cursor/scratchpad.md`) for session-specific context and troubleshooting notes. 