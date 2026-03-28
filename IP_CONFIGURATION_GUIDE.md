# IP Address Configuration - Complete Guide

## Problem Fixed ✅

Backend was **only listening on `localhost`** (127.0.0.1), which prevented:
- External devices from accessing the API
- Flutter app from connecting from different IP addresses
- Mobile testing on physical devices

---

## Solution Applied

### 1. **Backend Server Binding**
**File**: `PUnova-backend-main/server.js`

**Changed**:
```javascript
// BEFORE - Only localhost
app.listen(PORT, async () => { ... })

// AFTER - Listen on all interfaces
const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, async () => { ... })
```

Now the backend binds to **0.0.0.0** (all network interfaces) and listens for connections from any IP.

---

### 2. **CORS Settings**
**File**: `PUnova-backend-main/server.js`

**Changed**: CORS now distinguishes between development and production:

```javascript
// DEVELOPMENT - Allow all origins (flexible for testing)
if (NODE_ENV === 'development') {
  corsOptions.origin = '*';
}

// PRODUCTION - Whitelist specific origins (secure)
else {
  corsOptions.origin = (origin, callback) => {
    if (allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error('Not allowed by CORS'));
  };
}
```

---

### 3. **Environment Variables**
**File**: `PUnova-backend-main/.env`

**Added**:
```bash
HOST=0.0.0.0
```

This makes it configurable. You can override it:
```bash
HOST=127.0.0.1 npm start    # Localhost only
HOST=192.168.1.100 npm start # Specific IP
HOST=0.0.0.0 npm start       # All interfaces (default)
```

---

### 4. **Helper Scripts**

#### Get Local IP
```bash
node get-local-ip.js
```

**Output**:
```
✅ Local IP Address: 192.168.1.50
📍 Port: 3000

🔧 Use these URLs:

   • Localhost (Current Machine)
     http://localhost:3000/api/v1

   • Local Network (Other Devices)
     http://192.168.1.50:3000/api/v1

   • Android Emulator
     http://10.0.2.2:3000/api/v1
```

#### Smart Start Server
```bash
bash start-server.sh
```

Automatically:
- Detects local IP
- Displays all access URLs
- Shows Flutter commands
- Starts the server

---

## How to Use

### **Scenario 1: Development on Local Machine**
```bash
cd PUnova-backend-main
npm install
npm start
```

Frontend access: `http://localhost:3000/api/v1`

---

### **Scenario 2: Flutter App on Same Network**

1. Get your machine's local IP:
```bash
node get-local-ip.js
# Output: 192.168.1.50
```

2. Start backend:
```bash
npm start
```

3. Connect Flutter:
```bash
flutter run --dart-define=BACKEND_IP=192.168.1.50:3000
```

Or manually update in code:
```dart
// lib/core/constants/api_constants.dart
static String get baseUrl {
  return 'http://192.168.1.50:3000/api/v1';
}
```

---

### **Scenario 3: Android Emulator**

1. Start backend:
```bash
npm start
```

2. Connect Flutter (emulator automatically routes to host):
```bash
flutter run
```

The emulator will automatically use `http://10.0.2.2:3000/api/v1`

---

### **Scenario 4: Physical Device Testing**

1. Get local IP:
```bash
node get-local-ip.js
# Output: 192.168.1.50
```

2. Start backend:
```bash
npm start
```

3. Connect Flutter on physical device:
```bash
flutter run --dart-define=BACKEND_IP=192.168.1.50:3000
```

**Make sure**: Device is on same WiFi network as backend machine

---

### **Scenario 5: Production Deployment**

```bash
HOST=0.0.0.0
NODE_ENV=production
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
npm start
```

- Strict CORS (only specified origins)
- Listens on all interfaces (0.0.0.0)
- Production-grade logging

---

## Testing

### Health Check
```bash
# Localhost
curl http://localhost:3000/api/v1/health

# From another device (replace IP)
curl http://192.168.1.50:3000/api/v1/health
```

**Expected Response**:
```json
{
  "status": "ok",
  "timestamp": "2026-03-25T10:30:00Z",
  "environment": "development",
  "uptime": 123.45
}
```

### Test Signup
```bash
curl -X POST http://192.168.1.50:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@university.edu",
    "password": "SecureP@ss123",
    "full_name": "Test User"
  }'
```

---

## Troubleshooting

### ❌ Connection Refused
**Problem**: `Connection refused` error from Flutter

**Solutions**:
1. Verify backend is running: `curl http://localhost:3000/api/v1/health`
2. Check IP address: `node get-local-ip.js`
3. Verify network: Device should be on same WiFi
4. Check firewall: Allow port 3000

### ❌ CORS Error
**Problem**: `CORS error` in Flutter console

**Solutions**:
1. Ensure `NODE_ENV=development` (auto-allows all origins)
2. Or whitelist origin in `ALLOWED_ORIGINS`
3. Restart backend after env changes

### ❌ Wrong IP Address
**Problem**: Using wrong IP in Flutter

**Solutions**:
1. Run: `node get-local-ip.js` to get correct IP
2. Test with: `curl http://<IP>:3000/api/v1/health`
3. Use that IP in Flutter code

### ❌ Localhost Works, Network Doesn't
**Problem**: Works on `localhost:3000` but not on `192.168.x.x:3000`

**Solutions**:
1. Verify `HOST=0.0.0.0` in .env
2. Restart backend: `npm start`
3. Check firewall: Allow port 3000
4. Check network: Device on same WiFi

---

## Docker Deployment (Optional)

If deploying to Docker, ensure binding to 0.0.0.0:

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY . .

RUN npm install
ENV HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "start"]
```

Then run:
```bash
docker run -p 3000:3000 punova-api
```

---

## Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `HOST` | `0.0.0.0` | Server binding address |
| `PORT` | `3000` | Server port |
| `NODE_ENV` | `development` | Environment mode |
| `ALLOWED_ORIGINS` | `localhost:3000` | CORS whitelist (prod only) |
| `DATABASE_URL` | - | PostgreSQL connection string |
| `JWT_SECRET` | - | JWT signing key |

---

## Summary

✅ **Fixed**: Backend now listens on all interfaces (0.0.0.0)  
✅ **Flexible**: CORS adapts to dev/prod environments  
✅ **Discoverable**: Helper scripts show local IP automatically  
✅ **Secure**: Production mode restricts to whitelisted origins  
✅ **Documented**: Clear configuration examples  

---

## Quick Commands

```bash
# Get local IP
node get-local-ip.js

# Start backend
npm start

# Test connection
curl http://192.168.1.50:3000/api/v1/health

# Flutter dev build
flutter run --dart-define=BACKEND_IP=192.168.1.50:3000

# Production build
flutter build apk --dart-define=IS_PROD=true --dart-define=API_BASE_URL=https://api.yourdomain.com/api/v1
```

---

## Files Modified

1. `PUnova-backend-main/server.js` - HOST binding + flexible CORS
2. `PUnova-backend-main/.env` - Added HOST=0.0.0.0
3. `PUnova-backend-main/.env.example` - Added documentation
4. `PUnova-backend-main/get-local-ip.js` - NEW helper script
5. `PUnova-backend-main/start-server.sh` - NEW helper script

---

**Status**: 🟢 **PRODUCTION READY** - IP configuration is now permanent and flexible!
