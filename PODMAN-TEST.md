# Container Pilot - Podman Testing Guide

## Despre Testarea cu Podman

Container Pilot poate funcționa cu **Podman** în același mod în care funcționează cu Docker, deoarece Podman implementează Docker API. Socket-ul Podman poate fi montat în container exact ca socket-ul Docker.

## Diferențe între Docker și Podman

| Aspect | Docker | Podman |
|--------|--------|--------|
| Socket Path (Linux) | `/var/run/docker.sock` | `/run/podman/podman.sock` sau `/run/user/<UID>/podman/podman.sock` |
| Socket Path (Windows) | `//./pipe/docker_engine` | WSL2: `/run/podman/podman.sock` |
| Daemon | Da (Docker Engine) | Nu (daemonless) |
| Root Access | Necesită root | Poate rula rootless |
| API | Docker API | Docker-compatible API |

## Configurare Socket Podman

### Linux

Pornește serviciul Podman socket:

```bash
# Systemd user service
systemctl --user start podman.socket
systemctl --user enable podman.socket

# Verifică socket-ul
ls -la $XDG_RUNTIME_DIR/podman/podman.sock
# sau
ls -la /run/podman/podman.sock
```

Socket-ul va fi disponibil la:
- **Rootless**: `/run/user/<UID>/podman/podman.sock`
- **Root**: `/run/podman/podman.sock`

### Windows (cu Podman Desktop)

Podman Desktop pe Windows rulează în WSL2 și configurează automat socket-ul. Socket-ul este disponibil în WSL la:
- `/run/podman/podman.sock`
- `/mnt/wslg/runtime-dir/podman/podman.sock`

## Testare Rapidă

### Windows (PowerShell)

```powershell
# Rulează scriptul de testare
.\test-podman.ps1
```

Scriptul va:
1. ✅ Verifica instalarea Podman
2. 🔍 Detecta socket-ul Podman
3. 📦 Crea containere de test (test-nginx, test-alpine)
4. 🔨 Construi imaginea Container Pilot
5. 🚀 Porni Container Pilot cu acces la socket-ul Podman
6. ✅ Testa conexiunea și funcționalitatea

### Linux/macOS (Bash)

```bash
# Dă permisiuni de execuție
chmod +x test-podman.sh

# Rulează scriptul de testare
./test-podman.sh
```

## Testare Manuală

### 1. Construiește imaginea

```bash
podman build -t container-pilot:latest .
```

### 2. Creează containere de test

```bash
# Nginx pentru testare
podman run -d --name test-nginx -p 8080:80 nginx:alpine

# Alpine cu logs
podman run -d --name test-alpine alpine:latest sh -c \
  "while true; do echo 'Test log: $(date)'; sleep 10; done"
```

### 3. Pornește Container Pilot

**Linux (rootless):**
```bash
podman run -d \
  --name container-pilot-podman \
  -p 5000:5000 \
  -v $XDG_RUNTIME_DIR/podman/podman.sock:/var/run/docker.sock:rw \
  -e ASPNETCORE_ENVIRONMENT=Production \
  -e DockerHost=unix:///var/run/docker.sock \
  -e DockerImages=test-nginx,test-alpine \
  container-pilot:latest
```

**Windows (PowerShell cu WSL):**
```powershell
podman run -d `
  --name container-pilot-podman `
  -p 5000:5000 `
  --privileged `
  -v /run/podman/podman.sock:/var/run/docker.sock:rw `
  -e ASPNETCORE_ENVIRONMENT=Production `
  -e DockerHost=unix:///var/run/docker.sock `
  -e DockerImages=test-nginx,test-alpine `
  container-pilot:latest
```

### 4. Testează aplicația

```bash
# Health check
curl http://localhost:5000/api/health

# Status containere
curl http://localhost:5000/api/containers/status

# Deschide în browser
# http://localhost:5000
```

## Podman Compose

Pentru deployment complet, folosește `podman-compose.yml`:

```bash
# Cu podman-compose (dacă este instalat)
podman-compose -f podman-compose.yml up -d

# Sau cu podman play kube (conversie)
podman play kube podman-compose.yml
```

## Configurare pentru Unraid

În Unraid, vei folosi Docker (nu Podman), dar principiul este identic:

```yaml
services:
  container-pilot:
    image: ghcr.io/<username>/container-pilot:latest
    container_name: container-pilot
    ports:
      - "5000:5000"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:rw  # Docker socket în Unraid
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - DockerHost=unix:///var/run/docker.sock
      - DockerImages=plex,sonarr,radarr,transmission  # Containerele tale Unraid
    restart: unless-stopped
```

## Verificare Logs

```bash
# Logs Container Pilot
podman logs -f container-pilot-podman

# Logs containere de test
podman logs test-nginx
podman logs test-alpine

# Lista toate containerele
podman ps -a
```

## Troubleshooting

### Socket-ul Podman nu este găsit

```bash
# Pornește serviciul
systemctl --user start podman.socket

# Verifică status
systemctl --user status podman.socket

# Verifică dacă socket-ul există
ls -la $XDG_RUNTIME_DIR/podman/podman.sock
```

### Eroare de permisiuni

```bash
# Pentru rootless Podman, verifică permisiunile
chmod 660 $XDG_RUNTIME_DIR/podman/podman.sock

# Sau rulează cu --privileged
podman run --privileged ...
```

### Container Pilot nu vede containerele

Verifică că socket-ul este montat corect:

```bash
# Execută în container
podman exec -it container-pilot-podman ls -la /var/run/docker.sock

# Verifică logs pentru erori de conectare
podman logs container-pilot-podman | grep -i "docker"
```

## Notă Importantă

**Docker.DotNet** (biblioteca folosită de Container Pilot) funcționează cu orice API compatibil Docker, inclusiv Podman! Nu este nevoie de modificări în cod pentru a funcționa cu Podman - doar montează socket-ul corect și API-ul va funcționa identic.

## Resurse

- [Podman Documentation](https://docs.podman.io/)
- [Podman Desktop](https://podman-desktop.io/)
- [Podman API](https://docs.podman.io/en/latest/Reference.html)
- [Docker.DotNet](https://github.com/dotnet/Docker.DotNet)
