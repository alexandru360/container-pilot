#!/bin/bash

# Quick diagnostic script for Container Pilot deployment issues
# Run this on your server to diagnose the 500 error

echo "======================================"
echo "Container Pilot Diagnostic Script"
echo "======================================"
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "1. Checking if container-pilot is running..."
if docker ps --format '{{.Names}}' | grep -q "container-pilot"; then
    echo -e "${GREEN}✓${NC} container-pilot is running"
    CONTAINER_ID=$(docker ps --filter "name=container-pilot" --format '{{.ID}}')
    echo "   Container ID: $CONTAINER_ID"
else
    echo -e "${RED}✗${NC} container-pilot is NOT running"
    echo "   Start it with: docker start container-pilot"
    echo "   Or deploy it following DEPLOYMENT-CHECKLIST.md"
    exit 1
fi

echo
echo "2. Checking environment variables..."
DOCKER_IMAGES=$(docker exec $CONTAINER_ID sh -c 'echo $DOCKER_IMAGES' 2>/dev/null)
DOCKER_HOST=$(docker exec $CONTAINER_ID sh -c 'echo $DOCKER_HOST' 2>/dev/null)

if [ -z "$DOCKER_IMAGES" ]; then
    echo -e "${RED}✗${NC} DOCKER_IMAGES is NOT set"
    echo "   This is why you see 'No containers configured'"
    echo "   Fix: Recreate container with -e DOCKER_IMAGES=container1,container2"
else
    echo -e "${GREEN}✓${NC} DOCKER_IMAGES is set"
    echo "   Value: $DOCKER_IMAGES"
fi

if [ -z "$DOCKER_HOST" ]; then
    echo -e "${YELLOW}ℹ${NC} DOCKER_HOST not set (using default /var/run/docker.sock)"
else
    echo -e "${GREEN}✓${NC} DOCKER_HOST is set"
    echo "   Value: $DOCKER_HOST"
fi

echo
echo "3. Checking Docker socket mount..."
if docker exec $CONTAINER_ID sh -c 'test -S /var/run/docker.sock' 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Docker socket is mounted"
    SOCKET_PERMS=$(docker exec $CONTAINER_ID sh -c 'ls -la /var/run/docker.sock' 2>/dev/null)
    echo "   $SOCKET_PERMS"
else
    echo -e "${RED}✗${NC} Docker socket is NOT mounted or not accessible"
    echo "   This is causing the 500 error on /api/status"
    echo "   Fix: Add volume mount: -v /var/run/docker.sock:/var/run/docker.sock"
    exit 1
fi

echo
echo "4. Testing Docker socket access from container..."
DOCKER_TEST=$(docker exec $CONTAINER_ID sh -c 'ls /var/run/docker.sock 2>&1' 2>/dev/null)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Container can see Docker socket"
else
    echo -e "${RED}✗${NC} Container cannot access Docker socket"
    echo "   Error: $DOCKER_TEST"
    echo "   This is causing the 500 error"
fi

echo
echo "5. Checking recent container logs..."
echo "   Last 20 lines:"
echo "   -------------"
docker logs --tail 20 $CONTAINER_ID 2>&1 | sed 's/^/   /'

echo
echo "6. Testing API endpoints..."

# Test config endpoint
echo "   Testing /api/config..."
CONFIG_RESPONSE=$(curl -s http://localhost:3000/api/config 2>&1)
CONFIG_STATUS=$?
if [ $CONFIG_STATUS -eq 0 ] && echo "$CONFIG_RESPONSE" | grep -q "containers"; then
    echo -e "   ${GREEN}✓${NC} Config endpoint working"
    echo "$CONFIG_RESPONSE" | sed 's/^/     /'
else
    echo -e "   ${RED}✗${NC} Config endpoint failed"
    echo "   Response: $CONFIG_RESPONSE"
fi

echo
echo "   Testing /api/status..."
STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/status 2>&1)
if [ "$STATUS_CODE" == "200" ]; then
    echo -e "   ${GREEN}✓${NC} Status endpoint working (HTTP $STATUS_CODE)"
    STATUS_RESPONSE=$(curl -s http://localhost:3000/api/status 2>&1)
    echo "$STATUS_RESPONSE" | sed 's/^/     /'
else
    echo -e "   ${RED}✗${NC} Status endpoint failed (HTTP $STATUS_CODE)"
    echo "   This is the error you're seeing in the browser"
    
    # Try to get error details
    STATUS_ERROR=$(curl -s http://localhost:3000/api/status 2>&1)
    echo "   Error details:"
    echo "$STATUS_ERROR" | sed 's/^/     /'
fi

echo
echo "7. Checking container stats..."
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" $CONTAINER_ID

echo
echo "======================================"
echo "Diagnostic Summary"
echo "======================================"

# Provide summary and recommendations
if [ -z "$DOCKER_IMAGES" ]; then
    echo
    echo -e "${RED}CRITICAL:${NC} DOCKER_IMAGES environment variable is missing"
    echo
    echo "To fix this, you need to recreate the container with the correct environment variable:"
    echo
    echo "1. Stop and remove the current container:"
    echo "   docker stop container-pilot"
    echo "   docker rm container-pilot"
    echo
    echo "2. Run with proper environment variables:"
    echo "   docker run -d \\"
    echo "     --name container-pilot \\"
    echo "     -p 3000:3000 \\"
    echo "     -v /var/run/docker.sock:/var/run/docker.sock \\"
    echo "     -e DOCKER_IMAGES=lottery-nginx,lottery-dotnet \\"
    echo "     -e PORT=3000 \\"
    echo "     -e NODE_ENV=production \\"
    echo "     --restart unless-stopped \\"
    echo "     your-registry/container-pilot:latest"
    echo
elif ! docker exec $CONTAINER_ID sh -c 'test -S /var/run/docker.sock' 2>/dev/null; then
    echo
    echo -e "${RED}CRITICAL:${NC} Docker socket is not mounted or not accessible"
    echo
    echo "To fix this, you need to recreate the container with the socket mounted:"
    echo
    echo "1. Stop and remove the current container:"
    echo "   docker stop container-pilot"
    echo "   docker rm container-pilot"
    echo
    echo "2. Run with Docker socket mounted:"
    echo "   docker run -d \\"
    echo "     --name container-pilot \\"
    echo "     -p 3000:3000 \\"
    echo "     -v /var/run/docker.sock:/var/run/docker.sock \\"
    echo "     -e DOCKER_IMAGES=$DOCKER_IMAGES \\"
    echo "     -e PORT=3000 \\"
    echo "     -e NODE_ENV=production \\"
    echo "     --restart unless-stopped \\"
    echo "     your-registry/container-pilot:latest"
    echo
elif [ "$STATUS_CODE" != "200" ]; then
    echo
    echo -e "${YELLOW}WARNING:${NC} Status endpoint is returning errors"
    echo
    echo "Check the logs above for specific error messages."
    echo "Common issues:"
    echo "  - Permission denied on Docker socket"
    echo "  - Docker daemon not running"
    echo "  - Network connectivity issues"
    echo
    echo "Try viewing full logs with:"
    echo "   docker logs -f container-pilot"
    echo
else
    echo
    echo -e "${GREEN}SUCCESS:${NC} All checks passed!"
    echo
    echo "Container Pilot appears to be working correctly."
    echo "Access the web interface at:"
    echo "   http://localhost:3000"
    echo "   or"
    echo "   https://lottery-tools.alexserv.xyz"
    echo
fi

echo
echo "For more help, see:"
echo "  - TROUBLESHOOTING.md"
echo "  - DEPLOYMENT-CHECKLIST.md"
echo
