// Simple script to generate PWA icons
// This script tries multiple methods to generate icons
// Run: node scripts/generate-icons.js

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const publicDir = join(__dirname, '..', 'public');

// Simple base64-encoded 192x192 PNG (blue square with "PT")
const icon192Base64 = 'iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAYAAABS3GwHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAF8WlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNy4xLWMwMDAgNzkuZWRhMmIzZmFjLCAyMDIxLzExLzE3LTE3OjIzOjE5ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIFBob3Rvc2hvcCAyMS4xIChXaW5kb3dzKSIgeG1wOkNyZWF0ZURhdGU9IjIwMjQtMTEtMjRUMTY6MzA6MDBaIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyNC0xMS0yNFQxNjozMDowMFoiIHhtcDpNZXRhZGF0YURhdGU9IjIwMjQtMTEtMjRUMTY6MzA6MDBaIiBkYzpmb3JtYXQ9ImltYWdlL3BuZyIgcGhvdG9zaG9wOkNvbG9yTW9kZT0iMyI+IDx4bXBNTTpIaXN0b3J5PiA8cmRmOlNlcT4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImNyZWF0ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6ZjBkZjBkZjAtZjBkZi0wMDAwLWFkZGEtZjBkZjBkZjBkZjBkZiIgc3RFdnQ6d2hlbj0iMjAyNC0xMS0yNFQxNjozMDowMFoiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMS4xIChXaW5kb3dzKSIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz4=';
const icon512Base64 = 'iVBORw0KGgoAAAANSUhEUgAAAgAAAAIACAYAAAD0eNT6AAAACXBIWXMAAAsTAAALEwEAmpwYAAAF8WlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNy4xLWMwMDAgNzkuZWRhMmIzZmFjLCAyMDIxLzExLzE3LTE3OjIzOjE5ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIFBob3Rvc2hvcCAyMS4xIChXaW5kb3dzKSIgeG1wOkNyZWF0ZURhdGU9IjIwMjQtMTEtMjRUMTY6MzA6MDBaIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyNC0xMS0yNFQxNjozMDowMFoiIHhtcDpNZXRhZGF0YURhdGU9IjIwMjQtMTEtMjRUMTY6MzA6MDBaIiBkYzpmb3JtYXQ9ImltYWdlL3BuZyIgcGhvdG9zaG9wOkNvbG9yTW9kZT0iMyI+IDx4bXBNTTpIaXN0b3J5PiA8cmRmOlNlcT4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImNyZWF0ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6ZjBkZjBkZjAtZjBkZi0wMDAwLWFkZGEtZjBkZjBkZjBkZjBkZiIgc3RFdnQ6d2hlbj0iMjAyNC0xMS0yNFQxNjozMDowMFoiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMS4xIChXaW5kb3dzKSIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz4=';

function generateIcons() {
  try {
    // Try using canvas if available
    const { createCanvas } = await import('canvas');
    
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
    
    const sizes = [192, 512];
    for (const size of sizes) {
      const canvas = drawIcon(size);
      const buffer = canvas.toBuffer('image/png');
      const outputPath = join(publicDir, `pwa-${size}x${size}.png`);
      writeFileSync(outputPath, buffer);
      console.log(`✓ Generated ${outputPath} using canvas`);
    }
  } catch (error) {
    // Fallback: Create simple placeholder icons
    console.log('Canvas not available, creating simple placeholder icons...');
    console.log('For better icons, use: open scripts/generate-icons-simple.html in a browser');
    
    // Create minimal valid PNG files (1x1 blue pixel, then we'll need to resize)
    // Actually, let's just create a note file
    const notePath = join(publicDir, 'ICONS_README.txt');
    writeFileSync(notePath, `PWA Icons Required

Please create the following icon files in this directory:
- pwa-192x192.png (192x192 pixels)
- pwa-512x512.png (512x512 pixels)

You can:
1. Open scripts/generate-icons-simple.html in a browser to generate them
2. Or create them manually using any image editor
3. Or install canvas: npm install --save-dev canvas

The icons should be blue (#3b82f6) with white "PT" text.
`);
    console.log(`✓ Created ${notePath}`);
    console.log('Please generate icons using one of the methods above.');
  }
}

generateIcons().catch(console.error);

