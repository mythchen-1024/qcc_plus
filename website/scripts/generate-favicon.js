const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '../public/qcc_plus_icon_dark.png');
const outputPath = path.join(__dirname, '../public/favicon.ico');

async function generateFavicon() {
    try {
        // Resize to 32x32 and save as PNG (browsers handle PNG in .ico extension usually, 
        // but to be safe we just save as PNG and rename, or use a library. 
        // Since we don't have a dedicated ico library, we'll rely on modern browser behavior 
        // or just save as a small PNG which is standard for favicon.ico in many modern setups 
        // if we can't do real ICO. 
        // Actually, let's just output a 32x32 PNG.
        await sharp(inputPath)
            .resize(32, 32)
            .toFormat('png')
            .toFile(outputPath);

        console.log('Favicon generated at:', outputPath);
    } catch (error) {
        console.error('Error generating favicon:', error);
        process.exit(1);
    }
}

generateFavicon();
