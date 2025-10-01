# Unraid Docker Template pentru lottery-tools

## Template XML pentru Unraid Community Apps

```xml
<?xml version="1.0"?>
<Container version="2">
  <Name>lottery-tools</Name>
  <Repository>ghcr.io/alexandru360/lottery-docker-updater:latest</Repository>
  <Registry>https://ghcr.io/</Registry>
  <Network>bridge</Network>
  <MyIP/>
  <Shell>sh</Shell>
  <Privileged>true</Privileged>
  <Support>https://github.com/alexandru360/lottery-tools</Support>
  <Project>https://github.com/alexandru360/lottery-tools</Project>
  <Overview>
    Docker Container Manager - Update, start, stop, and view logs of your Docker containers with a beautiful web interface.
    
    Features:
    - Real-time container status monitoring
    - Start/Stop/Restart containers
    - View container logs
    - Update containers with one click
    - Live update progress via WebSocket
    - Mobile-friendly interface
  </Overview>
  <Category>Tools:System</Category>
  <WebUI>http://[IP]:[PORT:3000]</WebUI>
  <TemplateURL/>
  <Icon>https://raw.githubusercontent.com/docker-library/docs/master/docker/logo.png</Icon>
  <ExtraParams>--privileged</ExtraParams>
  <PostArgs/>
  <CPUset/>
  <DateInstalled>1696176000</DateInstalled>
  <DonateText/>
  <DonateLink/>
  <Requires/>
  <Config Name="WebUI Port" Target="3000" Default="3000" Mode="tcp" Description="Web interface port" Type="Port" Display="always" Required="true" Mask="false">3000</Config>
  <Config Name="Docker Socket" Target="/var/run/docker.sock" Default="/var/run/docker.sock" Mode="rw" Description="Docker socket for container management. Required for the app to function." Type="Path" Display="always" Required="true" Mask="false">/var/run/docker.sock</Config>
  <Config Name="DOCKER_IMAGES" Target="DOCKER_IMAGES" Default="lottery-nginx,lottery-dotnet" Mode="" Description="Comma-separated list of container names to manage (e.g., container1,container2,container3)" Type="Variable" Display="always" Required="true" Mask="false">lottery-nginx,lottery-dotnet,lottery-tools</Config>
  <Config Name="NODE_ENV" Target="NODE_ENV" Default="production" Mode="" Description="Node environment - must be lowercase 'production'" Type="Variable" Display="always" Required="true" Mask="false">production</Config>
  <Config Name="DOCKER_HOST" Target="DOCKER_HOST" Default="" Mode="" Description="(Optional) Docker host URL if using Remote API instead of socket. Example: http://192.168.1.10:2375" Type="Variable" Display="advanced" Required="false" Mask="false"></Config>
  <Config Name="TZ" Target="TZ" Default="Europe/Athens" Mode="" Description="Container timezone" Type="Variable" Display="advanced" Required="false" Mask="false">Europe/Athens</Config>
  <Config Name="Host OS" Target="HOST_OS" Default="Unraid" Mode="" Description="" Type="Variable" Display="advanced-hide" Required="false" Mask="false">Unraid</Config>
  <Config Name="Host Hostname" Target="HOST_HOSTNAME" Default="MoonServer" Mode="" Description="" Type="Variable" Display="advanced-hide" Required="false" Mask="false">MoonServer</Config>
</Container>
```

## Comandă Docker Run pentru Unraid

### Metoda 1: Cu Docker Socket (Recomandat)

```bash
docker run -d \
  --name='lottery-tools' \
  --net='bridge' \
  --privileged \
  -e TZ="Europe/Athens" \
  -e HOST_OS="Unraid" \
  -e 'DOCKER_IMAGES'='lottery-dotnet,lottery-nginx,lottery-tools' \
  -e 'NODE_ENV'='production' \
  -p '3000:3000/tcp' \
  -v '/var/run/docker.sock':'/var/run/docker.sock':'rw' \
  'ghcr.io/alexandru360/lottery-docker-updater:latest'
```

### Metoda 2: Cu Docker Remote API

**Pasul 1:** Activează Docker Remote API în Unraid:
- Settings → Docker → Enable Remote API → Port 2375 → Apply

**Pasul 2:** Rulează containerul:

```bash
docker run -d \
  --name='lottery-tools' \
  --net='bridge' \
  -e TZ="Europe/Athens" \
  -e HOST_OS="Unraid" \
  -e 'DOCKER_IMAGES'='lottery-dotnet,lottery-nginx,lottery-tools' \
  -e 'DOCKER_HOST'='http://192.168.1.10:2375' \
  -e 'NODE_ENV'='production' \
  -p '3000:3000/tcp' \
  'ghcr.io/alexandru360/lottery-docker-updater:latest'
```

**⚠️ Înlocuiește `192.168.1.10` cu IP-ul real al serverului tău Unraid!**

## Troubleshooting

### Error: "Couldn't find any `pages` or `app` directory"
**Cauză:** `NODE_ENV` setat cu majuscule (`Production` în loc de `production`)
**Soluție:** Schimbă în variabila de mediu: `NODE_ENV=production` (lowercase)

### Error: "connect ENOENT /var/run/docker.sock"
**Cauză:** Docker socket nu este montat sau nu are permisiuni
**Soluții:**
1. Verifică că Path-ul este adăugat corect în template
2. Asigură-te că `--privileged` este setat
3. SAU folosește Metoda 2 cu Docker Remote API

### Containerele nu se actualizează
**Verifică:**
1. Variabila `DOCKER_IMAGES` conține numele corecte (verifică în Unraid Docker tab)
2. Socket-ul Docker este montat corect
3. Containerul rulează cu `--privileged`

### Nu pot accesa interfața web
**Verifică:**
1. Portul 3000 este corect mapat
2. Nu există conflict cu alt serviciu pe portul 3000
3. Firewall-ul permite conexiuni pe portul 3000

## Suport

Pentru probleme sau întrebări:
- GitHub Issues: https://github.com/alexandru360/lottery-tools/issues
- Documentation: https://github.com/alexandru360/lottery-tools/blob/main/README.md
