# DEPLOYMENT GUIDE

Complete step-by-step instructions to get your dashboard live.

## Phase 1: Google Sheets API Setup (5 minutes)

### Step 1: Enable API
1. Go to https://console.cloud.google.com/
2. Create new project or select existing
3. Click "Enable APIs and Services"
4. Search for "Google Sheets API"
5. Click "Enable"

### Step 2: Create API Key
1. In Google Cloud Console, go to "Credentials"
2. Click "Create Credentials" → "API Key"
3. Copy the API key (save it somewhere safe)
4. (Optional but recommended) Click "Restrict Key":
   - Under "API restrictions", select "Restrict key"
   - Choose "Google Sheets API"
   - Click "Save"

### Step 3: Make Sheet Public
1. Open your Google Sheet
2. Click "Share" button (top right)
3. Click "Change to anyone with the link"
4. Set permission to "Viewer"
5. Click "Done"

## Phase 2: Local Setup (2 minutes)

### On Your Computer

```bash
# Navigate to the project folder
cd market-dashboard

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env file and add your API key
# On Mac/Linux: nano .env
# On Windows: notepad .env

# Add this line (replace with your actual key):
VITE_GOOGLE_API_KEY=AIzaSyC_your_actual_key_here

# Save and close

# Test locally
npm run dev
```

Open http://localhost:5173 - you should see your dashboard!

If it works locally, you're ready to deploy.

## Phase 3: Deploy to Vercel (2 minutes)

### Method A: Quick Deploy (CLI)

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy!
vercel
```

When prompted:
- "Set up and deploy?" → YES
- "Which scope?" → Select your account
- "Link to existing project?" → NO
- "What's your project's name?" → market-dashboard (or anything you want)
- "In which directory is your code located?" → ./
- "Want to override settings?" → NO

Vercel will ask about environment variables:
- "Add environment variable?" → YES
- Name: `VITE_GOOGLE_API_KEY`
- Value: [paste your Google API key]
- "Add another?" → NO

Done! Vercel will give you a URL like: `https://market-dashboard-xyz.vercel.app`

### Method B: Deploy via GitHub (Better for Updates)

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial dashboard setup"

# Create GitHub repository (do this on github.com first)
# Then connect and push:
git remote add origin https://github.com/YOUR_USERNAME/market-dashboard.git
git branch -M main
git push -u origin main
```

Now in your browser:
1. Go to https://vercel.com
2. Click "New Project"
3. Import your GitHub repository
4. Configure:
   - Framework Preset: Vite (auto-detected)
   - Root Directory: ./
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Add Environment Variable:
   - Name: `VITE_GOOGLE_API_KEY`
   - Value: [your Google API key]
6. Click "Deploy"

Wait ~60 seconds. Done!

**Bonus**: Now every time you push to GitHub, Vercel auto-deploys.

## Phase 4: Verification

### Test Your Dashboard

1. Open your Vercel URL
2. Check if data loads
3. Click "Refresh" button
4. Switch between tabs (Indices, FX, Futures, Crypto)
5. Check different sub-tabs

### If Something's Wrong

**Dashboard shows "Error: Failed to fetch data"**

Check these in order:
1. Is your Google Sheet publicly viewable? (try opening sheet URL in incognito)
2. Is the API key correct in Vercel? (Settings → Environment Variables)
3. Is the Sheet ID correct in your code?
4. Does the sheet have a tab named "Core markets"?

**Data looks wrong or incomplete**

1. Check sheet format matches the structure
2. Verify column order: Asset Name | Price | Change % | (optional)
3. Make sure categories are in ALL CAPS (EQUITY INDEX, CURRENCIES, etc.)

**Dashboard is blank/white screen**

1. Check Vercel deployment logs (Deployments → click latest → View Function Logs)
2. Open browser console (F12) and check for errors
3. Verify all dependencies installed: `npm install` again

## Daily Usage

1. Your n8n workflow updates Google Sheet at 4 AM ✓
2. Open dashboard URL (bookmark it!)
3. Click "Refresh" to fetch latest data
4. That's it!

## Updating the Dashboard

### To Make Code Changes:

**If using GitHub method:**
```bash
# Make your changes
# Then:
git add .
git commit -m "Description of changes"
git push
```
Vercel auto-deploys in 30 seconds.

**If using CLI method:**
```bash
# Make your changes
# Then:
vercel --prod
```

### To Update Environment Variables:

1. Go to vercel.com
2. Select your project
3. Settings → Environment Variables
4. Edit or add variables
5. Redeploy (Deployments → click "..." → Redeploy)

## Cost

- Google Sheets API: Free (up to 300 requests/minute)
- Vercel Hosting: Free (hobby plan includes everything you need)
- Your dashboard: $0/month

## Security Notes

- Your API key is safe in Vercel environment variables
- Sheet is read-only (Viewer access only)
- No sensitive data is stored in the frontend code
- API key never exposed to users

## Next Steps

Consider adding:
- Custom domain (Vercel Settings → Domains)
- Mobile shortcuts (add to home screen)
- Email alerts (via n8n)
- Historical data charts

---

Need help? Check the main README.md for troubleshooting.
