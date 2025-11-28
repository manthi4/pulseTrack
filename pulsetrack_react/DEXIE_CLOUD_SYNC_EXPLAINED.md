# Dexie Cloud Sync - How It Works

## Quick Answer: Yes, User Sign-In IS Required! 🔐

**To sync data across devices with Dexie Cloud, users MUST sign in.** Even though your database is configured with `requireAuth: false`, this only means:
- The app can work **offline** without authentication
- Users can use the app locally without signing in
- **BUT** to sync data between devices, users need to authenticate

## How Dexie Cloud Authentication Works

When a user clicks "Login to Sync" in your Settings page, here's what happens:

1. **User clicks "Login to Sync"** → Calls `db.cloud.login()`
2. **Dexie Cloud prompts for email** → User enters their email address
3. **OTP sent via email** → Dexie Cloud sends a one-time password to that email
4. **User enters OTP** → User enters the code from their email
5. **Authentication complete** → User is now logged in and can sync data
6. **Automatic sync begins** → Once authenticated, Dexie Cloud automatically syncs data

## Current Setup Status

✅ **What's Already Done:**
- Dexie Cloud addon installed (`dexie-cloud-addon`)
- Database configured with cloud sync (`src/lib/db.ts`)
- `useCloudSync` hook created (`src/hooks/useCloudSync.ts`)
- UI in Settings page for login/logout/sync (`src/components/Settings.tsx`)
- `dexie-cloud.json` file exists with your database URL

⚠️ **What You Need to Do:**

### Step 1: Set Up Environment Variable

Create a `.env.local` file in the `pulsetrack_react` directory:

```bash
VITE_DEXIE_CLOUD_DB_URL=https://zejy7j2s3.dexie.cloud
```

(Use the `dbUrl` from your `dexie-cloud.json` file)

**Important:** Restart your dev server after creating/updating `.env.local`!

### Step 2: Whitelist Your URLs

Before sync will work, you need to whitelist the URLs where your app runs:

```bash
# For local development
cd pulsetrack_react
npx dexie-cloud whitelist http://localhost:5173

# For production (GitHub Pages or your domain)
npx dexie-cloud whitelist https://yourusername.github.io
npx dexie-cloud whitelist https://yourusername.github.io/pulseTrack
```

### Step 3: Test the Sync

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Open the app** and navigate to **Settings**

3. **Click "Login to Sync"**
   - You'll be prompted for your email
   - Check your email for the OTP code
   - Enter the code to complete login

4. **Create some test data** (add an activity or session)

5. **Open the app on another device/browser** (or incognito window)
   - Login with the same email
   - Your data should appear automatically! 🎉

## How Sync Works Once Authenticated

Once a user is logged in:

1. **Automatic Sync**: Changes sync automatically when online
2. **Background Sync**: Service worker handles sync even when app is closed
3. **Offline Support**: Works offline, syncs when back online
4. **Multi-Device**: Same account = same data across all devices
5. **Conflict Resolution**: Last-write-wins based on `updated_at` timestamps

## Understanding `requireAuth: false`

In your `src/lib/db.ts`, you have:

```typescript
this.cloud.configure({
  databaseUrl: dbUrl,
  requireAuth: false, // Set to true if you want to require authentication
});
```

**What `requireAuth: false` means:**
- ✅ Users can use the app **locally** without signing in
- ✅ Data is stored in IndexedDB and works offline
- ❌ **BUT** data won't sync across devices without authentication
- ❌ Users can't access their data on other devices

**If you set `requireAuth: true`:**
- ❌ Users **must** sign in before using the app
- ✅ Data automatically syncs once authenticated
- ✅ Better for apps where sync is mandatory

**Recommendation:** Keep `requireAuth: false` for now - it gives users flexibility to use the app locally, but they can opt-in to sync when ready.

## Troubleshooting

### "Database URL not configured"
- Make sure `.env.local` exists with `VITE_DEXIE_CLOUD_DB_URL`
- Restart your dev server after creating `.env.local`
- Check that the URL matches your `dexie-cloud.json` `dbUrl`

### "Origin not whitelisted"
- Run `npx dexie-cloud whitelist <your-url>` for each URL
- Make sure you're using the exact URL (including `http://` or `https://`)
- Check browser console for the exact error message

### Login not working
- Check browser console for errors
- Make sure you've completed `npx dexie-cloud create` step
- Verify `dexie-cloud.json` exists and has valid `dbUrl`
- Try logging out and logging back in

### Data not syncing
- Make sure you're logged in (check Settings > Cloud Sync)
- Check sync status in Settings - should show "Synced" or "Syncing..."
- Make sure both devices are online
- Try clicking "Sync Now" manually
- Check browser console for sync errors

### OTP not received
- Check spam folder
- Make sure email address is correct
- Wait a few minutes - email delivery can be delayed
- Try requesting a new OTP

## Security Notes

- ✅ `dexie-cloud.json` and `dexie-cloud.key` are in `.gitignore` (safe)
- ✅ Never commit these files to version control
- ⚠️ Keep your database URL secure - anyone with it can potentially access your database
- ✅ Use environment variables in production
- ✅ Each user's data is isolated by their authentication

## Next Steps

1. Create `.env.local` with your database URL
2. Whitelist your URLs
3. Test login and sync
4. Consider setting `requireAuth: true` if you want to require sync for all users

## Additional Resources

- [Dexie Cloud Quickstart](https://dexie.org/docs/cloud/quickstart)
- [Dexie Cloud Authentication](https://dexie.org/docs/cloud/authentication)
- [Dexie Cloud API Reference](https://dexie.org/docs/API-Reference)

