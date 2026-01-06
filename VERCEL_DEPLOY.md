# Vercel Deployment Guide

This guide explains how to deploy Note2Exam AI to Vercel.

## Prerequisites

1. A GitHub account with the repository pushed
2. A Vercel account (sign up at https://vercel.com)
3. A Gemini API key from Google AI Studio

## Deployment Steps

### 1. Push to GitHub

The project is already configured to push to: `https://github.com/pranavraj22/project.git`

### 2. Deploy to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your GitHub repository: `pranavraj22/project`
4. Vercel will auto-detect the project settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### 3. Configure Environment Variables

In Vercel project settings, add these environment variables:

- `GEMINI_API_KEY` - Your Gemini API key from Google AI Studio
- `NODE_ENV` - Set to `production`

**To add environment variables:**
1. Go to your project settings in Vercel
2. Navigate to "Environment Variables"
3. Add `GEMINI_API_KEY` with your API key value
4. Add `NODE_ENV` with value `production`
5. Apply to all environments (Production, Preview, Development)

### 4. Deploy

Click "Deploy" and wait for the build to complete.

## Project Structure for Vercel

- **Frontend**: Built by Vite, served from `dist/` directory
- **Backend API**: Serverless functions in `api/` directory
- **Routes**: All `/api/*` requests are routed to `api/index.ts`

## API Endpoints

After deployment, your API endpoints will be available at:
- `https://your-project.vercel.app/api/generate-exam`
- `https://your-project.vercel.app/api/generate-learning-plan`
- `https://your-project.vercel.app/api/topic-videos`
- `https://your-project.vercel.app/api/topic-zero-to-hero`
- `https://your-project.vercel.app/api/skill-roadmap`
- `https://your-project.vercel.app/api/diagram-image`
- `https://your-project.vercel.app/api/health`

## Troubleshooting

### API Routes Not Working

If API routes return 404:
1. Check that `api/index.ts` exists
2. Verify `vercel.json` configuration
3. Check Vercel function logs in the dashboard

### Environment Variables Not Loading

1. Ensure environment variables are set in Vercel dashboard
2. Redeploy after adding new environment variables
3. Check that variable names match exactly (case-sensitive)

### Build Failures

1. Check build logs in Vercel dashboard
2. Ensure all dependencies are in `package.json`
3. Verify Node.js version compatibility (Vercel uses Node 18+ by default)

## Local Development vs Production

- **Local**: Uses `server/index.ts` with Express server on port 3001
- **Production**: Uses `api/index.ts` as Vercel serverless function
- Both files are identical, but `api/index.ts` is optimized for serverless

## Notes

- The frontend automatically detects if it's running on Vercel and uses the correct API base URL
- No need to set `VITE_BACKEND_URL` in production - Vercel handles routing automatically
- The API key is stored server-side only and never exposed to the browser
