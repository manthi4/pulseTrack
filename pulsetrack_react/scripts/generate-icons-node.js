// Simple Node.js script to generate PWA icons using canvas
// Requires: npm install canvas
// Or use the HTML version: open scripts/generate-icons-simple.html in a browser

import { createCanvas } from 'canvas';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const publicDir = join(__dirname, '..', 'public');

function drawIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Blue background
  ctx.fillStyle = '#3b82f6';
  ctx.fillRect(0, 0, size, size);
  
  // White "PT" text
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${size / 3}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PT', size / 2, size / 2);
  
  return canvas;
}

async function generateIcons() {
  try {
    const sizes = [192, 512];
    
    for (const size of sizes) {
      const canvas = drawIcon(size);
      const buffer = canvas.toBuffer('image/png');
      const outputPath = join(publicDir, `pwa-${size}x${size}.png`);
      writeFileSync(outputPath, buffer);
      console.log(`✓ Generated ${outputPath}`);
    }
    
    console.log('Icons generated successfully!');
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND' && error.message.includes('canvas')) {
      console.log('Canvas module not found. Please either:');
      console.log('1. Install canvas: npm install --save-dev canvas');
      console.log('2. Or use the HTML generator: open scripts/generate-icons-simple.html in a browser');
    } else {
      console.error('Error:', error.message);
    }
  }
}

generateIcons();

