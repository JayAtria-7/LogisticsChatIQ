# 🚀 Deployment Guide - Free Options

This guide covers FREE deployment options for the Package Chatbot application.

## ✅ Option 1: Render.com (Recommended - Easiest)

**Free Tier:** 750 hours/month, auto-sleeps after 15min inactivity

### Steps:

1. **Push to GitHub** (if not already):
   ```powershell
   cd j:\iitb-P1
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/package-chatbot.git
   git push -u origin main
   ```

2. **Deploy on Render**:
   - Go to https://render.com
   - Sign up with GitHub
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name:** package-chatbot
     - **Build Command:** `npm install && npm run build`
     - **Start Command:** `npm start`
     - **Plan:** Free
   - Click "Create Web Service"

3. **Done!** Your app will be live at: `https://package-chatbot.onrender.com`

**Note:** Free tier sleeps after 15min. First request after sleep takes ~30 seconds.

---

## ✅ Option 2: Railway.app

**Free Tier:** $5 credit/month (~500 hours runtime)

### Steps:

1. **Deploy**:
   - Go to https://railway.app
   - Sign up with GitHub
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Railway auto-detects and deploys

2. **Done!** Get your URL from the Railway dashboard.

---

## ✅ Option 3: Fly.io (More Control)

**Free Tier:** 3 shared VMs, 160GB bandwidth/month

### Steps:

1. **Install Fly CLI**:
   ```powershell
   powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
   ```

2. **Deploy**:
   ```powershell
   cd j:\iitb-P1
   fly auth login
   fly launch --name package-chatbot
   # Follow prompts, select free tier
   fly deploy
   ```

3. **Done!** Your app will be at: `https://package-chatbot.fly.dev`

---

## ✅ Option 4: Vercel (Serverless - Limited)

**Free Tier:** Unlimited deployments

**⚠️ Note:** Vercel is serverless. Socket.IO real-time features may have limitations.

### Steps:

1. **Install Vercel CLI**:
   ```powershell
   npm install -g vercel
   ```

2. **Deploy**:
   ```powershell
   cd j:\iitb-P1
   vercel
   ```

---

## 📊 Comparison

| Platform | Free Hours/Month | Sleep Time | Socket.IO | Build Time | Best For |
|----------|------------------|------------|-----------|------------|----------|
| **Render** | 750 | After 15min | ✅ Full | ~2min | Easiest setup |
| **Railway** | ~500 ($5 credit) | No sleep | ✅ Full | ~1min | No sleep needed |
| **Fly.io** | Always-on (3 VMs) | No sleep | ✅ Full | ~3min | Advanced users |
| **Vercel** | Unlimited | No sleep | ⚠️ Limited | ~30sec | Static/API routes |

---

## 🔧 Pre-Deployment Checklist

✅ Your app is already configured with:
- ✅ `process.env.PORT` support
- ✅ `npm start` script
- ✅ Production-ready CORS settings
- ✅ Static file serving
- ✅ Build command (`npm run build`)

---

## 🎯 Recommended: Render.com

**Why?**
- Easiest to set up (no CLI needed)
- Good free tier (750 hours)
- Auto-deploys on git push
- Free SSL certificate
- Simple dashboard

**Start here:** https://dashboard.render.com

---

## 🌐 After Deployment

Your app will be accessible at:
- Render: `https://YOUR-APP-NAME.onrender.com`
- Railway: `https://YOUR-APP-NAME.railway.app`
- Fly.io: `https://YOUR-APP-NAME.fly.dev`
- Vercel: `https://YOUR-APP-NAME.vercel.app`

Test it by:
1. Opening the URL in your browser
2. Starting a chat session
3. Importing a CSV/JSON file
4. Exporting packages

---

## 💡 Tips

1. **Sessions storage**: Currently uses in-memory storage. On free tiers, sessions are lost on restart.
   - For persistence, add a free MongoDB database (MongoDB Atlas free tier)

2. **File uploads**: Currently stored in memory. Works fine for small files (<10MB).

3. **Auto-sleep**: Render sleeps after 15min inactivity. First request wakes it up (~30s).

4. **Custom domain**: All platforms support custom domains on free tier.

---

## 🆘 Need Help?

If you encounter issues:
1. Check build logs in the platform dashboard
2. Ensure `npm run build` works locally
3. Verify `npm start` works with built code: `npm run build && npm start`
