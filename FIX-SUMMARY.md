# Rezolvare Probleme - Sumar

## Problema Identificată

Site-ul https://lottery-tools.alexserv.xyz/ afișează eroarea:
```
GET /api/status 500 (Internal Server Error)
```

Pagina arată "No containers configured" deși ar trebui să vadă containerele.

## Cauza

Endpoint-ul `/api/status` returnează eroare 500, cel mai probabil din cauza:

1. **Variabila de mediu `DOCKER_IMAGES` nu este setată** în containerul de producție
2. **Docker socket (`/var/run/docker.sock`) nu este montat** sau nu este accesibil
3. **Permisiuni insuficiente** pentru a accesa Docker socket-ul

## Soluții Implementate

### 1. Logging Îmbunătățit

Am adăugat logging detaliat în `app/api/status/route.js`:
- Afișează `DOCKER_IMAGES` și `DOCKER_HOST` la fiecare request
- Loghează numărul de containere găsite
- Returnează informații detaliate în caz de eroare (error code, docker host)

### 2. Documentație Completă

**TROUBLESHOOTING.md**
- Ghid complet de rezolvare probleme
- Cauze comune și soluții detaliate
- Exemple pentru Docker Compose, Docker Run, Unraid

**DEPLOYMENT-CHECKLIST.md**
- Lista de verificări pre-deployment
- Pași de deployment pas cu pas
- Verificări post-deployment
- Script bash de verificare automată

**QUICK-FIX.md**
- Soluții rapide pentru problemele cele mai comune
- Fix-uri specifice pentru Unraid
- Comenzi copy-paste gata de folosit

### 3. Script-uri de Diagnosticare

**diagnose.sh** (Linux/Mac)
- Verifică dacă containerul rulează
- Verifică variabilele de mediu
- Verifică accesul la Docker socket
- Testează toate endpoint-urile API
- Oferă recomandări specifice de fix

**diagnose.ps1** (Windows PowerShell)
- Aceleași verificări ca script-ul bash
- Adaptat pentru PowerShell și Windows

### 4. README Actualizat

Am adăugat secțiune de troubleshooting în README.md cu:
- Link-uri la documentația de troubleshooting
- Instrucțiuni rapide pentru erori comune
- Comenzi pentru verificare logs

## Cum să Rezolvi Problema

### Pasul 1: Descarcă actualizările

Pe serverul de producție:
```bash
cd /path/to/container-pilot
git pull origin main
```

### Pasul 2: Rebuild imaginea Docker

```bash
docker build -t container-pilot:latest .
```

Sau folosește imaginea de pe GitHub Container Registry:
```bash
docker pull ghcr.io/alexandru360/container-pilot:latest
```

### Pasul 3: Rulează script-ul de diagnosticare

**Linux/Mac:**
```bash
bash diagnose.sh
```

**Windows:**
```powershell
.\diagnose.ps1
```

Script-ul va identifica exact ce lipsește și va oferi comenzi de fix.

### Pasul 4: Aplică fix-ul recomandat

Cel mai probabil va trebui să **recreezi containerul** cu variabilele de mediu corecte:

```bash
# Stop și remove containerul curent
docker stop container-pilot
docker rm container-pilot

# Rulează cu configurația corectă
docker run -d \
  --name container-pilot \
  -p 3000:3000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -e DOCKER_IMAGES=lottery-nginx,lottery-dotnet \
  -e PORT=3000 \
  -e NODE_ENV=production \
  --privileged \
  --restart unless-stopped \
  ghcr.io/alexandru360/container-pilot:latest
```

**IMPORTANT:** Înlocuiește `lottery-nginx,lottery-dotnet` cu numele reale ale containerelor tale.

Pentru a vedea numele containerelor:
```bash
docker ps --format '{{.Names}}'
```

### Pasul 5: Verifică că funcționează

```bash
# Verifică logs
docker logs container-pilot

# Testează API
curl http://localhost:3000/api/config
curl http://localhost:3000/api/status

# Deschide în browser
# http://localhost:3000 sau https://lottery-tools.alexserv.xyz
```

## Pentru Unraid

Dacă folosești Unraid:

### Opțiunea 1: Docker Socket (Recomandat)

1. În template-ul containerului:
   - Adaugă path mapping:
     - Container Path: `/var/run/docker.sock`
     - Host Path: `/var/run/docker.sock`
     - Access Mode: Read/Write
   - Adaugă în Extra Parameters: `--privileged`
   - Setează variabila: `DOCKER_IMAGES=lottery-nginx,lottery-dotnet`

### Opțiunea 2: Docker Remote API

1. Mergi la **Settings → Docker**
2. Activează **Enable Remote API**
3. Restart Docker service
4. În template container:
   - NU adăuga socket path
   - Adaugă variabila: `DOCKER_HOST=http://UNRAID_IP:2375`
   - Adaugă variabila: `DOCKER_IMAGES=lottery-nginx,lottery-dotnet`

## Verificare Finală

După ce aplici fix-ul:

1. ✅ Pagina se încarcă fără erori
2. ✅ Containerele sunt listate
3. ✅ Status-ul containerelor este afișat corect
4. ✅ Butoanele Start/Stop/Restart funcționează
5. ✅ Log-urile pot fi vizualizate

## Resurse

- [QUICK-FIX.md](QUICK-FIX.md) - Soluții rapide
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Ghid detaliat
- [DEPLOYMENT-CHECKLIST.md](DEPLOYMENT-CHECKLIST.md) - Verificări complete
- `diagnose.sh` / `diagnose.ps1` - Script-uri de diagnosticare

## Notă

Toate modificările au fost:
- ✅ Committed în Git
- ✅ Pushed pe GitHub
- ✅ Disponibile pentru pull

Pentru a obține ultima versiune:
```bash
git pull origin main
```

Sau folosește imaginea Docker publicată:
```bash
docker pull ghcr.io/alexandru360/container-pilot:latest
```

## Suport Tehnic

Dacă problema persistă după aplicarea fix-urilor:

1. Rulează `diagnose.sh` și salvează output-ul
2. Salvează logs: `docker logs container-pilot > logs.txt`
3. Deschide un issue pe GitHub cu:
   - Output-ul script-ului de diagnosticare
   - Log-urile containerului
   - Comanda folosită pentru a rula containerul
   - Screenshot-ul erorii din browser console

---

**Data creării acestui document:** 1 Octombrie 2025
**Versiune Container Pilot:** Latest (post-fix pentru eroarea 500)
