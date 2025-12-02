export default async function handler(req, res) {
  // Set CORS headers
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
    UPDATE_CURRENCIES: 'https://selim-okums1.app.n8n.cloud/webhook/update-fx',
    UPDATE_CRYPTO: 'https://selim-okums1.app.n8n.cloud/webhook/update-crypto',
  };

  const targetUrl = webhookUrls[webhookType];

  if (!targetUrl) {
    return res.status(400).json({ error: 'Invalid webhook type' });
  }

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.ok) {
      return res.status(200).json({ success: true });
    } else {
      return res.status(500).json({ error: 'Webhook failed' });
    }
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
}