// Generate PWA icons automatically using Puppeteer
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateIcons() {
  console.log('🚀 Starting icon generation...');
  
  // Check if puppeteer is installed
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 512, height: 512 });
    
    // Create HTML content inline
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body>
  <canvas id="icon192" width="192" height="192"></canvas>
  <canvas id="icon512" width="512" height="512"></canvas>
  <script>
    function drawIcon(canvas, size) {
      const ctx = canvas.getContext('2d');
      const scale = size / 512;
      
      // Background circle
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.fill();
      
      const centerX = size / 2;
      const centerY = size / 2;
      
      // Checkbox 1
      ctx.fillStyle = 'white';
      ctx.fillRect(centerX - 80 * scale, centerY - 120 * scale, 40 * scale, 40 * scale);
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2 * scale;
      ctx.strokeRect(centerX - 80 * scale, centerY - 120 * scale, 40 * scale, 40 * scale);
      
      // Checkmark
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 4 * scale;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo((centerX - 65) * scale, (centerY - 105) * scale);
      ctx.lineTo((centerX - 55) * scale, (centerY - 115) * scale);
      ctx.lineTo((centerX - 45) * scale, (centerY - 105) * scale);
      ctx.stroke();
      
      // Task line 1
      ctx.fillStyle = 'white';
      ctx.fillRect((centerX - 30) * scale, (centerY - 110) * scale, 100 * scale, 8 * scale);
      
      // Checkbox 2
      ctx.fillStyle = 'white';
      ctx.fillRect(centerX - 80 * scale, centerY - 60 * scale, 40 * scale, 40 * scale);
      ctx.strokeStyle = 'white';
      ctx.strokeRect(centerX - 80 * scale, centerY - 60 * scale, 40 * scale, 40 * scale);
      
      // Checkmark 2
      ctx.strokeStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo((centerX - 65) * scale, (centerY - 45) * scale);
      ctx.lineTo((centerX - 55) * scale, (centerY - 55) * scale);
      ctx.lineTo((centerX - 45) * scale, (centerY - 45) * scale);
      ctx.stroke();
      
      // Task line 2
      ctx.fillStyle = 'white';
      ctx.fillRect((centerX - 30) * scale, (centerY - 50) * scale, 80 * scale, 8 * scale);
      
      // Container/folder icon
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.beginPath();
      ctx.moveTo((centerX - 60) * scale, (centerY + 20) * scale);
      ctx.lineTo((centerX - 100) * scale, (centerY + 20) * scale);
      ctx.lineTo((centerX - 100) * scale, (centerY + 60) * scale);
      ctx.lineTo((centerX + 100) * scale, (centerY + 60) * scale);
      ctx.lineTo((centerX + 100) * scale, (centerY + 20) * scale);
      ctx.lineTo((centerX + 60) * scale, (centerY + 20) * scale);
      ctx.lineTo((centerX + 50) * scale, centerY);
      ctx.lineTo((centerX - 50) * scale, centerY);
      ctx.closePath();
      ctx.fill();
      
      // Folder tab
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.beginPath();
      ctx.moveTo((centerX - 50) * scale, centerY);
      ctx.lineTo((centerX - 60) * scale, (centerY + 20) * scale);
      ctx.lineTo((centerX + 60) * scale, (centerY + 20) * scale);
      ctx.lineTo((centerX + 50) * scale, centerY);
      ctx.closePath();
      ctx.fill();
    }
    
    drawIcon(document.getElementById('icon192'), 192);
    drawIcon(document.getElementById('icon512'), 512);
  </script>
</body>
</html>
    `;
    
    await page.setContent(htmlContent);
    // Wait for canvas elements to be ready
    await page.waitForSelector('#icon192');
    await page.waitForSelector('#icon512');
    await new Promise(resolve => setTimeout(resolve, 300)); // Small delay for rendering
    
    // Generate 192x192 icon
    const icon192 = await page.$('#icon192');
    const icon192Buffer = await icon192.screenshot({ type: 'png' });
    const icon192Path = path.join(__dirname, 'public', 'icon-192.png');
    fs.writeFileSync(icon192Path, icon192Buffer);
    console.log('✅ Generated icon-192.png');
    
    // Generate 512x512 icon
    const icon512 = await page.$('#icon512');
    const icon512Buffer = await icon512.screenshot({ type: 'png' });
    const icon512Path = path.join(__dirname, 'public', 'icon-512.png');
    fs.writeFileSync(icon512Path, icon512Buffer);
    console.log('✅ Generated icon-512.png');
    
    await browser.close();
    console.log('🎉 All icons generated successfully!');
    console.log('📍 Icons are in the public/ directory');
    console.log('💡 Restart your dev server and check Chrome\'s address bar for the install icon!');
    
  } catch (error) {
    if (error.message.includes('Cannot find module')) {
      console.log('❌ Puppeteer not found. Installing...');
      console.log('📦 Run: npm install --save-dev puppeteer');
      console.log('   Then run this script again: node generate-icons.mjs');
    } else {
      console.error('❌ Error:', error.message);
    }
    process.exit(1);
  }
}

generateIcons();
