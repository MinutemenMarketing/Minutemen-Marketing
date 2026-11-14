// K1 detail layer for the code push-in: the right/lower part of k1-v5.png (v5 = K2's musket, 2026-11-13) at high resolution,
// left and top edges feathered into alpha so it blends into the full K1 still underneath.
const sharp = require('sharp');
const SRC = 'C:/Claude Code/minute-men-marketing/assets/keyframes/k1-v5.png';
const OUT = 'C:/Claude Code/minute-men-marketing/public/hero/v1/';
const R = { x0: 0.30, y0: 0.12, x1: 1, y1: 1 }, F = 0.06; // feather, fraction of the region
(async () => {
  const W = 5504, H = 3072;
  const left = Math.round(R.x0 * W), top = Math.round(R.y0 * H);
  const cw = W - left, ch = H - top;
  for (const [name, k] of [['k1dv5-1920', 0.8], ['k1dv5-1280', 0.56], ['k1dv5-m', 0.46]]) {
    const w = Math.round(cw * k), h = Math.round(ch * k);
    const rgb = await sharp(SRC).extract({ left, top, width: cw, height: ch }).resize(w, h).removeAlpha().raw().toBuffer();
    const a = Buffer.alloc(w * h);
    const fx = F * w, fy = F * h;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const sx = Math.min(1, x / fx), sy = Math.min(1, y / fy);
      const s = (t) => t * t * (3 - 2 * t);
      a[y * w + x] = Math.round(255 * s(sx) * s(sy));
    }
    await sharp(rgb, { raw: { width: w, height: h, channels: 3 } }).joinChannel(a, { raw: { width: w, height: h, channels: 1 } }).webp({ quality: 80, alphaQuality: 60 }).toFile(OUT + name + '.webp');
    console.log(name, w, h);
  }
})();
