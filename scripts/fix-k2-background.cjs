// K2 still (the hold before the shot): the same clean background line as the repaired C2 frames, so
// the hold and C2 match (2026-11-08). The C2 plate (assets/drafts/c2-plate.png) lines up with K2 within
// a pixel; the line left of the soldier is taken from it, brightness-matched on the stone wall.
// Writes public/hero/v1/k2v2-1920.webp and -1280.webp.  node scripts/fix-k2-background.cjs (needs sharp)
const sharp = require('sharp');
const path = require('path');
const OUT = path.join(__dirname, '..', 'public', 'hero', 'v1');
const SRC = path.join(__dirname, '..', 'assets', 'keyframes', 'k2.png');
const PLATE = path.join(__dirname, '..', 'assets', 'drafts', 'c2-plate.png');
const LINE = { x0: 0, x1: 0.25, y0: 0.2, y1: 0.74 };
const WALL = { x0: 0.02, x1: 0.25, y0: 0.76, y1: 0.86 };
(async () => {
  for (const W of [1920, 1280]) {
    const H = W === 1920 ? 1072 : 714;
    const src = await sharp(SRC).resize(W, H, { fit: 'fill' }).removeAlpha().raw().toBuffer();
    const plate = await sharp(PLATE).resize(W, H, { fit: 'fill' }).removeAlpha().raw().toBuffer();
    const m = Buffer.alloc(W * H);
    for (let y = Math.round(LINE.y0 * H); y < Math.round(LINE.y1 * H); y++)
      for (let x = Math.round(LINE.x0 * W); x < Math.round(LINE.x1 * W); x++) m[y * W + x] = 255;
    const b = await sharp(m, { raw: { width: W, height: H, channels: 1 } }).blur(W * 0.012).raw().toBuffer({ resolveWithObject: true });
    const mean = (buf) => {
      const s = [0, 0, 0];
      let n = 0;
      for (let y = Math.round(WALL.y0 * H); y < Math.round(WALL.y1 * H); y++)
        for (let x = Math.round(WALL.x0 * W); x < Math.round(WALL.x1 * W); x++) {
          for (let c = 0; c < 3; c++) s[c] += buf[(y * W + x) * 3 + c];
          n++;
        }
      return s.map((v) => v / n);
    };
    const ms = mean(src);
    const mp = mean(plate);
    const out = Buffer.alloc(src.length);
    for (let p = 0; p < W * H; p++) {
      const a = b.data[p * b.info.channels] / 255;
      for (let c = 0; c < 3; c++) {
        const q = p * 3 + c;
        out[q] = src[q] * (1 - a) + Math.min(255, (plate[q] * ms[c]) / mp[c]) * a;
      }
    }
    await sharp(out, { raw: { width: W, height: H, channels: 3 } }).webp({ quality: 82 }).toFile(path.join(OUT, `k2v2-${W}.webp`));
    console.log('k2v2', W, H);
  }
})();
