const sharp = require('sharp');
const toIco = require('to-ico');
const fs = require('fs');
const path = require('path');

async function generateIcon() {
  const svgPath = path.join(__dirname, 'icon.svg');
  const pngPath = path.join(__dirname, 'icon.png');
  const icoPath = path.join(__dirname, 'icon.ico');

  const sizes = [256, 128, 64, 48, 32, 16];
  const pngBuffers = [];

  for (const size of sizes) {
    const buf = await sharp(svgPath).resize(size, size).png().toBuffer();
    pngBuffers.push(buf);
  }

  // Save 256px as icon.png
  fs.writeFileSync(pngPath, pngBuffers[0]);
  console.log('PNG generated:', pngPath);

  // Convert to ICO
  const icoBuffer = await toIco(pngBuffers);
  fs.writeFileSync(icoPath, icoBuffer);
  console.log('ICO generated:', icoPath);

  console.log('Done!');
}

generateIcon().catch(console.error);
