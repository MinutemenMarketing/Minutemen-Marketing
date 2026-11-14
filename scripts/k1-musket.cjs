// K1 v5 (2026-11-13): K1's featured soldier gets K2's musket. K1 (the opening) showed him with a
// short fowler-style gun, wood to the muzzle; K2 and C2 show a long musket with an exposed steel barrel
// and ramrod whose muzzle ends ~7% further right. The code maps K1 onto K2 exactly, so the swap was in
// the pixels. A crop of k1-v4 around him (x 2700, y 1000, 2400 x 1350) was edited by Nano Banana Pro
// with K2's musket as the reference (Runway task 591aed08-6121-46f1-81a6-34e1580e827a, 20 credits).
// This script: registers the edit (scale 1.0025, offset +4/-4, found by search), shortens the barrel
// so the muzzle lands exactly where K2's does once mapped into K1 (x 1553 in the crop; the edit put
// it at 1695), colour-matches the edit to k1-v4, and pastes back ONLY the changed area (musket,
// hands, his head; feathered), so the rest of the painting is k1-v4 to the pixel.
// node k1-musket.cjs  (run where sharp is installed) -> assets/keyframes/k1-v5.png
const sharp = require('sharp');
const D = process.env.TEMP + '/musket/';
const K = 'C:/Claude Code/minute-men-marketing/assets/keyframes/';
const CROP = { left: 2700, top: 1000, width: 2400, height: 1350 };
const TIP_EDIT = 1695, TIP_K2 = 1553, CUT = TIP_EDIT - TIP_K2;
(async () => {
  const W = CROP.width, H = CROP.height;
  const O = await sharp(D + 'k1-crop.png').removeAlpha().raw().toBuffer();
  const E = await sharp(D + 'edit-aligned.png').removeAlpha().raw().toBuffer();
  const px = (b, x, y, c) => b[(y * W + x) * 3 + c];
  const diff = (x, y) => (Math.abs(px(E, x, y, 0) - px(O, x, y, 0)) + Math.abs(px(E, x, y, 1) - px(O, x, y, 1)) + Math.abs(px(E, x, y, 2) - px(O, x, y, 2))) / 3;
  // 1. colour-match the edit to the original (per channel gain/offset over unchanged pixels)
  const st = [0, 1, 2].map(() => ({ se: 0, so: 0, see: 0, seo: 0, n: 0 }));
  for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) {
    if (diff(x, y) > 12) continue;
    for (let c = 0; c < 3; c++) { const e = px(E, x, y, c), o = px(O, x, y, c); const s = st[c]; s.se += e; s.so += o; s.see += e * e; s.seo += e * o; s.n++; }
  }
  const fit = st.map((s) => { const me = s.se / s.n, mo = s.so / s.n; const g = (s.seo / s.n - me * mo) / (s.see / s.n - me * me); return { g, b: mo - g * me }; });
  console.log('colour fit', fit.map((f) => `${f.g.toFixed(3)}/${f.b.toFixed(1)}`).join(' '));
  const Ec = Buffer.alloc(E.length);
  for (let i = 0; i < E.length; i++) { const f = fit[i % 3]; Ec[i] = Math.max(0, Math.min(255, Math.round(E[i] * f.g + f.b))); }
  // 2. shorten the barrel: in the barrel band, x in [TIP_K2-260, TIP_K2) takes the edit's own pixels
  //    from CUT px further right wherever either spot is gun (differs from the original), so the
  //    steel, the forestock end and the ramrod move together, and
  //    [TIP_K2, TIP_EDIT+12] goes back to the original field where the edit had gun.
  const F = Buffer.from(Ec);
  const Y0 = 300, Y1 = 380; // barrel, ramrod and front sight rows (crop coords)
  const gun = (x, y) => Math.min(1, Math.max(0, (diff(x, y) - 10) / 30));
  for (let y = Y0; y < Y1; y++) {
    for (let x = TIP_K2 - 260; x < TIP_K2; x++) {
      const k = Math.max(gun(x, y), gun(x + CUT, y)); // the whole strip moves: steel, wood, ramrod
      for (let c = 0; c < 3; c++) { const i = (y * W + x) * 3 + c; F[i] = Math.round(F[i] * (1 - k) + Ec[(y * W + x + CUT) * 3 + c] * k); }
    }
    for (let x = TIP_K2; x <= TIP_EDIT + 12; x++) {
      const k = gun(x, y);
      for (let c = 0; c < 3; c++) { const i = (y * W + x) * 3 + c; F[i] = Math.round(F[i] * (1 - k) + O[i] * k); }
    }
  }
  // 3. paste mask: where F differs from the original, grown and feathered, inside the soldier's
  //    upper body + gun box only (nothing else in the painting changes)
  const BOX = { x0: 380, x1: TIP_K2 + 40, y0: 120, y1: 760 };
  const m = new Float32Array(W * H);
  for (let y = BOX.y0; y < BOX.y1; y++) for (let x = BOX.x0; x < BOX.x1; x++) {
    let d = 0; for (let c = 0; c < 3; c++) d += Math.abs(F[(y * W + x) * 3 + c] - O[(y * W + x) * 3 + c]); d /= 3;
    if (d > 14) m[y * W + x] = 1;
  }
  const blur = (a, r) => { // separable box blur, twice
    const t = new Float32Array(W * H), o = new Float32Array(W * H);
    for (let y = 0; y < H; y++) { let s = 0; for (let x = -r; x < W + r; x++) { if (x + r < W && x + r >= 0) s += a[y * W + x + r]; if (x - r - 1 >= 0 && x - r - 1 < W) s -= a[y * W + x - r - 1]; if (x >= 0 && x < W) t[y * W + x] = s / (2 * r + 1); } }
    for (let x = 0; x < W; x++) { let s = 0; for (let y = -r; y < H + r; y++) { if (y + r < H && y + r >= 0) s += t[(y + r) * W + x]; if (y - r - 1 >= 0 && y - r - 1 < H) s -= t[(y - r - 1) * W + x]; if (y >= 0 && y < H) o[y * W + x] = s / (2 * r + 1); } }
    return o;
  };
  let mk = blur(m, 14); for (let i = 0; i < mk.length; i++) mk[i] = Math.min(1, mk[i] * 3); mk = blur(mk, 10);
  const out = Buffer.from(O);
  for (let i = 0; i < W * H; i++) { const k = mk[i]; if (k <= 0) continue; for (let c = 0; c < 3; c++) out[i * 3 + c] = Math.round(O[i * 3 + c] * (1 - k) + F[i * 3 + c] * k); }
  const patch = await sharp(out, { raw: { width: W, height: H, channels: 3 } }).png().toBuffer();
  await sharp(K + 'k1-v4.png').composite([{ input: patch, left: CROP.left, top: CROP.top }]).png().toFile(K + 'k1-v5.png');
  // a mask preview for review
  const mv = Buffer.alloc(W * H); for (let i = 0; i < W * H; i++) mv[i] = Math.round(mk[i] * 255);
  await sharp(mv, { raw: { width: W, height: H, channels: 1 } }).resize(800).png().toFile(D + 'mask.png');
  console.log('wrote k1-v5.png');
})();
