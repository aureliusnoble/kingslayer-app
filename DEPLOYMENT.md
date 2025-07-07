# Deployment Guide

This guide will walk you through deploying the Kingslayer app to free hosting services.

## Overview

We'll deploy:
- **Backend**: Render.com (free tier with WebSocket support)
- **Frontend**: Vercel or Netlify (excellent free static hosting)
- **Database**: In-memory (no external database needed)

Total cost: $0/month

## Prerequisites

- GitHub account
- Accounts on Render.com and Vercel/Netlify

## Step 1: Prepare Your Code

1. **Create a GitHub repository**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/kingslayer-app.git
git push -u origin main
```

2. **Update backend for production**

Create `/backend/.env.production`:
```
NODE_ENV=production
PORT=10000
CORS_ORIGIN=https://your-frontend.vercel.app
```

3. **Update frontend for production**

Create `/frontend/.env.production`:
```
VITE_API_URL=https://your-backend.onrender.com
VITE_WS_URL=wss://your-backend.onrender.com
```

## Step 2: Deploy Backend to Render

1. **Sign up/login** to [Render.com](https://render.com)

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub account
   - Select your repository

3. **Configure the service**:
   - **Name**: `kingslayer-backend`
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

4. **Add environment variables**:
   - Click "Environment" tab
   - Add:
     - `NODE_ENV` = `production`
     - `PORT` = `10000`
     - `CORS_ORIGIN` = `https://your-frontend.vercel.app` (update after frontend deploy)

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (5-10 minutes)
   - Note your URL: `https://kingslayer-backend.onrender.com`

## Step 3: Deploy Frontend to Vercel

### Option A: Vercel (Recommended)

1. **Sign up/login** to [Vercel](https://vercel.com)

2. **Import Project**
   - Click "Add New..." → "Project"
   - Import your GitHub repository

3. **Configure**:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. **Environment Variables**:
   - Add:
     - `VITE_API_URL` = `https://kingslayer-backend.onrender.com`
     - `VITE_WS_URL` = `wss://kingslayer-backend.onrender.com`

5. **Deploy**
   - Click "Deploy"
   - Note your URL: `https://kingslayer-app.vercel.app`

### Option B: Netlify

1. **Sign up/login** to [Netlify](https://netlify.com)

2. **New Site from Git**
   - Click "Add new site" → "Import an existing project"
   - Connect GitHub and select repository

3. **Configure**:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`

4. **Environment Variables**:
   - Go to Site Settings → Environment Variables
   - Add same variables as Vercel option

5. **Deploy**
   - Click "Deploy site"

## Step 4: Update CORS Origin

1. Go back to Render dashboard
2. Update the `CORS_ORIGIN` environment variable with your frontend URL
3. Redeploy the backend

## Step 5: Test Your Deployment

1. Visit your frontend URL
2. Create a game
3. Join from another device/browser
4. Test all game features

## Troubleshooting

### WebSocket Connection Issues
- Ensure backend URL in frontend uses `wss://` (not `ws://`)
- Check CORS_ORIGIN matches exactly (including https://)
- Verify Render service is running

### Build Failures
- Check build logs in Render/Vercel dashboard
- Ensure all dependencies are in package.json
- Try building locally first

### Performance Issues
- Render free tier may sleep after 15 min inactivity
- First request will be slow (cold start)
- Consider upgrading if needed

## Alternative Free Hosting Options

### Backend Alternatives:
- **Railway.app**: Similar to Render, good WebSocket support
- **Fly.io**: More complex but very powerful
- **Heroku**: No longer has free tier

### Frontend Alternatives:
- **GitHub Pages**: Static only, needs routing workaround
- **Cloudflare Pages**: Fast, generous free tier
- **Surge.sh**: Simple CLI deployment

## Monitoring

### Free Monitoring Options:
- **UptimeRobot**: Monitor if your app is up
- **Render Dashboard**: Basic metrics included
- **Vercel Analytics**: Basic analytics free

## Scaling Considerations

When you outgrow free tier:
1. **Backend**: Render Starter ($7/month) - No sleep, better performance
2. **Database**: Add Redis for persistence (Upstash free tier)
3. **CDN**: Cloudflare for global performance

## Security Checklist

- [x] CORS properly configured
- [x] Environment variables not exposed
- [x] HTTPS enabled (automatic on Render/Vercel)
- [x] Input validation on backend
- [x] Rate limiting implemented

## Maintenance

1. **Updates**: Push to GitHub → Auto-deploy
2. **Logs**: Check Render/Vercel dashboards
3. **Backups**: Code is in GitHub
4. **Monitoring**: Set up UptimeRobot alerts

---

Congratulations! Your Kingslayer app is now live and ready for players worldwide! 🎉