// Hero stage: loads the stills and frame sequences, then paints one canvas from a scroll position
// (0–100). Paints only on requestAnimationFrame and only when the computed layers change.
import { CHOREO, ASSETS, FOCUS, circleTarget } from './choreography.js';

const S = CHOREO.scenes;
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const local = ([a, b], p) => clamp01((p - a) / (b - a));
const ease = (t) => t * t * (3 - 2 * t); // smoothstep
const lerp = (a, b, t) => a + (b - a) * t;
const PAPER = '#F7F4EC';
const NAVY = [3, 34, 73];
const PAPER_RGB = [247, 244, 236];
// On portrait screens C2 drifts from the soldier toward this point so muzzle and ball stay visible.
// Weighted toward the ball: on a 375px phone the visible slice is only ~26% of the frame wide.
const NARROW_FLIGHT_X = FOCUS.c2Muzzle.x * 0.4 + FOCUS.c2Ball.x * 0.6;

const loadImage = (src) =>
  new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null); // a missing frame never blocks the hero
    img.src = src;
  });

// Navy/off-white duotone of the painted globe — placeholder for the brand-colored globe.
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

// The logo file sits on a warm near-white; force it to pure white so `multiply` hides it fully.
function whiten(img) {
  const c = document.createElement('canvas');
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const id = ctx.getImageData(0, 0, c.width, c.height);
  const d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    const l = (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255;
    if (l > 0.93) d[i] = d[i + 1] = d[i + 2] = 255;
  }
  ctx.putImageData(id, 0, 0);
  return c;
}

export function createStage(canvas, onProgress) {
  let ctx = canvas.getContext('2d'); // reassigned while drawing into an offscreen group
  const a = { c2: [] };
  let p = 0;
  let w = 0;
  let h = 0;
  let lastKey = '';
  let queued = false;
  let k4Bg = '#0b1426';

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

  const size = () => (window.innerWidth >= 1100 ? 1920 : 1280);
  const still = (name) => `${ASSETS.base}/${name}-${size()}.webp`;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
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
    let dx = Math.min(0, Math.max(w - dw, w / 2 - fx * dw));
    let dy = Math.min(0, Math.max(h - dh, h / 2 - fy * dh));
    const px = dx + fx * dw;
    const py = dy + fy * dh;
    ctx.globalAlpha = alpha;
    ctx.drawImage(img, px - (px - dx) * z, py - (py - dy) * z, dw * z, dh * z);
    ctx.globalAlpha = 1;
  }

  // Draw a still so that a known circle inside it (cx, cy as image fractions, d as fraction of
  // image height or width) lands exactly on the shared circle target.
  // If the image ends up smaller than the frame, its edges fade into `edgeFill` so no seam shows.
  function onCircle(img, alpha, circle, dOfWidth, scale = 1, edgeFill = null) {
    if (!img || alpha <= 0) return;
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    const t = circleTarget(w, h);
    const sc = (t.d * scale) / (circle.d * (dOfWidth ? iw : ih));
    const x0 = t.x - circle.x * iw * sc;
    const y0 = t.y - circle.y * ih * sc;
    const dw = iw * sc;
    const dh = ih * sc;
    ctx.globalAlpha = alpha;
    ctx.drawImage(img, x0, y0, dw, dh);
    if (edgeFill) {
      const f = Math.min(dw, dh) * 0.14;
      const band = (gx0, gy0, gx1, gy1, rx, ry, rw, rh) => {
        const g = ctx.createLinearGradient(gx0, gy0, gx1, gy1);
        g.addColorStop(0, edgeFill);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(rx, ry, rw, rh);
      };
      if (y0 > 0) band(0, y0, 0, y0 + f, x0, y0, dw, f);
      if (y0 + dh < h) band(0, y0 + dh, 0, y0 + dh - f, x0, y0 + dh - f, dw, f);
      if (x0 > 0) band(x0, 0, x0 + f, 0, x0, y0, f, dh);
      if (x0 + dw < w) band(x0 + dw, 0, x0 + dw - f, 0, x0 + dw - f, y0, f, dh);
    }
    ctx.globalAlpha = 1;
  }

  // Nearest loaded frame, so a fast scroll never paints a blank.
  function c2Frame(t) {
    const n = ASSETS.c2.count;
    const i = Math.round(t * (n - 1));
    for (let d = 0; d < n; d++) {
      if (a.c2[i - d]) return a.c2[i - d];
      if (a.c2[i + d]) return a.c2[i + d];
    }
    return a.k2 || null;
  }

  // Everything the canvas needs at progress p, as a list of draw calls plus a cache key.
  function layers() {
    const ops = [];
    const narrow = w / h < 1;
    if (p < S.c1[0]) {
      ops.push(['k1', 1, FOCUS.k1Soldier.x, FOCUS.k1Soldier.y, 1]);
    } else if (p < S.k2Hold[0]) {
      // C1 placeholder: push in on the soldier in K1, then dissolve to K2.
      const t = local(S.c1, p);
      const zt = ease(clamp01(t / 0.85));
      ops.push(['k1', 1, FOCUS.k1Soldier.x, FOCUS.k1Soldier.y, lerp(1, 2.4, zt)]);
      const x = ease(clamp01((t - 0.55) / 0.45));
      if (x > 0) ops.push(['k2', x, FOCUS.k2Soldier.x, FOCUS.k2Soldier.y, lerp(1.35, 1, x)]);
    } else if (p < S.c2[0]) {
      ops.push(['k2', 1, FOCUS.k2Soldier.x, FOCUS.k2Soldier.y, 1]);
    } else if (p < S.c3[0]) {
      const t = local(S.c2, p);
      // On portrait screens drift the crop from the soldier toward the muzzle so the shot is seen.
      // and the ball is still in frame during the mid-flight hold.
      const fx = narrow ? lerp(FOCUS.k2Soldier.x, NARROW_FLIGHT_X, ease(t)) : FOCUS.k2Soldier.x;
      ops.push(['c2', t, fx, FOCUS.k2Soldier.y]);
    } else if (p < S.k4Hold[0]) {
      // C3 placeholder: follow the ball out of the last C2 frame, dissolve into the globe.
      const t = local(S.c3, p);
      const fx = narrow ? NARROW_FLIGHT_X : FOCUS.k2Soldier.x;
      ops.push(['c2', 1, lerp(fx, FOCUS.c2Ball.x, ease(clamp01(t / 0.6))), FOCUS.c2Ball.y, lerp(1, 2.2, ease(clamp01(t / 0.7)))]);
      const x = ease(clamp01((t - 0.3) / 0.55));
      if (x > 0) ops.push(['k4', x, lerp(1.6, 1, ease(t))]);
    } else if (p < S.toBrand[0]) {
      ops.push(['k4', 1, 1]);
    } else if (p < S.toLogo[0]) {
      ops.push(['k4', 1, 1], ['duo', ease(local(S.toBrand, p))]);
    } else if (p < S.toSite[0]) {
      const t = ease(local(S.toLogo, p));
      ops.push(['paper', 1], ['duo', 1 - t], ['logo', t, 1]);
    } else {
      const t = ease(local(S.toSite, p));
      ops.push(['paper', 1], ['logo', 1, lerp(1, 0.62, t)]);
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
    for (const [kind, alpha, ...rest] of ops) {
      if (kind === 'paper') {
        ctx.fillStyle = PAPER;
        ctx.fillRect(0, 0, w, h);
      } else if (kind === 'c2') {
        const [t, fx, fy, z = 1] = [alpha, ...rest];
        cover(c2Frame(t), 1, fx, fy, z);
      } else if (kind === 'k4' || kind === 'duo') {
        // Build the whole globe layer (sky fill + globe + feathered edges) at full strength, then
        // fade it as one piece — fading the parts separately leaves a seam at the image edge.
        const img = kind === 'k4' ? a.k4 : a.duo;
        const scale = kind === 'k4' ? rest[0] : 1;
        const fill = kind === 'k4' ? k4Bg : `rgb(${NAVY})`;
        group(alpha, () => {
          ctx.fillStyle = fill;
          ctx.fillRect(0, 0, w, h);
          onCircle(img, 1, FOCUS.k4Globe, false, scale, fill);
        });
      } else if (kind === 'logo') {
        // The logo sits on white; multiply drops the white onto the paper.
        ctx.globalCompositeOperation = 'multiply';
        onCircle(a.logo, alpha, FOCUS.logoRing, true, rest[0]);
        ctx.globalCompositeOperation = 'source-over';
      } else {
        cover(a[kind], alpha, ...rest);
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

  async function load() {
    const frameName = (i) => ASSETS.c2.pattern.replace('%04d', String(i + 1).padStart(4, '0'));
    const jobs = [
      ['k1', still(ASSETS.k1)],
      ['k2', still(ASSETS.k2)],
      ...Array.from({ length: ASSETS.c2.count }, (_, i) => [`c2:${i}`, `${ASSETS.base}/${ASSETS.c2.dir}/${frameName(i)}`]),
      ['k4', still(ASSETS.k4)],
      ['logo', `${ASSETS.base}/${ASSETS.logo}`],
    ];
    let done = 0;
    a.k1 = await loadImage(jobs[0][1]); // the opening frame first, alone
    onProgress(++done / jobs.length);
    request();
    // The rest in parallel, a few at a time.
    const queue = jobs.slice(1);
    const worker = async () => {
      while (queue.length) {
        const [key, src] = queue.shift();
        const img = await loadImage(src);
        if (key.startsWith('c2:')) a.c2[+key.slice(3)] = img;
        else a[key] = img;
        onProgress(++done / jobs.length);
        lastKey = '';
        request();
      }
    };
    await Promise.all(Array.from({ length: 6 }, worker));
    if (a.k4) {
      a.duo = duotone(a.k4);
      // The sky colour just inside the top edge fills around the zoomed-out globe.
      const probe = document.createElement('canvas').getContext('2d');
      probe.drawImage(a.k4, a.k4.naturalWidth * 0.1, a.k4.naturalHeight * 0.04, 8, 8, 0, 0, 1, 1);
      const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
      k4Bg = `rgb(${r},${g},${b})`;
    }
    if (a.logo) a.logo = whiten(a.logo);
    lastKey = '';
    request();
  }

  window.addEventListener('resize', resize);
  resize();
  load();

  return {
    set(progress) {
      p = progress;
      request();
    },
    circle: () => circleTarget(w, h),
  };
}
