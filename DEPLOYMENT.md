# AffectSync Deployment Guide

This document outlines the steps required to deploy AffectSync to production seamlessly, using platforms like Render or Vercel, MongoDB Atlas, Qdrant Cloud, and Cloudinary. 

## 1. Prerequisites & Required Accounts

Before deploying, ensure you have accounts and projects set up for the following external services:
- **MongoDB Atlas:** For the primary database.
- **Qdrant Cloud:** For the vector similarity search.
- **Cloudinary:** For permanent image storage (ephemeral cloud filesystems like Render's will wipe local uploads).
- **Google AI Studio (Gemini):** For metadata extraction from images.
- **Render / Vercel:** For hosting the Node.js monolith.

## 2. Environment Variables

Your production environment must be configured with the following secrets. **Do not hardcode these in your codebase.**

```env
# Server & Authentication
PORT=5000
JWT_SECRET=your_super_secure_random_string_here
ALLOWED_ORIGINS=https://your-production-url.com

# MongoDB
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/affectsync?retryWrites=true&w=majority

# Qdrant Cloud
QDRANT_URL=https://<your-cluster>.aws.cloud.qdrant.io
QDRANT_API_KEY=your_qdrant_api_key

# Cloudinary (Image Storage)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# AI Processing
GEMINI_API_KEY=your_google_gemini_api_key
```

## 3. Deployment Steps (Render Example)

Because AffectSync is configured as a Monolith (the Node backend serves the frontend statically), deploying it is extremely simple:

1. Push your repository to GitHub.
2. In the Render Dashboard, create a new **Web Service**.
3. Connect your GitHub repository.
4. Configure the service:
   - **Root Directory:** `backend` (because `package.json` with the start script is there).
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Add all the Environment Variables listed above in the Render dashboard.
6. Deploy!

*(Note for Vercel: You can deploy this as a standard Node serverless function by adding a `vercel.json` if preferred, but Render is recommended for continuous background processes like our auto-recovery loops).*

## 4. Architecture Resilience (Fail-Safes)

AffectSync includes robust graceful degradation to ensure uptime:
- **Cloudinary Fail-Safe:** If Cloudinary goes down, the server temporarily saves uploads to the local disk and marks them as `pending`. A background worker retries them automatically.
- **Qdrant Fail-Safe:** If the vector database is unreachable, the system automatically falls back to MongoDB for recommendations and queues vectors to sync when Qdrant recovers.

## 5. Health Monitoring

You can ping these endpoints to verify production health:
- `GET /api/health` - Basic server and DB connection status.
- `GET /api/health/storage` - Cloudinary dual-storage status and pending upload queues.
- `GET /api/health/vector` - Qdrant cloud connection status and pending vector sync queues.
