# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files and yarn lock from workspace root
COPY ./api/package*.json ./
COPY yarn.lock ./

# Install all dependencies (including dev dependencies for building)
RUN yarn install --frozen-lockfile && yarn cache clean

# Copy source code
COPY ./api/ .

# Install TypeScript globally to ensure tsc is available
RUN yarn global add typescript@latest

# Build the TypeScript application
RUN yarn build

# Production stage
FROM node:18-alpine AS production

# Install curl for health checks
RUN apk add --no-cache curl

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S wylloh -u 1001

# Copy package files and yarn lock from workspace root
COPY ./api/package*.json ./
COPY yarn.lock ./

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