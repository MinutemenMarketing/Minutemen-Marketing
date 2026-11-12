// Hero stage: loads the stills and frame sequences, then paints one canvas from a scroll position
// (0–100). Paints only on requestAnimationFrame and only when the computed layers change.
import { CHOREO, ASSETS, FOCUS, circleTarget } from './choreography.js';
import { SMOKE, smokePixels } from './smoke.js';

const S = CHOREO.scenes;
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const local = ([a, b], p) => clamp01((p - a) / (b - a));
const ease = (t) => t * t * (3 - 2 * t); // smoothstep
const sine = (t) => 0.5 - 0.5 * Math.cos(Math.PI * t); // slow in, slow out — the globe fades
const lerp = (a, b, t) => a + (b - a) * t;
// A smooth curve through [t, v] keys (monotone cubic, Fritsch-Carlson): no overshoot, and the
// camera does not stop at each key the way a chain of eases would.
const track = (keys, t) => {
  const n = keys.length;
  if (t <= keys[0][0]) return keys[0][1];
  if (t >= keys[n - 1][0]) return keys[n - 1][1];
  const d = keys.slice(1).map((k, i) => (k[1] - keys[i][1]) / (k[0] - keys[i][0]));
  const m = keys.map((_, i) => (i === 0 ? d[0] : i === n - 1 ? d[n - 2] : d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2));
  for (let i = 0; i < n - 1; i++) {
    if (!d[i]) {
      m[i] = m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const s = a * a + b * b;
    if (s > 9) {
      m[i] = (3 * a * d[i]) / Math.sqrt(s);
      m[i + 1] = (3 * b * d[i]) / Math.sqrt(s);
    }
  }
  let i = 0;
  while (t > keys[i + 1][0]) i++;
  const hh = keys[i + 1][0] - keys[i][0];
  const u = (t - keys[i][0]) / hh;
  const [y0, y1] = [keys[i][1], keys[i + 1][1]];
  return (2 * u ** 3 - 3 * u ** 2 + 1) * y0 + (u ** 3 - 2 * u ** 2 + u) * hh * m[i] + (-2 * u ** 3 + 3 * u ** 2) * y1 + (u ** 3 - u ** 2) * hh * m[i + 1];
};
const PAPER = '#F7F4EC';
const NAVY = [3, 34, 73];
const PAPER_RGB = [247, 244, 236];

// Piecewise-linear map through [[in, out], …] points.
function remap(points, t) {
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    if (t <= x1) return lerp(y0, y1, (t - x0) / (x1 - x0 || 1));
  }
  return points[points.length - 1][1];
}

const loadImage = (src) =>
  new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null); // a missing frame never blocks the hero
    img.src = src;
  });

// Navy/off-white rendering of the painted globe — the brand-coloured globe of stage (a).
function duotone(img) {
  const c = document.createElement('canvas');
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const id = ctx.getImageData(0, 0, c.width, c.height);
  const d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    // Dark sky maps to exactly the navy fill (no band at the image edge); the globe goes to paper.
    const l = clamp01(((0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255 - 0.16) / 0.5);
    d[i] = lerp(NAVY[0], PAPER_RGB[0], l);
    d[i + 1] = lerp(NAVY[1], PAPER_RGB[1], l);
    d[i + 2] = lerp(NAVY[2], PAPER_RGB[2], l);
  }
  ctx.putImageData(id, 0, 0);
  return c;
}

function rasterize(img, width) {
  const c = document.createElement('canvas');
  c.width = width;
  c.height = Math.round((width * img.naturalHeight) / img.naturalWidth);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return c;
}

// onFail() fires once if the story cannot play: the opening frame fails, or most of the opening
// window fails to load. The page then shows the still version instead.
export function createStage(canvas, onProgress, onFail = () => {}) {
  let ctx = canvas.getContext('2d'); // reassigned while drawing into an offscreen group
  const a = { seq: {} };
  let p = 0;
  let dir = 1; // last direction of travel through the hero: 1 down, -1 up
  let w = 0;
  let h = 0;
  let lastKey = '';
  let queued = false;
  let skyFill = '#0b1426';

  // Draw `fn` into an offscreen layer, then composite it at `alpha`.
  const layer = document.createElement('canvas');
  function group(alpha, fn) {
    if (alpha >= 1) return fn();
    if (alpha <= 0) return;
    if (layer.width !== canvas.width || layer.height !== canvas.height) {
      layer.width = canvas.width;
      layer.height = canvas.height;
    }
    const main = ctx;
    const lctx = layer.getContext('2d');
    lctx.setTransform(main.getTransform());
    lctx.clearRect(0, 0, w, h);
    ctx = lctx;
    fn();
    ctx = main;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = alpha;
    ctx.drawImage(layer, 0, 0);
    ctx.restore();
  }

  // Frame tiers (set once at load): phones < 768px get the 960px set; large screens (1440px+ wide, or
  // 1024px+ at 2x density, with no Save-Data) get the 1920px set upscaled from the approved clips;
  // everyone else the 1280px set. Stills follow the same tier so every join matches.
  const phone = window.innerWidth < 768;
  const saveData = navigator.connection?.saveData;
  const tall = window.innerWidth < window.innerHeight; // portrait screens load the tall plates
  const hd = !phone && !saveData && (window.innerWidth >= 1440 || (window.innerWidth >= 1024 && window.devicePixelRatio >= 2));
  const size = () => (hd ? 1920 : 1280);
  const still = (name) => `${ASSETS.base}/${name}-${size()}.webp`;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    // Toolbar show/hide fires resize without changing the (large-viewport) stage: skip it, because
    // resetting canvas.width would blank the frame for a moment.
    if (canvas.clientWidth === w && canvas.clientHeight === h && canvas.width === Math.round(w * dpr)) return;
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    lastKey = '';
    request();
  }

  // Cover-fit `img`, keep image point (fx, fy) as close to the canvas centre as cropping allows,
  // then zoom by z around where that point lands.
  function cover(img, alpha, fx = 0.5, fy = 0.5, z = 1) {
    if (!img || alpha <= 0) return;
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    const sc = Math.max(w / iw, h / ih);
    const dw = iw * sc;
    const dh = ih * sc;
    const dx = Math.min(0, Math.max(w - dw, w / 2 - fx * dw));
    const dy = Math.min(0, Math.max(h - dh, h / 2 - fy * dh));
    const px = dx + fx * dw;
    const py = dy + fy * dh;
    ctx.globalAlpha = alpha;
    ctx.drawImage(img, px - (px - dx) * z, py - (py - dy) * z, dw * z, dh * z);
    ctx.globalAlpha = 1;
  }

  // Draw an image so a known circle inside it (cx, cy as image fractions, d as a fraction of image
  // height or width) lands exactly on the shared circle target.
  function onCircle(img, circle, dOfWidth, scale = 1) {
    if (!img) return;
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    const t = circleTarget(w, h);
    const sc = (t.d * scale) / (circle.d * (dOfWidth ? iw : ih));
    ctx.drawImage(img, t.x - circle.x * iw * sc, t.y - circle.y * ih * sc, iw * sc, ih * sc);
  }

  // The globe scene is zoomed out to put the globe on the 50% circle, so it no longer fills the
  // frame. Fill behind it with a heavily blurred copy of the same scene, and erase the sharp
  // image's edges softly into it — the way film letterboxing is filled — so no edge ever shows.
  const edgeLayer = document.createElement('canvas');
  function globeScene(img, blurred, scale, plate) {
    if (!img) return;
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    const t = circleTarget(w, h);
    const sc = (t.d * scale) / (FOCUS.k4Globe.d * ih);
    const r = { x: t.x - FOCUS.k4Globe.x * iw * sc, y: t.y - FOCUS.k4Globe.y * ih * sc, w: iw * sc, h: ih * sc };
    // Portrait screens: the tall painted plate around it (2026-11-12), not the blurred copy.
    if (plate && w / h < 1) {
      const fit = ASSETS.plates.k4.fit;
      const pw = r.w / fit.w;
      const ph = (pw * plate.height) / plate.width;
      drawVisible(ctx, plate, r.x - fit.x0 * pw, r.y - fit.y0 * ph, pw, ph);
      return feathered(img, r.x, r.y, r.w, r.h, PLATE_FEATHER);
    }
    cover(blurred, 1, 0.5, 0.5, 1);
    feathered(img, r.x, r.y, r.w, r.h, 0.22);
  }

  // Draw img at (x0, y0, dw, dh) with any edge that falls inside the frame softly erased, so it
  // melts into whatever was drawn underneath.
  function feathered(img, x0, y0, dw, dh, frac, alpha = 1) {
    if (edgeLayer.width !== canvas.width || edgeLayer.height !== canvas.height) {
      edgeLayer.width = canvas.width;
      edgeLayer.height = canvas.height;
    }
    const e = edgeLayer.getContext('2d');
    e.setTransform(ctx.getTransform());
    e.clearRect(0, 0, w, h);
    if (typeof img === 'function') img(e);
    else e.drawImage(img, x0, y0, dw, dh);
    e.globalCompositeOperation = 'destination-out';
    const f = Math.min(dw, dh) * frac;
    const erase = (gx0, gy0, gx1, gy1, rx, ry, rw, rh) => {
      const g = e.createLinearGradient(gx0, gy0, gx1, gy1);
      g.addColorStop(0, 'rgba(0,0,0,1)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      e.fillStyle = g;
      e.fillRect(rx, ry, rw, rh);
    };
    if (y0 > 0) erase(0, y0, 0, y0 + f, x0, y0, dw, f);
    if (y0 + dh < h) erase(0, y0 + dh, 0, y0 + dh - f, x0, y0 + dh - f, dw, f);
    if (x0 > 0) erase(x0, 0, x0 + f, 0, x0, y0, f, dh);
    if (x0 + dw < w) erase(x0 + dw, 0, x0 + dw - f, 0, x0 + dw - f, y0, f, dh);
    e.globalCompositeOperation = 'source-over';
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = alpha;
    ctx.drawImage(edgeLayer, 0, 0);
    ctx.restore();
  }

  // C1 in code: a camera over the K1 painting (k1-v3, whose featured soldier is K2's man). It is a
  // rect that travels from K1's opening cover framing (f 0) to the K1 region that matches K2's hold
  // framing exactly (f 1, FOCUS.k1K2Frame, K2 cover-cropped around image x fx2), zooming toward him.
  // K2 crossfades in drawn at the same matched place (k2a), so the two read as one picture moving.
  function k1Rect(f, fx2, portrait) {
    const img = a.k1;
    const A = img.naturalWidth / img.naturalHeight;
    const M = FOCUS.k1K2Frame;
    const PH = CHOREO.phone;
    // Portrait: from the battlefield view on K1's plate to the hold view on K2's (CHOREO.phone).
    const s0 = portrait ? viewRect(img, PH.open.f, PH.open.x, 'k1') : heldRect(img, FOCUS.k1Soldier.x, FOCUS.k1Soldier.y);
    const r2 = portrait ? viewRect(a.k2 || img, PH.hold.f, PH.hold.x, 'c2') : heldRect(a.k2 || img, fx2, FOCUS.k2Soldier.y);
    const ew = r2.w / M.w;
    const e = { x: r2.x - M.x0 * ew, y: r2.y - (M.y0 * ew) / A, w: ew };
    const W = Math.exp(lerp(Math.log(s0.w), Math.log(e.w), f));
    const { x: ax, y: ay } = FOCUS.k1Man;
    let x = lerp(s0.x + ax * s0.w, e.x + ax * e.w, f) - ax * W;
    let y = lerp(s0.y + (ay * s0.w) / A, e.y + (ay * e.w) / A, f) - (ay * W) / A;
    if (W >= w) x = Math.min(0, Math.max(w - W, x));
    if (W / A >= h) y = Math.min(0, Math.max(h - W / A, y));
    return { x, y, w: W, h: W / A, zoom: W / s0.w };
  }
  // Draw only the part of `img` that lands inside the canvas: the smoke band is about four screens
  // wide and the K1 detail layer 3000px, and drawing them whole every frame cost time on software
  // and low-end GPUs (2026-11-08).
  function drawVisible(c, img, dx, dy, dw, dh) {
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    const x0 = Math.max(0, dx);
    const y0 = Math.max(0, dy);
    const x1 = Math.min(w, dx + dw);
    const y1 = Math.min(h, dy + dh);
    if (x1 <= x0 || y1 <= y0) return;
    const sx = ((x0 - dx) / dw) * iw;
    const sy = ((y0 - dy) / dh) * ih;
    c.drawImage(img, sx, sy, ((x1 - x0) / dw) * iw, ((y1 - y0) / dh) * ih, x0, y0, x1 - x0, y1 - y0);
  }
  function k1Cam(f, k2a, fx2, portrait) {
    const img = a.k1;
    if (!img) return;
    const r = k1Rect(f, fx2, portrait);
    const D = ASSETS.k1Detail;
    // The K1 still, then the high-resolution detail layer over it at the same place (its left and
    // top edges are feathered, so the two read as one picture). On portrait screens over K1's plate.
    const drawK1 = (c) => {
      drawVisible(c, img, r.x, r.y, r.w, r.h);
      if (a.k1d && r.zoom > 1.02) drawVisible(c, a.k1d, r.x + D.x0 * r.w, r.y + D.y0 * r.h, (D.x1 - D.x0) * r.w, (D.y1 - D.y0) * r.h);
    };
    if (k2a < 1) {
      if (portrait) plated(drawK1, r, 'k1');
      else drawK1(ctx);
    }
    if (k2a > 0 && a.k2) {
      const M = FOCUS.k1K2Frame;
      const r2 = { x: r.x + M.x0 * r.w, y: r.y + M.y0 * r.h, w: r.w * M.w, h: r.h * M.h };
      if (portrait) group(k2a, () => plated(a.k2, r2, 'c2', 1, CHOREO.phone.hold.x));
      else {
        ctx.globalAlpha = k2a;
        drawVisible(ctx, a.k2, r2.x, r2.y, r2.w, r2.h);
        ctx.globalAlpha = 1;
      }
    }
  }

  // Painted smoke band (smoke.js), built once. `u` 0 = just off the right edge, 1 = gone off the
  // left; the opaque core covers the frame around u = 0.5, and K1 crossfades to K2 under it. A second,
  // slightly larger and fainter pass runs a little ahead and behind it, for depth.
  let smokeTex = null;
  function buildSmoke() {
    if (smokeTex) return;
    const W = 512;
    const H = Math.round((W / SMOKE.span) * SMOKE.tall);
    smokeTex = document.createElement('canvas');
    smokeTex.width = W;
    smokeTex.height = H;
    smokeTex.getContext('2d').putImageData(new ImageData(smokePixels(W, H), W, H), 0, 0);
  }
  function smoke(u, strength = 1) {
    if (import.meta.env.DEV && window.__noSmoke) return; // QA: the bare hand-off
    buildSmoke();
    const travel = (SMOKE.span + 1) * w;
    const tw = SMOKE.span * w;
    const th = SMOKE.tall * w;
    const bob = Math.sin(u * Math.PI) * 0.03 * h;
    ctx.imageSmoothingQuality = 'high';
    // depth pass: bigger, fainter, a touch faster (leads in, trails out)
    const u2 = u * 1.1 - 0.05;
    ctx.globalAlpha = 0.3 * strength;
    drawVisible(ctx, smokeTex, w - u2 * travel - tw * 0.08, h / 2 - (th * 1.15) / 2 - bob, tw * 1.15, th * 1.15);
    ctx.globalAlpha = strength;
    drawVisible(ctx, smokeTex, w - u * travel, h / 2 - th / 2 + bob, tw, th);
    ctx.globalAlpha = 1;
  }

  // The cover framing of an image around image point (fx, fy), as a rect.
  function heldRect(img, fx, fy) {
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    const sc = Math.max(w / iw, h / ih);
    const cw = iw * sc;
    const ch = ih * sc;
    return { x: Math.min(0, Math.max(w - cw, w / 2 - fx * cw)), y: Math.min(0, Math.max(h - ch, h / 2 - fy * ch)), w: cw, h: ch };
  }

  // Portrait views over tall plates (CHOREO.phone). viewRect: where a 16:9 frame lands for view
  // { f, x } (f 0 = cover); zoomed out no further than the plate can still fill the screen.
  const PLATE_FEATHER = 0.12;
  function viewRect(img, f, fx, plateKey) {
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    const cf = (w * ih) / (iw * h); // the share of the width the cover crop shows
    const fit = ASSETS.plates[plateKey]?.fit;
    const m = fit ? Math.min(fit.y0, 1 - fit.y0 - fit.h) / fit.h : 0; // plate above/below, in frame heights
    const fMax = a['p' + plateKey] ? cf * (1 + 2 * m) * 0.97 : cf;
    const ff = Math.min(1, Math.max(cf, Math.min(f || cf, fMax)));
    const fw = w / ff;
    const fh = (fw * ih) / iw;
    const x = Math.min(0, Math.max(w - fw, w / 2 - fx * fw));
    const y = fh >= h ? Math.min(0, Math.max(h - fh, (h - fh) / 2)) : (h - fh) / 2;
    return { x, y, w: fw, h: fh };
  }
  const covers = (r) => r.x <= 0.5 && r.y <= 0.5 && r.x + r.w >= w - 0.5 && r.y + r.h >= h - 0.5;
  // Draw a frame (image, or a draw function) at rect r over its plate; the frame's edges feather
  // into the plate. Without the plate (not loaded yet) it falls back to the plain cover crop.
  function plated(img, r, plateKey, alpha = 1, fx = 0.5) {
    if (!img || alpha <= 0) return;
    if (covers(r)) {
      ctx.globalAlpha = alpha;
      if (typeof img === 'function') img(ctx);
      else drawVisible(ctx, img, r.x, r.y, r.w, r.h);
      ctx.globalAlpha = 1;
      return;
    }
    const P = a['p' + plateKey];
    if (!P) return typeof img === 'function' ? img(ctx) : cover(img, alpha, fx, 0.5, 1);
    const fit = ASSETS.plates[plateKey].fit;
    const pw = r.w / fit.w;
    const ph = (pw * P.naturalHeight) / P.naturalWidth;
    ctx.globalAlpha = alpha;
    drawVisible(ctx, P, r.x - fit.x0 * pw, r.y - fit.y0 * ph, pw, ph);
    ctx.globalAlpha = 1;
    feathered(img, r.x, r.y, r.w, r.h, PLATE_FEATHER, alpha);
  }

  // A small, soft copy of the globe scene with the globe itself painted out (sky and clouds only),
  // scaled down hard and blurred so it upscales smoothly behind the sharp scene.
  function blurredSky(img, fill) {
    const c = document.createElement('canvas');
    c.width = 240;
    c.height = Math.round((240 * (img.naturalHeight || img.height)) / (img.naturalWidth || img.width));
    const x = c.getContext('2d');
    x.drawImage(img, 0, 0, c.width, c.height);
    x.fillStyle = fill;
    x.beginPath();
    x.arc(FOCUS.k4Globe.x * c.width, FOCUS.k4Globe.y * c.height, (FOCUS.k4Globe.d * c.height) / 2 * 1.25, 0, Math.PI * 2);
    x.fill();
    const out = document.createElement('canvas');
    out.width = c.width;
    out.height = c.height;
    const o = out.getContext('2d');
    o.filter = 'blur(8px)';
    o.drawImage(c, -16, -16, c.width + 32, c.height + 32);
    return out;
  }

  // Nearest loaded frame of a sequence, so a fast scroll never paints a blank. If a reader outruns
  // the loader and none of the clip has arrived yet, show what the clip starts on (or, past its
  // middle, ends on): a still, or the neighbouring clip's frame — never a different scene.
  const STAND_IN = { c2: ['k2', 'k2'], c2b: [['c2', 1], ['c3', 0]], c3: [['c2b', 1], 'k4'], c4: ['k4', 'k4'] };
  // Frame indices actually played: every file, minus repeated ones in this tier.
  const order = {};
  const played = (name) =>
    (order[name] ||= [...Array(ASSETS[name].count).keys()].filter((i) => hd || !ASSETS[name].dupes?.includes(i + 1)));
  function frame(name, t) {
    const frames = a.seq[name];
    const n = ASSETS[name]?.count || 0;
    if (frames && n) {
      const list = played(name);
      const i = list[Math.round(clamp01(t) * (list.length - 1))];
      for (let d = 0; d < n; d++) {
        if (frames[i - d]) return frames[i - d];
        if (frames[i + d]) return frames[i + d];
      }
    }
    const s = STAND_IN[name][t < 0.5 ? 0 : 1];
    if (Array.isArray(s)) return a.seq[s[0]]?.some(Boolean) ? frame(s[0], s[1]) : a.k1 || null;
    return a[s] || a.k1 || null;
  }

  // Cross-dissolve weight at the head of a clip: 0 on its first frame, 1 after `dissolveFrames`.
  const dissolve = (name, t) => clamp01((t * (ASSETS[name].count - 1)) / CHOREO.dissolveFrames);

  // Everything the canvas needs at progress p, as a list of draw calls (also the cache key).
  // Each clip opens on the previous clip's last frame and dissolves over its first few frames.
  function layers() {
    const ops = [];
    // Portrait screens (phones, portrait tablets), 2026-11-12: always full-screen. The locked-camera
    // scenes are zoomed-out views over tall painted plates (CHOREO.phone, ASSETS.plates); the moving
    // clips (C2b, C3) keep the cover crop that pans with the action. Wider screens keep fixed points.
    const portrait = w / h < 1;
    const PH = CHOREO.phone;
    const k1 = portrait ? ['view', 'k1', 1, PH.open.f, PH.open.x, 'k1'] : ['img', 'k1', 1, FOCUS.k1Soldier.x, FOCUS.k1Soldier.y, 1];
    const sx = FOCUS.k2Soldier.x;
    // C2 on portrait: zooms out as he fires so body, musket, flash and ball are all on screen, then
    // eases into the cover crop on the ball, where C2b picks up. C2b follows the ball.
    const c2View = (t) => ['vseq', 'c2', t, 1, track(PH.c2f, t), track(PH.c2x, t), 'c2'];
    const swing = (t) => ease(clamp01(t / 0.25));
    const c2bFx = (t) => (portrait ? track(PH.c2b, t) : lerp(FOCUS.k2Soldier.x, FOCUS.c2bBall.x, swing(t)));
    const c2bFy = (t) => lerp(FOCUS.k2Soldier.y, FOCUS.c2bBall.y, swing(t));
    // K2 as the hold and C2's opening frame draw it.
    const c1Last = () => (portrait ? ['view', 'k2', 1, PH.hold.f, PH.hold.x, 'c2'] : ['img', 'k2', 1, sx, FOCUS.k2Soldier.y, 1]);
    const globeFrame = () => (ASSETS.c4 ? ['globe', 'c4', 1, 1] : ['globe', 'k4', 1, 1]);

    if (p < S.c1[0]) {
      ops.push(k1);
    } else if (p < S.k2Hold[0]) {
      const t = local(S.c1, p);
      const P = CHOREO.pushIn;
      // Push-in on a cubic with set start and end speeds: `start` matches how far the first wheel
      // click moved the old clip (measured 2026-11-08), `end` lets it settle onto K2's framing.
      const q = clamp01(t / P.push);
      const [m0, m1] = [P.start, P.end];
      const f = (m0 + m1 - 2) * q ** 3 + (3 - 2 * m0 - m1) * q ** 2 + m0 * q;
      const x = ease(local(P.fade, t)); // K1 -> K2, same man in the same place
      ops.push(x < 1 ? ['k1cam', f, x, sx, portrait ? 1 : 0] : c1Last());
      const u = local(P.wipe, t); // light smoke drifting across, densest mid-crossfade
      if (u > 0 && u < 1) ops.push(['smoke', u, P.smoke]);
    } else if (p < S.c2[0]) {
      // Hold on C1's own last frame (≈ K2), so the hold and the clip before it never jump.
      ops.push(c1Last());
    } else if (p < S.c2b[0]) {
      const t = local(S.c2, p);
      const d = dissolve('c2', t);
      if (d < 1) ops.push(c1Last());
      ops.push(portrait ? [...c2View(t).slice(0, 3), d, ...c2View(t).slice(4)] : ['seq', 'c2', t, d, sx, FOCUS.k2Soldier.y, 1]);
    } else if (p < S.c3[0]) {
      const t = local(S.c2b, p);
      const d = dissolve('c2b', t);
      if (d < 1) ops.push(portrait ? c2View(1) : ['seq', 'c2', 1, 1, sx, FOCUS.k2Soldier.y, 1]);
      ops.push(['seq', 'c2b', t, d, c2bFx(t), c2bFy(t), 1]);
    } else if (p < S.k4Hold[0]) {
      const t = local(S.c3, p);
      if (ASSETS.c3) {
        // C3 is drawn on the globe's own placement: full-frame at first, then (c3Settle) its globe
        // eases down onto the 50% circle, so it hands C4 a globe of exactly the same size.
        const ct = remap(CHOREO.c3Remap, t);
        const frameT = clamp01(ct);
        const d = dissolve('c3', frameT);
        if (d < 1) ops.push(['seq', 'c2b', 1, 1, c2bFx(1), c2bFy(1)]);
        ops.push(['c3', frameT, d, lerp(1, 0, sine(local(CHOREO.c3Settle, t)))]);
      } else {
        // Placeholder: rise from the last C2b frame and dissolve into the globe.
        ops.push(['seq', 'c2b', 1, 1, FOCUS.c2bBall.x, FOCUS.c2bBall.y, lerp(1, 1.5, ease(t))]);
        const x = ease(clamp01((t - 0.25) / 0.6));
        if (x > 0) ops.push(['globe', 'k4', x, lerp(1.6, 1, ease(t))]);
      }
    } else if (p < S.toBrand[0]) {
      // C4: the orbit, with the stretch where the ball is behind the globe compressed.
      const t = local(S.k4Hold, p);
      ops.push(ASSETS.c4 ? ['globe', 'c4', 1, 1, remap(CHOREO.c4Remap, t)] : ['globe', 'k4', 1, 1]);
    } else if (p < S.toLogo[0]) {
      ops.push(globeFrame().concat(1), ['globe', 'duo', sine(local(S.toBrand, p)), 1]);
    } else if (p < S.toSite[0]) {
      // Two overlapping stages, never a full-frame mix of navy and paper: the navy sky clears to
      // paper around the globe first, then the globe disc dissolves into the logo's ring.
      const t = local(S.toLogo, p);
      const sky = sine(clamp01(t / 0.55));
      const disc = 1 - sine(clamp01((t - 0.35) / 0.65));
      const logo = sine(clamp01((t - 0.3) / 0.7));
      ops.push(['paper'], ['disc', disc], ['globe', 'duo', 1 - sky, 1], ['logo', logo, 1]);
    } else {
      const t = sine(local(S.toSite, p));
      ops.push(['paper'], ['logo', 1, lerp(1, 0.78, t)]);
    }
    return ops;
  }

  function paint() {
    queued = false;
    if (!w || !h) return;
    const ops = layers();
    const key = JSON.stringify(ops.map((o) => o.map((v) => (typeof v === 'number' ? +v.toFixed(4) : v))));
    if (key === lastKey) return; // nothing changed — skip the paint
    lastKey = key;
    ctx.clearRect(0, 0, w, h);
    for (const [kind, ...rest] of ops) {
      if (kind === 'paper') {
        ctx.fillStyle = PAPER;
        ctx.fillRect(0, 0, w, h);
      } else if (kind === 'k1cam') {
        k1Cam(rest[0], rest[1], rest[2], rest[3]);
      } else if (kind === 'smoke') {
        smoke(rest[0], rest[1]);
      } else if (kind === 'img') {
        const [name, alpha, fx, fy, z] = rest;
        cover(a[name], alpha, fx, fy, z);
      } else if (kind === 'seq') {
        const [name, t, alpha, fx, fy, z = 1] = rest;
        cover(frame(name, t), alpha, fx, fy, z);
      } else if (kind === 'view' || kind === 'vseq') {
        // Portrait: a still (view) or clip frame (vseq) at view { f, x } over its plate.
        const [name, t, alpha, f, fx, plateKey] = kind === 'view' ? [rest[0], 0, ...rest.slice(1)] : rest;
        const img = kind === 'view' ? a[name] : frame(name, t);
        if (img) plated(img, viewRect(img, f, fx, plateKey), plateKey, alpha, fx);
      } else if (kind === 'globe') {
        // Build the whole globe layer (sky + globe + feathered edges) at full strength, then fade it
        // as one piece — fading the parts separately leaves a seam at the image edge.
        const [name, alpha, scale, t = 1] = rest;
        const img = name === 'c4' ? frame('c4', t) : a[name];
        const blurred = name === 'duo' ? a.duoBlur : a.k4Blur;
        group(alpha, () => {
          ctx.fillStyle = name === 'duo' ? `rgb(${NAVY})` : skyFill;
          ctx.fillRect(0, 0, w, h);
          globeScene(img, blurred, scale, name === 'duo' ? a.duoPlate : a.pk4);
        });
      } else if (kind === 'disc') {
        // The brand globe alone, clipped to the shared circle (no sky), for the hand-off to the logo.
        const [alpha] = rest;
        const img = a.duo;
        if (img && alpha > 0) {
          const iw = img.naturalWidth || img.width;
          const ih = img.naturalHeight || img.height;
          const c = circleTarget(w, h);
          const g = FOCUS.k4Globe;
          const sc = c.d / (g.d * ih);
          ctx.save();
          ctx.beginPath();
          ctx.arc(c.x, c.y, c.d / 2, 0, Math.PI * 2);
          ctx.clip();
          ctx.globalAlpha = alpha;
          ctx.drawImage(img, c.x - g.x * iw * sc, c.y - g.y * ih * sc, iw * sc, ih * sc);
          ctx.restore();
        }
      } else if (kind === 'c3') {
        // `zoom` 1 = cover the frame around the globe, 0 = globe on the 50% circle (as C4 draws it).
        const [t, alpha, zoom] = rest;
        const img = frame('c3', t);
        if (img) {
          const iw = img.naturalWidth;
          const ih = img.naturalHeight;
          const g = FOCUS.k4Globe;
          const coverSc = Math.max(w / (2 * Math.min(g.x, 1 - g.x) * iw), h / (2 * Math.min(g.y, 1 - g.y) * ih));
          const coverScale = (coverSc * g.d * ih) / circleTarget(w, h).d;
          const scale = lerp(1, Math.max(1, coverScale), zoom);
          group(alpha, () => {
            ctx.fillStyle = skyFill;
            ctx.fillRect(0, 0, w, h);
            globeScene(img, a.k4Blur, scale, a.pk4);
          });
        }
      } else if (kind === 'logo') {
        // Navy ink on a transparent ground (multiply keeps it looking printed on the paper).
        const [alpha, scale] = rest;
        ctx.globalCompositeOperation = 'multiply';
        ctx.globalAlpha = alpha;
        onCircle(a.logo, FOCUS.logoRing, true, scale);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
      }
    }
  }

  // Paint on the next animation frame; the timer only fires if frames are suspended (hidden tab),
  // so the canvas is never left showing a stale scene. `paint` is a no-op when nothing changed.
  function request() {
    if (!queued) {
      queued = true;
      requestAnimationFrame(paint);
      setTimeout(() => queued && paint(), 150);
    }
  }

  // Post-processing that depends on a still, run the moment it arrives.
  function onStill(key, img) {
    if (key === 'k4' && img) {
      a.duo = duotone(img);
      // The sky colour just inside the top edge fills around the zoomed-out globe.
      const probe = document.createElement('canvas').getContext('2d');
      probe.drawImage(img, img.naturalWidth * 0.1, img.naturalHeight * 0.04, 8, 8, 0, 0, 1, 1);
      const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
      skyFill = `rgb(${r},${g},${b})`;
      a.k4Blur = blurredSky(img, skyFill);
      a.duoBlur = blurredSky(a.duo, `rgb(${NAVY})`);
    }
    if (key === 'pk4' && img) a.duoPlate = duotone(img);
    // The stacked logo is a vector: rasterize it once, large enough to stay sharp on retina.
    a[key] = key === 'logo' && img ? rasterize(img, 2400) : img;
  }

  // Frames load just ahead of the scroll position, not all at once. Every job carries the scroll
  // position where it is first needed; workers always take the pending job nearest ahead of the
  // reader, within a window. Inside a clip every 4th frame comes first, so a fast scrub still has
  // frames to show while the in-betweens arrive.
  const AHEAD = saveData ? 10 : phone ? 18 : 30; // % of the hero to keep loaded ahead
  const BEHIND = 6; // and a little behind, for scrolling back
  const SEG = { c2: S.c2, c2b: S.c2b, c3: S.c3, c4: S.k4Hold };
  const REMAP = { c3: CHOREO.c3Remap, c4: CHOREO.c4Remap };
  const invert = (points, f) => remap(points.map(([x, y]) => [y, x]), f);
  const jobs = [];
  const waiting = []; // workers parked until the reader scrolls

  function buildJobs() {
    // Priority is "where in the hero it's needed" plus a lead for the in-betweens: every 4th frame
    // first, then every 2nd, then the rest. On a slow connection the reader then always has a frame
    // a few steps away instead of the loader trailing behind them (2026-11-08: a slow-4G phone that
    // swiped straight into C1 showed frames 10–19 behind, then a jump when they landed).
    const add = (key, src, at, step = 4) => jobs.push({ key, src, at, lead: step === 4 ? 0 : step === 2 ? 3 : 6 });
    add('k1', still(ASSETS.k1), 0);
    if (tall) {
      const P = (k) => `${ASSETS.base}/m/${ASSETS.plates[k].name}.webp`;
      add('pc2', P('c2'), S.c1[0] + 8);
      add('pk4', P('k4'), S.c3[0] + 2);
    }
    // C1 is the K1 painting itself: its detail layer next, then K2 (under the smoke at ~21%).
    add('k1d', `${ASSETS.base}/${ASSETS.k1Detail.name}-${phone ? 'm' : size()}.webp`, S.c1[0]);
    add('k2', still(ASSETS.k2), S.c1[0] + 8);
    add('k4', still(ASSETS.k4), S.c3[0] + 2);
    add('logo', ASSETS.logo, S.toLogo[0] - 6);
    for (const name of Object.keys(SEG)) {
      const s = ASSETS[name];
      if (!s) continue;
      a.seq[name] = [];
      const [from, to] = SEG[name];
      const list = played(name);
      for (const i of list) {
        const f = list.indexOf(i) / (list.length - 1);
        const t = REMAP[name] ? invert(REMAP[name], f) : f;
        const src = `${ASSETS.base}/${phone ? 'm/' : hd ? 'hd/' : ''}${s.dir}/${(s.fix?.[i + 1] || s.pattern.replace('%04d', String(i + 1).padStart(4, '0')))}`;
        add(`${name}:${i}`, src, from + t * (to - from), i % 4 === 0 ? 4 : i % 2 === 0 ? 2 : 1);
      }
    }
  }

  // Nearest pending job ahead of the reader (or just behind), within the window; null if none.
  function nextJob() {
    let best = -1;
    let bestScore = Infinity;
    for (let i = 0; i < jobs.length; i++) {
      const d = (jobs[i].at - p) * dir; // "ahead" in the direction the reader is scrolling
      if (d > AHEAD || d < -BEHIND) continue;
      const score = (d >= 0 ? d : -d * 3) + jobs[i].lead;
      if (score < bestScore) {
        bestScore = score;
        best = i;
      }
    }
    // Nothing left in the window: fetch any remaining still (globe, logo) so a reader who skips
    // ahead or scrolls back up into the hero from below still finds them. Only once they've started
    // scrolling: the globe's duotone pass is heavy, and it shouldn't run while the page is opening.
    if (best < 0 && p > 0) best = jobs.findIndex((j) => !j.key.includes(':'));
    return best < 0 ? null : jobs.splice(best, 1)[0];
  }

  async function load() {
    buildJobs();
    const initial = jobs.filter((j) => j.at <= AHEAD).length;
    let initialDone = 0;
    const k1Job = jobs.splice(0, 1)[0];
    // The opening frame first (on portrait screens with its plate, so the opening is never a crop
    // that then jumps to the zoomed-out view).
    const [k1, pk1] = await Promise.all([loadImage(k1Job.src), tall ? loadImage(`${ASSETS.base}/m/${ASSETS.plates.k1.name}.webp`) : null]);
    if (!k1) return onFail();
    if (pk1) onStill('pk1', pk1);
    onStill('k1', k1);
    let initialFailed = 0;
    onProgress(++initialDone / initial, true);
    request();
    // Clip frames start as soon as the opening painting is in (not when the preloader lifts): the
    // push-in begins on the first scroll, so its frames have to be on their way already.
    const worker = async () => {
      for (;;) {
        const job = nextJob();
        if (!job) {
          if (!jobs.length) return;
          await new Promise((r) => waiting.push(r)); // nothing in the window yet; wait for scroll
          continue;
        }
        const img = await loadImage(job.src);
        if (!img && job.at <= AHEAD && ++initialFailed > initial * 0.3) return onFail();
        const [name, idx] = job.key.split(':');
        if (idx !== undefined) a.seq[name][+idx] = img;
        else onStill(job.key, img);
        if (job.at <= AHEAD) onProgress(Math.min(1, ++initialDone / initial), false);
        lastKey = '';
        request();
      }
    };
    await Promise.all(Array.from({ length: 6 }, worker));
  }

  window.addEventListener('resize', resize);
  // The mobile toolbar resizes the visual viewport; re-measure the canvas and redraw the current
  // frame (no scroll or ScrollTrigger refresh is involved).
  window.visualViewport?.addEventListener('resize', resize);
  resize();
  load();

  return {
    set(progress) {
      if (Math.abs(progress - p) > 0.01) dir = progress < p ? -1 : 1;
      p = progress;
      waiting.splice(0).forEach((resume) => resume()); // the window moved: look again
      request();
    },
    circle: () => circleTarget(w, h),
    // Dev-only inspection of the loader (see main.js).
    debug: () => ({ p, pending: jobs.length, parked: waiting.length, phone, hd, AHEAD }),
  };
}
