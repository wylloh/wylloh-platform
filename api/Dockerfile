# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cmake \
    git \
    build-base

# Copy workspace root files for proper yarn workspace setup
COPY package.json yarn.lock ./
COPY ./api/package.json ./api/

# Install all dependencies (including dev dependencies for building)
# Use workspace root context for proper TypeScript installation
RUN yarn install --frozen-lockfile && yarn cache clean

# Copy source code
COPY ./api/ .

# Verify TypeScript installation and build
RUN ls -la node_modules/.bin/tsc && yarn build

# Production stage
FROM node:18-alpine AS production

# Install runtime dependencies and build tools for production deps
RUN apk add --no-cache \
    curl \
    python3 \
    make \
    g++ \
    cmake \
    git \
    build-base

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S wylloh -u 1001

# Copy workspace root files for proper yarn workspace setup
COPY package.json yarn.lock ./
COPY ./api/package.json ./api/

# Install only production dependencies
RUN yarn install --production --frozen-lockfile && yarn cache clean

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Environment variables will be provided by docker-compose
# COPY --chown=wylloh:nodejs .env.production ./

# Create necessary directories
RUN mkdir -p uploads logs && chown -R wylloh:nodejs uploads logs

# Switch to non-root user
USER wylloh

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start the compiled JavaScript application
CMD ["node", "dist/index.js"] 