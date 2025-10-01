# 🎯 User Guide - Container Pilot

## Interface Overview

### 📋 Main Screen

Când accesezi aplicația la `http://localhost:3000`, vei vedea:

1. **Header**
   - Titlu: "🐋 Docker Container Manager"
   - Buton Refresh (top-right) pentru a actualiza status-ul tuturor containerelor
   - Subtitle: "Manage your Docker containers with real-time status and logs"
   - Counter: Număr de containere configurate

2. **Lista de Containere (Accordion)**
   - Fiecare container are propriul accordion
   - Click pe accordion pentru a expanda/collapsa

3. **Update All Button**
   - Buton mare albastru: "Update All Containers"
   - Click pentru a actualiza toate containerele odată

4. **Activity Logs**
   - Secțiune la finalul paginii
   - Arată toate operațiunile efectuate (success ✅, error ❌, warning ⚠️, info ℹ️)

---

## 🎛️ Accordion Header

Fiecare container are un header cu următoarele elemente:

### Stânga:
- **🐋 Nume Container** (e.g., "ollama")
- **Image name** (caption mic, e.g., "ollama/ollama:latest")

### Centru:
- **Status Chip** - Colorat după stare:
  - 🟢 **Green (running)**: Container pornit
  - 🔴 **Red (exited)**: Container oprit
  - 🟠 **Orange (paused)**: Container paused
  - ⚪ **Gray (not-found)**: Container nu există

### Dreapta (Butoane):
1. **🔍 Check Update** (albastru) - Verifică dacă există versiune nouă
2. **▶️ Start** (verde) - Pornește containerul (doar dacă e oprit)
3. **⏹️ Stop** (roșu) - Oprește containerul (doar dacă e pornit)
4. **🔄 Restart** (albastru) - Restart container (doar dacă e pornit)

**Important**: Butoanele NU deschid acordeonul! Poți apăsa pe ele fără să expandezi containerul.

---

## 📂 Accordion Details (când expandezi)

Click pe numele containerului sau pe săgeata ▼ pentru a expanda și vedea:

### Container Info
```
ID: 8e14d924cd99
State: running
Created: 01.10.2025, 19:38:45
Ports: 11434:11434/tcp
```

### Update Status (dacă ai apăsat Check Update)
Alert colorat care arată:
- 🟢 **Verde**: "✅ Up to date! Running latest version."
- 🟠 **Orange**: "🆕 Update available! New version found."
- 🔵 **Albastru**: "✅ Recently created, likely up to date."
- 🟡 **Galben**: "⚠️ Container is old, check recommended."

### Container Logs
- **Titlu**: "📋 Container Logs"
- **Refresh Button**: ↻ în dreapta pentru a reîncărca log-urile
- **Text Area**: Log-uri cu font monospace pe fundal negru
- **Auto-load**: Log-urile se încarcă automat când expandezi acordeonul prima dată

---

## 🎮 How to Use

### ✅ Check if Container Has Updates

1. Găsește containerul în listă
2. Click pe butonul **🔍** (Check Update) din header
3. Așteaptă (~1-2 secunde) - butonul arată loading spinner
4. Expand acordeonul pentru a vedea rezultatul în alert
5. Verifică mesajul:
   - "Update available" → Ar trebui să updatezi
   - "Up to date" → Totul e ok
   - "Check recommended" → Container vechi, verifică manual

**Note:**
- Nu descarcă imaginea (doar verifică digest-ul)
- Foarte rapid (<500ms per container)
- Rezultatul se afișează în Activity Logs

### ▶️ Start a Stopped Container

1. Găsește containerul cu status **red (exited)**
2. Click pe butonul **▶️ Start** din header
3. Așteaptă ~1-2 secunde
4. Status chip devine **green (running)**
5. Verifică Activity Logs pentru confirmare: "✅ ollama: start successful"

### ⏹️ Stop a Running Container

1. Găsește containerul cu status **green (running)**
2. Click pe butonul **⏹️ Stop** din header
3. Așteaptă ~1-2 secunde
4. Status chip devine **red (exited)**
5. Verifică Activity Logs pentru confirmare: "✅ ollama: stop successful"

### 🔄 Restart a Container

1. Containerul trebuie să fie **running**
2. Click pe butonul **🔄 Restart** din header
3. Așteaptă ~3-5 secunde (stop + start)
4. Status chip rămâne **green (running)**
5. Verifică Activity Logs pentru confirmare

### 📋 View Container Logs

**Metoda 1: Click pe Accordion**
1. Click pe numele containerului sau pe săgeata ▼
2. Acordeonul se expandează automat și încarcă log-urile
3. Vezi ultimele 200 de linii din log

**Metoda 2: Refresh Logs**
1. Dacă acordeonul e deja expandat
2. Click pe butonul **↻ Refresh** (lângă "Container Logs")
3. Log-urile se reîncarcă

**Metoda 3: Collapse & Expand**
1. Închide acordeonul (click pe săgeată ▲)
2. Redeschide acordeonul (click pe săgeată ▼)
3. Log-urile rămân cached (nu se reîncarcă automat)

### 🔄 Update All Containers

1. Scroll la secțiunea "Update All Containers"
2. Click pe butonul mare albastru
3. Aplicația va:
   - Pull ultima versiune pentru fiecare imagine
   - Stop containerul
   - Remove containerul vechi
   - Recreate containerul cu noua imagine
4. Vezi progresul în **Activity Logs** (real-time prin WebSocket)
5. Status-ul se actualizează automat după finalizare

**Warning**: Această operațiune:
- Oprește containerele temporar (downtime!)
- Descarcă imagini noi (poate dura minute)
- Recreează containerele (configurația trebuie să fie corectă)

---

## 🔔 Activity Logs Explained

La finalul paginii există secțiunea "Activity Logs" care arată toate operațiunile:

### Tipuri de mesaje:

#### ✅ Success (verde)
```
✅ ollama: start successful
✅ Up to date! Running latest version. (ollama)
```

#### ❌ Error (roșu)
```
❌ portainer: stop failed - Error: Container not running
```

#### ⚠️ Warning (portocaliu)
```
⚠️ ollama: Container is old, check recommended.
🆕 Update available! New version found. (nginx)
```

#### ℹ️ Info (albastru)
```
ℹ️ Starting update process...
ℹ️ Pulling image: ollama/ollama:latest
```

---

## 🚨 Troubleshooting

### Container Shows "not-found"
**Cauză**: Containerul nu există în Docker
**Soluție**: 
- Verifică că numele e corect în `DOCKER_IMAGES`
- Rulează `docker ps -a` pentru a vedea numele real
- Containerul trebuie creat înainte

### Check Update arată "check-failed"
**Cauză**: Nu se poate conecta la registry sau imagine invalidă
**Soluție**:
- Verifică conectivitatea la internet
- Verifică că imaginea există: `docker pull <image>`
- Pentru imagini private, adaugă autentificare

### Butoanele nu fac nimic
**Cauză**: Container ID-ul nu e valid sau socket-ul Docker nu e montat
**Soluție**:
- Verifică că containerul rulează cu `--privileged`
- Verifică mount-ul: `-v /var/run/docker.sock:/var/run/docker.sock:rw`
- Verifică logs: `docker logs container-pilot`

### Log-urile nu se încarcă
**Cauză**: Container nu are output sau a fost șters
**Soluție**:
- Verifică că containerul există: `docker ps -a`
- Click pe **↻ Refresh** pentru retry
- Verifică că containerul are log-uri: `docker logs <container>`

### "Update All" nu funcționează
**Cauză**: WebSocket connection failed sau socket mount missing
**Soluție**:
- Deschide Developer Tools (F12) → Console
- Verifică erori WebSocket
- Verifică că `--privileged` e setat
- Restart container-pilot container

---

## 💡 Tips & Best Practices

### 🎯 Before Updating
1. **Check Update** pentru fiecare container
2. Verifică dacă chiar există update
3. Citește log-urile pentru erori
4. Fă backup la date importante

### 🔒 Security
- Nu expune portul 3000 public (doar LAN)
- Folosește reverse proxy cu autentificare
- Rulează în network izolat în Unraid

### ⚡ Performance
- Auto-refresh la fiecare 10 secunde (status)
- Log-urile se încarcă doar când expandezi
- Check Update nu descarcă imagini (lightweight)

### 📱 Mobile Friendly
- UI-ul e responsive (funcționează pe telefon)
- Butoanele sunt suficient de mari pentru touchscreen
- Accordion-ul se expandează ușor pe mobile

---

## 🎨 Color Guide

### Status Chips
- 🟢 **Verde** = Running (OK)
- 🔴 **Roșu** = Stopped/Exited
- 🟠 **Orange** = Paused
- ⚪ **Gri** = Not Found

### Buttons
- 🔵 **Albastru** = Info/Check/Restart
- 🟢 **Verde** = Start/Success
- 🔴 **Roșu** = Stop/Error
- 🟡 **Galben** = Warning

### Alerts
- 🟢 **Success** = Up to date
- 🟠 **Warning** = Update available
- 🔵 **Info** = Check recommended
- 🔴 **Error** = Operation failed

---

## 📞 Need Help?

- **GitHub Issues**: https://github.com/alexandru360/container-pilot/issues
- **Documentation**: Check README.md, CHECK-UPDATE.md, CHANGELOG.md
- **Logs**: `docker logs container-pilot` pentru debugging
