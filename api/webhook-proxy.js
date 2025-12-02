export default async function handler(req, res) {
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

  const { webhookType } = req.body || {};

  const webhookUrls = {
    UPDATE_CURRENCIES: 'https://selim-okumus1.app.n8n.cloud/webhook/update-fx',
    UPDATE_CRYPTO: 'https://selim-okumus1.app.n8n.cloud/webhook/update-crypto',
  };

  const targetUrl = webhookUrls[webhookType];

  if (!targetUrl) {
    return res.status(400).json({ error: 'Invalid webhook type' });
  }

  try {
    // Use dynamic import for https module
    const https = await import('https');
    const url = await import('url');
    
    const parsedUrl = url.parse(targetUrl);
    
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    return new Promise((resolve) => {
      const request = https.request(options, (response) => {
        let data = '';
        
        response.on('data', (chunk) => {
          data += chunk;
        });
        
        response.on('end', () => {
          if (response.statusCode >= 200 && response.statusCode < 300) {
            res.status(200).json({ success: true });
            resolve();
          } else {
            res.status(500).json({ error: 'Webhook failed', status: response.statusCode });
            resolve();
          }
        });
      });

      request.on('error', (error) => {
        console.error('Request error:', error);
        res.status(500).json({ error: error.message });
        resolve();
      });

      request.end();
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
}