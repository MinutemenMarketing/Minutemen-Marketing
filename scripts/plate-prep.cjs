// Phone plates (2026-11-12): turn an outpainted tall plate into the served file. The generated
// plate repaints the whole picture, so its colours drift a little from the original frame; this
// measures the plate's copy of the frame (the band, located by plate-fit.cjs) against the original
// frame per brightness band and shifts the whole plate's L*/a*/b* by the difference, so the top and
// bottom match the frame drawn over the middle. Writes public/hero/v1/m/<out>.webp (new names only:
// /hero/v1 is cached as immutable).
// node scripts/plate-prep.cjs <plate.png> <frame> <x0> <y0> <w> <h> <out-name>  (from a folder with sharp)
const sharp = require('sharp');
const [plateFile, frameFile, X0, Y0, FW, FH, outName] = process.argv.slice(2);
const OUT = 'C:/Claude Code/minute-men-marketing/public/hero/v1/m/';
const lin = (c) => { c /= 255; return c > 0.04045 ? ((c + 0.055) / 1.055) ** 2.4 : c / 12.92; };
const gam = (c) => { c = c > 0.0031308 ? 1.055 * c ** (1 / 2.4) - 0.055 : 12.92 * c; return Math.max(0, Math.min(255, Math.round(c * 255))); };
const LUT = new Float64Array(256).map((_, i) => lin(i));
const fw = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
const bw = (t) => (t ** 3 > 0.008856 ? t ** 3 : (t - 16 / 116) / 7.787);
function toLab(r, g, b) {
  const [R, G, B] = [LUT[r], LUT[g], LUT[b]];
  const X = fw((R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047), Y = fw(R * 0.2126 + G * 0.7152 + B * 0.0722), Z = fw((R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883);
  return [116 * Y - 16, 500 * (X - Y), 200 * (Y - Z)];
}
function toRgb(L, a, b) {
  const fy = (L + 16) / 116;
  const X = bw(fy + a / 500) * 0.95047, Y = bw(fy), Z = bw(fy - b / 200) * 1.08883;
  return [gam(X * 3.2406 - Y * 1.5372 - Z * 0.4986), gam(-X * 0.9689 + Y * 1.8758 + Z * 0.0415), gam(X * 0.0557 - Y * 0.204 + Z * 1.057)];
}
const BANDS = 10;
const lerp = (a, b, t) => a + (b - a) * t;
(async () => {
  const meta = await sharp(plateFile).metadata();
  const [x0, y0, w, h] = [+X0, +Y0, +FW, +FH];
  const box = { left: Math.max(0, Math.round(x0 * meta.width)), top: Math.round(y0 * meta.height), width: Math.min(meta.width, Math.round(w * meta.width)), height: Math.round(h * meta.height) };
  const S = 480;
  const plateBand = await sharp(plateFile).extract(box).resize(S, Math.round((S * 9) / 16), { fit: 'fill' }).removeAlpha().raw().toBuffer();
  const frame = await sharp(frameFile).resize(S, Math.round((S * 9) / 16), { fit: 'fill' }).removeAlpha().raw().toBuffer();
  // per-pixel pairs (same content): mean difference per plate-L band
  const acc = Array.from({ length: BANDS }, () => [0, 0, 0, 0]);
  for (let i = 0; i < plateBand.length; i += 3) {
    const p = toLab(plateBand[i], plateBand[i + 1], plateBand[i + 2]);
    const f = toLab(frame[i], frame[i + 1], frame[i + 2]);
    const k = Math.min(BANDS - 1, Math.floor(p[0] / 10));
    acc[k][0] += f[0] - p[0]; acc[k][1] += f[1] - p[1]; acc[k][2] += f[2] - p[2]; acc[k][3]++;
  }
  // bands with too few pixels are noise (a slightly misregistered edge); shifts are capped at 6
  const cap = (v) => Math.max(-6, Math.min(6, v));
  const total = plateBand.length / 3;
  let off = acc.map(([l, a, b, n]) => (n > total * 0.01 ? [cap(l / n), cap(a / n), cap(b / n)] : null));
  for (let k = 0; k < BANDS; k++) if (!off[k]) off[k] = off.slice(k).find(Boolean) || off.slice(0, k).reverse().find(Boolean);
  console.log('L/a/b shift per band:', off.map((o) => o.map((x) => x.toFixed(1)).join('/')).join('  '));
  const at = (L) => {
    const x = Math.max(0, Math.min(BANDS - 1, L / 10 - 0.5));
    const i = Math.floor(x), t = x - i, j = Math.min(BANDS - 1, i + 1);
    return [0, 1, 2].map((c) => off[i][c] * (1 - t) + off[j][c] * t);
  };
  const { data, info } = await sharp(plateFile).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 3) {
    const [L, a, b] = toLab(data[i], data[i + 1], data[i + 2]);
    const d = at(L);
    const [r, g, bl] = toRgb(L + d[0], a + d[1], b + d[2]);
    data[i] = r; data[i + 1] = g; data[i + 2] = bl;
  }
  // Seam match: per column, the colour step between the original frame's top/bottom edge and the
  // plate just outside it, blended into the plate with a soft falloff, so the feathered seam has
  // nothing left to hide (the outpaint can shift tone right at the edge).
  const PW = info.width, PH = info.height;
  const top = Math.round(y0 * PH), bot = Math.round((y0 + h) * PH);
  const bandH = bot - top, left = Math.round(x0 * PW), bandW = Math.round(w * PW);
  const fr = await sharp(frameFile).resize(bandW, bandH, { fit: 'fill' }).removeAlpha().raw().toBuffer();
  const R = 6; // rows averaged on each side of a seam
  const px = (buf, W, x, y, c) => buf[(y * W + x) * 3 + c];
  // The feather reveals the plate's OWN copy of the frame just inside the edge, so that is where they
  // must agree: per column, the frame vs the plate's copy a few rows inside the edge (skipping the
  // edge rows, which carry a light compression line). The shift applies fully across the feather
  // zone and fades out into the plate beyond the edge; no pixels are rebuilt, so texture stays.
  const IN = 4; // rows inside the edge where sampling starts
  const ZONE = Math.round(bandH * 0.14); // the feather zone inside the frame (PLATE_FEATHER 0.12 + margin)
  for (const [edgeRow, plateEdge, dir] of [[0, top, -1], [bandH - 1, bot - 1, 1]]) {
    const diff = Array.from({ length: PW }, () => [0, 0, 0]);
    for (let x = 0; x < PW; x++) {
      const fx = Math.min(bandW - 1, Math.max(0, x - left));
      for (let c = 0; c < 3; c++) {
        let fs = 0, ps = 0;
        for (let r = 0; r < R; r++) {
          fs += px(fr, bandW, fx, edgeRow - dir * (IN + r), c);
          ps += px(data, PW, x, plateEdge - dir * (IN + r), c);
        }
        diff[x][c] = (fs - ps) / R;
      }
    }
    // smooth across columns (box blur, 4% of the width)
    const rad = Math.round(PW * 0.04);
    const sm = diff.map((_, x) => [0, 1, 2].map((c) => {
      let s = 0, n = 0;
      for (let k = Math.max(0, x - rad); k <= Math.min(PW - 1, x + rad); k++) (s += diff[k][c]), n++;
      return s / n;
    }));
    const fall = bandH * 0.3;
    // from ZONE rows inside the frame, across the edge, out into the plate
    for (let y = plateEdge - dir * ZONE, d = -ZONE; y >= 0 && y < PH; y += dir, d++) {
      const k = d <= 0 ? 1 : Math.exp(-d / fall);
      if (k < 0.01) break;
      for (let x = 0; x < PW; x++)
        for (let c = 0; c < 3; c++) {
          const i = (y * PW + x) * 3 + c;
          data[i] = Math.max(0, Math.min(255, Math.round(data[i] + sm[x][c] * k)));
        }
    }
  }
  // `bridge-top`: the K4 plate has a hard step of its own a few rows above the frame (where the gray
  // canvas border was). Its sky is smooth, so the rows there are bridged with a short vertical blend
  // from just inside the frame to past the step (no texture to smear). Not for textured edges.
  if (process.argv.includes('bridge-top')) {
    const GAP = Math.round(PH * 0.012);
    const inner = top + 4;
    const outer = top - GAP;
    // first pull the sky beyond the step toward the frame's own sky (it was painted lighter),
    // fading out over most of a frame height
    const rad = Math.round(PW * 0.06);
    const raw = Array.from({ length: PW }, (_, x) => [0, 1, 2].map((c) => {
      let fs = 0, ps = 0;
      for (let r = 0; r < R; r++) {
        fs += px(fr, bandW, Math.min(bandW - 1, Math.max(0, x - left)), IN + r, c);
        ps += px(data, PW, x, outer - r, c);
      }
      return (fs - ps) / R;
    }));
    const sky = raw.map((_, x) => [0, 1, 2].map((c) => {
      let s = 0, n = 0;
      for (let k = Math.max(0, x - rad); k <= Math.min(PW - 1, x + rad); k++) (s += raw[k][c]), n++;
      return s / n;
    }));
    for (let y = outer; y >= 0; y--) {
      const k = Math.exp(-(outer - y) / (bandH * 0.8));
      for (let x = 0; x < PW; x++)
        for (let c = 0; c < 3; c++) {
          const i = (y * PW + x) * 3 + c;
          data[i] = Math.max(0, Math.min(255, Math.round(data[i] + sky[x][c] * k)));
        }
    }
    for (let y = outer + 1; y < inner; y++) {
      const t = (y - outer) / (inner - outer);
      const s = t * t * (3 - 2 * t);
      for (let x = 0; x < PW; x++)
        for (let c = 0; c < 3; c++) {
          const i = (y * PW + x) * 3 + c;
          data[i] = Math.round(lerp(px(data, PW, x, outer, c), px(data, PW, x, inner, c), s));
        }
    }
  }
  const outW = info.width; // full width (1536): tablets in portrait use the plates too
  await sharp(data, { raw: info }).resize(outW).webp({ quality: 80 }).toFile(OUT + outName + '.webp');
  console.log('wrote', outName, JSON.stringify({ x0, y0, w, h }));
})();
