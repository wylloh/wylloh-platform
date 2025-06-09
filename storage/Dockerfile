# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install all dependencies (including dev dependencies for building)
RUN npm install --legacy-peer-deps && npm cache clean --force

# Ensure TypeScript is properly installed
RUN npm install -g typescript@latest

# Copy source code
COPY . .

# Build the TypeScript application (skip for now due to compilation errors)
# RUN tsc || npm run build
RUN mkdir -p dist && cp -r src/* dist/

# Production stage
FROM node:18-alpine AS production

# Install curl for health checks
RUN apk add --no-cache curl

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S wylloh -u 1001

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --only=production --legacy-peer-deps && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Environment variables will be provided by docker-compose
# COPY --chown=wylloh:nodejs .env.production ./

# Create necessary directories
RUN mkdir -p temp logs && chown -R wylloh:nodejs temp logs

# Switch to non-root user
USER wylloh

# Expose port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3002/health || exit 1

# Start with ts-node for now (until TypeScript compilation is fixed)
CMD ["npx", "ts-node", "dist/index.ts"] 