// api/webhook-proxy.js
// Vercel Serverless Function to proxy n8n webhooks with CORS

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { webhookType } = req.body;

    // Map webhook types to n8n URLs
    const webhookUrls = {
      UPDATE_CURRENCIES: 'https://selim-okums1.app.n8n.cloud/webhook/update-fx',
      UPDATE_CRYPTO: 'https://selim-okums1.app.n8n.cloud/webhook/update-crypto',
    };

    const targetUrl = webhookUrls[webhookType];

    if (!targetUrl) {
      res.status(400).json({ error: 'Invalid webhook type' });
      return;
    }

    // Forward request to n8n
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      res.status(200).json({ success: true, message: 'Webhook triggered successfully' });
    } else {
      res.status(500).json({ error: 'Webhook failed' });
    }
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
