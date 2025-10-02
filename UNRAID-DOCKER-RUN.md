# Container Pilot - Unraid Docker Run Command

## 🎯 Production-Ready Command (Copy-Paste in Unraid Terminal)

```bash
docker run -d \
  --name='lottery-tools' \
  --net='bridge' \
  --pids-limit 2048 \
  -e TZ="Europe/Athens" \
  -e HOST_OS="Unraid" \
  -e HOST_HOSTNAME="MoonServer" \
  -e HOST_CONTAINERNAME="lottery-tools" \
  -e 'DockerImages'='lottery-dotnet,lottery-nginx,lottery-tools' \
  -e 'ASPNETCORE_ENVIRONMENT'='Production' \
  -e 'DockerHost'='unix:///var/run/docker.sock' \
  -l net.unraid.docker.managed=dockerman \
  -l net.unraid.docker.webui='http://[IP]:[PORT:8087]' \
  -p '8087:5000/tcp' \
  -v '/var/run/docker.sock':'/var/run/docker.sock':'rw' \
  --restart unless-stopped \
  'ghcr.io/alexandru360/container-pilot:latest'
```

## 📋 Configuration Breakdown

### Port Mapping
- **Host Port:** `8087` (Unraid WebUI)
- **Container Port:** `5000` (ASP.NET Core app)
- **Access URL:** `http://[UNRAID-IP]:8087`

### Environment Variables

| Variable | Value | Description |
|----------|-------|-------------|
| `TZ` | `Europe/Athens` | Timezone for logs and timestamps |
| `ASPNETCORE_ENVIRONMENT` | `Production` | ASP.NET Core environment mode |
| `DockerImages` | `lottery-dotnet,lottery-nginx,lottery-tools` | Containers to manage (comma-separated) |
| `DockerHost` | `unix:///var/run/docker.sock` | Docker socket path |
| `HOST_OS` | `Unraid` | Host OS identifier (optional) |
| `HOST_HOSTNAME` | `MoonServer` | Your Unraid server name (optional) |
| `HOST_CONTAINERNAME` | `lottery-tools` | Container name (optional) |

### Volume Mounts
- **Docker Socket:** `/var/run/docker.sock` (read-write access)
  - Required for container management
  - Allows the app to communicate with Docker daemon

### Unraid-Specific Labels
- `net.unraid.docker.managed=dockerman` - Managed by Unraid Docker Manager
- `net.unraid.docker.webui='http://[IP]:[PORT:8087]'` - WebUI link in Unraid dashboard

## 🚀 Quick Commands

### Check if running
```bash
docker ps | grep lottery-tools
```

### View logs
```bash
docker logs -f lottery-tools
```

### Stop container
```bash
docker stop lottery-tools
```

### Remove container
```bash
docker rm -f lottery-tools
```

### Update to latest version
```bash
# Stop and remove old container
docker stop lottery-tools
docker rm lottery-tools

# Pull latest image
docker pull ghcr.io/alexandru360/container-pilot:latest

# Run the docker run command again from above
```

## 🔧 Customization

### Add More Containers to Manage
Edit the `DockerImages` environment variable:
```bash
-e 'DockerImages'='lottery-dotnet,lottery-nginx,lottery-tools,myapp1,myapp2'
```

### Change Port
If port `8087` is already in use:
```bash
-p '8088:5000/tcp'  # Use port 8088 instead
```
Then update the WebUI label:
```bash
-l net.unraid.docker.webui='http://[IP]:[PORT:8088]'
```

### Change Timezone
Available timezones: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
```bash
-e TZ="America/New_York"
-e TZ="Europe/London"
-e TZ="Asia/Tokyo"
```

## 📊 Health Check

The container includes a built-in health check:
- **Endpoint:** `http://localhost:5000/api/health`
- **Interval:** 30 seconds
- **Timeout:** 3 seconds
- **Start Period:** 10 seconds
- **Retries:** 3

Check health status:
```bash
docker inspect lottery-tools | grep -A 10 Health
```

## 🐛 Troubleshooting

### Container won't start
```bash
# Check logs for errors
docker logs lottery-tools

# Verify Docker socket access
ls -la /var/run/docker.sock
```

### Can't access WebUI
1. Check if container is running: `docker ps`
2. Verify port is not in use: `netstat -tulpn | grep 8087`
3. Check firewall rules
4. Try accessing: `http://[UNRAID-IP]:8087`

### Permission denied for Docker socket
```bash
# Verify socket permissions
ls -la /var/run/docker.sock
# Should show: srw-rw---- 1 root docker

# If needed, add more permissions (not recommended for production)
chmod 666 /var/run/docker.sock
```

## 📦 Unraid Community Applications Template

If you want to add this to Unraid Community Applications, use this template:

**Repository:** `ghcr.io/alexandru360/container-pilot:latest`  
**WebUI:** `http://[IP]:[PORT:8087]`  
**Icon URL:** `https://raw.githubusercontent.com/alexandru360/container-pilot/main/public/icon.png`

**Post Arguments:**
```
--pids-limit 2048
```

## 🔗 Links

- **GitHub Repository:** https://github.com/alexandru360/container-pilot
- **Docker Image:** https://github.com/alexandru360/container-pilot/pkgs/container/container-pilot
- **Documentation:** https://github.com/alexandru360/container-pilot/blob/main/README.md
