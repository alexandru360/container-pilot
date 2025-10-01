# Deployment Checklist

## Pre-Deployment Verification

Before deploying Container Pilot, ensure you have:

- [ ] Docker or Podman installed and running
- [ ] Access to the Docker socket (`/var/run/docker.sock`)
- [ ] List of container names you want to manage
- [ ] Port 3000 available (or another port of your choice)

## Deployment Steps

### 1. Build the Image (if building locally)

```bash
docker build -t container-pilot:latest .
```

### 2. Set Required Environment Variables

**DOCKER_IMAGES** (Required):
```bash
export DOCKER_IMAGES=container1,container2,container3
```

Example:
```bash
export DOCKER_IMAGES=lottery-nginx,lottery-dotnet
```

**DOCKER_HOST** (Optional):
- Default: `/var/run/docker.sock`
- For remote Docker: `http://192.168.1.100:2375`

### 3. Deploy with Docker Compose

```bash
docker-compose up -d
```

### 4. Deploy with Docker Run

```bash
docker run -d \
  --name container-pilot \
  -p 3000:3000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -e DOCKER_IMAGES=lottery-nginx,lottery-dotnet \
  -e PORT=3000 \
  -e NODE_ENV=production \
  --restart unless-stopped \
  container-pilot:latest
```

## Post-Deployment Verification

### Step 1: Check Container is Running

```bash
docker ps | grep container-pilot
```

Expected output:
```
CONTAINER ID   IMAGE                  COMMAND         STATUS         PORTS
abc123def456   container-pilot:latest node server.js  Up 2 minutes   0.0.0.0:3000->3000/tcp
```

### Step 2: Check Container Logs

```bash
docker logs container-pilot
```

Look for:
- ✅ `Server running on port 3000`
- ✅ `Socket.IO initialized`
- ❌ Any error messages about Docker socket

### Step 3: Test Configuration Endpoint

```bash
curl http://localhost:3000/api/config
```

Expected response:
```json
{
  "containers": ["lottery-nginx", "lottery-dotnet"],
  "count": 2,
  "raw": "lottery-nginx,lottery-dotnet",
  "dockerHost": "/var/run/docker.sock",
  "timestamp": "2025-10-01T12:00:00.000Z"
}
```

### Step 4: Test Status Endpoint

```bash
curl http://localhost:3000/api/status
```

Expected response (example):
```json
{
  "containers": [
    {
      "name": "lottery-nginx",
      "status": "running",
      "state": "Up 2 hours",
      "id": "abc123...",
      "image": "nginx:latest",
      "created": 1696147200,
      "ports": [...]
    },
    {
      "name": "lottery-dotnet",
      "status": "running",
      "state": "Up 2 hours",
      "id": "def456...",
      "image": "mcr.microsoft.com/dotnet/aspnet:8.0",
      "created": 1696147200,
      "ports": [...]
    }
  ],
  "timestamp": "2025-10-01T12:00:00.000Z"
}
```

### Step 5: Test Health Endpoint

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-01T12:00:00.000Z"
}
```

### Step 6: Access Web Interface

Open in browser:
```
http://localhost:3000
```

or your domain:
```
https://your-domain.com
```

Expected behavior:
- ✅ Page loads without errors
- ✅ Container cards are displayed
- ✅ Container status is shown (running/stopped)
- ✅ Control buttons are visible (Start/Stop/Restart)
- ✅ No "No containers configured" message

## Common Issues and Quick Fixes

### Issue: "No containers configured"

**Cause:** `DOCKER_IMAGES` environment variable not set

**Fix:**
```bash
docker stop container-pilot
docker rm container-pilot
docker run -d ... -e DOCKER_IMAGES=container1,container2 ...
```

### Issue: "500 Internal Server Error" on /api/status

**Cause 1:** Docker socket not mounted

**Fix:**
```bash
docker run -d ... -v /var/run/docker.sock:/var/run/docker.sock ...
```

**Cause 2:** Permission denied on Docker socket

**Fix:**
```bash
# Check socket permissions
ls -la /var/run/docker.sock

# Fix permissions (temporary)
sudo chmod 666 /var/run/docker.sock

# Or add container user to docker group (better)
docker run -d ... --group-add $(stat -c '%g' /var/run/docker.sock) ...
```

### Issue: Cannot control containers (Start/Stop/Restart doesn't work)

**Cause:** Docker socket mounted as read-only

**Fix:** Ensure socket is mounted with read-write access:
```bash
-v /var/run/docker.sock:/var/run/docker.sock:rw
```

### Issue: Containers not found

**Cause:** Container names don't match

**Fix:** Check exact container names:
```bash
docker ps --format "{{.Names}}"
```

Then update `DOCKER_IMAGES` with exact names (case-sensitive).

## Production Deployment Considerations

### 1. Use Reverse Proxy (Recommended)

Example Nginx configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 2. Enable Docker Remote API (if managing remote containers)

**Warning:** Only enable if you understand the security implications!

On the remote Docker host, edit `/etc/docker/daemon.json`:
```json
{
  "hosts": ["unix:///var/run/docker.sock", "tcp://0.0.0.0:2375"]
}
```

**Better:** Use TLS for security:
```json
{
  "hosts": ["unix:///var/run/docker.sock", "tcp://0.0.0.0:2376"],
  "tls": true,
  "tlscert": "/path/to/cert.pem",
  "tlskey": "/path/to/key.pem"
}
```

### 3. Set Up Monitoring

Add to docker-compose.yml:
```yaml
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
      interval: 30s
      timeout: 3s
      start_period: 10s
      retries: 3
```

### 4. Set Up Logging

Configure Docker logging driver:
```yaml
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## Verification Summary

Run this complete verification script:

```bash
#!/bin/bash

echo "=== Container Pilot Deployment Verification ==="
echo

echo "1. Checking container is running..."
if docker ps | grep -q container-pilot; then
    echo "✅ Container is running"
else
    echo "❌ Container is NOT running"
    exit 1
fi

echo
echo "2. Checking configuration..."
CONFIG=$(curl -s http://localhost:3000/api/config)
if echo "$CONFIG" | grep -q "containers"; then
    echo "✅ Configuration loaded"
    echo "   $CONFIG"
else
    echo "❌ Configuration failed"
    exit 1
fi

echo
echo "3. Checking status endpoint..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/status)
if [ "$STATUS" == "200" ]; then
    echo "✅ Status endpoint working (HTTP $STATUS)"
else
    echo "❌ Status endpoint failed (HTTP $STATUS)"
    echo "   Check logs: docker logs container-pilot"
    exit 1
fi

echo
echo "4. Checking health endpoint..."
HEALTH=$(curl -s http://localhost:3000/api/health)
if echo "$HEALTH" | grep -q "healthy"; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed"
    exit 1
fi

echo
echo "=== All checks passed! ==="
echo "Access the web interface at: http://localhost:3000"
```

Save as `verify-deployment.sh` and run:
```bash
chmod +x verify-deployment.sh
./verify-deployment.sh
```
