// C2b ball, step 1 (2026-11-13): take the painted ball OUT of the footage so the site can draw it as a
// crisp sprite at a size it controls (Noah: on phones the ball grew to fill the screen, and it looked
// blurry next to the soldier and the globe).
// Why it was blurry: the ball was repainted per frame at extraction (a matte sphere over Kling's chrome
// ball) at each set's own resolution, with a soft edge; phones load the 960x537 set, and the cover crop
// draws one of its pixels ~4.7 device pixels wide on a 3x phone, so the edge smeared and stepped.
// Why it was huge: in the footage its radius reaches 0.30 of the frame height (frames 50-57), and the
// phone's cover crop puts the full frame height on the screen: ~500px of ball on a 390px screen.
// What this does:
// 1. Tracks the ball in every hd frame (the largest dark, grey, round blob), fills gaps and smooths;
//    writes the track (x, y = centre as fractions of width / height; r = radius / height) to
//    src/hero/ball-track.js, frames 17-92 (before 17 the ball is a few pixels in the smoke and stays).
// 2. In every set, removes the ball from frames 17-92: each row inside the ball (plus a soft halo) is
//    rebuilt from the texture just outside it on that row, shifted (not mirrored, so the field keeps
//    moving the camera's way), with a per-row correction that makes both edges seamless.
// Writes f_00NN-ball1.webp (new names: /hero/v1 is cached as immutable).
// node c2b-ball.cjs   (run where sharp is installed)
const sharp = require('sharp');
const fs = require('fs');
const ROOT = 'C:/Claude Code/minute-men-marketing/';
const V = ROOT + 'public/hero/v1/';
const FIRST = 17, LAST = 92;
const src = (n) => (n === 17 ? 'f_0017-fix1.webp' : `f_${String(n).padStart(4, '0')}.webp`);
const out = (n) => `f_${String(n).padStart(4, '0')}-ball1.webp`;

async function detect(file) {
  const S = 480;
  const { data, info } = await sharp(file).resize(S).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  const m = new Uint8Array(W * H);
  for (let p = 0; p < W * H; p++) {
    const r = data[p * 3], g = data[p * 3 + 1], b = data[p * 3 + 2];
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    if (mx < 118 && mx - mn < 22) m[p] = 1;
  }
  const lab = new Int32Array(W * H);
  let best = null, id = 0;
  for (let p = 0; p < W * H; p++) {
    if (!m[p] || lab[p]) continue;
    const st = [p]; lab[p] = ++id;
    let area = 0, sx = 0, sy = 0, x0 = W, x1 = 0, y0 = H, y1 = 0;
    while (st.length) {
      const q = st.pop(), x = q % W, y = (q / W) | 0;
      area++; sx += x; sy += y; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      for (const nb of [q - 1, q + 1, q - W, q + W]) if (nb >= 0 && nb < W * H && Math.abs((nb % W) - x) <= 1 && m[nb] && !lab[nb]) { lab[nb] = id; st.push(nb); }
    }
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1, aspect = Math.min(bw, bh) / Math.max(bw, bh);
    if (area < 6 || aspect < 0.85 || area / (bw * bh) < 0.65) continue;
    if (!best || area > best.area) best = { area, x: (x0 + x1 + 1) / 2 / W, y: (y0 + y1 + 1) / 2 / H, r: (bw + bh) / 4 / H };
  }
  return best;
}

(async () => {
  // 1. track
  const raw = [];
  for (let n = FIRST; n <= LAST; n++) raw[n] = await detect(V + 'hd/c2b/' + src(n));
  // reject jumps (a blob elsewhere in the frame): keep detections near the neighbours' path
  const ok = (n) => raw[n] && (n < 30 || (Math.abs(raw[n].x - 0.5) < 0.05 && Math.abs(raw[n].y - 0.45) < 0.05)) && raw[n].r > 0.02;
  const keys = []; for (let n = FIRST; n <= LAST; n++) if (ok(n)) keys.push(n);
  const lerpAt = (n, k) => { // linear interpolation over the accepted detections
    let a = keys[0], b = keys[keys.length - 1];
    for (const q of keys) { if (q <= n) a = q; if (q >= n) { b = q; break; } }
    if (a === b) return raw[a][k];
    return raw[a][k] + (raw[b][k] - raw[a][k]) * ((n - a) / (b - a));
  };
  const T = [];
  for (let n = FIRST; n <= LAST; n++) T[n] = { x: lerpAt(n, 'x'), y: lerpAt(n, 'y'), r: lerpAt(n, 'r') };
  // radius: running median of 5, then mean of 3 (frame-to-frame jitter would show as pulsing)
  const med = (a) => a.slice().sort((p, q) => p - q)[a.length >> 1];
  const R1 = [], R2 = [];
  for (let n = FIRST; n <= LAST; n++) R1[n] = med([-2, -1, 0, 1, 2].map((d) => T[Math.min(LAST, Math.max(FIRST, n + d))].r));
  for (let n = FIRST; n <= LAST; n++) R2[n] = ([-1, 0, 1].map((d) => R1[Math.min(LAST, Math.max(FIRST, n + d))]).reduce((s, v) => s + v, 0)) / 3;
  for (let n = FIRST; n <= LAST; n++) T[n].r = R2[n];
  const rows = [];
  for (let n = FIRST; n <= LAST; n++) rows.push(`[${T[n].x.toFixed(4)}, ${T[n].y.toFixed(4)}, ${T[n].r.toFixed(4)}]`);
  fs.writeFileSync(ROOT + 'src/hero/ball-track.js', `// C2b's musket ball, tracked in the hd frames by scripts/c2b-ball.cjs (2026-11-13). One entry per frame
// from BALL_TRACK.first: [x, y, r] = centre as fractions of the frame's width and height, radius as a
// fraction of its height. The frames from \`first\` on have the painted ball removed; the stage draws
// the sprite here instead (stage.js, drawBall).
export const BALL_TRACK = {
  first: ${FIRST},
  frames: [
    ${rows.join(',\n    ')},
  ],
};
`);
  console.log('track written', keys.length, 'detections of', LAST - FIRST + 1);
  // 2. remove the ball in every set
  for (const set of ['hd/c2b', 'c2b', 'm/c2b']) {
    for (let n = FIRST; n <= LAST; n++) {
      const file = V + set + '/' + src(n);
      if (!fs.existsSync(file)) continue;
      const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
      const W = info.width, H = info.height, I = data, F = Buffer.from(data);
      const cx = T[n].x * W, cy = T[n].y * H, rh = T[n].r * H * 1.16 + H * 0.016; // ball + soft halo
      const px = (x, y, c) => I[(y * W + Math.min(W - 1, Math.max(0, x))) * 3 + c];
      for (let y = Math.max(0, Math.floor(cy - rh)); y <= Math.min(H - 1, Math.ceil(cy + rh)); y++) {
        const half = Math.sqrt(Math.max(0, rh * rh - (y - cy) ** 2));
        if (half < 1) continue;
        const xl = Math.max(0, Math.floor(cx - half) - 1), xr = Math.min(W - 1, Math.ceil(cx + half) + 1);
        const span = xr - xl;
        // edge colours: a few pixels just outside, averaged
        // averaged over +-8 rows too, so the per-row corrections change smoothly from row to row (a
        // per-row correction striped the treeline)
        const edge = (x0, dir) => [0, 1, 2].map((c) => { let s = 0, q = 0; for (let dy = -8; dy <= 8; dy++) { const yy = Math.min(H - 1, Math.max(0, y + dy)); for (let k = 2; k <= 6; k++) { s += I[(yy * W + Math.min(W - 1, Math.max(0, x0 + dir * k))) * 3 + c]; q++; } } return s / q; });
        const at = (fn, x0) => [0, 1, 2].map((c) => { let s = 0; for (let dy = -8; dy <= 8; dy++) s += fn(x0, c, Math.min(H - 1, Math.max(0, y + dy))); return s / 17; });
        const eL = edge(xl, -1), eR = edge(xr, 1);
        // shifted texture sources: the strip left of the hole moved right, the strip right of it moved left
        // (each shift is capped by the room on its side, but stays over half the hole, so a source never
        // lands on the ball itself in the half where it is used)
        const sh = Math.ceil(span * 0.7) + 8, sL = Math.min(sh, Math.max(1, xl - 8)), sR = Math.min(sh, Math.max(1, W - 9 - xr)); // as close to the hole as the cross-fade allows (the frame edges carry canvas texture)
        const TL = (x, c, yy = y) => I[(yy * W + Math.min(W - 1, Math.max(0, x - sL))) * 3 + c], TR = (x, c, yy = y) => I[(yy * W + Math.min(W - 1, Math.max(0, x + sR))) * 3 + c];
        const tLe = at(TL, xl), tRr = at(TR, xr);
        for (let x = xl + 1; x < xr; x++) {
          const t = (x - xl) / span, u = Math.min(1, Math.max(0, (t - 0.3) / 0.4)), s = u * u * (3 - 2 * u);
          for (let c = 0; c < 3; c++) {
            // each source shifted by one offset so it meets its OWN edge exactly (measuring it at the far
            // edge sampled the ball itself in the widest frames), then the two cross-faded in the middle
            const a = TL(x, c) + (eL[c] - tLe[c]);
            const b = TR(x, c) + (eR[c] - tRr[c]);
            F[(y * W + x) * 3 + c] = Math.max(0, Math.min(255, Math.round(a * (1 - s) + b * s)));
          }
        }
      }
      // soften row-to-row steps inside the hole (3-row vertical average, faded in from the rim)
      const G = Buffer.from(F);
      for (let y = Math.max(1, Math.floor(cy - rh)); y < Math.min(H - 1, Math.ceil(cy + rh)); y++) {
        const half = Math.sqrt(Math.max(0, rh * rh - (y - cy) ** 2));
        for (let x = Math.floor(cx - half); x <= Math.ceil(cx + half); x++) {
          if (x < 0 || x >= W) continue;
          const d = Math.hypot(x - cx, y - cy) / rh; if (d >= 1) continue;
          const k = Math.min(1, (1 - d) * 6);
          // the outer 8% of the hole blends back into the frame's own pixels (clean background out there),
          // so no ring shows where the fill meets the frame
          const rim = Math.min(1, Math.max(0, (d - 0.92) / 0.08)), rs = rim * rim * (3 - 2 * rim);
          for (let c = 0; c < 3; c++) { const i = (y * W + x) * 3 + c; const v = F[i] * (1 - k) + ((F[i - W * 3] + F[i] + F[i + W * 3]) / 3) * k; G[i] = Math.round(v * (1 - rs) + I[i] * rs); }
        }
      }
      await sharp(G, { raw: { width: W, height: H, channels: 3 } }).webp({ quality: set.startsWith('hd') ? 80 : 82 }).toFile(V + set + '/' + out(n));
    }
    console.log('set done', set);
  }
})();
