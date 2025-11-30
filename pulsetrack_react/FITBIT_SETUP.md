# Fitbit Integration Setup

This guide explains how to set up Fitbit integration to import sleep data into PulseTrack.

## Prerequisites

1. A Fitbit account with a device that tracks sleep
2. A Fitbit Developer account (free)

## Step 1: Register Your Application

1. Go to the [Fitbit Developer Portal](https://dev.fitbit.com/apps)
2. Click **Register a New App**
3. Fill in the application details:
   - **Application Name**: PulseTrack (or your preferred name)
   - **Description**: Personal activity tracking application
   - **Application Website**: Your website URL (or `http://localhost:5173` for local development)
   - **OAuth 2.0 Application Type**: Select **Personal**
   - **Callback URL**: 
     - For local development: `http://localhost:5173/pulseTrack/`
     - For production: `https://yourdomain.com/pulseTrack/`
     - **Note**: The callback URL must match your app's base path exactly (no hash fragment needed)
   - **Default Access Type**: **Read-Only**
   - **Scopes**: Select **sleep** (or all scopes you need)

4. After registration, you'll receive:
   - **Client ID** (OAuth 2.0 Client ID)
   - **Client Secret** (OAuth 2.0 Client Secret)

## Step 2: Configure Environment Variables

1. Create a `.env.local` file in the `pulsetrack_react` directory (if it doesn't exist)
2. Add the following variables:

```env
VITE_FITBIT_CLIENT_ID=your_client_id_here
VITE_FITBIT_CLIENT_SECRET=your_client_secret_here
```

**Important**: 
- Never commit `.env.local` to version control (it should be in `.gitignore`)
- The `VITE_` prefix is required for Vite to expose these variables to your application
- Replace `your_client_id_here` and `your_client_secret_here` with your actual credentials

## Step 2.5: Set Up CORS Proxy (Required)

**Fitbit's API blocks direct browser requests due to CORS restrictions.** You need a backend proxy.

See [FITBIT_CORS_PROXY.md](./FITBIT_CORS_PROXY.md) for detailed setup instructions.

Quick setup options:
- **Option 1**: Use the provided Node.js proxy server (recommended for development)
- **Option 2**: Use Vercel/Netlify serverless functions (recommended for production)
- **Option 3**: Use a public CORS proxy (development only, not secure)

After setting up a proxy, add to your `.env.local`:

```env
VITE_FITBIT_API_PROXY=http://localhost:3001/api/fitbit-proxy
VITE_FITBIT_TOKEN_PROXY=http://localhost:3001/api/fitbit-token
```

## Step 3: Verify Callback URL

Make sure your callback URL in the Fitbit Developer Portal matches your application's base URL exactly:

- **Local Development**: `http://localhost:5173/pulseTrack/`
- **Production**: `https://yourdomain.com/pulseTrack/`

**Important**: Fitbit will redirect back with query parameters (e.g., `?code=...`), not hash fragments. The code automatically handles these query parameters when you're redirected back from Fitbit authorization.

## Step 4: Restart Development Server

After adding environment variables, restart your development server:

```bash
npm run dev
```

## Step 5: Connect Fitbit Account

1. Open PulseTrack and navigate to **Settings**
2. Scroll to the **Fitbit Integration** section
3. Click **Connect Fitbit**
4. You'll be redirected to Fitbit to authorize the application
5. After authorization, you'll be redirected back to PulseTrack
6. The Fitbit section should now show "Connected to Fitbit"

## Step 6: Import Sleep Data

1. Once connected, click **Import Sleep Data** in the Fitbit Integration section
2. This will import the last 30 days of sleep data from your Fitbit account
3. Sleep sessions will be created as activities tagged with "Sleep"
4. Duplicate sessions (matching start time within 1 hour) will be automatically skipped

## Troubleshooting

### "Fitbit Client ID not configured" Error

- Make sure you've created `.env.local` in the `pulsetrack_react` directory
- Verify the variable names start with `VITE_`
- Restart your development server after adding environment variables

### Authorization Fails / "Authorization code invalid" Error

This usually means the redirect URI doesn't match exactly. Check:

1. **Redirect URI must match exactly**:
   - Check the browser console for the logged redirect URI
   - It should be: `http://localhost:5173/pulseTrack/` (with trailing slash)
   - In Fitbit Developer Portal, the callback URL must match **exactly**
   - Match the protocol (http vs https)
   - Match the domain and port
   - Match the trailing slash

2. **Common issues**:
   - Trailing slash mismatch (`/pulseTrack` vs `/pulseTrack/`)
   - Port mismatch (5173 vs 3000)
   - Protocol mismatch (http vs https)
   - Path mismatch (`/pulseTrack/` vs `/`)

3. **Debug steps**:
   - Check browser console for "Fitbit redirect URI:" log message
   - Copy that exact value
   - Paste it into Fitbit Developer Portal callback URL field
   - Save and try again

4. **Authorization codes are single-use**:
   - If you see "invalid" error, the code may have already been used
   - Try disconnecting and reconnecting
   - Clear browser cache/localStorage if needed

### CORS Errors

If you see CORS errors when making API calls:

- **This is expected** - Fitbit's API blocks direct browser requests
- You **must** set up a backend proxy (see Step 2.5)
- Add `VITE_FITBIT_API_PROXY` and `VITE_FITBIT_TOKEN_PROXY` to your `.env.local`
- Make sure the proxy server is running before making API calls

### "Failed to exchange authorization code" Error

- Verify your Client ID and Client Secret are correct
- Check that your callback URL matches exactly (see "Authorization Fails" above)
- Ensure your app is set to "Personal" type in the Fitbit Developer Portal
- If using a token proxy, make sure it's running and `VITE_FITBIT_TOKEN_PROXY` is set correctly

### No Sleep Data Found

- Make sure your Fitbit device has been synced recently
- Verify you have sleep data in your Fitbit account for the date range
- Check that your device supports sleep tracking

### Token Expired

- If you see authentication errors, try disconnecting and reconnecting your Fitbit account
- Tokens are automatically refreshed, but if refresh fails, you'll need to reconnect

## Security Notes

- **Never share your Client Secret** publicly
- Keep `.env.local` in `.gitignore`
- For production, use environment variables provided by your hosting platform
- The Client Secret is used server-side in production (this implementation uses it client-side for simplicity, but consider moving token exchange to a backend in production)

## API Rate Limits

Fitbit API has rate limits:
- **150 requests per hour per user**
- Sleep data import respects these limits
- If you hit rate limits, wait an hour before trying again

## Additional Resources

- [Fitbit Web API Documentation](https://dev.fitbit.com/build/reference/web-api/)
- [Fitbit Authorization Guide](https://dev.fitbit.com/build/reference/web-api/developer-guide/authorization/)
- [Sleep API Documentation](https://dev.fitbit.com/build/reference/web-api/sleep/get-sleep-log-by-date/)

