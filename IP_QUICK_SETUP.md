# 🚀 Backend IP Configuration - Quick Reference

## The Fix
Backend now listens on **0.0.0.0** (all interfaces) instead of just localhost.

---

## Quick Setup

### 1️⃣ Get Your Local IP
```bash
node get-local-ip.js
```
**Output**: `192.168.1.50`

### 2️⃣ Start Backend
```bash
npm start
```

### 3️⃣ Connect Flutter
```bash
flutter run --dart-define=BACKEND_IP=192.168.1.50:3000
```

---

## Access URLs

| Device | URL |
|--------|-----|
| **This Machine** | `http://localhost:3000/api/v1` |
| **Other Device (WiFi)** | `http://192.168.1.50:3000/api/v1` |
| **Android Emulator** | `http://10.0.2.2:3000/api/v1` |
| **Production** | `https://yourdomain.com/api/v1` |

---

## Common Commands

```bash
# Show local IP + all access URLs
node get-local-ip.js

# Start backend with smart logging
bash start-server.sh

# Test backend connection
curl http://192.168.1.50:3000/api/v1/health

# Connect Flutter to specific IP
flutter run --dart-define=BACKEND_IP=192.168.1.50:3000
```

---

## Environment Variables

```bash
# .env file
HOST=0.0.0.0              # ← Permanent fix
PORT=3000
NODE_ENV=development      # ← Auto-allows all CORS origins
DATABASE_URL=...
JWT_SECRET=...
```

---

## What Changed

✅ Backend binds to `0.0.0.0` (all interfaces)  
✅ CORS flexible in dev, strict in prod  
✅ Helper scripts for easy IP discovery  
✅ Permanent env config  

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| **Can't connect** | `node get-local-ip.js` to find correct IP |
| **CORS error** | Ensure `NODE_ENV=development` if testing |
| **Localhost works, WiFi doesn't** | Check firewall allows port 3000 |
| **Wrong IP shown** | Device might be on different network |

---

## Files Modified

- `server.js` - HOST binding + CORS
- `.env` - Added HOST=0.0.0.0
- `.env.example` - Documentation
- `get-local-ip.js` - NEW helper
- `start-server.sh` - NEW helper

---

## ✅ Status: FIXED & PERMANENT!
