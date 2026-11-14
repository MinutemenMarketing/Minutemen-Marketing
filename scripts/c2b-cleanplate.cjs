// C2b clean plate (2026-11-14). Aleph 2.0 (Runway task 1676f23d-208d-4a20-b4c3-47c0ee7a1b80, 144 credits incl.
// keyframe) was asked to remove the ball from C2b frames 17-92; it kept every frame in place (76 frames,
// played back at 24fps) and painted the real background through the ball, but left it as a darkened glass
// disc. This recovers that background: inside the disc a per-row, per-channel gain (painting just outside
// the disc / disc interior, smoothed over rows), clamped to the painting's own range on that row (Aleph's
// glass highlights); the thin annulus where Aleph drew the glass rim and the footage ball's soft halo sat
// is rebuilt per row between the real pixels at its two ends. Only that region changes: each set keeps its
// own pixels outside it. Writes f_00NN-ball2.webp in hd/, base and m/ (new names: /hero/v1 is immutable).
// node c2b-cleanplate.cjs   (needs the decoded Aleph frames in %TEMP%/aleph/frames, a_000-a_075.png)
const sharp = require('sharp');
const A = process.env.TEMP + '/aleph/frames/', V = 'C:/Claude Code/minute-men-marketing/public/hero/v1/hd/c2b/';
const src = (n) => (n === 17 ? 'f_0017-fix1.webp' : `f_${String(n).padStart(4, '0')}.webp`);
(async () => {
  const T = (await import('file:///C:/Claude Code/minute-men-marketing/src/hero/ball-track.js')).BALL_TRACK;
  const outs = [];
  const ROOT = 'C:/Claude Code/minute-men-marketing/public/hero/v1/';
  const only = process.argv[2] ? process.argv[2].split(',').map(Number) : null;
  for (let k = 0; k <= 75; k++) {
    if (only && !only.includes(k)) continue;
    const n = 17 + k;
    const { data: Ad, info } = await sharp(A + `a_${String(k).padStart(3, '0')}.png`).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const W = info.width, H = info.height;
    const O = await sharp(V + src(n)).resize(W, H, { fit: 'fill' }).removeAlpha().raw().toBuffer();
    const [bx, by, br] = T.frames[k];
    const cx = bx * W, cy = by * H, r = br * H;
    const R1 = r * 1.03, R2 = r * 1.18 + H * 0.012; // disc edge; outer edge of the soft halo
    // per-row gain: mean of a band just outside the disc (both sides) / mean of the disc's inner part on that row
    const gain = [];
    for (let y = 0; y < H; y++) {
      const dy = y - cy; if (Math.abs(dy) >= R1) { gain[y] = null; continue; }
      const half = Math.sqrt(R1 * R1 - dy * dy), hin = Math.sqrt(Math.max(0, (r * 0.9) ** 2 - dy * dy));
      // two gains per row, left and right: the smoke wake on one side and open field on the other need
      // different ones (a single gain left a hard vertical edge in the smoke)
      const side = (dir) => {
        const o = [0, 0, 0], q = [0, 0, 0]; let no = 0, nq = 0;
        const x0 = dir < 0 ? Math.floor(cx - half - r * 0.25) : Math.ceil(cx + half + 2), x1 = dir < 0 ? cx - half - 2 : cx + half + r * 0.25;
        for (let x = x0; x < x1; x++) if (x >= 0 && x < W) { for (let c = 0; c < 3; c++) o[c] += Ad[(y * W + x) * 3 + c]; no++; }
        const q0 = dir < 0 ? Math.floor(cx - hin) : Math.ceil(cx + hin * 0.2), q1 = dir < 0 ? cx - hin * 0.2 : cx + hin;
        for (let x = q0; x <= q1; x++) { for (let c = 0; c < 3; c++) q[c] += Ad[(y * W + x) * 3 + c]; nq++; }
        return no && nq > 4 ? [0, 1, 2].map((c) => (o[c] / no) / Math.max(1, q[c] / nq)) : null;
      };
      const gl = side(-1), gr = side(1);
      gain[y] = gl && gr ? [...gl, ...gr] : null;
    }
    // fill gaps at the disc's top/bottom with the nearest row, then smooth vertically (+-r*0.15)
    const ys = gain.map((g, y) => (g ? y : -1)).filter((y) => y >= 0);
    const near = (y) => { let b = ys[0]; for (const v of ys) if (Math.abs(v - y) < Math.abs(b - y)) b = v; return gain[b]; };
    const sm = [], rad = Math.max(2, Math.round(r * 0.15));
    for (let y = 0; y < H; y++) { if (Math.abs(y - cy) > R2) continue; const acc = [0, 0, 0, 0, 0, 0]; let c0 = 0; for (let d = -rad; d <= rad; d++) { const g = near(Math.min(H - 1, Math.max(0, y + d))); for (let c = 0; c < 6; c++) acc[c] += g[c]; c0++; } sm[y] = acc.map((v) => v / c0); }
    // the painting's own range on each row (original frame, just outside the halo, +-8 rows): Aleph's glass
    // highlights inside the disc are clamped back into it
    const band = [];
    for (let y = Math.max(0, Math.floor(cy - R1)); y < Math.min(H, cy + R1); y++) {
      const vals = [[], [], []];
      for (let yy = Math.max(0, y - 8); yy <= Math.min(H - 1, y + 8); yy += 2) {
        const dy = yy - cy, half = Math.sqrt(Math.max(0, R2 * R2 - dy * dy));
        for (const x0 of [cx - half - r * 0.3, cx + half + 2]) for (let x = Math.floor(x0); x < x0 + r * 0.3; x += 2) if (x >= 0 && x < W) { const i = (yy * W + x) * 3; for (let c = 0; c < 3; c++) vals[c].push(O[i + c]); }
      }
      band[y] = vals.map((v) => { if (!v.length) return [0, 255]; v.sort((p, q) => p - q); return [v[Math.floor(v.length * 0.03)] - 6, v[Math.floor(v.length * 0.97)] + 6]; });
      const sat = []; for (let j = 0; j < vals[0].length; j++) sat.push(Math.max(vals[0][j], vals[1][j], vals[2][j]) - Math.min(vals[0][j], vals[1][j], vals[2][j]));
      sat.sort((p, q) => p - q); band[y].sat = sat.length ? sat[Math.floor(sat.length * 0.97)] + 4 : 255;
    }
    // recovered background inside the disc (gain only), Aleph as is outside
    const REC = Buffer.from(Ad);
    for (let y = Math.max(0, Math.floor(cy - R1)); y < Math.min(H, cy + R1); y++) for (let x = Math.max(0, Math.floor(cx - R1)); x < Math.min(W, cx + R1); x++) {
      if (Math.hypot(x - cx, y - cy) >= R1) continue; const i = (y * W + x) * 3;
      const u = Math.min(1, Math.max(0, (x - (cx - r * 0.6)) / (r * 1.2))), us = u * u * (3 - 2 * u);
      for (let c = 0; c < 3; c++) { const v = Ad[i + c] * (sm[y][c] * (1 - us) + sm[y][c + 3] * us); const [lo, hi] = band[y][c]; REC[i + c] = Math.max(0, Math.min(255, Math.round(v > hi ? hi + (v - hi) * 0.15 : v < lo ? lo - (lo - v) * 0.15 : v))); }
    }
    // inside the disc: saturation no higher than the painting's on that row (Aleph left warm smears), then a
    // 7-row vertical median (Aleph drew a thin glass 'horizon' line across the disc that the gain amplified)
    for (let y = Math.max(0, Math.floor(cy - R1)); y < Math.min(H, cy + R1); y++) for (let x = Math.max(0, Math.floor(cx - R1)); x < Math.min(W, cx + R1); x++) {
      if (Math.hypot(x - cx, y - cy) >= R1) continue; const i = (y * W + x) * 3;
      const v = [REC[i], REC[i + 1], REC[i + 2]], mx = Math.max(...v), mn = Math.min(...v), sMax = band[y].sat;
      if (mx - mn > sMax) { const m = (v[0] + v[1] + v[2]) / 3, k = sMax / (mx - mn); for (let c = 0; c < 3; c++) REC[i + c] = Math.round(m + (v[c] - m) * k); }
    }
    { const MED = Buffer.from(REC);
      for (let y = Math.max(3, Math.floor(cy - R1)); y < Math.min(H - 3, cy + R1); y++) for (let x = Math.max(0, Math.floor(cx - R1)); x < Math.min(W, cx + R1); x++) {
        if (Math.hypot(x - cx, y - cy) >= R1) continue;
        for (let c = 0; c < 3; c++) { const a = []; for (let d = -3; d <= 3; d++) a.push(REC[((y + d) * W + x) * 3 + c]); a.sort((p, q) => p - q); MED[(y * W + x) * 3 + c] = a[3]; }
      }
      MED.copy(REC); }
    // annulus [RI, R2] (Aleph's glass rim + the footage ball's soft halo): rebuilt per row by blending
    // between the real pixels at its two ends on that row (recovered interior / original frame)
    const RI = r * 0.82;
    const out = Buffer.from(O);
    const inA = (x, y) => { const d = Math.hypot(x - cx, y - cy); return d >= RI && d < R2; };
    for (let y = Math.max(0, Math.floor(cy - R2)); y < Math.min(H, cy + R2); y++) {
      // interior of the disc: recovered
      for (let x = Math.max(0, Math.floor(cx - RI)); x < Math.min(W, cx + RI); x++) if (Math.hypot(x - cx, y - cy) < RI) { const i = (y * W + x) * 3; for (let c = 0; c < 3; c++) out[i + c] = REC[i + c]; }
      // annulus segments on this row
      let x = Math.max(0, Math.floor(cx - R2));
      const xe = Math.min(W - 1, Math.ceil(cx + R2));
      while (x <= xe) {
        if (!inA(x, y)) { x++; continue; }
        const s0 = x; while (x <= xe && inA(x, y)) x++; const s1 = x; // [s0, s1)
        const L = Math.max(0, s0 - 1), R = Math.min(W - 1, s1);
        const pick = (xx) => { const d = Math.hypot(xx - cx, y - cy); const b = d < RI ? out : O; const i = (y * W + xx) * 3; return [b[i], b[i + 1], b[i + 2]]; };
        const cl = pick(L), cr = pick(R);
        for (let xx = s0; xx < s1; xx++) { const t = (xx - L) / Math.max(1, R - L); const i = (y * W + xx) * 3; for (let c = 0; c < 3; c++) out[i + c] = Math.round(cl[c] * (1 - t) + cr[c] * t); }
      }
    }
    // per set: the set's own frame outside R2 (feathered over the last 6%), this composite inside
    const hdOut = sharp(out, { raw: { width: W, height: H, channels: 3 } });
    for (const set of ['hd/c2b', 'c2b', 'm/c2b']) {
      const sf = ROOT + set + '/' + src(n);
      if (!require('fs').existsSync(sf)) continue;
      const { data: S0, info: si } = await sharp(sf).removeAlpha().raw().toBuffer({ resolveWithObject: true });
      const sw = si.width, sh = si.height;
      const C = await hdOut.clone().resize(sw, sh, { fit: 'fill' }).raw().toBuffer();
      const sc = sw / W, scx = cx * sc, scy = cy * sc, sR = R2 * sc, F = Buffer.from(S0);
      // frame 17 was rebuilt per set on 2026-11-08 and the 1280/960 rebuilds put the ball at x 0.851 (hd 0.835):
      // those sets take the repaired hd frame whole for this one frame
      if (n === 17 && !set.startsWith('hd')) { C.copy(F); }
      for (let y = Math.max(0, Math.floor(scy - sR)); y < Math.min(sh, scy + sR); y++) for (let x = Math.max(0, Math.floor(scx - sR)); x < Math.min(sw, scx + sR); x++) {
        if (n === 17 && !set.startsWith('hd')) continue;
        const d = Math.hypot(x - scx, y - scy) / sR; if (d >= 1) continue;
        const kk = Math.min(1, (1 - d) / 0.06), ks = kk * kk * (3 - 2 * kk);
        for (let c = 0; c < 3; c++) { const i = (y * sw + x) * 3 + c; F[i] = Math.round(S0[i] * (1 - ks) + C[i] * ks); }
      }
      await sharp(F, { raw: { width: sw, height: sh, channels: 3 } }).webp({ quality: set.startsWith('hd') ? 80 : 82 }).toFile(ROOT + set + '/' + `f_${String(n).padStart(4, '0')}-ball2.webp`);
    }
    if (only) { outs.push(await sharp(out, { raw: { width: W, height: H, channels: 3 } }).resize(640).png().toBuffer()); outs.push(await sharp(O, { raw: { width: W, height: H, channels: 3 } }).resize(640).png().toBuffer()); }
  }
  if (!outs.length) return console.log('wrote ball2 frames');
  const c = outs.map((b, i) => ({ input: b, left: (i % 2) * 644, top: Math.floor(i / 2) * 362 }));
  await sharp({ create: { width: 1288, height: Math.ceil(outs.length / 2) * 362, channels: 3, background: '#fff' } }).composite(c).jpeg({ quality: 86 }).toFile(process.env.TEMP + '/aleph/undark.jpg');
})();
