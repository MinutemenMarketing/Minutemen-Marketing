// Rebuild C2b f_0017 from f_0016 + f_0018: 50/50 blend (reads as the whip-pan's motion blur), each
// ghost ball replaced by the other frame's pixels, then one ball (from f_0018) pasted at the midpoint
// position and size. node fix17.cjs dir out.webp
const sharp = require('sharp'); const [dir, out] = process.argv.slice(2);
const load = async (f) => { const { data, info } = await sharp(f).removeAlpha().raw().toBuffer({ resolveWithObject: true }); return { d: data, W: info.width, H: info.height }; };
function findBall(img, s, [bx, by]) { // dark blob within ±45px (1280 coords) of the eyeballed centre
  const { d, W } = img; const x0 = Math.round((bx - 45) * s), x1 = Math.round((bx + 45) * s), y0 = Math.round((by - 45) * s), y1 = Math.round((by + 45) * s);
  let n = 0, sx = 0, sy = 0, minx = 1e9, maxx = -1, miny = 1e9, maxy = -1;
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const k = (y * W + x) * 3; const l = 0.2126 * d[k] + 0.7152 * d[k + 1] + 0.0722 * d[k + 2];
    if (l < 70) { n++; sx += x; sy += y; minx = Math.min(minx, x); maxx = Math.max(maxx, x); miny = Math.min(miny, y); maxy = Math.max(maxy, y); } }
  return { x: sx / n, y: sy / n, r: Math.max(Math.sqrt(n / Math.PI), Math.max(maxx - minx, maxy - miny) / 2) + 0.5, n, box: [minx, maxx, miny, maxy] };
}
(async () => {
  const a = await load(`${dir}/f_0016.webp`), b = await load(`${dir}/f_0018.webp`);
  const { W, H } = a; const s = W / 1280;
  // Measured on the 1280 set (bounding boxes of the dark ball), scaled to this set: same footage.
  // The 1920 set was extracted from the upscaled clip with its own ball track: measured there directly.
  const hd = W === 1920;
  const A = hd ? { x: 1692, y: 328, r: 30 } : { x: 1167 * s, y: 216.5 * s, r: 16 * s };
  const B = hd ? { x: 1512, y: 348, r: 41 } : { x: 1010 * s, y: 234.5 * s, r: 25 * s };
  const M = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2, r: (A.r + B.r) / 2 };
  const o = Buffer.alloc(W * H * 3);
  const sm = (e0, e1, v) => { const t = Math.min(1, Math.max(0, (v - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const k = (y * W + x) * 3;
    // weight of frame b: 0.5 normally; 1 inside A's ghost (use b there), 0 inside B's ghost.
    const gA = 1 - sm(A.r * 1.35, A.r * 1.9, Math.hypot(x - A.x, y - A.y));
    const gB = 1 - sm(B.r * 1.35, B.r * 1.9, Math.hypot(x - B.x, y - B.y));
    const wb = 0.5 + 0.5 * gA - 0.5 * gB;
    for (let c = 0; c < 3; c++) o[k + c] = Math.round(a.d[k + c] * (1 - wb) + b.d[k + c] * wb);
  }
  // Paste B's ball, scaled to M.r, at M with a soft 1.5px edge.
  const k = M.r / B.r;
  for (let y = Math.floor(M.y - M.r - 3); y <= M.y + M.r + 3; y++) for (let x = Math.floor(M.x - M.r - 3); x <= M.x + M.r + 3; x++) {
    if (x < 0 || y < 0 || x >= W || y >= H) continue;
    const dist = Math.hypot(x - M.x, y - M.y); const al = 1 - sm(M.r - 1.5 * s, M.r + 0.5 * s, dist); if (al <= 0) continue;
    const sx = Math.round(B.x + (x - M.x) / k), sy = Math.round(B.y + (y - M.y) / k);
    const kk = (y * W + x) * 3, ks = (sy * W + sx) * 3;
    for (let c = 0; c < 3; c++) o[kk + c] = Math.round(o[kk + c] * (1 - al) + b.d[ks + c] * al);
  }
  await sharp(o, { raw: { width: W, height: H, channels: 3 } }).webp({ quality: 82 }).toFile(out);
  console.log(dir, 'ball 16', A, 'ball 18', B, 'new 17', M);
})();
