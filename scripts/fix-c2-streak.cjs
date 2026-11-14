// C2 stray streak (2026-11-13, Noah: "a flare from thin air" in the isolated-soldier scene). Before he
// fires, a small warm-white streak flies through the smoke under his barrel (frames 13-22, x 0.42-0.86,
// y 0.33-0.47 of the frame). The 2026-11-08 clean-up (fix-c2-background-flashes.cjs) only covered the
// background line left of him, so it survived. The camera is static and the smoke there drifts
// slowly, so each affected frame takes, inside that band, the time-interpolation of the clean frames
// 12 and 23 wherever it is brighter than that interpolation (the streak), feathered; everything else,
// including his sling and arm, stays the frame's own pixels.
// Writes f_00NN-fix2.webp next to the -fix1 files (new names: /hero/v1 is cached as immutable) and
// prints the frames it changed. node scripts/fix-c2-streak.cjs  (run where sharp is installed)
const sharp = require('sharp');
const path = require('path');
const ROOT = 'C:/Claude Code/minute-men-marketing/public/hero/v1';
const SETS = ['c2', 'm/c2', 'hd/c2'];
const A = 12, Z = 23;
const BAND = { x0: 0.42, x1: 0.86, y0: 0.33, y1: 0.47 };
const name = (i, v = 1) => `f_${String(i).padStart(4, '0')}-fix${v}.webp`;
const lum = (d, i) => 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2];
(async () => {
  const changed = {};
  for (const set of SETS) {
    const dir = path.join(ROOT, set);
    const a = await sharp(path.join(dir, name(A))).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const z = await sharp(path.join(dir, name(Z))).removeAlpha().raw().toBuffer();
    const { width: W, height: H } = a.info;
    const bx0 = Math.round(BAND.x0 * W), bx1 = Math.round(BAND.x1 * W), by0 = Math.round(BAND.y0 * H), by1 = Math.round(BAND.y1 * H);
    for (let n = A + 1; n < Z; n++) {
      const t = (n - A) / (Z - A);
      const f = await sharp(path.join(dir, name(n))).removeAlpha().raw().toBuffer();
      const target = Buffer.from(f);
      const m = Buffer.alloc(W * H);
      let hits = 0, peak = 0;
      for (let y = by0; y < by1; y++)
        for (let x = bx0; x < bx1; x++) {
          const p = y * W + x, i = p * 3;
          for (let c = 0; c < 3; c++) target[i + c] = Math.round(a.data[i + c] * (1 - t) + z[i + c] * t);
          const d = lum(f, i) - lum(target, i);
          peak = Math.max(peak, d);
          if (d > 7) { m[p] = 255; hits++; }
        }
      if (hits < W * H * 0.00005) continue; // nothing there
      // grow and soften the mask: a separable box blur of the hit map, scaled up so it covers the
      // streak's soft glow, not just its core
      const r = Math.max(3, Math.round(W * 0.012));
      const tmp = new Float32Array(W * H), mk = new Float32Array(W * H);
      for (let y = by0; y < by1; y++) { let acc = 0; for (let x = bx0 - r; x < bx1 + r; x++) { if (x + r < W && x + r >= 0) acc += m[y * W + x + r]; if (x - r - 1 >= 0) acc -= m[y * W + x - r - 1]; if (x >= bx0 && x < bx1) tmp[y * W + x] = acc / (2 * r + 1); } }
      for (let x = bx0; x < bx1; x++) { let acc = 0; for (let y = by0 - r; y < by1 + r; y++) { if (y + r < H && y + r >= by0 && y + r < by1) acc += tmp[(y + r) * W + x]; if (y - r - 1 >= by0 && y - r - 1 < by1) acc -= tmp[(y - r - 1) * W + x]; if (y >= by0 && y < by1) mk[y * W + x] = Math.min(1, (acc / (2 * r + 1)) / 255 * 4); } }
      const edge = (x, y) => Math.min(1, (x - bx0) / (W * 0.02), (bx1 - x) / (W * 0.02), (y - by0) / (H * 0.02), (by1 - y) / (H * 0.02));
      const out = Buffer.from(f);
      for (let y = by0; y < by1; y++)
        for (let x = bx0; x < bx1; x++) {
          const p = y * W + x, i = p * 3;
          const k = mk[p] * Math.max(0, edge(x, y));
          if (k <= 0) continue;
          for (let c = 0; c < 3; c++) out[i + c] = Math.round(f[i + c] * (1 - k) + target[i + c] * k);
        }
      await sharp(out, { raw: { width: W, height: H, channels: 3 } }).webp({ quality: 82 }).toFile(path.join(dir, name(n, 2)));
      (changed[set] ||= []).push(`${n} (peak +${peak.toFixed(0)})`);
    }
  }
  for (const [s, l] of Object.entries(changed)) console.log(s, 'fixed:', l.join(', '));
})();
