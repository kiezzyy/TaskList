const fs = require('fs');
const path = require('path');
const { app, BrowserWindow } = require('electron');

app.whenReady().then(async () => {
  try {
    const svgPath = path.join(__dirname, 'build/icon.svg');
    console.log('Loading SVG from:', svgPath);
    
    if (!fs.existsSync(svgPath)) {
      console.error('SVG file does not exist at:', svgPath);
      app.quit();
      return;
    }

    const svgContent = fs.readFileSync(svgPath, 'utf8');

    // Create a hidden window with transparent background
    const win = new BrowserWindow({
      show: false,
      width: 512,
      height: 512,
      transparent: true,
      frame: false,
      webPreferences: {
        offscreen: true
      }
    });

    const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`;
    
    const sizes = [16, 32, 48, 64, 128, 256];
    const pngBuffers = [];

    for (const size of sizes) {
      console.log(`Rendering size: ${size}x${size}`);
      win.setSize(size, size);
      
      const html = `
        <html>
        <head>
          <style>
            body {
              margin: 0;
              padding: 0;
              overflow: hidden;
              background: transparent;
            }
            img {
              width: ${size}px;
              height: ${size}px;
              display: block;
            }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" />
        </body>
        </html>
      `;
      
      await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
      
      // Wait a bit to ensure rendering is complete
      await new Promise(resolve => setTimeout(resolve, 200));

      const image = await win.webContents.capturePage();
      const pngBuf = image.toPNG();
      pngBuffers.push({
        width: size,
        height: size,
        buffer: pngBuf
      });
    }

    // Construct the ICO buffer
    const header = Buffer.alloc(6);
    header.writeUInt16LE(0, 0); // Reserved
    header.writeUInt16LE(1, 2); // Type: 1 = ICO
    header.writeUInt16LE(pngBuffers.length, 4); // Count
    
    const entries = [];
    let currentOffset = 6 + pngBuffers.length * 16;
    
    for (const img of pngBuffers) {
      const entry = Buffer.alloc(16);
      const w = img.width === 256 ? 0 : img.width;
      const h = img.height === 256 ? 0 : img.height;
      entry.writeUInt8(w, 0); // Width
      entry.writeUInt8(h, 1); // Height
      entry.writeUInt8(0, 2); // Color count (0 for >= 256 colors)
      entry.writeUInt8(0, 3); // Reserved
      entry.writeUInt16LE(1, 4); // Color planes
      entry.writeUInt16LE(32, 6); // Bits per pixel
      entry.writeUInt32LE(img.buffer.length, 8); // Image data size
      entry.writeUInt32LE(currentOffset, 12); // Image data offset
      
      entries.push(entry);
      currentOffset += img.buffer.length;
    }
    
    const buffers = [header, ...entries, ...pngBuffers.map(img => img.buffer)];
    const icoBuffer = Buffer.concat(buffers);
    
    fs.writeFileSync(path.join(__dirname, 'build/icon.ico'), icoBuffer);
    console.log('Successfully generated build/icon.ico! Size:', icoBuffer.length);

    fs.writeFileSync(path.join(__dirname, 'frontend/public/favicon.ico'), icoBuffer);
    console.log('Successfully generated frontend/public/favicon.ico! Size:', icoBuffer.length);
    
    const largestPng = pngBuffers[pngBuffers.length - 1].buffer;
    fs.writeFileSync(path.join(__dirname, 'build/icon.png'), largestPng);
    console.log('Successfully generated build/icon.png! Size:', largestPng.length);
    
  } catch (err) {
    console.error('Error generating icons:', err);
  } finally {
    app.quit();
  }
});
