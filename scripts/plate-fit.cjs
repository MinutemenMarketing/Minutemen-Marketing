// Phone plates (2026-11-12): find where the original 16:9 frame sits inside a tall outpainted plate,
// so the frame can be drawn over the plate exactly in register. Searches scale and offset by
// normalised cross-correlation on grayscale, coarse then fine.
// node scripts/plate-fit.cjs <plate> <frame>   (run from a folder with sharp installed)
const sharp = require('sharp');
const [plateFile, frameFile] = process.argv.slice(2);
const gray = async (f, w) => {
  const { data, info } = await sharp(f).resize(w).grayscale().raw().toBuffer({ resolveWithObject: true });
  return { d: data, w: info.width, h: info.height };
};
function ncc(P, F, s, ox, oy, step) {
  // frame pixel (x, y) maps to plate (ox + x*s, oy + y*s)
  let n = 0, sa = 0, sb = 0, saa = 0, sbb = 0, sab = 0;
  for (let y = 0; y < F.h; y += step)
    for (let x = 0; x < F.w; x += step) {
      const px = Math.round(ox + x * s), py = Math.round(oy + y * s);
      if (px < 0 || py < 0 || px >= P.w || py >= P.h) return -1;
      const a = F.d[y * F.w + x], b = P.d[py * P.w + px];
      n++; sa += a; sb += b; saa += a * a; sbb += b * b; sab += a * b;
    }
  const cov = sab - (sa * sb) / n, va = saa - (sa * sa) / n, vb = sbb - (sb * sb) / n;
  return cov / Math.sqrt(va * vb);
}
(async () => {
  const PW = 384;
  const P = await gray(plateFile, PW);
  const F = await gray(frameFile, 192);
  let best = { r: -2 };
  // coarse: the frame spans 0.9-1.1 of the plate width
  for (let k = 0.88; k <= 1.12; k += 0.01) {
    const s = (k * P.w) / F.w;
    const fh = F.h * s;
    for (let ox = -0.06 * P.w; ox <= P.w - F.w * s + 0.06 * P.w; ox += 2)
      for (let oy = 0; oy <= P.h - fh; oy += 2) {
        const r = ncc(P, F, s, ox, oy, 3);
        if (r > best.r) best = { r, s, ox, oy, k };
      }
  }
  // fine
  const c = best;
  for (let s = c.s * 0.99; s <= c.s * 1.01; s += c.s * 0.001)
    for (let ox = c.ox - 3; ox <= c.ox + 3; ox += 0.5)
      for (let oy = c.oy - 3; oy <= c.oy + 3; oy += 0.5) {
        const r = ncc(P, F, s, ox, oy, 1);
        if (r > best.r) best = { r, s, ox, oy };
      }
  // as fractions of the plate: the frame's left/top and its width
  const out = { x0: +(best.ox / P.w).toFixed(4), y0: +(best.oy / P.h).toFixed(4), w: +((F.w * best.s) / P.w).toFixed(4), h: +((F.h * best.s) / P.h).toFixed(4), ncc: +best.r.toFixed(3) };
  console.log(JSON.stringify(out));
})();
