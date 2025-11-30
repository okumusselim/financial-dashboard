# Market Dashboard

Real-time financial markets dashboard that reads data from Google Sheets and displays it in a beautiful, responsive interface.

## Features

- **Live Data**: Fetches real-time data from your Google Sheet
- **Multiple Asset Classes**: Indices, FX, Futures, Crypto
- **Regional Coverage**: US, European, Asian, Latin American markets
- **News Integration**: World and Turkey-specific news feeds
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Color-Coded UI**: Each asset class has its own theme

## Quick Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Google Sheets API

#### A. Enable Google Sheets API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable "Google Sheets API"
4. Go to "Credentials" → "Create Credentials" → "API Key"   AIzaSyD3oiuguPymeXuOY3rfvJENfbBaU9fPmik

#### B. Make Your Sheet Public
1. Open your Google Sheet
2. Click "Share" → "Change to anyone with the link"    https://docs.google.com/spreadsheets/d/1OuEvGdiiG8qQSEbAIVaMyitUsr2bBc6WaxnyjjvC1Uc/edit?usp=sharing
3. Set to "Viewer" access

### 3. Configure Environment

```bash
# Copy the example env file
cp .env.example .env

# Edit .env and add your API key
VITE_GOOGLE_API_KEY=your_actual_api_key_here
```

### 4. Update App Configuration

Open `src/App.jsx` and update lines 7-8:

```javascript
const SHEET_ID = '1OuEvGdiiG8qQSEbAIVaMyitUsr2bBc6WaxnyjjvC1Uc';
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || 'YOUR_API_KEY';
```

### 5. Test Locally

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

## Deploy to Vercel

### Option 1: Via CLI (Fastest)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel
```

Follow the prompts. Add your environment variable when asked:
- Variable name: `VITE_GOOGLE_API_KEY`
- Value: Your Google API key

### Option 2: Via GitHub (Recommended for Auto-Deploy)

1. **Push to GitHub:**
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/market-dashboard.git
git push -u origin main
```

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Add environment variable:
     - Name: `VITE_GOOGLE_API_KEY`
     - Value: Your Google API key
   - Click "Deploy"

3. **Auto-Deploy:**
   - Every push to `main` branch will auto-deploy
   - Takes ~30 seconds per deployment

## Google Sheet Format

Your sheet should have a tab named "Core markets" with this structure:

```
| Asset Name           | Price    | Change %  | (optional) |
|---------------------|----------|-----------|------------|
| EQUITY INDEX        |          |           |            |
| US Markets          |          |           |            |
| S&P 500             | 6765.88  | 0.91      |            |
| Dow Jones           | 47112.45 | 1.43      |            |
| ...                 |          |           |            |
```

Categories should be in ALL CAPS:
- EQUITY INDEX (or INDEX)
- CURRENCIES (or FX)
- FUTURES
- CRYPTO

## Daily Workflow

1. Your n8n workflow runs at 4 AM → Updates Google Sheet
2. Open dashboard URL → Click "Refresh"
3. View updated data instantly

No server maintenance needed. No database to manage.

## Customization

### Change Colors
Edit color schemes in `src/App.jsx` starting at line 128.

### Add More Tabs
Add to `mainTabs` array in `src/App.jsx` starting at line 224.

### Modify Layout
Edit grid classes in the render section starting at line 450.

## Troubleshooting

**Error: "Failed to fetch data"**
- Check API key is correct in Vercel environment variables
- Verify sheet is publicly viewable
- Confirm sheet ID matches

**Data not parsing correctly**
- Check sheet format matches expected structure
- Verify tab name is exactly "Core markets"
- Ensure headers are in ALL CAPS

**Deployment fails**
- Check all dependencies are in package.json
- Verify environment variables are set in Vercel
- Check build logs in Vercel dashboard

## Project Structure

```
market-dashboard/
├── src/
│   ├── App.jsx          # Main dashboard component
│   ├── main.jsx         # React entry point
│   └── index.css        # Global styles
├── index.html           # HTML template
├── package.json         # Dependencies
├── vite.config.js       # Vite configuration
└── README.md           # This file
```

## Performance

- Initial load: ~1-2 seconds
- Refresh: <1 second
- Sheet API calls: Cached by Google for ~60 seconds
- Hosting: Free on Vercel

## Support

Questions? Issues? 
- Check Vercel deployment logs
- Verify Google Cloud Console API quotas
- Test sheet access manually: `https://sheets.googleapis.com/v4/spreadsheets/YOUR_SHEET_ID/values/Core%20markets!A:D?key=YOUR_API_KEY`
