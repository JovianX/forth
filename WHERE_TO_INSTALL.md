# Where to Find the "Install" Button in Chrome

The install button appears in different places depending on your Chrome version and whether the PWA requirements are met.

## 📍 Location 1: Address Bar (Most Common)
Look for a **plus icon (+)** or **install icon** in Chrome's address bar (omnibox), usually on the right side next to the bookmark star.

## 📍 Location 2: Chrome Menu
1. Click the **three dots menu** (⋮) in the top right
2. Look for **"Install Forth"** or **"Install [App Name]"** option
3. Click it to install

## 📍 Location 3: Banner/Prompt
Sometimes Chrome shows a banner at the top of the page saying:
- "Install Forth" with an Install button
- "Add to Home Screen" (on mobile)

## ⚠️ Why You Might Not See It

The install button **won't appear** if:

1. **Icons are missing** ❌ (Currently the issue!)
   - Need: `icon-192.png` and `icon-512.png` in the `public` folder
   - **Fix**: Open `public/generate-icons.html` in your browser and download the icons

2. **Not served over HTTPS or localhost**
   - Development: Use `localhost` (works with `npm run dev`)
   - Production: Must be HTTPS

3. **Service worker not registered**
   - Check browser console for errors
   - Should see: "Service Worker registered successfully"

4. **Manifest errors**
   - Open DevTools → Application → Manifest
   - Check for any errors

## ✅ Quick Fix Steps

1. **Generate icons**:
   - Open `public/generate-icons.html` in your browser
   - Download both icon sizes
   - Move them to the `public` folder

2. **Start the app**:
   ```bash
   npm run dev
   ```

3. **Open in Chrome**: `http://localhost:5173`

4. **Check DevTools**:
   - Press F12
   - Go to Application tab
   - Check "Manifest" and "Service Workers" sections
   - Look for any errors

5. **Look for install button** in the address bar or Chrome menu

## 🔍 Debug Checklist

- [ ] Icons exist: `public/icon-192.png` and `public/icon-512.png`
- [ ] App running on `localhost` or HTTPS
- [ ] Service worker registered (check console)
- [ ] Manifest valid (check DevTools → Application → Manifest)
- [ ] No console errors

Once all checkboxes are ✅, the install button should appear!
