<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1g6YKFDke-q0xWSKJRldCm4TnmePJJBtb

## Run Locally

**Prerequisites:** Node.js (v18+)

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the project root with your Gemini API key:
   ```bash
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
   > **Important:** The API key is now stored **server-side only** and never exposed to the browser.

### Running the Application

The app consists of two parts:
- **Frontend** (React + Vite) - runs on port 3000
- **Backend** (Express server) - runs on port 3001 and handles all Gemini API calls

**Option 1: Run both together (recommended)**
```bash
npm run dev:all
```
This starts both the backend server and frontend dev server simultaneously.

**Option 2: Run separately**

Terminal 1 (Backend):
```bash
npm run dev:backend
```

Terminal 2 (Frontend):
```bash
npm run dev
```

### Architecture

- **Frontend** (`services/geminiService.ts`): Thin client that makes HTTP requests to backend APIs
- **Backend** (`server/index.ts`): Express server that uses `@google/genai` SDK with the API key stored securely server-side
- **Security**: The Gemini API key is **never** included in the browser bundle, preventing exposure to public

### API Endpoints

The backend exposes these endpoints:
- `POST /api/generate-exam` - Generate exam questions
- `POST /api/generate-learning-plan` - Generate learning plan
- `POST /api/topic-videos` - Get video resources
- `POST /api/topic-zero-to-hero` - Get topic explanation
- `POST /api/skill-roadmap` - Generate skill roadmap
- `POST /api/diagram-image` - Generate diagram images
- `GET /health` - Health check
