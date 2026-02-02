// Simple script to generate PWA icons
// Run with: node public/generate-icons.js
// Note: This requires the 'canvas' package. Install with: npm install canvas

const fs = require('fs');
const path = require('path');

// Check if canvas is available
let canvas;
try {
  canvas = require('canvas');
} catch (e) {
  console.log('Canvas package not found. Please install it with: npm install canvas');
  console.log('Alternatively, open public/generate-icons.html in your browser to generate icons manually.');
  process.exit(1);
}

function generateIcon(size) {
  const canvasElement = canvas.createCanvas(size, size);
  const ctx = canvasElement.getContext('2d');
  const scale = size / 512;
  
  // Background circle
  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();
  
  // Task list icon
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
  
  return canvasElement;
}

// Generate icons
const publicDir = path.join(__dirname);
const sizes = [192, 512];

sizes.forEach(size => {
  const icon = generateIcon(size);
  const buffer = icon.toBuffer('image/png');
  const filePath = path.join(publicDir, `icon-${size}.png`);
  fs.writeFileSync(filePath, buffer);
  console.log(`Generated icon-${size}.png`);
});

console.log('All icons generated successfully!');
