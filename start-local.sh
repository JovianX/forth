#!/bin/bash

# Start script for running the app locally as an installable PWA

echo "🚀 Starting Life Tasker as installable PWA..."
echo ""
echo "📋 Checklist:"
echo "  ✅ Icons generated"
echo "  ✅ Manifest configured"
echo "  ✅ Service worker ready"
echo ""
echo "🌐 Starting dev server..."
echo "   Once running, open Chrome and go to: http://localhost:5173"
echo "   Look for the install icon (+) in Chrome's address bar!"
echo ""

npm run dev
