# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with legacy peer deps to resolve conflicts
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build arguments for environment variables
ARG REACT_APP_API_URL
ARG REACT_APP_STORAGE_URL
ARG REACT_APP_IPFS_GATEWAY
ARG REACT_APP_NETWORK_ID
ARG REACT_APP_CHAIN_NAME

# Set environment variables
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_STORAGE_URL=$REACT_APP_STORAGE_URL
ENV REACT_APP_IPFS_GATEWAY=$REACT_APP_IPFS_GATEWAY
ENV REACT_APP_NETWORK_ID=$REACT_APP_NETWORK_ID
ENV REACT_APP_CHAIN_NAME=$REACT_APP_CHAIN_NAME

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine AS production

# Install curl for health checks
RUN apk add --no-cache curl

# Copy built application from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

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