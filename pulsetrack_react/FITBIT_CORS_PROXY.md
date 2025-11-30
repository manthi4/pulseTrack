# Fitbit CORS Proxy Setup

Fitbit's API doesn't allow direct browser requests due to CORS restrictions. You need a backend proxy to make API calls.

## Option 1: Simple Node.js Proxy Server (Recommended)

Create a simple Express server to proxy Fitbit API requests.

### Setup

1. Create a new file `fitbit-proxy.js` in your project root:

```javascript
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PROXY_PORT || 3001;

// Proxy endpoint for Fitbit API calls
app.get('/api/fitbit-proxy', async (req, res) => {
  const { url } = req.query;
  const authHeader = req.headers.authorization;

  if (!url || !authHeader) {
    return res.status(400).json({ error: 'Missing url or authorization header' });
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
    res.status(500).json({ error: 'Proxy request failed' });
  }
});

// Proxy endpoint for token exchange
app.post('/api/fitbit-token', async (req, res) => {
  const { code, redirect_uri, code_verifier } = req.body;
  const clientId = process.env.VITE_FITBIT_CLIENT_ID;
  const clientSecret = process.env.VITE_FITBIT_CLIENT_SECRET;

  if (!code || !redirect_uri || !code_verifier) {
    return res.status(400).json({ error: 'Missing required parameters' });
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
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Token exchange error:', error);
    res.status(500).json({ error: 'Token exchange failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Fitbit proxy server running on http://localhost:${PORT}`);
});
```

2. Install dependencies:

```bash
npm install express cors node-fetch dotenv
```

3. Update your `.env.local`:

```env
VITE_FITBIT_CLIENT_ID=your_client_id
VITE_FITBIT_CLIENT_SECRET=your_client_secret
VITE_FITBIT_API_PROXY=http://localhost:3001/api/fitbit-proxy
VITE_FITBIT_TOKEN_PROXY=http://localhost:3001/api/fitbit-token
```

4. Run the proxy server:

```bash
node fitbit-proxy.js
```

5. Update `fitbit.ts` to use the proxy for token exchange (see below).

## Option 2: Vercel/Netlify Serverless Functions

### Vercel

Create `api/fitbit-proxy.js`:

```javascript
export default async function handler(req, res) {
  const { url } = req.query;
  const authHeader = req.headers.authorization;

  if (!url || !authHeader) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  const response = await fetch(url, {
    headers: {
      'Authorization': authHeader,
      'Accept': 'application/json',
    },
  });

  const data = await response.json();
  res.status(response.status).json(data);
}
```

Set `VITE_FITBIT_API_PROXY` to your Vercel function URL.

### Netlify

Create `netlify/functions/fitbit-proxy.js`:

```javascript
exports.handler = async (event, context) => {
  const { url } = event.queryStringParameters;
  const authHeader = event.headers.authorization;

  if (!url || !authHeader) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing parameters' }),
    };
  }

  const response = await fetch(url, {
    headers: {
      'Authorization': authHeader,
      'Accept': 'application/json',
    },
  });

  const data = await response.json();
  return {
    statusCode: response.status,
    body: JSON.stringify(data),
  };
};
```

## Option 3: CORS Proxy Service (Development Only)

For quick testing, you can use a public CORS proxy (NOT recommended for production):

```env
VITE_FITBIT_API_PROXY=https://cors-anywhere.herokuapp.com/
```

**Warning**: Public CORS proxies are unreliable and insecure. Use only for development.

## Updating fitbit.ts for Token Proxy

If you set up a token proxy, update the `handleCallback` function in `fitbit.ts`:

```typescript
const TOKEN_PROXY = import.meta.env.VITE_FITBIT_TOKEN_PROXY || '';

// In handleCallback function, replace the fetch call:
const tokenUrl = TOKEN_PROXY || FITBIT_TOKEN_URL;
const response = await fetch(tokenUrl, {
  method: 'POST',
  headers: TOKEN_PROXY 
    ? { 'Content-Type': 'application/json' }
    : {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
      },
  body: TOKEN_PROXY
    ? JSON.stringify({
        code,
        redirect_uri: REDIRECT_URI,
        code_verifier: codeVerifier,
      })
    : new URLSearchParams({
        client_id: CLIENT_ID,
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        code_verifier: codeVerifier,
      }),
});
```

## Security Notes

- **Never expose your Client Secret** in client-side code
- The proxy server should run on your backend
- Use environment variables for sensitive credentials
- In production, add rate limiting and authentication to your proxy


