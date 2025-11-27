# GitHub Pages Deployment Guide

This guide will help you deploy your PulseTrack React app to GitHub Pages.

## Prerequisites

1. A GitHub account
2. A GitHub repository (e.g., `pulseTrack`)
3. Git installed on your local machine
4. Node.js and npm installed

## Initial Setup

### 1. Install Dependencies

First, install the `gh-pages` package (if not already installed):

```bash
npm install
```

### 2. Configure Base Path

The app is configured to use `/pulseTrack/` as the base path by default. If your repository name is different, you can:

**Option A: Set environment variable before building**
```bash
# For Windows PowerShell
$env:GITHUB_PAGES_BASE="/your-repo-name/"; npm run build

# For Windows CMD
set GITHUB_PAGES_BASE=/your-repo-name/ && npm run build

# For Linux/Mac
GITHUB_PAGES_BASE=/your-repo-name/ npm run build
```

**Option B: Edit `vite.config.ts`**
Change the base path directly in `vite.config.ts`:
```typescript
const base = process.env.GITHUB_PAGES_BASE || '/your-repo-name/'
```

**Note:** If you're deploying to a custom domain or using GitHub Pages with a repository named `username.github.io`, use `/` as the base path.

### 3. Build the Project

Build your project for production:

```bash
npm run build
```

This creates an optimized production build in the `dist` folder.

### 4. Test Locally (Optional)

Before deploying, test the production build locally:

```bash
npm run preview
```

Visit `http://localhost:4173` (or the URL shown) to verify everything works correctly.

## Deployment

### Method 1: Using npm Script (Recommended)

The easiest way to deploy is using the npm script:

```bash
npm run deploy
```

This command will:
1. Automatically build your project (`predeploy` script)
2. Deploy the `dist` folder to the `gh-pages` branch
3. Push the changes to GitHub

### Method 2: Manual Deployment

If you prefer manual control:

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Deploy to gh-pages branch:**
   ```bash
   npx gh-pages -d dist
   ```

## GitHub Pages Configuration

After deploying, configure GitHub Pages:

1. Go to your repository on GitHub
2. Click **Settings** → **Pages** (in the left sidebar)
3. Under **Source**, select:
   - **Branch:** `gh-pages`
   - **Folder:** `/ (root)`
4. Click **Save**

Your site will be available at:
- `https://your-username.github.io/pulseTrack/`

**Note:** It may take a few minutes for GitHub Pages to build and publish your site.

## Updating Your Site

Whenever you make changes and want to update the live site:

1. Commit your changes to your main branch:
   ```bash
   git add .
   git commit -m "Your commit message"
   git push
   ```

2. Deploy the updated build:
   ```bash
   npm run deploy
   ```

## Troubleshooting

### Assets Not Loading (404 Errors)

If you see 404 errors for CSS, JS, or other assets:

1. **Check the base path:** Make sure the base path in `vite.config.ts` matches your repository name
2. **Verify the build:** Check that `dist/index.html` has correct paths (they should start with `/pulseTrack/`)
3. **Clear browser cache:** Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### PWA Not Working

The PWA manifest and service worker are configured to work with the base path. If PWA features aren't working:

1. Ensure you've built with the correct base path
2. Check browser console for service worker errors
3. Verify `manifest.webmanifest` is accessible at `/pulseTrack/manifest.webmanifest`

### Custom Domain

If you're using a custom domain:

1. Set the base path to `/` in `vite.config.ts`
2. Add a `CNAME` file in the `public` folder with your domain name
3. Configure DNS settings as per GitHub Pages documentation

## Environment Variables

You can customize the base path using environment variables:

```bash
# For root deployment
GITHUB_PAGES_BASE=/ npm run build

# For custom path
GITHUB_PAGES_BASE=/my-custom-path/ npm run build
```

## Additional Resources

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [gh-pages npm package](https://www.npmjs.com/package/gh-pages)
- [Vite Deployment Guide](https://vite.dev/guide/static-deploy.html#github-pages)

