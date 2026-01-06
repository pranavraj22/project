# Step-by-Step Instructions to Push to GitHub

## Repository: https://github.com/pranav448/Note2Exam-ai.git

### Step 1: Open Terminal
Open your terminal/command prompt and navigate to the project directory:
```bash
cd /Users/poojith/project
```

### Step 2: Check Current Status
Verify you have uncommitted changes and check your current remote:
```bash
git status
git remote -v
```

### Step 3: Update Remote URL
Change the remote repository URL to the new one:
```bash
git remote set-url origin https://github.com/pranav448/Note2Exam-ai.git
```

Verify the change:
```bash
git remote -v
```
You should see:
```
origin  https://github.com/pranav448/Note2Exam-ai.git (fetch)
origin  https://github.com/pranav448/Note2Exam-ai.git (push)
```

### Step 4: Check Your Commit
Make sure your commit is ready:
```bash
git log --oneline -1
```
You should see: `897e456 Prepare project for Vercel deployment`

### Step 5: Push to GitHub

**Option A: If the repository exists and you have access:**
```bash
git push -u origin master
```

**Option B: If the repository doesn't exist yet:**
1. Go to https://github.com/pranav448
2. Click "New repository"
3. Name it: `Note2Exam-ai`
4. Don't initialize with README (since you already have files)
5. Click "Create repository"
6. Then run:
```bash
git push -u origin master
```

**Option C: If you get authentication errors:**
You may need to authenticate. Use one of these methods:

**Using Personal Access Token (Recommended):**
1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate a new token with `repo` permissions
3. When pushing, use the token as password:
```bash
git push -u origin master
# Username: your_github_username
# Password: paste_your_token_here
```

**Using SSH (Alternative):**
1. Set up SSH key if you haven't: https://docs.github.com/en/authentication/connecting-to-github-with-ssh
2. Change remote to SSH:
```bash
git remote set-url origin git@github.com:pranav448/Note2Exam-ai.git
git push -u origin master
```

### Step 6: Verify Push
After successful push, verify:
```bash
git status
```
You should see: `Your branch is up to date with 'origin/master'`

### Step 7: Check on GitHub
Visit: https://github.com/pranav448/Note2Exam-ai
You should see all your files including:
- ✅ `server/` folder
- ✅ `api/` folder  
- ✅ `vercel.json`
- ✅ All other project files

## Troubleshooting

### Error: "repository not found"
- Make sure the repository exists on GitHub
- Verify you have write access to `pranav448/Note2Exam-ai`
- Check the repository URL is correct

### Error: "authentication failed"
- Use Personal Access Token instead of password
- Or set up SSH keys

### Error: "remote origin already exists"
- Remove old remote first:
```bash
git remote remove origin
git remote add origin https://github.com/pranav448/Note2Exam-ai.git
```

### Error: "failed to push some refs"
- If repository has different history, force push (use with caution):
```bash
git push -u origin master --force
```

## Files That Will Be Pushed

✅ All committed files including:
- `server/index.ts` (Backend server)
- `api/index.ts` (Vercel serverless)
- `vercel.json` (Vercel config)
- `.gitignore` (Enhanced security)
- All other project files

❌ Files that WON'T be pushed (protected by .gitignore):
- `.env` (API keys - safe!)
- `node_modules/` (Dependencies)
- `dist/` (Build output)
