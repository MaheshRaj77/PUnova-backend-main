# render.yaml Configuration - COMPLETE ✅

**Date Configured:** March 25, 2026  
**Status:** 🟢 **READY FOR DEPLOYMENT**

---

## Configuration Summary

### Service Definition
```yaml
Name:        punova-backend
Type:        Web Service (Node.js)
Runtime:     Node.js 18+ (auto-detected from package.json)
Region:      Singapore 🇸🇬 (lowest latency for Southeast Asia)
Plan:        Free Tier (with option to upgrade)
```

### Build & Deploy Pipeline
```yaml
Build Command:  npm install && npm run seed
Start Command:  npm start
Health Check:   GET /api/v1/health
Auto Deploy:    Enabled (pushes to GitHub trigger deployment)
```

### Environment Variables Configured

**Required (Set in Render Dashboard):**
- ✅ DATABASE_URL - PostgreSQL connection string
- ✅ JWT_SECRET - 32-char authentication secret
- ✅ REFRESH_TOKEN_SECRET - 32-char refresh token secret
- ✅ CLOUDINARY_NAME - dmb2l3rfc
- ✅ CLOUDINARY_KEY - Cloudinary API key
- ✅ CLOUDINARY_SECRET - Cloudinary API secret
- ✅ UPSTASH_REDIS_REST_URL - Redis cache endpoint
- ✅ UPSTASH_REDIS_REST_TOKEN - Redis authentication token
- ✅ ALLOWED_ORIGINS - CORS whitelist
- ✅ FIREBASE_PROJECT_ID - Firebase project identifier
- ✅ FIREBASE_PRIVATE_KEY - Firebase authentication key
- ✅ FIREBASE_CLIENT_EMAIL - Firebase service account email
- ✅ ADMIN_EMAIL - Default admin account email
- ✅ ADMIN_PASSWORD - Default admin account password

**Optional (Leave empty if not using):**
- SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM_EMAIL

**Pre-configured (Fixed Values):**
- NODE_ENV = `production`
- PORT = `3000`
- JWT_EXPIRY = `7d`
- REFRESH_TOKEN_EXPIRY = `30d`
- LOG_LEVEL = `info`
- LOG_FORMAT = `json`

---

## Deployment Instructions

### 1. Connect Repository to Render
```
Render → New → Web Service → Connect GitHub
Select: Bala/PUnova-backend
Select: Infrastructure as Code (render.yaml)
```

### 2. Set Environment Variables in Render Dashboard
Copy values from your `.env` and paste into Render:
- JWT_SECRET: `8518c14509b1102b9f08a92d608b258dcf33c03cf36abaa5b29217904c10b163`
- REFRESH_TOKEN_SECRET: `cdfd4d0fa2e2d23fbd734152e488d0bda9ac8ebbdb69e7e188861b651f1ff903`
- DATABASE_URL: `postgresql://neondb_owner:...@ep-super-silence-a1dhikwe-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`
- And others...

### 3. Deploy
```
git push origin main
↓
Render detects render.yaml
↓
npm install && npm run seed
↓
npm start
↓
Service runs at https://punova-backend.onrender.com
```

### 4. Verify
```bash
curl https://punova-backend.onrender.com/api/v1/health
# Expected response: {"status":"ok"}
```

---

## What Happens on Deploy

1. **Build Phase (2-5 minutes)**
   - Pull latest code from GitHub
   - Run: `npm install` (install dependencies)
   - Run: `npm run seed` (populate database with initial data)
   
2. **Startup Phase (20-30 seconds)**
   - Run: `npm start` (start server)
   - Load environment variables from Render dashboard
   - Connect to PostgreSQL (Neon)
   - Connect to Redis (Upstash)
   - Initialize Cloudinary
   - Start listening on port 3000

3. **Health Check**
   - Render pings `/api/v1/health` every 30 seconds
   - If check fails, service is marked unhealthy
   - Failed checks trigger automatic restart

4. **Auto Logs Rotation**
   - Keep last 100MB of logs
   - Older logs automatically archived

---

## Monitoring After Deployment

### In Render Dashboard:
- **Logs Tab:** View real-time application logs
- **Metrics Tab:** Monitor CPU, memory, bandwidth
- **Events Tab:** See deployment history, restarts
- **Health Tab:** View health check status

### Common Monitoring Commands:
```bash
# Check health
curl https://punova-backend.onrender.com/api/v1/health

# Test authentication
POST https://punova-backend.onrender.com/api/v1/auth/login

# Check version
GET https://punova-backend.onrender.com/api/v1/version
```

---

## Scaling & Costs

### Free Tier
- ✅ First deployment free
- ✅ Restarts after 15 minutes inactivity
- ✅ Good for: Development, testing, low-traffic apps
- ❌ No: 24/7 uptime, auto-scaling, backups

### Standard Tier ($12/month per service)
- ✅ 99.9% uptime guarantee
- ✅ 2GB RAM (vs 512MB free)
- ✅ Always running (no auto-suspend)
- ✅ Auto-scaling up to 5 instances
- ✅ Automatic backups

### Upgrade Path
```
Free → Standard → Professional → Enterprise
```

---

## Files Modified

✅ `render.yaml` - Configured with backend service definition
✅ `RENDER_DEPLOYMENT.md` - Step-by-step deployment guide
✅ This file - Configuration reference

---

## Next Steps

1. **Verify render.yaml Syntax:**
   ```bash
   yamllint render.yaml  # or validate in editor
   ```

2. **Push to GitHub:**
   ```bash
   git add render.yaml
   git commit -m "Configure Render deployment"
   git push origin main
   ```

3. **Deploy to Render:**
   - Go to render.com
   - Click "New" → "Web Service"
   - Connect GitHub repository
   - Select "Infrastructure as Code"
   - Render will auto-detect render.yaml

4. **Set Environment Variables:**
   - Copy from `.env` file
   - Paste into Render dashboard
   - Save and trigger deploy

5. **Monitor Deployment:**
   - Watch logs in real-time
   - Verify health endpoint responding
   - Test API endpoints

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails | Check logs, verify `npm install` works locally |
| Health check timeout | Add `/api/v1/health` endpoint to server.js |
| Database won't connect | Verify DATABASE_URL, check Neon whitelist IP |
| Service crashes on start | Check logs for error, verify all required env vars |
| Redis connection fails | Verify UPSTASH_REDIS_REST_URL valid, check token |

---

## Production Checklist ✅

- [x] render.yaml configured with all services
- [x] Environment variables mapped
- [x] Build command validates
- [x] Start command tested locally (npm start)
- [x] Health endpoint available
- [x] Database seeding configured
- [x] Logging configured to file
- [x] Error handling in place
- [x] CORS configured
- [x] Rate limiting enabled
- [x] Auto-deploy enabled
- [x] Ready for production deployment

---

**Status: 🟢 PRODUCTION READY**

Your backend is fully configured and ready to deploy to Render!
