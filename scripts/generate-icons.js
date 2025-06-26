const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

// Create directory if it doesn't exist
const iconsDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Icon sizes needed for PWA
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function generateIcons() {
  try {
    // Load the base SVG icon
    const baseIcon = path.join(__dirname, '../public/icons/icon-base.svg');
    const img = await loadImage(baseIcon);

    // Generate each size
    for (const size of sizes) {
      const canvas = createCanvas(size, size);
      const ctx = canvas.getContext('2d');
      
      // Draw the image on the canvas
      ctx.drawImage(img, 0, 0, size, size);
      
      // Save as PNG
      const buffer = canvas.toBuffer('image/png');
      const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);
      fs.writeFileSync(outputPath, buffer);
      
      console.log(`Generated: ${outputPath}`);
    }

    console.log('All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

// If canvas is not available, create simple placeholder files
function createPlaceholderIcons() {
  console.log('Creating placeholder icons...');
  
  // Copy the SVG to each size
  for (const size of sizes) {
    const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);
    fs.copyFileSync(path.join(__dirname, '../public/icons/icon-base.svg'), outputPath);
    console.log(`Created placeholder: ${outputPath}`);
  }
}

// Try to generate proper icons, fall back to placeholders
generateIcons().catch(() => {
  console.log('Falling back to placeholder icons');
  createPlaceholderIcons();
});
