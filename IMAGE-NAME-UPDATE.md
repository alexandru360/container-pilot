# Docker Image Name Update

## Change Summary

Updated Docker image name across all project files to match the actual GitHub Container Registry publication name.

## Before → After

| Location | Old Name | New Name |
|----------|----------|----------|
| GHCR Image | `ghcr.io/alexandru360/lottery-docker-updater` | `ghcr.io/alexandru360/container-pilot` |
| Local Build | `lottery-docker-updater:latest` | `container-pilot:latest` |
| Package Name | `lottery-docker-updater` | `container-pilot` |

## Files Updated

### GitHub Actions Workflows
- ✅ `.github/workflows/docker-publish.yml` - Already using `container-pilot`
- ✅ `.github/workflows/release.yml` - Updated to `container-pilot`
- ✅ `.github/workflows/ci.yml` - Updated test image name
- ✅ `.github/workflows/README.md` - Updated examples

### Package Files
- ✅ `package.json` - Already using `container-pilot`
- ✅ `package-lock.json` - Regenerated with correct name

### Documentation
- ℹ️ Historical documents (REBRANDING.md, RELEASE-v1.1.0.md, etc.) intentionally left unchanged as historical reference

## Current Usage

### Pull from GitHub Container Registry
```bash
# Latest version
docker pull ghcr.io/alexandru360/container-pilot:latest

# Specific version
docker pull ghcr.io/alexandru360/container-pilot:1.1.0

# Specific commit
docker pull ghcr.io/alexandru360/container-pilot:sha-abc1234
```

### Run Container
```bash
docker run -d \
  --name container-pilot \
  -p 3000:3000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -e DOCKER_IMAGES=lottery-dotnet,lottery-nginx \
  -e NODE_ENV=production \
  --privileged \
  --restart unless-stopped \
  ghcr.io/alexandru360/container-pilot:latest
```

### Build Locally
```bash
# Docker
docker build -t container-pilot:latest .

# Podman
podman build -t container-pilot:latest .
```

## Migration Note

If you have the old image name cached or in use:

```bash
# Remove old image (optional)
docker rmi ghcr.io/alexandru360/lottery-docker-updater:latest

# Pull new image
docker pull ghcr.io/alexandru360/container-pilot:latest

# Update your docker run command or docker-compose.yml to use the new image name
```

## Next Release

The next release will be published as:
- `ghcr.io/alexandru360/container-pilot:v1.2.0`
- `ghcr.io/alexandru360/container-pilot:1.2.0`
- `ghcr.io/alexandru360/container-pilot:latest`

All using the consistent `container-pilot` name across the board.

---

**Date:** October 1, 2025  
**Status:** ✅ Complete  
**Impact:** Better consistency across documentation and actual published images
