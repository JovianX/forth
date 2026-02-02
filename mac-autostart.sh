#!/bin/bash

# Mac Autostart Setup Script for Forth PWA
# This script helps you set up autostart options for Mac

echo "🍎 Mac Autostart Setup for Forth"
echo ""

# Get the current directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
APP_NAME="Forth"

echo "Choose an autostart option:"
echo "1) Add installed PWA to Login Items (recommended - starts the installed app)"
echo "2) Create Launch Agent to auto-start dev server"
echo "3) Both options"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
  1)
    echo ""
    echo "📱 Adding PWA to Login Items..."
    echo ""
    echo "To add the installed PWA to Login Items:"
    echo "1. Open System Settings (or System Preferences on older macOS)"
    echo "2. Go to 'Users & Groups' (or 'Users & Groups' → Login Items)"
    echo "3. Click the '+' button"
    echo "4. Navigate to Applications and select 'Forth'"
    echo "5. The app will now start automatically when you log in"
    echo ""
    echo "Or use this command in Terminal:"
    echo "osascript -e 'tell application \"System Events\" to make login item at end with properties {path:\"/Applications/Forth.app\", hidden:false}'"
    ;;
    
  2)
    echo ""
    echo "⚙️  Creating Launch Agent for dev server..."
    
    # Create Launch Agent directory if it doesn't exist
    LAUNCH_AGENTS_DIR="$HOME/Library/LaunchAgents"
    mkdir -p "$LAUNCH_AGENTS_DIR"
    
    # Create plist file
    PLIST_FILE="$LAUNCH_AGENTS_DIR/com.forth.devserver.plist"
    
    cat > "$PLIST_FILE" << EOF
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
    <string>$SCRIPT_DIR</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <false/>
    <key>StandardOutPath</key>
    <string>$HOME/Library/Logs/forth-dev.log</string>
    <key>StandardErrorPath</key>
    <string>$HOME/Library/Logs/forth-dev-error.log</string>
</dict>
</plist>
EOF
    
    echo "✅ Launch Agent created at: $PLIST_FILE"
    echo ""
    echo "⚠️  Note: You need to update the node and npm paths in the plist file"
    echo "   Find your paths with: which node && which npm"
    echo ""
    echo "To load the Launch Agent:"
    echo "  launchctl load $PLIST_FILE"
    echo ""
    echo "To unload (disable):"
    echo "  launchctl unload $PLIST_FILE"
    ;;
    
  3)
    echo ""
    echo "📱 Setting up both options..."
    echo ""
    
    # Create Launch Agent
    LAUNCH_AGENTS_DIR="$HOME/Library/LaunchAgents"
    mkdir -p "$LAUNCH_AGENTS_DIR"
    PLIST_FILE="$LAUNCH_AGENTS_DIR/com.forth.devserver.plist"
    
    # Get node and npm paths
    NODE_PATH=$(which node)
    NPM_PATH=$(which npm)
    
    if [ -z "$NODE_PATH" ] || [ -z "$NPM_PATH" ]; then
      echo "⚠️  Could not find node/npm paths. Please update the plist file manually."
      NODE_PATH="/usr/local/bin/node"
      NPM_PATH="/usr/local/bin/npm"
    fi
    
    cat > "$PLIST_FILE" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.forth.devserver</string>
    <key>ProgramArguments</key>
    <array>
        <string>$NODE_PATH</string>
        <string>$NPM_PATH</string>
        <string>run</string>
        <string>dev</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$SCRIPT_DIR</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <false/>
    <key>StandardOutPath</key>
    <string>$HOME/Library/Logs/forth-dev.log</string>
    <key>StandardErrorPath</key>
    <string>$HOME/Library/Logs/forth-dev-error.log</string>
</dict>
</plist>
EOF
    
    echo "✅ Launch Agent created at: $PLIST_FILE"
    echo ""
    echo "📱 To add PWA to Login Items:"
    echo "   1. Open System Settings → Users & Groups → Login Items"
    echo "   2. Click '+' and select 'Forth' from Applications"
    echo ""
    echo "Or run this command:"
    echo "osascript -e 'tell application \"System Events\" to make login item at end with properties {path:\"/Applications/Forth.app\", hidden:false}'"
    echo ""
    echo "⚙️  To enable Launch Agent (dev server autostart):"
    echo "   launchctl load $PLIST_FILE"
    ;;
    
  *)
    echo "Invalid choice"
    exit 1
    ;;
esac

echo ""
echo "✅ Setup complete!"
echo ""
echo "📖 For more details, see MAC_AUTOSTART.md"
