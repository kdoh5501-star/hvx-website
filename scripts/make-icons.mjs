// Generates the favicon set and web manifest in public/ from the logos in assets/.
// Run: npm run icons
import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'node:fs';

mkdirSync('public', { recursive: true });
const SRC = 'assets/hvx-logo-256.png';
const BIG = 'assets/hvx-logo-original.png';
const clear = { r: 0, g: 0, b: 0, alpha: 0 };

const square = (src, size, { pad = 0, background = clear } = {}) =>
  sharp(src)
    .resize(size - pad * 2, size - pad * 2, { fit: 'contain', background: clear })
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background })
    .flatten(background.alpha === 0 ? false : { background })
    .png({ compressionLevel: 9 })
    .toBuffer();

/** ICO container holding PNG images (supported by all current browsers). */
function ico(pngs) {
  const header = Buffer.alloc(6 + 16 * pngs.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  let offset = header.length;
  pngs.forEach(({ size, buf }, i) => {
    const e = 6 + 16 * i;
    header.writeUInt8(size >= 256 ? 0 : size, e);
    header.writeUInt8(size >= 256 ? 0 : size, e + 1);
    header.writeUInt16LE(1, e + 4);
    header.writeUInt16LE(32, e + 6);
    header.writeUInt32LE(buf.length, e + 8);
    header.writeUInt32LE(offset, e + 12);
    offset += buf.length;
  });
  return Buffer.concat([header, ...pngs.map((p) => p.buf)]);
}

const sizes = [16, 32, 48];
const icoPngs = await Promise.all(sizes.map(async (size) => ({ size, buf: await square(SRC, size) })));
writeFileSync('public/favicon.ico', ico(icoPngs));
writeFileSync('public/favicon-32.png', icoPngs[1].buf);
// iOS ignores transparency, so the touch icon gets the site background and some padding.
writeFileSync('public/apple-touch-icon.png', await square(SRC, 180, { pad: 18, background: { r: 246, g: 246, b: 244, alpha: 1 } }));
writeFileSync('public/icon-192.png', await square(BIG, 192, { pad: 8 }));
writeFileSync('public/icon-512.png', await square(BIG, 512, { pad: 20 }));

writeFileSync('public/site.webmanifest', JSON.stringify({
  name: 'HIVE-X',
  short_name: 'HIVE-X',
  description: 'HIVE-X (HVX) cross-border payments on BNB Smart Chain',
  start_url: '/',
  display: 'standalone',
  background_color: '#f6f6f4',
  theme_color: '#0e1116',
  icons: [
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
  ],
}, null, 2) + '\n');

console.log('icons written to public/');
