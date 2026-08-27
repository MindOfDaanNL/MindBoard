const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const OUT = path.join(__dirname, '..', 'public', 'icons');

function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
  }
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function makeIcon(size, color) {
  // RGBA pixel data
  const raw = Buffer.alloc(size * size * 4);
  const radius = size * 0.22;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      // Rounded-square background
      const dx = Math.max(radius - x, 0, x - (size - radius));
      const dy = Math.max(radius - y, 0, y - (size - radius));
      const inside = dx * dx + dy * dy <= radius * radius;
      const bg = [79, 70, 229, 255]; // #4f46e5
      if (inside) {
        raw[i] = bg[0];
        raw[i + 1] = bg[1];
        raw[i + 2] = bg[2];
        raw[i + 3] = bg[3];
      }
    }
  }

  // Draw a simple "brain node" glyph: central circle + 3 outer dots
  const cx = size / 2;
  const cy = size / 2;
  const rMain = size * 0.16;
  const rDot = size * 0.07;
  const dist = size * 0.24;
  const dots = [
    [cx, cy - dist],
    [cx - dist * 0.87, cy + dist * 0.5],
    [cx + dist * 0.87, cy + dist * 0.5]
  ];

  function fillCircle(x, y, r, col) {
    const minX = Math.max(0, Math.floor(x - r));
    const maxX = Math.min(size - 1, Math.ceil(x + r));
    const minY = Math.max(0, Math.floor(y - r));
    const maxY = Math.min(size - 1, Math.ceil(y + r));
    for (let yy = minY; yy <= maxY; yy++) {
      for (let xx = minX; xx <= maxX; xx++) {
        const d = Math.hypot(xx - x, yy - y);
        if (d <= r) {
          const i = (yy * size + xx) * 4;
          const a = Math.min(1, r - d + 0.5);
          raw[i] = Math.round(col[0] * a + raw[i] * (1 - a));
          raw[i + 1] = Math.round(col[1] * a + raw[i + 1] * (1 - a));
          raw[i + 2] = Math.round(col[2] * a + raw[i + 2] * (1 - a));
          raw[i + 3] = 255;
        }
      }
    }
  }

  const white = [255, 255, 255];
  fillCircle(cx, cy, rMain, white);
  for (const [x, y] of dots) fillCircle(x, y, rDot, white);
  // connect lines
  const lines = [[cx, cy, dots[0][0], dots[0][1]], [cx, cy, dots[1][0], dots[1][1]], [cx, cy, dots[2][0], dots[2][1]]];
  for (const [x1, y1, x2, y2] of lines) {
    const steps = Math.ceil(Math.hypot(x2 - x1, y2 - y1));
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      fillCircle(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, size * 0.045, white);
    }
  }

  // PNG encode
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  const stride = size * 4;
  const filtered = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    filtered[y * (stride + 1)] = 0; // filter none
    raw.copy(filtered, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const idat = zlib.deflateSync(filtered, { level: 9 });
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0))
  ]);
  return png;
}

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
for (const size of [192, 512]) {
  const png = makeIcon(size, '#4f46e5');
  fs.writeFileSync(path.join(OUT, `icon-${size}.png`), png);
  console.log(`  icon-${size}.png gegenereerd (${(png.length / 1024).toFixed(1)} KB)`);
}
console.log('\nIcons klaar in public/icons/');