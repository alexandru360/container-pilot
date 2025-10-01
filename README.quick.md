# Docker Updater Tool

🐋 **One-click Docker container updater for Unraid**

## Quick Start

### Build & Run with Docker

```bash
# Build image
docker build -t lottery-docker-updater:latest .

# Run (set your containers in DOCKER_IMAGES)
docker run -d \
  -p 3000:3000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -e DOCKER_IMAGES='container1,container2,container3' \
  --name lottery-updater \
  lottery-docker-updater:latest
```

### Build & Run with Podman

```powershell
podman build -t lottery-docker-updater:latest .

podman run -d `
  -p 3000:3000 `
  -v /var/run/docker.sock:/var/run/docker.sock `
  -e DOCKER_IMAGES='lottery-nginx,lottery-dotnet' `
  --name lottery-updater `
  lottery-docker-updater:latest
```

### Docker Compose

```bash
docker-compose up -d
```

## Access UI

Open browser: **http://localhost:3000**

## Configuration

Edit `DOCKER_IMAGES` environment variable with your container names (comma-separated):

```
DOCKER_IMAGES=plex,sonarr,radarr,jellyfin
```

Click "Update Dockers" button to update all configured containers!

---

Full documentation coming soon...
