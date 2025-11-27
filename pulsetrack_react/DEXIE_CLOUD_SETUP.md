# Dexie Cloud Setup Guide

This guide will walk you through setting up Dexie Cloud sync for PulseTrack so you can sync your data across devices.

## Prerequisites

- Node.js version >= 18
- A terminal/command line (Git Bash on Windows)

## Step 1: Create a Cloud Database

Run the following command in the `pulsetrack_react` directory:

```bash
npx dexie-cloud create
```

This will:
1. Prompt you for your email address
2. Send you a one-time password (OTP) via email
3. Create two files: `dexie-cloud.json` and `dexie-cloud.key`

**Important:** These files contain sensitive credentials. They are automatically added to `.gitignore` to prevent committing them to your repository.

## Step 2: Configure Environment Variable

The database URL from `dexie-cloud.json` needs to be available to your app. You have two options:

### Option A: Use Environment Variable (Recommended for Production)

Create a `.env.local` file in the `pulsetrack_react` directory:

```bash
VITE_DEXIE_CLOUD_DB_URL=https://your-database.dexie.cloud
```

Replace `https://your-database.dexie.cloud` with the `databaseUrl` from your `dexie-cloud.json` file.

### Option B: Read from dexie-cloud.json (Development)

For development, you can modify `src/lib/db.ts` to read directly from `dexie-cloud.json`:

```typescript
import dexieCloudConfig from '../../dexie-cloud.json';

// In constructor:
this.cloud.configure({
  databaseUrl: dexieCloudConfig.databaseUrl,
  requireAuth: false,
});
```

**Note:** This approach requires importing JSON files, which may need additional Vite configuration.

## Step 3: Whitelist Your Application URLs

Before your app can sync, you need to whitelist the URLs where it will run:

### For Local Development:
```bash
npx dexie-cloud whitelist http://localhost:5173
```

(Replace `5173` with your Vite dev server port if different)

### For Production:
```bash
npx dexie-cloud whitelist https://yourusername.github.io
npx dexie-cloud whitelist https://yourusername.github.io/pulseTrack
```

Replace with your actual GitHub Pages URL or production domain.

## Step 4: Test the Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to Settings in the app
3. You should see a "Cloud Sync" section
4. Click "Login to Sync" to authenticate
5. After logging in, your data will automatically sync

## Step 5: Test Cross-Device Sync

1. Install the app on multiple devices (or open in multiple browsers)
2. Login with the same account on both devices
3. Create or modify data on one device
4. Wait a few seconds - the changes should appear on the other device automatically!

## Troubleshooting

### "Database URL not configured"
- Make sure you've created `.env.local` with `VITE_DEXIE_CLOUD_DB_URL`
- Restart your dev server after creating/updating `.env.local`

### "Origin not whitelisted"
- Run `npx dexie-cloud whitelist <your-url>` for the URL you're accessing the app from
- Make sure you're using the exact URL (including protocol: http:// or https://)

### Sync not working
- Check that you're logged in (Settings > Cloud Sync)
- Check the browser console for errors
- Make sure both devices are online
- Try clicking "Sync Now" manually

### Authentication issues
- Make sure you've completed the `npx dexie-cloud create` step
- Check that `dexie-cloud.json` exists in your project root
- Try logging out and logging back in

## Additional Resources

- [Dexie Cloud Quickstart](https://dexie.org/docs/cloud/quickstart)
- [Dexie Cloud Documentation](https://dexie.org/docs/cloud/)
- [Dexie Cloud API Reference](https://dexie.org/docs/API-Reference)

## Security Notes

- Never commit `dexie-cloud.json` or `dexie-cloud.key` to version control
- These files are automatically added to `.gitignore`
- Keep your database URL secure - anyone with it can potentially access your database
- Consider using environment variables in production

