# Railway Deployment Guide

Quick guide to deploy Social Cat to Railway with minimal setup.

## Prerequisites

- GitHub account (to connect your repository)
- Railway account (sign up at https://railway.app)

## Basic Deployment (5 minutes)

### 1. Initial Setup

1. Push your code to GitHub
2. Go to https://railway.app and login
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your `social-cat` repository
5. Railway will auto-detect Next.js and start building

### 2. Add PostgreSQL Database

1. In your Railway project, click "New" → "Database" → "Add PostgreSQL"
2. Once provisioned, Railway automatically sets `DATABASE_URL` for your app
3. Your app will now use PostgreSQL instead of SQLite

### 3. Configure Environment Variables

Click on your app service → "Variables" → Add these required variables:

```bash
# Required - Generate with: openssl rand -base64 32
AUTH_SECRET=your_generated_secret_here

# Required - Admin login credentials
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=your_secure_password

# Required - Your app URL (Railway provides this)
AUTH_URL=https://your-app-name.railway.app
```

### 4. API Keys (Add as needed)

Add these variables for the features you want to use:

```bash
# OpenAI (for AI tweet generation)
OPENAI_API_KEY=sk-...

# Twitter/X API
TWITTER_API_KEY=...
TWITTER_API_SECRET=...
TWITTER_ACCESS_TOKEN=...
TWITTER_ACCESS_SECRET=...
TWITTER_CLIENT_ID=...
TWITTER_CLIENT_SECRET=...

# YouTube API
YOUTUBE_CLIENT_ID=...
YOUTUBE_CLIENT_SECRET=...
YOUTUBE_REFRESH_TOKEN=...

# Instagram API
INSTAGRAM_ACCESS_TOKEN=...
```

### 5. Run Database Migrations

In Railway's deployment logs, look for the build completing. Then:

1. Click your service → "Settings" → Scroll to "Deploy"
2. Under "Custom Start Command", add:
   ```
   npm run db:migrate && npm start
   ```
3. Redeploy to apply migrations

**That's it!** Your app is now live with basic job scheduling (node-cron).

---

## Optional: Add Persistent Job Queue (Recommended)

**Why?** Jobs survive server restarts, automatic retries, better reliability.

**How?** (1 minute setup)

1. In your Railway project, click "New" → "Database" → "Add Redis"
2. Click the Redis service → "Variables" tab → Copy `REDIS_URL`
3. Go to your app service → "Variables" → Add new variable:
   ```
   REDIS_URL=redis://default:...
   ```
4. Redeploy your app

**Done!** Your app now uses BullMQ for persistent jobs. Check logs to confirm:
```
✅ "BullMQ initialized successfully - jobs will persist across restarts"
```

---

## Monitoring & Logs

### View Logs
1. Click your service in Railway
2. Go to "Deployments" → Click latest deployment
3. View real-time logs

### Check Database
1. Click PostgreSQL service
2. Click "Data" tab to browse tables
3. Or use `npm run db:studio` locally with `DATABASE_URL` set

### Job Status

**Without Redis (node-cron):**
- Logs show: `"Node-cron scheduler started"`
- Jobs run on schedule but are lost on restart

**With Redis (BullMQ):**
- Logs show: `"BullMQ initialized successfully"`
- Jobs persist across restarts
- Failed jobs automatically retry

---

## Troubleshooting

### Build Fails

**Error:** `Module not found`
- Make sure all dependencies are in `package.json`
- Run `npm install` locally first

**Error:** `Database connection failed`
- Ensure `DATABASE_URL` is set (automatic with Railway Postgres)
- Check PostgreSQL service is running

### Jobs Not Running

**Check logs for:**
- `"Initializing job scheduler"` - Scheduler started
- `"No Redis configured - using node-cron"` - Using simple mode
- `"BullMQ initialized successfully"` - Using persistent mode

**Enable specific jobs:**
1. Go to `src/lib/jobs/bullmq-jobs.ts` (if using Redis)
2. Or `src/lib/jobs/index.ts` (if using node-cron)
3. Set `enabled: true` for jobs you want to run

### Redis Connection Issues

**Error:** `Redis connection failed`
- Check `REDIS_URL` is correctly set
- Ensure Redis service is running in Railway
- App will automatically fallback to node-cron

---

## Production Checklist

Before going live with automated posting:

- [ ] Test all jobs in dry-run mode first
- [ ] Set correct `TWITTER_REPLY_SEARCH_QUERY`
- [ ] Configure AI system prompts
- [ ] Enable only the jobs you need
- [ ] Set up monitoring alerts (Railway Webhooks)
- [ ] Review rate limits for your API tier
- [ ] Enable Redis for job persistence (optional but recommended)

---

## Cost Estimate

**Railway Free Trial:**
- $5 free credit monthly
- Hobby Plan: $5/month after trial

**Typical Resource Usage:**
- Web Service: ~$3-5/month
- PostgreSQL: ~$1-2/month
- Redis (optional): ~$1/month

**Total:** ~$5-8/month for full setup with job persistence

---

## Support

- Railway Docs: https://docs.railway.app
- Social Cat Issues: https://github.com/your-repo/issues
- Check logs first - structured logging helps debug issues
