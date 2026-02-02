# Generating PWA Icons

To make the app installable in Chrome, you need PNG icon files. Here are two ways to generate them:

## Method 1: Using the HTML Generator (Recommended)

1. Open `public/generate-icons.html` in your web browser
2. Click the "Download 192x192" and "Download 512x512" buttons
3. The icons will be downloaded to your Downloads folder
4. Move them to the `public` directory as `icon-192.png` and `icon-512.png`

## Method 2: Using Node.js Script

1. Install the canvas package: `npm install canvas`
2. Run the script: `node public/generate-icons.cjs`
3. The icons will be automatically generated in the `public` directory

## Method 3: Manual Creation

You can also create your own icons:
- Create PNG files: `icon-192.png` (192x192 pixels) and `icon-512.png` (512x512 pixels)
- Place them in the `public` directory
- The icons should represent your app (task management with containers)

Once the icons are in place, the app will be installable as a PWA in Chrome!
