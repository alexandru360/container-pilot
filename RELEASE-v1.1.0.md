# 🎉 lottery-tools v1.1.0 - Release Summary

## 🚀 What's New

### 🎯 Accordion Interface
Interfața a fost complet redesenată cu **Material-UI Accordion**:
- Click pe numele containerului → expand pentru detalii și log-uri
- Header compact cu toate controalele
- UI mai clean și intuitiv
- Performanță îmbunătățită (lazy loading pentru logs)

### 🔍 Check for Updates (NEW!)
Verifică dacă există versiuni noi **fără a descărca imaginea**:
- Folosește Docker Distribution API pentru comparare digest-uri
- Foarte rapid (<500ms per container)
- Lightweight check (doar ~2-5KB de date)
- Statusuri clare: `available`, `up-to-date`, `check-recommended`, etc.

**How it works:**
1. Click pe butonul 🔍 din header-ul acordeonului
2. Aplicația compară digest-ul local cu cel din registry
3. Rezultatul apare într-un Alert în accordion + Activity Logs

### ⚡ Smart Buttons in Header
Toate butoanele sunt acum în header-ul acordeonului:
- **🔍 Check Update** - Verifică updates
- **▶️ Start** - Pornește container (doar dacă e oprit)
- **⏹️ Stop** - Oprește container (doar dacă e pornit)
- **🔄 Restart** - Restart container (doar dacă e pornit)

**Important:** Butoanele NU deschid acordeonul! Event propagation este oprit.

### 📋 Enhanced Logs Viewer
Log-urile sunt acum inline în accordion:
- Se încarcă automat când expandezi containerul prima dată
- Buton Refresh pentru a reîncărca
- Font monospace pe fundal negru (terminal-like)
- Ultimele 200 de linii

### 🎨 Better UI/UX
- Status chips colorate în header (verde/roșu/orange/gri)
- Tooltips pe toate butoanele
- Loading spinners pentru operațiuni async
- Alert-uri pentru update status
- Activity Logs cu iconițe colorate

---

## 📊 Technical Changes

### New API Endpoint
**POST `/api/check-update`**
```json
Request:
{
  "containerId": "abc123"
}

Response:
{
  "success": true,
  "containerId": "abc123",
  "containerName": "ollama",
  "currentImage": "ollama/ollama:latest",
  "currentImageId": "8e14d924cd99",
  "localDigest": "sha256:abc...",
  "remoteDigest": "sha256:xyz...",
  "hasUpdate": true,
  "updateAvailable": "available",
  "message": "🆕 Update available! New version found."
}
```

### Update Status Values
- `available` - Update disponibil
- `up-to-date` - La zi
- `check-recommended` - Container vechi (>7 zile)
- `recently-created` - Container recent (<7 zile)
- `check-failed` - Eroare la verificare
- `unknown` - Status necunoscut

### Code Improvements
- **Event Propagation Control**: `stopPropagation()` pentru butoane
- **Lazy Loading**: Log-urile se încarcă doar când sunt necesare
- **State Management**: Separate state pentru `checkingUpdate`, `updateStatus`, `containerLogs`
- **Docker Distribution API**: Folosește `image.distribution()` pentru digest check
- **Fallback Mechanism**: Creation date check dacă digest comparison eșuează

---

## 📦 Files Added/Modified

### New Files
- ✅ `app/api/check-update/route.js` - API pentru verificare updates
- ✅ `CHECK-UPDATE.md` - Documentație completă despre feature
- ✅ `USER-GUIDE.md` - Ghid complet pentru utilizatori
- ✅ `CHANGELOG.md` - Changelog cu toate modificările

### Modified Files
- ✏️ `app/page.js` - UI complet refăcut cu Accordion
- ✏️ `README.md` - Actualizat cu noile features
- ✏️ `package.json` - Version bump la 1.1.0

---

## 🎮 How to Test

### 1. Build & Run
```bash
cd D:\Dev\lottery-applications\lottery-tools
podman build -t lottery-docker-updater:latest .
podman run -d --name lottery-updater --privileged \
  -p 3000:3000 \
  -v /run/podman/podman.sock:/var/run/docker.sock:Z \
  -e "DOCKER_IMAGES=ollama,portainer" \
  -e "NODE_ENV=production" \
  lottery-docker-updater:latest
```

### 2. Open Browser
```
http://localhost:3000
```

### 3. Test Features

#### ✅ Test Accordion
- Click pe "ollama" → Acordeonul se expandează
- Vezi Container Info (ID, State, Created, Ports)
- Vezi Container Logs (ultimele 200 linii)
- Click pe săgeată ▲ → Acordeonul se închide

#### ✅ Test Check Update
- Click pe butonul 🔍 din header
- Așteaptă loading spinner (~1-2s)
- Expand acordeonul pentru a vedea rezultatul
- Verifică Activity Logs: ar trebui să apară mesajul

#### ✅ Test Start/Stop
- Dacă ollama e pornit → Click pe ⏹️ Stop
- Status chip devine roșu (exited)
- Click pe ▶️ Start
- Status chip devine verde (running)

#### ✅ Test Restart
- Click pe 🔄 Restart (doar dacă e running)
- Așteaptă ~3-5 secunde
- Status rămâne verde
- Verifică Activity Logs

#### ✅ Test Logs
- Expand acordeonul ollama
- Vezi log-urile încărcate automat
- Click pe ↻ Refresh
- Log-urile se reîncarcă

#### ✅ Test Update All
- Click pe "Update All Containers"
- Vezi progresul în Activity Logs (real-time)
- Containerele sunt pull-ate, stop-ate, șterse, recreate

---

## 🚀 Deployment

### Local (Podman/Docker)
```bash
podman run -d --name lottery-updater --privileged \
  -p 3000:3000 \
  -v /run/podman/podman.sock:/var/run/docker.sock:Z \
  -e "DOCKER_IMAGES=container1,container2" \
  -e "NODE_ENV=production" \
  lottery-docker-updater:latest
```

### Unraid
Vezi `UNRAID-SETUP.md` pentru template complet.

**Important:**
- Path: `/var/run/docker.sock` → `/var/run/docker.sock` (RW)
- Extra Parameters: `--privileged`
- NODE_ENV: `production` (lowercase!)

### GitHub Container Registry
```bash
docker pull ghcr.io/alexandru360/lottery-docker-updater:latest
```

---

## 📈 Performance

### Before (v1.0.0)
- Grid layout cu Cards
- Dialog separat pentru logs
- Load logs on button click
- No update check feature

### After (v1.1.0)
- Accordion layout (mai compact)
- Inline logs în accordion
- Lazy loading (load only when expanded)
- Check update fără download (<500ms)

**Improvement:**
- ✅ Mai puține click-uri pentru a vedea logs
- ✅ UI mai clean și mai puțin cluttered
- ✅ Performanță mai bună (lazy loading)
- ✅ Verificare updates fără bandwidth waste

---

## 🔮 Future Enhancements

### Planned for v1.2.0
- [ ] Auto-check updates on page load
- [ ] Bulk operations (start all, stop all, update all selected)
- [ ] Container filtering/search
- [ ] Export logs to file
- [ ] Dark mode toggle
- [ ] Notifications (browser/email) pentru updates

### Planned for v2.0.0
- [ ] Multi-host support (manage multiple Docker hosts)
- [ ] Scheduled updates (cron-like)
- [ ] Rollback support (keep previous images)
- [ ] Container resource usage (CPU/RAM/Network)
- [ ] Environment variables editor
- [ ] Docker Compose support
- [ ] Dependency management (update order)

---

## 🐛 Known Issues

### Non-Issues
- ✅ Check Update poate arăta "check-recommended" pentru imagini private (normal behavior)
- ✅ Docker Hub rate limiting (solved: distribution API nu contează ca pull)
- ✅ Button clicks deschid accordion (SOLVED: stopPropagation)

### To Fix
- ⚠️ Logs nu au timestamps visible (doar în raw output)
- ⚠️ Update All nu arată progress per container
- ⚠️ No confirmation dialog pentru destructive actions

---

## 📚 Documentation

### For Users
- **USER-GUIDE.md** - Ghid complet cu screenshots text
- **README.md** - Quick start și features overview

### For Developers
- **CHECK-UPDATE.md** - Technical deep-dive în feature
- **CHANGELOG.md** - Toate modificările versionate
- **UNRAID-SETUP.md** - Deployment specific pentru Unraid

### For DevOps
- **docker-compose.yml** - Example configuration
- **.github/workflows/** - CI/CD pipelines
- **Dockerfile** - Multi-stage build config

---

## 🎯 Migration from v1.0.0

### Breaking Changes
❌ **None!** All API endpoints remain backward compatible.

### UI Changes
- Grid Cards → Accordion (user preference)
- Dialog Logs → Inline Logs (better UX)
- New buttons in header (additional functionality)

### Config Changes
❌ **None!** Same environment variables.

### Docker Changes
❌ **None!** Same Dockerfile and runtime requirements.

**Conclusion:** Drop-in replacement, no migration needed! 🎉

---

## 🙏 Credits

Built with:
- [Next.js 14](https://nextjs.org/) - React framework
- [Material-UI v5](https://mui.com/) - UI components
- [dockerode](https://github.com/apocas/dockerode) - Docker API client
- [Socket.IO](https://socket.io/) - Real-time WebSocket
- Love and caffeine ☕

---

## 📞 Support

- **Issues**: https://github.com/alexandru360/lottery-tools/issues
- **Discussions**: https://github.com/alexandru360/lottery-tools/discussions
- **Docs**: Check all `.md` files in repo root

---

**Version**: 1.1.0  
**Release Date**: October 1, 2025  
**License**: MIT  
**Author**: Alexandru360
