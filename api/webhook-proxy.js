export default function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { webhookType } = req.body;

  const webhookUrls = {
    UPDATE_CURRENCIES: 'https://selim-okumus1.app.n8n.cloud/webhook/update-fx',
    UPDATE_CRYPTO: 'https://selim-okumus1.app.n8n.cloud/webhook/update-crypto',
  };

  const targetUrl = webhookUrls[webhookType];

  if (!targetUrl) {
    return res.status(400).json({ error: 'Invalid webhook type' });
  }

  // Use native https module
  const https = require('https');
  const url = require('url');

  const parsedUrl = url.parse(targetUrl);
  
  const options = {
    hostname: parsedUrl.hostname,
    path: parsedUrl.path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': 0
    }
  };

  const request = https.request(options, (response) => {
    let data = '';
    
    response.on('data', (chunk) => {
      data += chunk;
    });
    
    response.on('end', () => {
      if (response.statusCode >= 200 && response.statusCode < 300) {
        res.status(200).json({ success: true });
      } else {
        res.status(500).json({ error: 'Webhook failed', status: response.statusCode });
      }
    });
  });

  request.on('error', (error) => {
    console.error('Request error:', error);
    res.status(500).json({ error: error.message });
  });

  request.end();
}