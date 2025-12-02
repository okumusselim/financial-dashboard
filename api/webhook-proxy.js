// api/webhook-proxy.js
// Vercel Serverless Function to proxy n8n webhooks with CORS

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { webhookType } = req.body;

  // Map webhook types to n8n URLs
  const webhookUrls = {
    UPDATE_CURRENCIES: 'https://selim-okums1.app.n8n.cloud/webhook/update-fx',
    UPDATE_CRYPTO: 'https://selim-okums1.app.n8n.cloud/webhook/update-crypto',
  };

  const targetUrl = webhookUrls[webhookType];

  if (!targetUrl) {
    return res.status(400).json({ error: 'Invalid webhook type' });
  }

  try {
    // Make request to n8n webhook using fetch (available in Node 18+)
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      return res.status(200).json({ 
        success: true, 
        message: 'Webhook triggered successfully' 
      });
    } else {
      console.error('n8n webhook returned status:', response.status);
      return res.status(500).json({ 
        error: 'Webhook failed',
        status: response.status 
      });
    }
  } catch (error) {
    console.error('Proxy error:', error.message);
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
}