#!/bin/bash

# Fix Client Nginx Splash Page Issue
# Rebuilds client container with proper React build

echo "🔧 FIXING WYLLOH CLIENT NGINX ISSUE"
echo "===================================="

echo
echo "📋 Current Status Check:"
echo "------------------------"

# Check if containers are running
if docker ps | grep -q wylloh-client; then
    echo "✅ Client container is running"
    
    # Check what's actually in the nginx html directory
    echo "📁 Current nginx html contents:"
    docker exec wylloh-client ls -la /usr/share/nginx/html
    
    # Check if it's serving default nginx
    if docker exec wylloh-client ls /usr/share/nginx/html | grep -q "index.nginx-debian.html"; then
        echo "❌ PROBLEM FOUND: Serving default nginx page instead of React app"
    elif docker exec wylloh-client ls /usr/share/nginx/html | grep -q "index.html"; then
        echo "🔍 index.html found, checking if it's React app..."
        # Check first line of index.html to see if it's React
        FIRST_LINE=$(docker exec wylloh-client head -1 /usr/share/nginx/html/index.html)
        if [[ "$FIRST_LINE" == *"<!doctype html>"* || "$FIRST_LINE" == *"<!DOCTYPE html>"* ]]; then
            echo "✅ Appears to be a proper HTML file"
            echo "   First line: $FIRST_LINE"
        else
            echo "❌ Strange index.html content: $FIRST_LINE"
        fi
    else
        echo "❌ No index.html found in nginx directory"
    fi
else
    echo "❌ Client container is NOT running"
fi

echo
echo "🏗️ REBUILDING CLIENT CONTAINER"
echo "-------------------------------"

# Stop client container
echo "1. Stopping client container..."
docker-compose stop client

# Remove client container and image to force complete rebuild
echo "2. Removing old client container and image..."
docker rm -f wylloh-client 2>/dev/null || true
docker rmi -f wylloh-platform-client 2>/dev/null || true

# Clear any build cache for client
echo "3. Clearing Docker build cache..."
docker builder prune -f

# Rebuild client with no cache
echo "4. Building client container from scratch..."
docker-compose build --no-cache client

# Start client container
echo "5. Starting client container..."
docker-compose up -d client

# Wait for startup
echo "6. Waiting for client to start (30 seconds)..."
sleep 30

# Verify the fix
echo
echo "✅ VERIFICATION"
echo "---------------"

if docker ps | grep -q wylloh-client; then
    echo "✅ Client container is now running"
    
    echo
    echo "📁 New nginx html contents:"
    docker exec wylloh-client ls -la /usr/share/nginx/html
    
    echo
    echo "📄 First 5 lines of index.html:"
    docker exec wylloh-client head -5 /usr/share/nginx/html/index.html
    
    echo
    echo "🌐 Testing external access:"
    sleep 10  # Give nginx time to serve
    RESPONSE=$(curl -s -w "%{http_code}" https://wylloh.com)
    echo "   Response code: $RESPONSE"
    
    if [[ "$RESPONSE" == "200" ]]; then
        echo "✅ SUCCESS! wylloh.com is now responding"
        echo "🎉 Please check https://wylloh.com in your browser"
    else
        echo "⚠️ Still getting response code: $RESPONSE"
        echo "   May need additional troubleshooting"
    fi
    
else
    echo "❌ Client container failed to start"
    echo "📊 Client container logs:"
    docker logs wylloh-client --tail=20
fi

echo
echo "🏁 Fix attempt complete!"
echo "Check https://wylloh.com to see if the React app is now loading." 