// C2b ball, step 2 (2026-11-13): the crisp painted ball the stage draws over C2b. Source: Nano Banana
// Pro, 2K, the footage ball as reference (Runway task 748cfbeb-a091-4460-a085-2b53f23ad887, 20 credits,
// assets/drafts/ball-gen.png): a painted lead sphere, lit from the upper left, on flat grey.
// This finds the sphere (bounding box of everything darker than the ground), cuts it out on a circle
// with a 1.5px anti-aliased edge, matches its mean colour per channel to the footage ball's (so the
// hand-offs to C2's and C3's own painted ball don't change tone), and writes public/hero/v1/ball-v1.webp
// (1024px, alpha) and ball-v1-512.webp for phones.
// node ball-sprite.cjs   (run where sharp is installed)
const sharp = require('sharp');
const ROOT = 'C:/Claude Code/minute-men-marketing/';
const SRC = ROOT + 'assets/drafts/ball-gen.png';
(async () => {
  const { data, info } = await sharp(SRC).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  // ground = mean of the corners
  const g = [0, 0, 0]; let n = 0;
  for (const [x0, y0] of [[0, 0], [W - 40, 0], [0, H - 40], [W - 40, H - 40]]) for (let y = y0; y < y0 + 40; y++) for (let x = x0; x < x0 + 40; x++) { for (let c = 0; c < 3; c++) g[c] += data[(y * W + x) * 3 + c]; n++; }
  const gL = (g[0] + g[1] + g[2]) / 3 / n;
  // the sphere's edge along 180 rays, walking in from the ground to the first dark pixel (the ground
  // is uneven, so a bounding box caught the whole square; walking out stopped on the highlight)
  const L = (x, y) => { const i = (Math.round(y) * W + Math.round(x)) * 3; return (data[i] + data[i + 1] + data[i + 2]) / 3; };
  const pts = [];
  for (let k = 0; k < 180; k++) {
    const th = (k / 180) * Math.PI * 2;
    for (let d = W * 0.49; d > W * 0.2; d -= 0.5) { const x = W / 2 + Math.cos(th) * d, y = H / 2 + Math.sin(th) * d; if (L(x, y) < gL - 40) { pts.push([x, y]); break; } }
  }
  const cx = pts.reduce((s2, p) => s2 + p[0], 0) / pts.length, cy = pts.reduce((s2, p) => s2 + p[1], 0) / pts.length;
  const rs = pts.map((p) => Math.hypot(p[0] - cx, p[1] - cy)).sort((p, q) => p - q);
  const r = rs[rs.length >> 1] - 3; // 3px in: drop the ground's halo
  console.log('sphere', { cx, cy, r, ground: gL.toFixed(0) });
  // footage ball mean colour (hd C2b frame 50, inner 80% of the disc)
  const F = await sharp(ROOT + 'public/hero/v1/hd/c2b/f_0050.webp').removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const fcx = 0.4969 * F.info.width, fcy = 0.4552 * F.info.height, fr = 0.2948 * F.info.height * 0.8;
  const fm = [0, 0, 0]; let fn = 0;
  for (let y = Math.floor(fcy - fr); y < fcy + fr; y++) for (let x = Math.floor(fcx - fr); x < fcx + fr; x++) if (Math.hypot(x - fcx, y - fcy) < fr) { for (let c = 0; c < 3; c++) fm[c] += F.data[(y * F.info.width + x) * 3 + c]; fn++; }
  const sm = [0, 0, 0]; let sn = 0;
  for (let y = Math.floor(cy - r * 0.8); y < cy + r * 0.8; y++) for (let x = Math.floor(cx - r * 0.8); x < cx + r * 0.8; x++) if (Math.hypot(x - cx, y - cy) < r * 0.8) { for (let c = 0; c < 3; c++) sm[c] += data[(y * W + x) * 3 + c]; sn++; }
  const gain = [0, 1, 2].map((c) => fm[c] / fn / (sm[c] / sn));
  console.log('footage mean', fm.map((v) => (v / fn).toFixed(0)).join(','), 'sprite mean', sm.map((v) => (v / sn).toFixed(0)).join(','), 'gain', gain.map((v) => v.toFixed(3)).join(','));
  const S = Math.ceil(r * 2) + 4, out = Buffer.alloc(S * S * 4);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const sx = cx - S / 2 + x + 0.5, sy = cy - S / 2 + y + 0.5;
    const d = Math.hypot(sx - cx, sy - cy);
    const a = Math.max(0, Math.min(1, (r - d) / 1.5 + 0.5));
    const xi = Math.min(W - 1, Math.max(0, Math.round(sx - 0.5))), yi = Math.min(H - 1, Math.max(0, Math.round(sy - 0.5)));
    const o = (y * S + x) * 4;
    for (let c = 0; c < 3; c++) out[o + c] = Math.max(0, Math.min(255, Math.round(data[(yi * W + xi) * 3 + c] * gain[c])));
    out[o + 3] = Math.round(a * 255);
  }
  const img = sharp(out, { raw: { width: S, height: S, channels: 4 } });
  await img.clone().resize(1024, 1024).webp({ quality: 88, alphaQuality: 100 }).toFile(ROOT + 'public/hero/v1/ball-v1.webp');
  await img.clone().resize(512, 512).webp({ quality: 88, alphaQuality: 100 }).toFile(ROOT + 'public/hero/v1/ball-v1-512.webp');
  console.log('wrote ball-v1.webp, ball-v1-512.webp');
})();
