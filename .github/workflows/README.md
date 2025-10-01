# GitHub Actions Workflows

This directory contains the CI/CD workflows for the Lottery Docker Updater project.

## Workflows

### 1. **docker-publish.yml** - Main Docker Build & Push
**Trigger:** Push to `main` branch or manual dispatch

**What it does:**
- Builds Docker image for `linux/amd64` and `linux/arm64`
- Pushes to GitHub Container Registry (GHCR)
- Tags: `latest` and `sha-<commit>`

**Image location:**
```bash
ghcr.io/alexandru360/lottery-docker-updater:latest
```

### 2. **ci.yml** - Continuous Integration
**Trigger:** Push/PR to `main` or `develop` branches

**What it does:**
- Installs dependencies with `npm ci`
- Runs linting with `npm run lint`
- Builds Next.js application
- Tests Docker image build
- Uploads build artifacts

### 3. **release.yml** - Version Release
**Trigger:** Push of version tags (`v*.*.*`)

**What it does:**
- Builds multi-platform Docker images
- Tags with version number (e.g., `v1.0.0`, `1.0.0`, `latest`)
- Creates GitHub Release with notes
- Publishes to GHCR

**Usage:**
```bash
git tag v1.0.0
git push origin v1.0.0
```

## Required Secrets

No additional secrets required! The workflows use:
- `GITHUB_TOKEN` - Automatically provided by GitHub Actions

## Permissions

The workflows require:
- `contents: read` - Read repository content
- `packages: write` - Push to GHCR
- `id-token: write` - For attestation (optional)

## Usage Examples

### Deploy latest version:
```bash
docker pull ghcr.io/alexandru360/lottery-docker-updater:latest
```

### Deploy specific version:
```bash
docker pull ghcr.io/alexandru360/lottery-docker-updater:1.0.0
```

### Deploy specific commit:
```bash
docker pull ghcr.io/alexandru360/lottery-docker-updater:sha-abc1234
```

## Local Testing

Before pushing, test the Docker build locally:
```bash
docker build -t lottery-docker-updater:test .
docker run --rm lottery-docker-updater:test node --version
```

Or with Podman:
```bash
podman build -t lottery-docker-updater:test .
podman run --rm lottery-docker-updater:test node --version
```
