// Simple Fitbit API Proxy Server
// Run with: node fitbit-proxy.js
// Requires: npm install express cors node-fetch dotenv

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PROXY_PORT || 3001;

// Proxy endpoint for Fitbit API calls
app.get('/api/fitbit-proxy', async (req, res) => {
  const { url } = req.query;
  const authHeader = req.headers.authorization;

  if (!url) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  if (!authHeader) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json',
      },
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy request failed', details: error.message });
  }
});

// Proxy endpoint for token exchange
app.post('/api/fitbit-token', async (req, res) => {
  const { code, redirect_uri, code_verifier } = req.body;
  const clientId = process.env.VITE_FITBIT_CLIENT_ID;
  const clientSecret = process.env.VITE_FITBIT_CLIENT_SECRET;

  if (!code || !redirect_uri || !code_verifier) {
    return res.status(400).json({ 
      error: 'Missing required parameters',
      received: { code: !!code, redirect_uri: !!redirect_uri, code_verifier: !!code_verifier }
    });
  }

  if (!clientId || !clientSecret) {
    return res.status(500).json({ 
      error: 'Server configuration error: Client ID or Secret not found in environment variables' 
    });
  }

  try {
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const response = await fetch('https://api.fitbit.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        client_id: clientId,
        grant_type: 'authorization_code',
        code,
        redirect_uri,
        code_verifier,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Fitbit token exchange error:', data);
      console.error('Redirect URI used:', redirect_uri);
    }
    
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Token exchange error:', error);
    res.status(500).json({ error: 'Token exchange failed', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Fitbit proxy server running on http://localhost:${PORT}`);
  console.log(`API Proxy: http://localhost:${PORT}/api/fitbit-proxy`);
  console.log(`Token Proxy: http://localhost:${PORT}/api/fitbit-token`);
});


