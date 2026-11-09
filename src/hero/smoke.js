// Painted gunsmoke for the K1 → K2 change of shot (2026-11-08). Built once in code, no footage: a
// band of billowing smoke, lit from the upper left in K1's own cool smoke colours, opaque in the
// middle and ragged at both ends. The stage slides it right to left across the frame and swaps K1
// for K2 while the dense middle covers everything.
//
// The texture spans SMOKE.span screen widths across and SMOKE.tall screen widths down (tall enough
// for portrait phones): an empty margin, a ramp of thickening wisps, the fully opaque `core`, a ramp
// thinning out, an empty margin (the margins keep the ragged ends from touching the texture edge).
export const SMOKE = { span: 4.3, tall: 2.4, margin: 0.35, ramp: 1.1, core: 1.4 };

// Smoke colours sampled from k1-cool.png (shadow, body, highlight).
const SHADOW = [118, 116, 146];
const BODY = [166, 160, 184];
const LIGHT = [232, 230, 238];

// Value noise on an integer lattice, hashed, smoothly interpolated.
function hash(x, y, seed) {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
function noise(x, y, seed) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi, seed);
  const b = hash(xi + 1, yi, seed);
  const c = hash(xi, yi + 1, seed);
  const d = hash(xi + 1, yi + 1, seed);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
// Billowing fractal noise: puffy, rounded shapes like rolling powder smoke.
function billow(x, y, seed, oct = 4) {
  let sum = 0;
  let amp = 0.5;
  let f = 1;
  let norm = 0;
  for (let o = 0; o < oct; o++) {
    // first octave rounded (puffs), the finer ones plain (soft, no creases)
    const v = noise(x * f, y * f, seed + o * 17);
    sum += amp * (o === 0 ? 1 - (2 * v - 1) ** 2 : v);
    norm += amp;
    amp *= 0.42;
    f *= 2.03;
  }
  return sum / norm;
}

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const mix = (a, b, t) => a + (b - a) * t;

// RGBA pixels, `width` × `height`, covering SMOKE.span × SMOKE.tall screen widths.
export function smokePixels(width, height, seed = 7) {
  const px = new Uint8ClampedArray(width * height * 4);
  const unit = width / SMOKE.span; // pixels per screen width
  const sc = 1.5; // noise features per screen width
  const { margin, ramp, core } = SMOKE;
  for (let j = 0; j < height; j++) {
    for (let i = 0; i < width; i++) {
      const ux = i / unit;
      const uy = j / unit;
      // Domain warp: the puffs lean and curl instead of sitting on a grid.
      const wx = ux * sc + 0.9 * (noise(ux * 0.9, uy * 0.9, seed + 101) - 0.5);
      const wy = uy * sc * 1.15 + 0.9 * (noise(ux * 0.9 + 5.2, uy * 0.9, seed + 202) - 0.5);
      const n = billow(wx, wy, seed);
      // Lighting: compare with a sample nudged toward the upper-left light.
      const nl = billow(wx - 0.14, wy - 0.14, seed);
      const lit = Math.min(1, Math.max(0, 0.62 + (nl - n) * 2.6 + (n - 0.55) * 1.1));
      // Band profile: 0 outside, 1 across the core, ragged edges set by the noise.
      const edge = (n - 0.5) * 0.7;
      const lin = (a, b, x) => Math.min(1, Math.max(0, (x - a) / (b - a)));
      const inL = lin(margin, margin + ramp, ux + edge);
      const inR = 1 - lin(margin + ramp + core, SMOKE.span - margin, ux - edge);
      const band = Math.min(inL, inR);
      // Thin, broken wisps at the leading and trailing edges, thickening into the core.
      const dens = Math.min(1, band * band * (0.35 + 1.3 * n));
      const a = band >= 0.999 ? 1 : dens;
      const k = (j * width + i) * 4;
      const toneA = lit < 0.5 ? lit * 2 : (lit - 0.5) * 2;
      const from = lit < 0.5 ? SHADOW : BODY;
      const to = lit < 0.5 ? BODY : LIGHT;
      px[k] = mix(from[0], to[0], toneA);
      px[k + 1] = mix(from[1], to[1], toneA);
      px[k + 2] = mix(from[2], to[2], toneA);
      px[k + 3] = a * 255;
    }
  }
  return px;
}
