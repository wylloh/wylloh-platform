#!/bin/bash

# Debug Production Deployment
# Troubleshoots nginx splash page issue

echo "🔍 WYLLOH PRODUCTION DEBUGGING SCRIPT"
echo "====================================="

echo
echo "1. 🐳 DOCKER CONTAINER STATUS"
echo "------------------------------"
docker ps -a --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"

echo
echo "2. 📱 CLIENT CONTAINER ANALYSIS"
echo "--------------------------------"

if docker ps | grep -q wylloh-client; then
    echo "✅ Client container is running"
    
    echo
    echo "📁 Contents of /usr/share/nginx/html:"
    docker exec wylloh-client ls -la /usr/share/nginx/html
    
    echo
    echo "📄 Sample of index.html (first 10 lines):"
    docker exec wylloh-client head -10 /usr/share/nginx/html/index.html
    
    echo
    echo "🔧 Client nginx configuration:"
    docker exec wylloh-client cat /etc/nginx/conf.d/default.conf
    
    echo
    echo "📊 Client container logs (last 20 lines):"
    docker logs wylloh-client --tail=20
    
else
    echo "❌ Client container is NOT running!"
    echo
    echo "📊 Client container logs:"
    docker logs wylloh-client --tail=50 2>/dev/null || echo "No logs available"
    
    echo
    echo "🔄 Attempting to restart client container:"
    docker-compose restart client
    sleep 10
    docker ps | grep wylloh-client || echo "Client still not running after restart"
fi

echo
echo "3. 🌐 NGINX REVERSE PROXY ANALYSIS"
echo "-----------------------------------"

if docker ps | grep -q wylloh-nginx; then
    echo "✅ Nginx reverse proxy is running"
    
    echo
    echo "🔧 Nginx configuration test:"
    docker exec wylloh-nginx nginx -t
    
    echo
    echo "📊 Nginx access logs (last 5 lines):"
    docker exec wylloh-nginx tail -5 /var/log/nginx/access.log
    
    echo
    echo "🚨 Nginx error logs (last 10 lines):"
    docker exec wylloh-nginx tail -10 /var/log/nginx/error.log
    
else
    echo "❌ Nginx reverse proxy is NOT running!"
fi

echo
echo "4. 🌍 EXTERNAL CONNECTIVITY TEST"
echo "---------------------------------"

echo "Testing external endpoints:"
echo "Main site: $(curl -s -o /dev/null -w "%{http_code}" https://wylloh.com)"
echo "API health: $(curl -s -o /dev/null -w "%{http_code}" https://api.wylloh.com/health)"
echo "Storage health: $(curl -s -o /dev/null -w "%{http_code}" https://storage.wylloh.com/health)"

echo
echo "5. 🛠️ SUGGESTED FIXES"
echo "----------------------"

if ! docker ps | grep -q wylloh-client; then
    echo "❗ ISSUE: Client container not running"
    echo "💡 FIX: docker-compose restart client"
elif docker exec wylloh-client ls /usr/share/nginx/html | grep -q "index.nginx-debian.html"; then
    echo "❗ ISSUE: Client container serving default nginx page"
    echo "💡 FIX: Rebuild client container with proper React build"
    echo "   Command: docker-compose build --no-cache client && docker-compose restart client"
else
    echo "✅ Client container appears to be configured correctly"
    echo "💡 Issue may be with nginx reverse proxy configuration"
fi

echo
echo "🚀 QUICK FIX COMMANDS:"
echo "----------------------"
echo "1. Rebuild client:        docker-compose build --no-cache client"
echo "2. Restart client:        docker-compose restart client"  
echo "3. Restart all services:  docker-compose restart"
echo "4. Full rebuild:          docker-compose down && docker-compose up -d --build"

echo
echo "✅ Debug complete! Check the analysis above for issues." 