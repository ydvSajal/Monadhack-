// Generates public/icon-192.png and icon-512.png: ink ground, amber "V" glyph.
// ponytail: no design tool, no image dep beyond pngjs. Run: node scripts/gen-icons.js
const fs = require("fs");
const path = require("path");
const { PNG } = require("pngjs");

const BG = [0x1a, 0x17, 0x14];
const VIOLET = [0x1a, 0x17, 0x14];
const WHITE = [0xd9, 0x8a, 0x1f];

function make(size) {
  const png = new PNG({ width: size, height: size });
  const r = size * 0.22; // corner radius
  const cx = size / 2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2;
      // rounded-rect mask
      const inCorner =
        (x < r && y < r && (x - r) ** 2 + (y - r) ** 2 > r * r) ||
        (x > size - r && y < r && (x - (size - r)) ** 2 + (y - r) ** 2 > r * r) ||
        (x < r && y > size - r && (x - r) ** 2 + (y - (size - r)) ** 2 > r * r) ||
        (x > size - r && y > size - r && (x - (size - r)) ** 2 + (y - (size - r)) ** 2 > r * r);

      let c = VIOLET;
      if (inCorner) c = BG;

      // draw a "V": two diagonals meeting at bottom-center
      const t = y / size;
      const halfWidth = size * 0.055;
      const leftX = cx - (0.32 - 0.26 * t) * size;
      const rightX = cx + (0.32 - 0.26 * t) * size;
      if (
        y > size * 0.24 &&
        y < size * 0.8 &&
        (Math.abs(x - leftX) < halfWidth || Math.abs(x - rightX) < halfWidth)
      ) {
        c = WHITE;
      }

      png.data[idx] = c[0];
      png.data[idx + 1] = c[1];
      png.data[idx + 2] = c[2];
      png.data[idx + 3] = inCorner ? 0 : 255;
    }
  }
  return PNG.sync.write(png);
}

const out = path.join(__dirname, "..", "public");
for (const size of [192, 512]) {
  fs.writeFileSync(path.join(out, `icon-${size}.png`), make(size));
  console.log(`wrote public/icon-${size}.png`);
}
