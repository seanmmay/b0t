# Deployment Guide

## Railway Deployment

### Quick Deploy

1. **Fork/Clone this repository**
2. **Connect to Railway:**
   - Go to [Railway](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
3. **Add PostgreSQL:**
   - Click "New" → "Database" → "Add PostgreSQL"
   - Railway auto-configures `DATABASE_URL` for you
4. **Add Redis (REQUIRED for production):**
   - Click "New" → "Database" → "Add Redis"
   - Railway auto-configures `REDIS_URL` for you
   - **Why required:** Ensures scheduled jobs persist across restarts
5. **Configure environment variables:**
   - Copy all variables from `.env.example`
   - Add them in Railway Settings → Variables
   - At minimum, set:
     - `OPENAI_API_KEY`
     - `TWITTER_API_KEY`, `TWITTER_API_SECRET`, etc.
     - `AUTH_SECRET` (generate: `openssl rand -base64 32`)
     - `AUTH_URL` (your Railway app URL)
6. **Deploy:**
   - Railway automatically builds and deploys
   - Check logs for any errors

### Why Redis is Required for Production

**Without Redis (node-cron):**
- ❌ Jobs lost on every restart/redeploy
- ❌ No job retry on failure
- ❌ No job history or monitoring

**With Redis (BullMQ):**
- ✅ Jobs persist across restarts
- ✅ Automatic retries with exponential backoff
- ✅ Job history and status tracking
- ✅ Dead letter queue for failed jobs
- ✅ Rate limiting per queue

**Cost:** Redis on Railway is ~$5/month for basic tier (free trial available)

### Project Structure

```
Database Setup:
├── PostgreSQL  → Production database (auto-configured via DATABASE_URL)
├── Redis       → Job queue persistence (auto-configured via REDIS_URL)
└── SQLite      → Local development only (no DATABASE_URL = SQLite)

Job Scheduling:
├── BullMQ      → When REDIS_URL is set (production)
└── node-cron   → Fallback when no Redis (development/testing)
```

### Post-Deployment Checklist

1. ✅ App deploys successfully
2. ✅ Can access app at Railway URL
3. ✅ Can login with `ADMIN_EMAIL` and `ADMIN_PASSWORD`
4. ✅ PostgreSQL connected (check Settings → Database)
5. ✅ Redis connected (check logs - should see "BullMQ initialized successfully")
6. ✅ No Redis connection errors in logs
7. ✅ Configure Twitter/YouTube/Instagram credentials in UI

### Monitoring

**Check logs for:**
- `"BullMQ initialized successfully"` - Redis working
- `"No Redis configured - using node-cron"` - Redis NOT working
- `[ioredis] Unhandled error event` - Redis connection failing

### Troubleshooting

**"BullMQ initialization failed - falling back to node-cron"**
- Redis service not added or not connected
- Add Redis in Railway dashboard

**Jobs not persisting across restarts**
- Redis not configured
- Add Redis service and verify `REDIS_URL` is set

**Build fails with Node version error**
- Ensure `nixpacks.toml` exists with `nixPkgs = ['nodejs_20']`
- Check `package.json` has `"engines": { "node": ">=20.0.0" }`

## Other Platforms

### Vercel
Not recommended - Vercel is for serverless, this app needs long-running processes for job scheduling.

### Docker
```bash
# Build
docker build -t social-cat .

# Run with PostgreSQL and Redis
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://... \
  -e REDIS_URL=redis://... \
  -e OPENAI_API_KEY=... \
  social-cat
```

### VPS (Ubuntu/Debian)
```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL and Redis
sudo apt-get install postgresql redis-server

# Clone and setup
git clone <your-repo>
cd social-cat
npm install
cp .env.example .env
# Edit .env with your credentials

# Build and run
npm run build
npm start
```

For production VPS, use PM2:
```bash
npm install -g pm2
pm2 start npm --name "social-cat" -- start
pm2 save
pm2 startup
```
