# Docker Container Updater

[![Build and Push Docker image](https://github.com/alexandru360/lottery-tools/actions/workflows/docker-publish.yml/badge.svg)](https://github.com/alexandru360/lottery-tools/actions/workflows/docker-publish.yml)
[![CI](https://github.com/alexandru360/lottery-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/alexandru360/lottery-tools/actions/workflows/ci.yml)

Aplicație Next.js pentru actualizarea containerelor Docker cu un singur click.

## Caracteristici

- 🔄 Update automat containere Docker
- 📊 Logs în timp real prin WebSocket
- 🎨 Interface modern cu Material-UI
- 🐋 Suport pentru Docker local sau remote

## Variabile de Mediu

### DOCKER_IMAGES (obligatoriu)
Lista containerelor care trebuie actualizate, separate prin virgulă.

**Exemplu:**
```bash
DOCKER_IMAGES=lottery-nginx,lottery-dotnet,my-app
```

### DOCKER_HOST (opțional)
Specifică engine-ul Docker care administrează containerele.

**Valori acceptate:**
- `http://IP:PORT` - Docker daemon remote via HTTP
  ```bash
  DOCKER_HOST=http://192.168.1.100:2375
  ```
- `https://IP:PORT` - Docker daemon remote via HTTPS  
  ```bash
  DOCKER_HOST=https://192.168.1.100:2376
  ```
- `unix:///path/to/socket` - Docker socket local
  ```bash
  DOCKER_HOST=unix:///var/run/docker.sock
  ```
- Dacă nu este specificat: folosește `/var/run/docker.sock` (default)

## Utilizare în Unraid

### Template Container Unraid

```
Name: Docker Updater
Repository: ghcr.io/username/lottery-docker-updater:latest
Port: 3000 -> 3000
Path: /var/run/docker.sock -> /var/run/docker.sock

Environment Variables:
  - DOCKER_IMAGES: lottery-nginx,lottery-dotnet
  - DOCKER_HOST: http://192.168.1.10:2375  (IP-ul serverului Unraid)
```

### De ce DOCKER_HOST?

În Unraid, containerul nu poate reporni alte containere direct prin socket-ul local (`/var/run/docker.sock`) din cauza restricțiilor de permisiuni. Trebuie să specifici IP-ul și portul serverului Unraid unde rulează Docker daemon-ul.

**Pași pentru activarea Docker Remote API în Unraid:**

1. Mergi la **Settings** → **Docker**
2. Activează **Enable Remote API**
3. Setează portul (default: 2375)
4. Restart Docker service
5. Folosește `DOCKER_HOST=http://UNRAID_IP:2375` în container

## Rulare Locală cu Podman

```bash
podman build -t lottery-docker-updater:latest .

podman run -d \
  -p 3000:3000 \
  -v /run/podman/podman.sock:/var/run/docker.sock:Z \
  -e "DOCKER_IMAGES=lottery-nginx,lottery-dotnet" \
  --name lottery-updater \
  lottery-docker-updater:latest
```

## Rulare cu Docker Compose

```bash
docker-compose up -d
```

## Pull from GitHub Container Registry

```bash
# Latest version
docker pull ghcr.io/alexandru360/lottery-docker-updater:latest

# Specific version
docker pull ghcr.io/alexandru360/lottery-docker-updater:1.0.0
```

## Build

```bash
npm install
npm run build
```

## Development

```bash
npm run dev
```

**Notă:** În dev mode, Socket.IO nu funcționează automat. Pentru testare completă, rulează:
```bash
node server.js
```

## CI/CD

Proiectul folosește GitHub Actions pentru:
- **Continuous Integration** - Build și test automat pe fiecare push/PR
- **Docker Build & Push** - Publicare automată pe GHCR la push pe `main`
- **Release Management** - Creare automată release la push de tag (`v*.*.*`)

Vezi [.github/workflows/README.md](.github/workflows/README.md) pentru detalii.

## Arhitectură

- **Next.js 14** - Framework React cu App Router
- **Material-UI** - Componente UI
- **Socket.IO** - WebSocket pentru logs în timp real
- **dockerode** - Client Node.js pentru Docker API
- **Custom server** - server.js integrează Socket.IO cu Next.js

## Licență

MIT
