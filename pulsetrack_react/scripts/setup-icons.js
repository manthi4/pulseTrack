// Simple script to copy icon1.png to PWA icon names
// This creates the required icon files (they'll be resized by the browser if needed)

import { copyFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const publicDir = join(__dirname, '..', 'public');
const sourceIcon = join(publicDir, 'icon1.png');

if (!existsSync(sourceIcon)) {
  console.error('Error: icon1.png not found in public folder');
  console.log('Please copy your icon to pulsetrack_react/public/icon1.png');
  process.exit(1);
}

try {
  // Copy icon1.png to the required PWA icon names
  copyFileSync(sourceIcon, join(publicDir, 'pwa-192x192.png'));
  copyFileSync(sourceIcon, join(publicDir, 'pwa-512x512.png'));
  
  console.log('✓ Created pwa-192x192.png');
  console.log('✓ Created pwa-512x512.png');
  console.log('\nNote: For best results, use resize-icon.html to create properly sized icons.');
  console.log('Open pulsetrack_react/public/resize-icon.html in your browser.');
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}

