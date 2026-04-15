/**
 * Genera los íconos PNG de la app para PWA y favicons.
 * Lee public/icon.svg y produce PNGs en public/icons/.
 *
 * Uso: node scripts/generate-icons.js
 */

const sharp = require('sharp');
const path  = require('path');
const fs    = require('fs');

const SVG_SRC  = path.join(__dirname, '..', 'public', 'icon.svg');
const OUT_DIR  = path.join(__dirname, '..', 'public', 'icons');

const SIZES = [
    { name: 'icon-192.png',  size: 192 },
    { name: 'icon-512.png',  size: 512 },
    { name: 'apple-touch-icon.png', size: 180 },
];

async function run() {
    fs.mkdirSync(OUT_DIR, { recursive: true });

    const src = fs.readFileSync(SVG_SRC);

    for (const { name, size } of SIZES) {
        const out = path.join(OUT_DIR, name);
        await sharp(src).resize(size, size).png().toFile(out);
        console.log(`✓ ${name} (${size}×${size})`);
    }

    console.log('\nÍconos generados en public/icons/');
}

run().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
