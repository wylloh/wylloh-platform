# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install all dependencies (including dev dependencies for building)
RUN npm ci --legacy-peer-deps && npm cache clean --force

# Ensure TypeScript is properly installed
RUN npm install -g typescript@latest && npm install typescript@latest

# Copy source code
COPY . .

# Build the TypeScript application
RUN npm run build || npx tsc

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
RUN npm ci --only=production --legacy-peer-deps && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy any other necessary files (env, configs, etc.)
COPY --chown=wylloh:nodejs .env.production* ./

# Create necessary directories
RUN mkdir -p temp logs && chown -R wylloh:nodejs temp logs

# Switch to non-root user
USER wylloh

# Expose port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3002/health || exit 1

# Start the compiled JavaScript application
CMD ["node", "dist/index.js"] 