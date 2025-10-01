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

#### Metoda 1: Cu Docker Socket (Recomandat)

```
Name: lottery-tools
Repository: ghcr.io/alexandru360/lottery-docker-updater:latest
WebUI: http://[IP]:[PORT:3000]
Port: 3000 -> 3000 (TCP)

Path #1:
  Name: Docker socket
  Container Path: /var/run/docker.sock
  Host Path: /var/run/docker.sock
  Access Mode: Read/Write
  Description: This is needed for Docker management

Environment Variables:
  - DOCKER_IMAGES: lottery-nginx,lottery-dotnet,lottery-tools
  - NODE_ENV: production  (lowercase!)
  - TZ: Europe/Athens

Extra Parameters:
  --privileged
```

#### Metoda 2: Cu Docker Remote API

Dacă socket-ul nu funcționează, activează Docker Remote API:

**Pași:**
1. Mergi la **Settings** → **Docker** în Unraid
2. Activează **Enable Remote API**
3. Setează portul (default: 2375)
4. Restart Docker service
5. În template, NU adăuga path-ul pentru socket
6. Adaugă variabila: `DOCKER_HOST=http://SERVER_IP:2375`

```
Environment Variables:
  - DOCKER_IMAGES: lottery-nginx,lottery-dotnet,lottery-tools
  - DOCKER_HOST: http://192.168.1.10:2375  (Înlocuiește cu IP-ul tău Unraid)
  - NODE_ENV: production
```

### ⚠️ Notă Importantă despre NODE_ENV

Folosește **`production`** (lowercase), NU `Production`! Next.js necesită exact această valoare.

### De ce DOCKER_HOST?

În Unraid, containerul poate avea restricții de permisiuni pentru socket-ul Docker local. Ai două opțiuni:

1. **Socket Mount + --privileged** (mai simplu, mai rapid)
   - Montează `/var/run/docker.sock`
   - Adaugă `--privileged` în Extra Parameters
   
2. **Docker Remote API** (mai sigur pentru production)
   - Activează Remote API în Settings
   - Folosește `DOCKER_HOST=http://IP:2375`
   - Nu necesită `--privileged`

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
