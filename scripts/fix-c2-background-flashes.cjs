// C2 frames 1–17: the footage has muzzle flashes on the background soldiers (and a glow in the smoke
// behind the featured man's arm) before he fires. The camera and the man are static over these frames,
// so the two background regions are taken from frame 19 (clean), with feathered masks, at full
// strength through frame 14 and easing back to the real footage by frame 17 (2026-11-08, 0 credits).
// Writes f_00NN-fix1.webp next to the originals in every tier (/hero/v1 is cached as immutable, so
// repaired frames get new names; ASSETS.c2.fix points at them).
// node scripts/fix-c2-background-flashes.cjs
const sharp = require('sharp');
const path = require('path');
const ROOT = path.join(__dirname, '..', 'public', 'hero', 'v1');
const SETS = ['c2', 'm/c2', 'hd/c2'];
const REF = 19;
const LAST = 17;
// Regions as fractions of the frame: the line left of him, and the smoke under his raised arm.
const REGIONS = [
  { x0: 0, x1: 0.275, y0: 0.2, y1: 0.74 },
  { x0: 0.37, x1: 0.53, y0: 0.38, y1: 0.54 },
];
const weight = (i) => (i <= 14 ? 1 : Math.max(0, (LAST + 1 - i) / (LAST + 1 - 14)));
const name = (i, fix) => `f_${String(i).padStart(4, '0')}${fix ? '-fix1' : ''}.webp`;

(async () => {
  for (const set of SETS) {
    const dir = path.join(ROOT, set);
    const ref = await sharp(path.join(dir, name(REF))).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const { width: W, height: H } = ref.info;
    // feathered mask
    const m = Buffer.alloc(W * H);
    for (const r of REGIONS)
      for (let y = Math.round(r.y0 * H); y < Math.round(r.y1 * H); y++)
        for (let x = Math.round(r.x0 * W); x < Math.round(r.x1 * W); x++) m[y * W + x] = 255;
    // (sharp can hand back a blurred 1-channel image as 3 channels: read every `ch`-th byte)
    const blurred = await sharp(m, { raw: { width: W, height: H, channels: 1 } }).blur(Math.max(1, W * 0.012)).raw().toBuffer({ resolveWithObject: true });
    const ch = blurred.info.channels;
    const mask = { at: (p) => blurred.data[p * ch] };
    for (let i = 1; i <= LAST; i++) {
      const src = await sharp(path.join(dir, name(i))).removeAlpha().raw().toBuffer();
      const k = weight(i);
      const out = Buffer.alloc(src.length);
      for (let p = 0, q = 0; p < W * H; p++, q += 3) {
        const a = (mask.at(p) / 255) * k;
        out[q] = src[q] * (1 - a) + ref.data[q] * a;
        out[q + 1] = src[q + 1] * (1 - a) + ref.data[q + 1] * a;
        out[q + 2] = src[q + 2] * (1 - a) + ref.data[q + 2] * a;
      }
      await sharp(out, { raw: { width: W, height: H, channels: 3 } }).webp({ quality: 82 }).toFile(path.join(dir, name(i, true)));
    }
    console.log(set, W, H, 'frames 1-' + LAST);
  }
})();
