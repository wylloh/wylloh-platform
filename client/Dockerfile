# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files first (for better layer caching)
COPY ./client/package*.json ./

# Install dependencies using npm for self-contained builds  
# This layer will be cached unless package.json changes
RUN npm install --legacy-peer-deps

# Copy source code (this layer changes more frequently)
COPY ./client/src ./src
COPY ./client/public ./public
COPY ./client/index.html ./
COPY ./client/vite.config.ts ./
COPY ./client/tsconfig*.json ./
COPY ./client/.eslintrc.json ./

# Build arguments for environment variables (Vite format)
ARG VITE_API_URL
ARG VITE_STORAGE_URL
ARG VITE_IPFS_GATEWAY
ARG VITE_NETWORK_ID
ARG VITE_CHAIN_NAME

# Set environment variables (Vite format)
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_STORAGE_URL=$VITE_STORAGE_URL
ENV VITE_IPFS_GATEWAY=$VITE_IPFS_GATEWAY
ENV VITE_NETWORK_ID=$VITE_NETWORK_ID
ENV VITE_CHAIN_NAME=$VITE_CHAIN_NAME

# Build the application (using CI/CD script with proper environment settings)
RUN npm run build:cicd

# Production stage
FROM nginx:alpine AS production

# Install curl for health checks
RUN apk add --no-cache curl

# Copy built application from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY ./client/nginx.conf /etc/nginx/conf.d/default.conf

# Create non-root user
RUN addgroup -g 1001 -S nginx-wylloh
RUN adduser -S wylloh -u 1001 -G nginx-wylloh

# Set proper permissions
RUN chown -R wylloh:nginx-wylloh /usr/share/nginx/html
RUN chown -R wylloh:nginx-wylloh /var/cache/nginx
RUN chown -R wylloh:nginx-wylloh /var/log/nginx
RUN chown -R wylloh:nginx-wylloh /etc/nginx/conf.d
RUN touch /var/run/nginx.pid
RUN chown -R wylloh:nginx-wylloh /var/run/nginx.pid

# Switch to non-root user
USER wylloh

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:80 || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"] 