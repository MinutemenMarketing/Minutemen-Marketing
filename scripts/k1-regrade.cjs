// K1 colour fix (2026-11-12). Each Nano Banana Pro edit of K1 drifted it toward magenta: Lab a*
// (green-magenta) averaged 7.6 in the approved k1-cool, 11.0 in k1-v2 and 14.1 in k1-v3, while K2 and
// C2 sit at 5-7, so the opening read pink next to the rest of the story. For each brightness band
// this measures k1-v3's mean a* against K2 (the still K1 dissolves into: the same field, smoke and sky)
// and its mean b* (blue-yellow) against the approved k1-cool (same geometry), and shifts k1-v3's pixels
// in that band by the differences (interpolated between bands), leaving brightness untouched.
// Writes k1-v4.png and the served files under new names (/hero/v1 is cached as immutable).
// Run from a folder with sharp installed: node scripts/k1-regrade.cjs
const sharp = require('sharp');
const ROOT = 'C:/Claude Code/minute-men-marketing/';
const SRC = ROOT + 'assets/keyframes/k1-v3.png';
const REF_A = ROOT + 'assets/keyframes/k2.png';
const REF_B = ROOT + 'assets/keyframes/k1-cool.png';

const lin = (c) => { c /= 255; return c > 0.04045 ? ((c + 0.055) / 1.055) ** 2.4 : c / 12.92; };
const gam = (c) => { c = c > 0.0031308 ? 1.055 * c ** (1 / 2.4) - 0.055 : 12.92 * c; return Math.max(0, Math.min(255, Math.round(c * 255))); };
const LUT = new Float64Array(256).map((_, i) => lin(i));
const fw = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
const bw = (t) => (t ** 3 > 0.008856 ? t ** 3 : (t - 16 / 116) / 7.787);
function toLab(r, g, b) {
  const [R, G, B] = [LUT[r], LUT[g], LUT[b]];
  const X = fw((R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047);
  const Y = fw(R * 0.2126 + G * 0.7152 + B * 0.0722);
  const Z = fw((R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883);
  return [116 * Y - 16, 500 * (X - Y), 200 * (Y - Z)];
}
function toRgb(L, a, b) {
  const fy = (L + 16) / 116;
  const X = bw(fy + a / 500) * 0.95047, Y = bw(fy), Z = bw(fy - b / 200) * 1.08883;
  return [gam(X * 3.2406 - Y * 1.5372 - Z * 0.4986), gam(-X * 0.9689 + Y * 1.8758 + Z * 0.0415), gam(X * 0.0557 - Y * 0.204 + Z * 1.057)];
}
const BANDS = 10; // L 0-100 in 10-point bands
async function bandMeans(file) {
  const { data } = await sharp(file).resize(688, 384).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const s = Array.from({ length: BANDS }, () => [0, 0, 0]);
  for (let i = 0; i < data.length; i += 3) {
    const [L, a, b] = toLab(data[i], data[i + 1], data[i + 2]);
    const k = Math.min(BANDS - 1, Math.floor(L / 10));
    s[k][0] += a; s[k][1] += b; s[k][2]++;
  }
  return s.map(([a, b, n]) => (n > 50 ? [a / n, b / n] : null));
}
let OFF;
function offsetAt(L) {
  const x = Math.max(0, Math.min(BANDS - 1, L / 10 - 0.5));
  const i = Math.floor(x), t = x - i, j = Math.min(BANDS - 1, i + 1);
  return [OFF[i][0] * (1 - t) + OFF[j][0] * t, OFF[i][1] * (1 - t) + OFF[j][1] * t];
}
// Fix an RGB(A) raw buffer in place.
function fix(data, ch) {
  for (let i = 0; i < data.length; i += ch) {
    const [L, a, b] = toLab(data[i], data[i + 1], data[i + 2]);
    const [da, db] = offsetAt(L);
    const [r, g, bl] = toRgb(L, a + da, b + db);
    data[i] = r; data[i + 1] = g; data[i + 2] = bl;
  }
}
async function regrade(src, out, fmt) {
  const { data, info } = await sharp(src).raw().toBuffer({ resolveWithObject: true });
  fix(data, info.channels);
  const img = sharp(data, { raw: info });
  await (fmt === 'jpg' ? img.jpeg({ quality: 86, mozjpeg: true }) : fmt === 'png' ? img.png() : img.webp(fmt)).toFile(out);
  console.log('wrote', out.replace(ROOT, ''));
}
(async () => {
  const [v, ra, rb] = [await bandMeans(SRC), await bandMeans(REF_A), await bandMeans(REF_B)];
  OFF = v.map((m, k) => (m && ra[k] && rb[k] ? [ra[k][0] - m[0], rb[k][1] - m[1]] : null));
  // fill empty bands from their nearest neighbour
  for (let k = 0; k < BANDS; k++) if (!OFF[k]) OFF[k] = OFF.slice(k).find(Boolean) || OFF.slice(0, k).reverse().find(Boolean);
  console.log('offsets a*/b* per L band:', OFF.map((o) => o.map((x) => x.toFixed(1)).join('/')).join('  '));
  await regrade(SRC, ROOT + 'assets/keyframes/k1-v4.png', 'png');
  const H = ROOT + 'public/hero/v1/';
  await regrade(H + 'k1v3-1920.webp', H + 'k1v4-1920.webp', { quality: 82 });
  await regrade(H + 'k1v3-1280.webp', H + 'k1v4-1280.webp', { quality: 82 });
  for (const n of ['1920', '1280', 'm']) await regrade(H + `k1dv3-${n}.webp`, H + `k1dv4-${n}.webp`, { quality: 80, alphaQuality: 60 });
  await regrade(ROOT + 'public/og-v3.jpg', ROOT + 'public/og-v4.jpg', 'jpg');
})();
