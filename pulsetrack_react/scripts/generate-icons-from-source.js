// Generate PWA icons from icon1.png
// This script uses the HTML5 Canvas API via jsdom or creates a simple conversion

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const publicDir = join(__dirname, '..', 'public');
const sourceIcon = join(publicDir, 'icon1.png');

async function generateIcons() {
  try {
    // Try using canvas if available
    const { createCanvas, loadImage } = await import('canvas');
    
    const sizes = [192, 512];
    const sourceImage = await loadImage(sourceIcon);
    
    for (const size of sizes) {
      const canvas = createCanvas(size, size);
      const ctx = canvas.getContext('2d');
      
      // Draw the source image, scaled to fit
      ctx.drawImage(sourceImage, 0, 0, size, size);
      
      const buffer = canvas.toBuffer('image/png');
      const outputPath = join(publicDir, `pwa-${size}x${size}.png`);
      writeFileSync(outputPath, buffer);
      console.log(`✓ Generated ${outputPath}`);
    }
    
    console.log('PWA icons generated successfully!');
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND' && error.message.includes('canvas')) {
      console.log('Canvas module not found. Installing...');
      console.log('Please run: npm install --save-dev canvas');
      console.log('Or use the HTML generator: open scripts/generate-icons-simple.html in a browser');
      console.log('\nFor now, copying icon1.png as placeholder...');
      
      // Fallback: copy the source icon as both sizes (not ideal but works)
      const sourceBuffer = readFileSync(sourceIcon);
      writeFileSync(join(publicDir, 'pwa-192x192.png'), sourceBuffer);
      writeFileSync(join(publicDir, 'pwa-512x512.png'), sourceBuffer);
      console.log('✓ Copied icon1.png as placeholder icons');
      console.log('Note: These should be resized to proper dimensions for best results');
    } else {
      console.error('Error:', error.message);
    }
  }
}

generateIcons();

