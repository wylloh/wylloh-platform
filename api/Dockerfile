# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for building)
RUN npm install

# Copy source code
COPY . .

# Build the application using the full TypeScript path
RUN ./node_modules/.bin/tsc

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

# Install all dependencies (including TypeScript for runtime compilation)
RUN npm install && npm cache clean --force

# Copy source code
COPY --chown=wylloh:nodejs . .

# Create necessary directories
RUN mkdir -p uploads logs && chown -R wylloh:nodejs uploads logs

# Switch to non-root user
USER wylloh

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start the application with ts-node for development
CMD ["npx", "ts-node", "src/index.ts"] 