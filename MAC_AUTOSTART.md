# Mac Autostart Setup 🍎

Set up your Forth app to automatically start when you log in to your Mac.

## Option 1: Auto-start Installed PWA (Recommended) ⭐

This makes the **installed PWA app** start automatically when you log in.

### Method A: Using System Settings (Easiest)

1. **Install the PWA first** (if not already installed):
   - Run `npm run dev`
   - Open Chrome → `http://localhost:5173`
   - Click the install icon in Chrome's address bar
   - Install the app

2. **Add to Login Items**:
   - Open **System Settings** (or **System Preferences** on older macOS)
   - Go to **Users & Groups** → **Login Items** (or **General** → **Login Items**)
   - Click the **+** button
   - Navigate to **Applications** folder
   - Select **Forth** (your installed PWA)
   - The app will now start automatically when you log in

### Method B: Using Terminal (Quick)

```bash
# Add to Login Items
osascript -e 'tell application "System Events" to make login item at end with properties {path:"/Applications/Forth.app", hidden:false}'

# Remove from Login Items (if needed)
osascript -e 'tell application "System Events" to delete login item "Forth"'
```

### Verify Login Items

```bash
# List all login items
osascript -e 'tell application "System Events" to get the name of every login item'
```

## Option 2: Auto-start Dev Server

This makes the **development server** start automatically when you log in. Useful if you want the dev server running in the background.

### Quick Setup

Run the setup script:
```bash
./mac-autostart.sh
```

Choose option 2 or 3, then follow the instructions.

### Manual Setup

1. **Create Launch Agent**:

```bash
# Create the LaunchAgents directory if it doesn't exist
mkdir -p ~/Library/LaunchAgents

# Create the plist file
cat > ~/Library/LaunchAgents/com.forth.devserver.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.forth.devserver</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>/usr/local/bin/npm</string>
        <string>run</string>
        <string>dev</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/Users/arthurberezin/Documents/forth</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <false/>
    <key>StandardOutPath</key>
    <string>~/Library/Logs/forth-dev.log</string>
    <key>StandardErrorPath</key>
    <string>~/Library/Logs/forth-dev-error.log</string>
</dict>
</plist>
EOF
```

2. **Update paths** in the plist file:
   - Find your node path: `which node`
   - Find your npm path: `which npm`
   - Edit the plist file and replace `/usr/local/bin/node` and `/usr/local/bin/npm` with your actual paths
   - Update the `WorkingDirectory` to your project path

3. **Load the Launch Agent**:

```bash
# Load (enable autostart)
launchctl load ~/Library/LaunchAgents/com.forth.devserver.plist

# Check status
launchctl list | grep forth

# View logs
tail -f ~/Library/Logs/forth-dev.log
```

4. **Unload (disable)** if needed:

```bash
launchctl unload ~/Library/LaunchAgents/com.forth.devserver.plist
```

## Option 3: Both (PWA + Dev Server)

Run the setup script and choose option 3:
```bash
./mac-autostart.sh
```

This sets up both:
- Installed PWA in Login Items
- Dev server Launch Agent

## Troubleshooting

### PWA Not Found in Applications

If you can't find "Forth" in Applications:
1. Make sure the PWA is installed (check Chrome → `chrome://apps`)
2. The app might be in `~/Applications` instead of `/Applications`
3. Try searching for "Forth" in Spotlight

### Launch Agent Not Starting

1. **Check paths**:
   ```bash
   which node
   which npm
   ```
   Make sure these match the paths in your plist file

2. **Check logs**:
   ```bash
   tail -f ~/Library/Logs/forth-dev.log
   tail -f ~/Library/Logs/forth-dev-error.log
   ```

3. **Verify plist syntax**:
   ```bash
   plutil -lint ~/Library/LaunchAgents/com.forth.devserver.plist
   ```

4. **Reload the agent**:
   ```bash
   launchctl unload ~/Library/LaunchAgents/com.forth.devserver.plist
   launchctl load ~/Library/LaunchAgents/com.forth.devserver.plist
   ```

### Using nvm or Other Node Version Managers

If you use `nvm`, `n`, or another version manager, you'll need to:
1. Use the full path to node/npm from your version manager
2. Or create a wrapper script that sources your version manager first

Example wrapper script:
```bash
#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
cd /Users/arthurberezin/Documents/forth
npm run dev
```

Then point the Launch Agent to this wrapper script instead.

## Recommendations

- **For daily use**: Use Option 1 (PWA in Login Items) - cleaner and uses less resources
- **For development**: Use Option 2 (Dev Server Launch Agent) - keeps dev server running
- **For both**: Use Option 3 - best of both worlds

## Quick Commands Reference

```bash
# Setup script
./mac-autostart.sh

# Add PWA to Login Items
osascript -e 'tell application "System Events" to make login item at end with properties {path:"/Applications/Forth.app", hidden:false}'

# Remove PWA from Login Items
osascript -e 'tell application "System Events" to delete login item "Forth"'

# Load Launch Agent (dev server)
launchctl load ~/Library/LaunchAgents/com.forth.devserver.plist

# Unload Launch Agent
launchctl unload ~/Library/LaunchAgents/com.forth.devserver.plist

# Check Launch Agent status
launchctl list | grep forth

# View dev server logs
tail -f ~/Library/Logs/forth-dev.log
```

## Security Note

Launch Agents run with your user permissions. The dev server will only be accessible on localhost, so it's safe for local development.
