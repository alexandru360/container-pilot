# ⚡ Quick Start Guide

## 🚀 Start în 3 pași

### 1️⃣ Build Image
```bash
cd D:\Dev\lottery-applications\lottery-tools
podman build -t container-pilot:latest .
```

### 2️⃣ Run Container
```bash
podman run -d --name container-pilot --privileged \
  -p 3000:3000 \
  -v /run/podman/podman.sock:/var/run/docker.sock:Z \
  -e "DOCKER_IMAGES=ollama,portainer,nginx" \
  -e "NODE_ENV=production" \
  container-pilot:latest
```

### 3️⃣ Open Browser
```
http://localhost:3000
```

---

## 🎮 Folosire

### Click pe Container Name
→ Expand pentru logs și detalii

### Butoane în Header
- **🔍** = Check dacă există update (fără download)
- **▶️** = Start container (dacă e oprit)
- **⏹️** = Stop container (dacă e pornit)  
- **🔄** = Restart container

### Update All Containers
Click pe butonul mare albastru la final

---

## 📋 Status Chips

- 🟢 **Green** = Container running ✅
- 🔴 **Red** = Container stopped ❌
- 🟠 **Orange** = Container paused ⏸️
- ⚪ **Gray** = Container not found

---

## 🔍 Check Update Results

### În accordion după ce apeși 🔍:

- ✅ **Verde**: "Up to date! Running latest version."
- 🆕 **Orange**: "Update available! New version found."
- ⚠️ **Galben**: "Container is old, check recommended."
- 🕐 **Albastru**: "Recently created, likely up to date."
- ❌ **Roșu**: "Could not verify update status."

---

## 🛠️ Commands

### Stop Container
```bash
podman stop container-pilot
```

### Remove Container
```bash
podman rm container-pilot
```

### View Logs
```bash
podman logs container-pilot
```

### Rebuild
```bash
podman stop container-pilot && podman rm container-pilot
podman build -t container-pilot:latest .
# then run again (step 2)
```

---

## 🐛 Troubleshooting

### Container nu pornește
```bash
podman logs container-pilot
```
Verifică:
- `NODE_ENV=production` (lowercase!)
- Socket mount: `/run/podman/podman.sock`
- Flag: `--privileged`

### Butoanele nu fac nimic
Verifică că:
- Socket-ul e montat corect
- Containerul are `--privileged`
- Browser console (F12) nu arată erori

### Check Update arată "check-failed"
- Verifică internet connection
- Imaginea există? `podman pull <image>`
- Pentru private images: `podman login`

---

## 📚 More Info

- **Full Guide**: `USER-GUIDE.md`
- **Technical Details**: `CHECK-UPDATE.md`
- **Unraid Setup**: `UNRAID-SETUP.md`
- **Changelog**: `CHANGELOG.md`

---

**Version:** 1.1.0  
**Port:** 3000  
**Status:** ✅ Ready to use!

🎉 **Enjoy!**
