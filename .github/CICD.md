# Container Pilot - GitHub Actions CI/CD

Acest proiect folosește un **single unified pipeline** pentru CI/CD, organizat în stage-uri secvențiale clare.

## 📋 Pipeline Structure

```
┌─────────────────────────────────────────┐
│  STAGE 1: BUILD                         │
│  - Backend (.NET 8.0)                   │
│  - Frontend (React + Vite)              │
│  - Combine în artifact                  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  STAGE 2: TEST                          │
│  - Unit tests                           │
│  - Integration tests                    │
│  - Code quality checks                  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  STAGE 3: DOCKER                        │
│  - Build multi-platform image           │
│  - Push la GitHub Container Registry    │
│  - Tag: latest, version, sha            │
└──────────────┬──────────────────────────┘
               │
               ▼ (doar pe tags)
┌─────────────────────────────────────────┐
│  STAGE 4: DEPLOY (optional)             │
│  - Create GitHub Release                │
│  - Deployment notifications             │
└─────────────────────────────────────────┘
```

## 🚀 Trigger Conditions

Pipeline-ul se execută în următoarele situații:

- **Push pe `main`** → Build + Test + Docker (tag: `latest`)
- **Push pe `develop`** → Build + Test + Docker (tag: `develop`)
- **Pull Request** → Build + Test (fără Docker publish)
- **Tag `v*`** → Build + Test + Docker + Deploy (tag: version)
- **Manual** → Workflow dispatch pentru debugging

## 🏗️ Build Artifacts

Stage-ul de **BUILD** creează artifact-uri care sunt refolosite în stage-urile următoare:

```yaml
Artifact: published-app
├── ContainerPilot.Server.dll
├── appsettings.json
├── wwwroot/
│   ├── index.html
│   ├── assets/
│   └── ...
└── ...
```

Acest artifact este:
1. **Uploadat** după stage-ul BUILD
2. **Downloadat** în stage-ul DOCKER
3. **Copiat** direct în imagine (fără rebuild)

## 🐳 Docker Images

### Multi-platform build

Imaginile sunt construite pentru:
- `linux/amd64` (x86_64)
- `linux/arm64` (ARM pentru Raspberry Pi, M1/M2 Mac, etc.)

### Image tags

| Event | Tags |
|-------|------|
| Push pe `main` | `latest`, `main-<sha>` |
| Push pe `develop` | `develop`, `develop-<sha>` |
| Tag `v1.2.3` | `v1.2.3`, `1.2`, `1`, `latest` |
| Pull Request | `pr-<number>` |

### Pull imagine

```bash
# Latest stable
docker pull ghcr.io/<username>/container-pilot:latest
podman pull ghcr.io/<username>/container-pilot:latest

# Specific version
docker pull ghcr.io/<username>/container-pilot:v1.2.3

# Development branch
docker pull ghcr.io/<username>/container-pilot:develop
```

## 📦 Registry

Imaginile sunt publicate în **GitHub Container Registry (ghcr.io)**:

- Registry: `ghcr.io`
- Image: `ghcr.io/<username>/container-pilot`
- Visibility: Public (după prima publicare)
- Authentication: `GITHUB_TOKEN` (automat)

## 🔐 Secrets & Permissions

### Required permissions

Pipeline-ul folosește doar permisiuni built-in:

```yaml
permissions:
  contents: read    # Citește codul
  packages: write   # Publică imagini Docker
```

### No custom secrets needed!

Toate secret-urile sunt automate:
- `GITHUB_TOKEN` - generat automat de GitHub Actions
- `github.actor` - username-ul care a declanșat workflow-ul

## 🎯 Local Development Workflow

Pentru a replica exact ce face CI/CD-ul:

```bash
# 1. Build backend
cd src/ContainerPilot.Server
dotnet restore
dotnet build -c Release
dotnet publish -c Release -o ./bin/Release/net8.0/publish

# 2. Build frontend
cd src/ContainerPilot.Server.Client
npm ci
npm run build

# 3. Combine
cp -r dist/* ../bin/Release/net8.0/publish/wwwroot/

# 4. Build Docker image
cd ../../../../
docker build -t container-pilot:local -f Dockerfile.podman .

# 5. Test
docker run -p 5000:5000 -v /var/run/docker.sock:/var/run/docker.sock container-pilot:local
```

## 🔄 Pipeline Optimization

### Caching

Pipeline-ul folosește mai multe tipuri de cache:

1. **Dependency cache**
   - npm: `~/.npm`
   - NuGet: `~/.nuget/packages`

2. **Docker layer cache**
   - Type: GitHub Actions cache
   - Mode: `max` (cache all layers)

3. **Build artifacts**
   - Retention: 1 zi
   - Refolosit între stage-uri

### Paralelizare

Stage-urile sunt **secvențiale** (cum ai cerut), dar în interiorul unui stage poți paralela:

```yaml
# În viitor, poți adăuga:
test:
  strategy:
    matrix:
      test-suite: [unit, integration, e2e]
  # Toate suites rulează în paralel, dar stage-ul TEST așteaptă toate
```

## 📊 Monitoring & Notifications

### Pipeline status badge

Add în `README.md`:

```markdown
[![CI/CD Pipeline](https://github.com/<username>/container-pilot/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/<username>/container-pilot/actions/workflows/ci-cd.yml)
```

### Notifications (optional)

Poți adăuga notificări pentru failure:

```yaml
- name: Notify on failure
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

## 🛠️ Troubleshooting

### Pipeline fails la BUILD

```bash
# Local debug
dotnet restore --verbosity detailed
npm ci --loglevel verbose
```

### Pipeline fails la DOCKER

```bash
# Verifică Dockerfile local
docker build -t test -f Dockerfile.podman .

# Verifică dimensiunea imaginii
docker images test
```

### Imagine prea mare

Optimizări:
1. `.dockerignore` corect configurat
2. Multi-stage build (doar runtime, nu SDK)
3. Alpine/slim base images

## 🚀 Release Process

Pentru a lansa o nouă versiune:

```bash
# 1. Update version în csproj
# 2. Commit changes
git add .
git commit -m "chore: bump version to 1.2.3"

# 3. Create tag
git tag -a v1.2.3 -m "Release v1.2.3"

# 4. Push (trigger CI/CD)
git push origin main --tags
```

Pipeline-ul va:
1. ✅ Build + Test
2. 🐳 Build & publish Docker images
3. 📦 Create GitHub Release
4. 🚀 Deploy (dacă e configurat)

## 📝 Notes

- **Single pipeline** = Un singur workflow file
- **Sequential stages** = Build → Test → Docker (uno după altul)
- **Artifact reuse** = Build o dată, folosește peste tot
- **No parallel workflows** = Nu mai multe workflow-uri în același timp
- **Grouped execution** = Tot într-un singur run, vizibil în GitHub Actions UI
