/**
 * Genera los iconos de la PWA sin dependencias (PNG a mano con zlib).
 * Correr con: npm run icons
 *
 * La marca es un triángulo de play: arrancar, empezar, salir.
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

const BG_TOP = [0x2e, 0x21, 0x17];
const BG_BOTTOM = [0x14, 0x10, 0x0d];
const MARK = [0xd9, 0xa2, 0x73];

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function encodePng(size, pixels) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * 4 + 1);
    raw[rowStart] = 0; // filtro none
    pixels.copy(raw, rowStart + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function mix(a, b, t) {
  return a + (b - a) * t;
}

/** Triángulo equilátero apuntando a la derecha, centrado ópticamente. */
function triangle(size, scale) {
  const r = size * 0.3 * scale;
  const cx = size * 0.53;
  const cy = size * 0.5;
  return [
    [cx + r, cy],
    [cx - r * 0.72, cy - r * 0.9],
    [cx - r * 0.72, cy + r * 0.9],
  ];
}

function inside(pts, x, y) {
  let sign = 0;
  for (let i = 0; i < 3; i++) {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[(i + 1) % 3];
    const cross = (bx - ax) * (y - ay) - (by - ay) * (x - ax);
    if (cross !== 0) {
      const s = Math.sign(cross);
      if (sign === 0) sign = s;
      else if (s !== sign) return false;
    }
  }
  return true;
}

/** Supersampling 4x4: bordes limpios sin matemática de antialiasing. */
function coverage(pts, x, y) {
  let hits = 0;
  for (let sy = 0; sy < 4; sy++) {
    for (let sx = 0; sx < 4; sx++) {
      if (inside(pts, x + (sx + 0.5) / 4, y + (sy + 0.5) / 4)) hits++;
    }
  }
  return hits / 16;
}

function render(size, markScale) {
  const px = Buffer.alloc(size * size * 4);
  const pts = triangle(size, markScale);

  for (let y = 0; y < size; y++) {
    // Fondo: degradé vertical más un halo cálido arriba.
    const t = y / (size - 1);
    const halo = Math.max(0, 1 - Math.abs(t - 0.1) * 1.7);
    for (let x = 0; x < size; x++) {
      let rr = mix(BG_TOP[0], BG_BOTTOM[0], t) + halo * 14;
      let gg = mix(BG_TOP[1], BG_BOTTOM[1], t) + halo * 8;
      let bb = mix(BG_TOP[2], BG_BOTTOM[2], t) + halo * 3;

      const inMark = coverage(pts, x, y);
      if (inMark > 0) {
        rr = mix(rr, MARK[0], inMark);
        gg = mix(gg, MARK[1], inMark);
        bb = mix(bb, MARK[2], inMark);
      }

      const i = (y * size + x) * 4;
      px[i] = Math.round(Math.min(rr, 255));
      px[i + 1] = Math.round(Math.min(gg, 255));
      px[i + 2] = Math.round(Math.min(bb, 255));
      px[i + 3] = 255;
    }
  }
  return px;
}

const targets = [
  ['icon-192.png', 192, 1],
  ['icon-512.png', 512, 1],
  ['icon-maskable-512.png', 512, 0.72],
  ['apple-touch-icon.png', 180, 1],
];

for (const [name, size, scale] of targets) {
  writeFileSync(join(OUT_DIR, name), encodePng(size, render(size, scale)));
  console.log(`${name} (${size}x${size})`);
}
