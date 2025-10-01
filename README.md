# Container Pilot 🐋✈️

[![Build and Push Docker image](https://github.com/alexandru360/container-pilot/actions/workflows/docker-publish.yml/badge.svg)](https://github.com/alexandru360/container-pilot/actions/workflows/docker-publish.yml)
[![CI](https://github.com/alexandru360/container-pilot/actions/workflows/ci.yml/badge.svg)](https://github.com/alexandru360/container-pilot/actions/workflows/ci.yml)

**Your co-pilot for Docker container management** - Aplicație Next.js pentru management complet al containerelor Docker cu interfață modernă și intuitivă.

## 🚀 Caracteristici

- 🔄 **Update containere** - Actualizează toate containerele cu un singur click
- ✅ **Check for updates** - Verifică dacă există versiuni noi pentru fiecare container
- ▶️ **Start/Stop/Restart** - Control complet al containerelor
- � **Container logs** - Vezi log-urile în timp real pentru fiecare container
- 📊 **Status monitoring** - Monitorizează starea containerelor (running/stopped/paused)
- 🎯 **Accordion interface** - Click pe numele containerului pentru detalii și log-uri
- 🔌 **Real-time updates** - WebSocket pentru logs în timp real
- 🎨 **Material-UI** - Interface modernă și responsivă
- 🐋 **Suport flexibil** - Docker local (socket) sau remote (HTTP/HTTPS)

## 📸 Preview

### Interfața principală cu Accordion
- **Header accordion**: Butonele Check Update, Start/Stop, Restart
- **Click pe nume**: Expand pentru a vedea log-urile și detalii
- **Status chips**: Culori diferite pentru running (verde), stopped (roșu), paused (portocaliu)
- **Activity Logs**: Istoric cu toate operațiunile efectuate

### Butoane disponibile (în header-ul acordeonului)
1. **🔍 Check Update** - Verifică dacă există versiune nouă
2. **▶️ Start** - Pornește containerul (doar dacă e oprit)
3. **⏹️ Stop** - Oprește containerul (doar dacă e pornit)
4. **🔄 Restart** - Restart container (doar dacă e pornit)

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
Name: container-pilot
Repository: ghcr.io/alexandru360/container-pilot:latest
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
podman build -t container-pilot:latest .

podman run -d \
  -p 3000:3000 \
  --privileged \
  -v /run/podman/podman.sock:/var/run/docker.sock:Z \
  -e "DOCKER_IMAGES=container1,container2,container3" \
  -e "NODE_ENV=production" \
  --name container-pilot \
  container-pilot:latest
```
  -v /run/podman/podman.sock:/var/run/docker.sock:Z \
  -e "DOCKER_IMAGES=lottery-nginx,lottery-dotnet" \
```

## Rulare cu Docker Compose

```bash
docker-compose up -d
```

## 📡 API Endpoints

### GET `/api/config`
Returnează lista containerelor configurate.

### GET `/api/status`
Returnează status-ul tuturor containerelor (running/stopped/paused/not-found).

### POST `/api/check-update`
Verifică dacă există update pentru un container specific.
```json
{
  "containerId": "abc123"
}
```

**Răspuns:**
```json
{
  "success": true,
  "containerId": "abc123",
  "containerName": "my-app",
  "currentImage": "my-image:latest",
  "hasUpdate": true,
  "updateAvailable": "available",
  "message": "🆕 Update available! New version found."
}
```

**Statusuri posibile:**
- `available` - Update disponibil
- `up-to-date` - La zi cu ultima versiune
- `check-recommended` - Container vechi, verificare recomandată
- `recently-created` - Container recent creat
- `check-failed` - Nu s-a putut verifica

### POST `/api/control`
Start/Stop/Restart container.
```json
{
  "containerId": "abc123",
  "action": "start" // sau "stop", "restart"
}
```

### GET `/api/logs`
Returnează log-urile unui container.
```
/api/logs?containerId=abc123&lines=200
```

### POST `/api/update`
Trigger update pentru toate containerele configurate (pull, stop, remove, recreate).

### GET `/api/health`
Health check endpoint.

## Pull from GitHub Container Registry

```bash
# Latest version
docker pull ghcr.io/alexandru360/container-pilot:latest

# Specific version
docker pull ghcr.io/alexandru360/container-pilot:1.1.0
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
