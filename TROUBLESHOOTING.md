# Troubleshooting Guide

## Error 500 on /api/status

### Symptom
The application shows "No containers configured" and the browser console shows:
```
GET /api/status 500 (Internal Server Error)
```

### Common Causes

#### 1. Docker Socket Not Mounted
**Problem:** The container cannot access the Docker socket.

**Solution:** Ensure the Docker socket is properly mounted in your deployment:

**Docker Compose:**
```yaml
volumes:
  - /var/run/docker.sock:/var/run/docker.sock
```

**Docker Run:**
```bash
docker run -v /var/run/docker.sock:/var/run/docker.sock ...
```

**Unraid/Portainer:**
- Add a volume mapping in the container settings:
  - Container Path: `/var/run/docker.sock`
  - Host Path: `/var/run/docker.sock`
  - Access Mode: Read/Write

#### 2. Missing DOCKER_IMAGES Environment Variable
**Problem:** The application doesn't know which containers to manage.

**Solution:** Set the `DOCKER_IMAGES` environment variable:

```bash
-e DOCKER_IMAGES=container1,container2,container3
```

For example:
```bash
-e DOCKER_IMAGES=lottery-nginx,lottery-dotnet
```

#### 3. Permission Issues
**Problem:** The container doesn't have permission to access the Docker socket.

**Solution:** 
- Ensure the socket has proper permissions on the host
- Or run the container with appropriate privileges:
```bash
docker run --privileged ...
```

Or add the container user to the docker group (if running on the host):
```bash
docker run --group-add $(stat -c '%g' /var/run/docker.sock) ...
```

#### 4. Remote Docker Host Connection
**Problem:** Cannot connect to remote Docker host.

**Solution:** Set the `DOCKER_HOST` environment variable:

```bash
# For HTTP connection
-e DOCKER_HOST=http://192.168.1.100:2375

# For HTTPS connection
-e DOCKER_HOST=https://192.168.1.100:2376

# For Unix socket (local)
-e DOCKER_HOST=unix:///var/run/docker.sock
```

### Checking the Logs

To see detailed error messages, check the container logs:

```bash
docker logs container-pilot
```

Look for lines starting with `[STATUS]` for diagnostic information.

### Testing the Configuration

1. **Check if config is loaded:**
   Visit: `https://your-domain/api/config`
   
   Should return:
   ```json
   {
     "containers": ["container1", "container2"],
     "count": 2,
     "raw": "container1,container2",
     "dockerHost": "/var/run/docker.sock",
     "timestamp": "2025-10-01T..."
   }
   ```

2. **Check container status:**
   Visit: `https://your-domain/api/status`
   
   Should return container information, not a 500 error.

3. **Check health:**
   Visit: `https://your-domain/api/health`
   
   Should return:
   ```json
   {
     "status": "healthy",
     "timestamp": "..."
   }
   ```

### Complete Docker Compose Example

```yaml
version: '3.8'

services:
  container-pilot:
    image: your-registry/container-pilot:latest
    container_name: container-pilot
    ports:
      - "3000:3000"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - DOCKER_IMAGES=lottery-nginx,lottery-dotnet
      - PORT=3000
      - NODE_ENV=production
    restart: unless-stopped
```

### Complete Docker Run Example

```bash
docker run -d \
  --name container-pilot \
  -p 3000:3000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -e DOCKER_IMAGES=lottery-nginx,lottery-dotnet \
  -e PORT=3000 \
  -e NODE_ENV=production \
  --restart unless-stopped \
  your-registry/container-pilot:latest
```

### Unraid Template Example

```xml
<Container>
  <Name>Container Pilot</Name>
  <Repository>your-registry/container-pilot</Repository>
  <Network>bridge</Network>
  <Privileged>false</Privileged>
  <Config Name="WebUI Port" Target="3000" Default="3000" Mode="tcp" Description="" Type="Port" Display="always" Required="true" Mask="false">3000</Config>
  <Config Name="Docker Socket" Target="/var/run/docker.sock" Default="/var/run/docker.sock" Mode="rw" Description="" Type="Path" Display="always" Required="true" Mask="false">/var/run/docker.sock</Config>
  <Config Name="Docker Images" Target="DOCKER_IMAGES" Default="lottery-nginx,lottery-dotnet" Mode="" Description="Comma-separated list of container names to manage" Type="Variable" Display="always" Required="true" Mask="false">lottery-nginx,lottery-dotnet</Config>
  <Config Name="Port" Target="PORT" Default="3000" Mode="" Description="" Type="Variable" Display="advanced" Required="false" Mask="false">3000</Config>
  <Config Name="Node Environment" Target="NODE_ENV" Default="production" Mode="" Description="" Type="Variable" Display="advanced" Required="false" Mask="false">production</Config>
</Container>
```

## Still Having Issues?

If you're still experiencing problems after trying these solutions:

1. Check the container logs for detailed error messages
2. Verify the Docker socket exists and is accessible: `ls -la /var/run/docker.sock`
3. Test Docker connectivity from within the container: `docker exec -it container-pilot sh -c "ls -la /var/run/docker.sock"`
4. Ensure the container names in `DOCKER_IMAGES` match exactly with the actual container names
