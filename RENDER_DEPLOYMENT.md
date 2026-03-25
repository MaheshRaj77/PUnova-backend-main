# Render Deployment Guide for PUnova Backend

## Configuration Status ✅

Your `render.yaml` is now configured with:
- ✅ Node.js runtime
- ✅ Singapore region (fastest for Southeast Asia)
- ✅ Free tier plan
- ✅ Automatic builds & deploys on git push
- ✅ Health check endpoint
- ✅ All required environment variables
- ✅ Database seeding on deploy

---

## Step 1: Connect to Render

1. Go to [render.com](https://render.com)
2. Sign up / Log in
3. Connect your GitHub repository
4. Select **"Infrastructure as Code"** deployment method
5. Upload or paste your `render.yaml` file

---

## Step 2: Set Environment Variables in Render Dashboard

In the Render dashboard, set these variables (marked with `sync: false`):

| Variable | Value | Source |
|----------|-------|--------|
| `DATABASE_URL` | Your Neon PostgreSQL URL | `.env` |
| `JWT_SECRET` | 32-char random string | `.env` |
| `REFRESH_TOKEN_SECRET` | 32-char random string | `.env` |
| `CLOUDINARY_NAME` | `dmb2l3rfc` | `.env` |
| `CLOUDINARY_KEY` | Your Cloudinary API key | `.env` |
| `CLOUDINARY_SECRET` | Your Cloudinary API secret | `.env` |
| `UPSTASH_REDIS_REST_URL` | Your Redis URL | `.env` |
| `UPSTASH_REDIS_REST_TOKEN` | Your Redis token | `.env` |
| `ALLOWED_ORIGINS` | Your app domains (comma-separated) | `.env` |
| `FIREBASE_PROJECT_ID` | Your Firebase project ID | `.env` |
| `FIREBASE_PRIVATE_KEY` | Your Firebase private key | `.env` |
| `FIREBASE_CLIENT_EMAIL` | Your Firebase client email | `.env` |
| `ADMIN_EMAIL` | Your admin email | `.env` |
| `ADMIN_PASSWORD` | Your admin password | `.env` |

**Optional (leave empty if not using):**
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM_EMAIL`

---

## Step 3: Deploy

### Option A: Automatic Deploy (Recommended)
- Push to your repository: `git push`
- Render automatically detects changes and redeploys
- Check deployment status in Render dashboard

### Option B: Manual Deploy
1. In Render dashboard, click "Deploy"
2. Select the commit to deploy
3. Wait for build & startup

---

## Step 4: Verify Deployment

After deployment completes:

```bash
# Check if backend is live
curl https://punova-backend.onrender.com/api/v1/health

# Response should be:
# {"status":"ok"}
```

---

## Step 5: Post-Deployment Setup

### Create Admin User (if not seeded)

```bash
# SSH into Render deployment:
# In Render dashboard → Shell → connect

npm run create-admin
```

### Test API Endpoints

```bash
# Test authentication
curl -X POST https://punova-backend.onrender.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

---

## Monitoring & Logs

### View Logs in Render
1. Dashboard → Your service → Logs
2. Logs update in real-time
3. Errors and warnings visible immediately

### Check CPU/Memory Usage
- Dashboard → Your service → Metrics
- Monitor performance and scaling needs

---

## Troubleshooting

### Build Fails
- Check **Build Logs** tab
- Verify all `.env` variables are set
- Ensure `package.json` has all dependencies

### Service Won't Start
- Check **Logs** for error messages
- Verify database connection: `DATABASE_URL` is reachable
- Ensure Redis is reachable: `UPSTASH_REDIS_REST_URL`

### Health Check Failing
- Deploy must include `/api/v1/health` endpoint
- If missing, add to `server.js`:
  ```javascript
  app.get('/api/v1/health', (req, res) => {
    res.json({ status: 'ok' });
  });
  ```

### Database Connection Timeout
- Verify Neon PostgreSQL allows Render's IP
- Check `DATABASE_URL` format
- Test locally first with `.env`

---

## Scaling & Upgrades

### When to Upgrade
- Free tier: Good for development/testing
- Standard tier: 2+ GB RAM, auto-scaling, 99.9% uptime
- Pro tier: Advanced monitoring, SLA support

### Automatic Restarts
- Free tier: Restarts after 15 mins of inactivity
- Standard+: 24/7 uptime without restarts

---

## Deployment Checklist ✅

- [ ] `render.yaml` configured with correct variables
- [ ] All environment variables set in dashboard
- [ ] `.env` file NOT committed to git
- [ ] Database URL verified working
- [ ] Redis connection tested locally
- [ ] Cloudinary credentials validated
- [ ] Health endpoint available at `/api/v1/health`
- [ ] `npm start` command works locally
- [ ] Administrative user can be created
- [ ] API endpoints responding with test calls
- [ ] Logs accessible in Render dashboard
- [ ] CORS origins include your frontend URL

---

## Next Steps

1. **Push to GitHub:** `git push origin main`
2. **Monitor Deployment:** Check Render dashboard
3. **Test Backend:** Call health endpoint
4. **Create Admin:** Run admin creation CLI
5. **Update Flutter App:** Set API base URL to Render URL

---

## Support

- Render Docs: https://render.com/docs
- Check deployment logs for detailed error messages
- Verify all environment variables before deploying

