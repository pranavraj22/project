# Environment Variables Setup

## Quick Setup

1. **Create a `.env` file** in the project root directory:
   ```bash
   touch .env
   ```

2. **Add your Gemini API key** to the `.env` file:
   ```
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   ```

   Get your API key from: https://makersuite.google.com/app/apikey

3. **Optional variables** (you can add these if needed):
   ```
   # Backend server port (default: 3001)
   PORT=3001
   
   # Frontend backend URL (for production)
   # Leave empty in development - Vite proxy handles it automatically
   VITE_BACKEND_URL=
   ```

## Important Notes

- ✅ The `.env` file is already in `.gitignore` - it will **never** be committed to git
- ✅ The API key is stored **server-side only** - never exposed to the browser
- ✅ Never share your `.env` file or commit it to version control

## Example `.env` file:

```
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
PORT=3001
```

## Verification

After creating `.env`, verify it's working:

1. Start the backend server:
   ```bash
   npm run dev:backend
   ```

2. You should see:
   ```
   🚀 Backend server running on http://localhost:3001
   📝 API key configured: Yes
   ```

If you see "API key configured: No", check that your `.env` file exists and contains `GEMINI_API_KEY=...`
