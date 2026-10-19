#!/usr/bin/env node
// Renders the app icon (a 2×2 grid of tiles on a violet gradient) to the PNG
// sizes the manifest and iOS need, plus a matching icons/icon.svg.
// No dependencies: shapes are drawn with signed-distance functions and
// 4×4 supersampling, and PNGs are encoded with node:zlib.

import { writeFile, mkdir } from 'node:fs/promises';
import { deflateSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'icons');

const FROM = [0x6d, 0x5d, 0xf0]; // top-left of gradient
const TO = [0x3f, 0x2f, 0xb8];   // bottom-right
const TILE = [0xff, 0xff, 0xff];
const ACCENT = [0x3a, 0xd6, 0xc6];

// Signed distance to a rounded rectangle centred at (cx, cy).
function roundRect(x, y, cx, cy, hw, hh, r) {
  const qx = Math.abs(x - cx) - hw + r;
  const qy = Math.abs(y - cy) - hh + r;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
}

// Layout in unit space [0,1]. `inset` shrinks the artwork for maskable icons.
function tiles(inset) {
  const s = 1 - 2 * inset;
  const size = 0.2 * s, gap = 0.07 * s, r = 0.05 * s;
  const start = 0.5 - size - gap / 2;
  return [0, 1, 2, 3].map((i) => ({
    cx: start + size / 2 + (i % 2) * (size + gap),
    cy: start + size / 2 + Math.floor(i / 2) * (size + gap),
    h: size / 2,
    r,
    color: i === 3 ? ACCENT : TILE,
  }));
}

function sample(x, y, { fullBleed, inset }) {
  if (!fullBleed && roundRect(x, y, 0.5, 0.5, 0.5, 0.5, 0.22) > 0) return null;
  for (const t of tiles(inset)) {
    if (roundRect(x, y, t.cx, t.cy, t.h, t.h, t.r) <= 0) return t.color;
  }
  const k = (x + y) / 2;
  return FROM.map((c, i) => c + (TO[i] - c) * k);
}

function render(size, opts) {
  const SS = 4;
  const px = Buffer.alloc(size * size * 4);
  for (let py = 0; py < size; py++) {
    for (let pxi = 0; pxi < size; pxi++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const c = sample((pxi + (sx + 0.5) / SS) / size, (py + (sy + 0.5) / SS) / size, opts);
          if (c) { r += c[0]; g += c[1]; b += c[2]; a++; }
        }
      }
      const o = (py * size + pxi) * 4;
      if (a) { px[o] = r / a; px[o + 1] = g / a; px[o + 2] = b / a; }
      px[o + 3] = Math.round((a / (SS * SS)) * 255);
    }
  }
  return px;
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function encodePng(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function svg() {
  const hex = (c) => '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
  const rects = tiles(0).map((t) => {
    const s = (t.h * 2 * 100).toFixed(1);
    return `<rect x="${((t.cx - t.h) * 100).toFixed(1)}" y="${((t.cy - t.h) * 100).toFixed(1)}" width="${s}" height="${s}" rx="${(t.r * 100).toFixed(1)}" fill="${hex(t.color)}"/>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${hex(FROM)}"/><stop offset="1" stop-color="${hex(TO)}"/></linearGradient></defs>
  <rect width="100" height="100" rx="22" fill="url(#g)"/>
  ${rects.join('\n  ')}
</svg>
`;
}

const targets = [
  { file: 'icon-192.png', size: 192, fullBleed: false, inset: 0 },
  { file: 'icon-512.png', size: 512, fullBleed: false, inset: 0 },
  { file: 'icon-maskable-512.png', size: 512, fullBleed: true, inset: 0.1 },
  { file: 'apple-touch-icon.png', size: 180, fullBleed: true, inset: 0.04 },
];

await mkdir(outDir, { recursive: true });
for (const t of targets) {
  await writeFile(join(outDir, t.file), encodePng(t.size, render(t.size, t)));
  console.log(`icons/${t.file}`);
}
await writeFile(join(outDir, 'icon.svg'), svg());
console.log('icons/icon.svg');
