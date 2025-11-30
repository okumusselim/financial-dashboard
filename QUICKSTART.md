# QUICK START - 3 Commands to Deploy

## Prerequisites
- Node.js installed
- Google Sheet ready and public

## Get Your Google API Key First
1. https://console.cloud.google.com/ → Enable "Google Sheets API"
2. Credentials → Create API Key → Copy it

## Deploy in 3 Commands

```bash
# 1. Install
npm install

# 2. Set API Key (replace with yours)
echo "VITE_GOOGLE_API_KEY=AIzaSyC_your_key_here" > .env

# 3. Deploy
npx vercel
```

When Vercel asks for environment variable:
- Name: `VITE_GOOGLE_API_KEY`
- Value: [your API key]

Done! You'll get a URL like: https://market-dashboard-xyz.vercel.app

## That's It!

Your dashboard is live. Your n8n workflow updates the sheet at 4 AM, you refresh the dashboard URL to see new data.

---

For detailed instructions, see DEPLOYMENT.md
For customization, see README.md
