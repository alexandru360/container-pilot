# Quick Fix Guide - Container Pilot

## 🚨 Common Error: 500 on /api/status

### Symptoms
- Browser console shows: `GET /api/status 500 (Internal Server Error)`
- Web page displays: "No containers configured"
- WebSocket connects but no container data

### Quick Diagnosis

Run the diagnostic script:
```bash
# Linux/Mac/WSL
bash diagnose.sh

# Windows PowerShell
.\diagnose.ps1
```

### Most Common Fixes

#### Fix 1: Missing DOCKER_IMAGES Environment Variable

**Problem:** Container doesn't know which containers to manage.

**Solution:**
```bash
# Stop and remove current container
docker stop container-pilot
docker rm container-pilot

# Run with DOCKER_IMAGES set
docker run -d \
  --name container-pilot \
  -p 3000:3000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -e DOCKER_IMAGES=container1,container2,container3 \
  -e NODE_ENV=production \
  --restart unless-stopped \
  ghcr.io/alexandru360/container-pilot:latest
```

**Replace** `container1,container2,container3` with your actual container names.

To find your container names:
```bash
docker ps --format '{{.Names}}'
```

#### Fix 2: Docker Socket Not Mounted

**Problem:** Container cannot access Docker.

**Solution:**
```bash
# Recreate with socket mounted
docker run -d \
  --name container-pilot \
  -p 3000:3000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -e DOCKER_IMAGES=your-containers \
  --privileged \
  ghcr.io/alexandru360/container-pilot:latest
```

#### Fix 3: Permission Denied on Docker Socket

**Problem:** Container can see socket but cannot access it.

**Solution A** (Quick, less secure):
```bash
sudo chmod 666 /var/run/docker.sock
docker restart container-pilot
```

**Solution B** (Better, more secure):
```bash
# Add container to docker group
docker run -d \
  --name container-pilot \
  -p 3000:3000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  --group-add $(stat -c '%g' /var/run/docker.sock) \
  -e DOCKER_IMAGES=your-containers \
  ghcr.io/alexandru360/container-pilot:latest
```

**Solution C** (Unraid/Docker daemon):
```bash
# Use Docker Remote API instead
docker run -d \
  --name container-pilot \
  -p 3000:3000 \
  -e DOCKER_HOST=http://YOUR_HOST_IP:2375 \
  -e DOCKER_IMAGES=your-containers \
  ghcr.io/alexandru360/container-pilot:latest
```

### Unraid Specific

#### Using Docker Socket
1. In container template, add:
   - **Container Path:** `/var/run/docker.sock`
   - **Host Path:** `/var/run/docker.sock`
   - **Access Mode:** Read/Write
2. In **Extra Parameters:** add `--privileged`
3. Set **DOCKER_IMAGES** variable with your container names

#### Using Docker Remote API
1. Go to **Settings → Docker**
2. Enable **Remote API**
3. Set port (default: 2375)
4. Restart Docker service
5. In container template:
   - Remove socket path mapping
   - Add variable: `DOCKER_HOST=http://YOUR_UNRAID_IP:2375`
   - Set **DOCKER_IMAGES** with your container names

### Verification Steps

After applying fixes:

1. **Check container logs:**
   ```bash
   docker logs container-pilot
   ```
   Look for `[STATUS]` lines - should see container discovery logs.

2. **Test config endpoint:**
   ```bash
   curl http://localhost:3000/api/config
   ```
   Should return your configured containers.

3. **Test status endpoint:**
   ```bash
   curl http://localhost:3000/api/status
   ```
   Should return HTTP 200 with container information.

4. **Check web interface:**
   Open `http://localhost:3000` - should see your containers listed.

### Still Not Working?

1. **View full logs:**
   ```bash
   docker logs -f container-pilot
   ```

2. **Check Docker is running:**
   ```bash
   docker ps
   ```

3. **Verify container names match exactly:**
   ```bash
   # List all containers
   docker ps -a --format '{{.Names}}'
   
   # Check your DOCKER_IMAGES setting
   docker exec container-pilot sh -c 'echo $DOCKER_IMAGES'
   ```

4. **Test Docker socket manually:**
   ```bash
   docker exec -it container-pilot sh
   ls -la /var/run/docker.sock
   # Should show socket file with permissions
   exit
   ```

## 📚 More Help

- **Detailed Troubleshooting:** [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- **Deployment Guide:** [DEPLOYMENT-CHECKLIST.md](DEPLOYMENT-CHECKLIST.md)
- **Main README:** [README.md](README.md)

## 🆘 Need More Support?

1. Run `diagnose.sh` or `diagnose.ps1` and share the output
2. Share container logs: `docker logs container-pilot`
3. Share your docker run command or docker-compose.yml
4. Open an issue on GitHub with the above information
