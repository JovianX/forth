# Run Locally as an Installable App 🚀

Your app is ready to run locally as an installable PWA! Follow these steps:

## Quick Start

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Open Chrome** and navigate to the URL shown (usually `http://localhost:5173`)

3. **Look for the install icon** in Chrome's address bar (right side, next to bookmark icon)

4. **Click the install icon** to install the app

5. **Launch the installed app** from your desktop/applications folder

## Detailed Steps

### Step 1: Start the Server

```bash
npm run dev
```

You should see output like:
```
  VITE v4.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Step 2: Open in Chrome

1. Copy the localhost URL (e.g., `http://localhost:5173`)
2. Open **Google Chrome** (not other browsers - PWA install works best in Chrome)
3. Paste the URL and press Enter

### Step 3: Install the App

**Option A: Address Bar Icon**
- Look for a **plus icon (+)** or **install icon** on the right side of Chrome's address bar
- Click it to install

**Option B: Chrome Menu**
- Click the **three dots menu** (⋮) in the top right
- Select **"Install Forth"** or **"Install [App Name]"**

**Option C: Banner Prompt**
- Sometimes Chrome shows a banner at the top saying "Install Forth"
- Click the **Install** button

### Step 4: Launch Your Installed App

After installation:
- **Mac**: Look in Applications folder or Launchpad
- **Windows**: Look in Start Menu
- **Linux**: Look in your applications menu

The app will open in its own window without browser chrome!

## Verify Installation

1. **Check Service Worker**:
   - Open DevTools (F12)
   - Go to **Application** tab
   - Click **Service Workers**
   - Should show "activated and running"

2. **Check Manifest**:
   - In DevTools → **Application** → **Manifest**
   - Should show your app details with no errors

3. **Test Offline**:
   - Install the app
   - Disconnect from internet
   - The app should still work (thanks to service worker caching)

## Troubleshooting

### Install Icon Not Showing?

1. **Hard refresh**: Press `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
2. **Check icons exist**: 
   ```bash
   ls public/icon-*.png
   ```
   Should show `icon-192.png` and `icon-512.png`
3. **Regenerate icons if needed**:
   ```bash
   npm run generate-icons
   ```
4. **Check DevTools Console** for errors
5. **Make sure you're using `localhost`** (not `127.0.0.1`)

### Service Worker Not Registering?

1. Open DevTools → **Application** → **Service Workers**
2. Check for errors
3. Click **Unregister** if there's an old one
4. Refresh the page
5. Check console for "Service Worker registered successfully"

### App Not Installing?

1. Make sure you're using **Chrome** (not Edge, Firefox, etc.)
2. Check that manifest.json is accessible: `http://localhost:5173/manifest.json`
3. Verify icons are accessible: `http://localhost:5173/icon-192.png`
4. Check DevTools → **Application** → **Manifest** for errors

## Development vs Production

### Development Mode (`npm run dev`)
- ✅ Works for local installation
- ✅ Hot module reloading
- ⚠️ Service worker updates require page refresh

### Production Mode (`npm run build` then `npm run preview`)
- ✅ Optimized and minified
- ✅ Better performance
- ✅ More realistic to production environment

**For testing installation, either mode works!**

## What Happens After Installation?

- ✅ App opens in its own window (no browser UI)
- ✅ Works offline (cached resources)
- ✅ Appears in your applications folder
- ✅ Can be pinned to taskbar/dock
- ✅ Has its own icon and name

## Next Steps

Once installed, you can:
- Use the app offline
- Pin it to your taskbar/dock
- Launch it like any other app
- Update it by refreshing the installed app

Enjoy your installable PWA! 🎉
