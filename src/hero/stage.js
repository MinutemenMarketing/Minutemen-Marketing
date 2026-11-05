// Hero stage: loads the stills and frame sequences, then paints one canvas from a scroll position
// (0–100). Paints only on requestAnimationFrame and only when the computed layers change.
import { CHOREO, ASSETS, FOCUS, circleTarget } from './choreography.js';

const S = CHOREO.scenes;
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const local = ([a, b], p) => clamp01((p - a) / (b - a));
const ease = (t) => t * t * (3 - 2 * t); // smoothstep
const sine = (t) => 0.5 - 0.5 * Math.cos(Math.PI * t); // slow in, slow out — the globe fades
const lerp = (a, b, t) => a + (b - a) * t;
const PAPER = '#F7F4EC';
const NAVY = [3, 34, 73];
const PAPER_RGB = [247, 244, 236];
// On portrait screens C2 drifts from the soldier toward this point so muzzle and ball stay visible.
// Weighted toward the ball: on a 375px phone the visible slice is only ~26% of the frame wide.
const NARROW_FLIGHT_X = FOCUS.c2Muzzle.x * 0.4 + FOCUS.c2Ball.x * 0.6;

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
  const a = { seq: {} };
  let p = 0;
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
  function globeScene(img, blurred, scale) {
    if (!img) return;
    cover(blurred, 1, 0.5, 0.5, 1);
    if (edgeLayer.width !== canvas.width || edgeLayer.height !== canvas.height) {
      edgeLayer.width = canvas.width;
      edgeLayer.height = canvas.height;
    }
    const e = edgeLayer.getContext('2d');
    e.setTransform(ctx.getTransform());
    e.clearRect(0, 0, w, h);
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    const t = circleTarget(w, h);
    const sc = (t.d * scale) / (FOCUS.k4Globe.d * ih);
    const x0 = t.x - FOCUS.k4Globe.x * iw * sc;
    const y0 = t.y - FOCUS.k4Globe.y * ih * sc;
    const dw = iw * sc;
    const dh = ih * sc;
    e.drawImage(img, x0, y0, dw, dh);
    e.globalCompositeOperation = 'destination-out';
    const f = Math.min(dw, dh) * 0.22;
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
    ctx.drawImage(edgeLayer, 0, 0);
    ctx.restore();
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
  // the loader and none of the clip has arrived yet, show the still it starts or ends on.
  const STAND_IN = { c1: 'k1', c2: 'k2', c2b: 'k2', c3: 'k4', c4: 'k4' };
  function frame(name, t) {
    const frames = a.seq[name];
    const n = ASSETS[name]?.count || 0;
    if (frames && n) {
      const i = Math.round(clamp01(t) * (n - 1));
      for (let d = 0; d < n; d++) {
        if (frames[i - d]) return frames[i - d];
        if (frames[i + d]) return frames[i + d];
      }
    }
    return a[STAND_IN[name]] || a.k1 || null;
  }

  // Cross-dissolve weight at the head of a clip: 0 on its first frame, 1 after `dissolveFrames`.
  const dissolve = (name, t) => clamp01((t * (ASSETS[name].count - 1)) / CHOREO.dissolveFrames);

  // Everything the canvas needs at progress p, as a list of draw calls (also the cache key).
  // Each clip opens on the previous clip's last frame and dissolves over its first few frames.
  function layers() {
    const ops = [];
    const narrow = w / h < 1;
    const k1 = ['img', 'k1', 1, FOCUS.k1Soldier.x, FOCUS.k1Soldier.y, 1];
    const k2 = (alpha = 1, z = 1) => ['img', 'k2', alpha, FOCUS.k2Soldier.x, FOCUS.k2Soldier.y, z];
    const c2Fx = (t) => (narrow ? lerp(FOCUS.k2Soldier.x, NARROW_FLIGHT_X, ease(t)) : FOCUS.k2Soldier.x);
    // C2b opens on C2's crop (so the join dissolve lines up) and drifts to the ball as the camera swings.
    const swing = (t) => ease(clamp01(t / 0.25));
    const c2bFx = (t) => lerp(c2Fx(1), FOCUS.c2bBall.x, swing(t));
    const c2bFy = (t) => lerp(FOCUS.k2Soldier.y, FOCUS.c2bBall.y, swing(t));
    const c1Last = () => (ASSETS.c1 ? ['seq', 'c1', 1, 1, FOCUS.k2Soldier.x, FOCUS.k2Soldier.y] : k2());
    const globeFrame = () => (ASSETS.c4 ? ['globe', 'c4', 1, 1] : ['globe', 'k4', 1, 1]);

    if (p < S.c1[0]) {
      ops.push(k1);
    } else if (p < S.k2Hold[0]) {
      const t = local(S.c1, p);
      if (ASSETS.c1) {
        // C1 opens on K1 and ends on K2, so its crop travels from K1's focus to K2's.
        const d = dissolve('c1', t);
        if (d < 1) ops.push(k1);
        const f = ease(t);
        ops.push(['seq', 'c1', t, d, lerp(FOCUS.k1Soldier.x, FOCUS.k2Soldier.x, f), lerp(FOCUS.k1Soldier.y, FOCUS.k2Soldier.y, f)]);
      } else {
        // Placeholder: push in on the soldier in K1, then dissolve to K2.
        ops.push(['img', 'k1', 1, FOCUS.k1Soldier.x, FOCUS.k1Soldier.y, lerp(1, 2.4, ease(clamp01(t / 0.85)))]);
        const x = ease(clamp01((t - 0.55) / 0.45));
        if (x > 0) ops.push(k2(x, lerp(1.35, 1, x)));
      }
    } else if (p < S.c2[0]) {
      // Hold on C1's own last frame (≈ K2), so the hold and the clip before it never jump.
      ops.push(c1Last());
    } else if (p < S.c2b[0]) {
      const t = local(S.c2, p);
      const d = dissolve('c2', t);
      if (d < 1) ops.push(c1Last());
      ops.push(['seq', 'c2', t, d, c2Fx(t), FOCUS.k2Soldier.y]);
    } else if (p < S.c3[0]) {
      const t = local(S.c2b, p);
      const d = dissolve('c2b', t);
      if (d < 1) ops.push(['seq', 'c2', 1, 1, c2Fx(1), FOCUS.k2Soldier.y]);
      ops.push(['seq', 'c2b', t, d, c2bFx(t), c2bFy(t)]);
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
      const t = sine(local(S.toLogo, p));
      ops.push(['paper'], ['globe', 'duo', 1 - t, 1], ['logo', t, 1]);
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
      } else if (kind === 'img') {
        const [name, alpha, fx, fy, z] = rest;
        cover(a[name], alpha, fx, fy, z);
      } else if (kind === 'seq') {
        const [name, t, alpha, fx, fy, z = 1] = rest;
        cover(frame(name, t), alpha, fx, fy, z);
      } else if (kind === 'globe') {
        // Build the whole globe layer (sky + globe + feathered edges) at full strength, then fade it
        // as one piece — fading the parts separately leaves a seam at the image edge.
        const [name, alpha, scale, t = 1] = rest;
        const img = name === 'c4' ? frame('c4', t) : a[name];
        const blurred = name === 'duo' ? a.duoBlur : a.k4Blur;
        group(alpha, () => {
          ctx.fillStyle = name === 'duo' ? `rgb(${NAVY})` : skyFill;
          ctx.fillRect(0, 0, w, h);
          globeScene(img, blurred, scale);
        });
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
            globeScene(img, a.k4Blur, scale);
          });
        }
      } else if (kind === 'logo') {
        // The logo sits on white; multiply drops the white onto the paper.
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
    a[key] = key === 'logo' && img ? whiten(img) : img;
  }

  // Frames load just ahead of the scroll position, not all at once. Every job carries the scroll
  // position where it is first needed; workers always take the pending job nearest ahead of the
  // reader, within a window. Inside a clip every 4th frame comes first, so a fast scrub still has
  // frames to show while the in-betweens arrive.
  const phone = window.innerWidth < 768;
  const saveData = navigator.connection?.saveData;
  const AHEAD = saveData ? 10 : phone ? 18 : 30; // % of the hero to keep loaded ahead
  const BEHIND = 6; // and a little behind, for scrolling back
  const SEG = { c1: S.c1, c2: S.c2, c2b: S.c2b, c3: S.c3, c4: S.k4Hold };
  const REMAP = { c3: CHOREO.c3Remap, c4: CHOREO.c4Remap };
  const invert = (points, f) => remap(points.map(([x, y]) => [y, x]), f);
  const jobs = [];
  const waiting = []; // workers parked until the reader scrolls

  function buildJobs() {
    const add = (key, src, at, coarse = true) => jobs.push({ key, src, at: at + (coarse ? 0 : 1.2) });
    add('k1', still(ASSETS.k1), 0);
    add('k2', still(ASSETS.k2), S.k2Hold[0] - 4);
    add('k4', still(ASSETS.k4), S.c3[0] + 2);
    add('logo', `${ASSETS.base}/${ASSETS.logo}`, S.toLogo[0] - 6);
    for (const name of Object.keys(SEG)) {
      const s = ASSETS[name];
      if (!s) continue;
      a.seq[name] = [];
      const [from, to] = SEG[name];
      for (let i = 0; i < s.count; i++) {
        const f = i / (s.count - 1);
        const t = REMAP[name] ? invert(REMAP[name], f) : f;
        const src = `${ASSETS.base}/${phone ? 'm/' : ''}${s.dir}/${s.pattern.replace('%04d', String(i + 1).padStart(4, '0'))}`;
        add(`${name}:${i}`, src, from + t * (to - from), i % 4 === 0);
      }
    }
  }

  // Nearest pending job ahead of the reader (or just behind), within the window; null if none.
  function nextJob() {
    let best = -1;
    let bestScore = Infinity;
    for (let i = 0; i < jobs.length; i++) {
      const d = jobs[i].at - p;
      if (d > AHEAD || d < -BEHIND) continue;
      const score = d >= 0 ? d : -d * 3;
      if (score < bestScore) {
        bestScore = score;
        best = i;
      }
    }
    return best < 0 ? null : jobs.splice(best, 1)[0];
  }

  async function load() {
    buildJobs();
    const initial = jobs.filter((j) => j.at <= AHEAD).length;
    let initialDone = 0;
    const k1Job = jobs.splice(0, 1)[0];
    onStill('k1', await loadImage(k1Job.src)); // the opening frame first, alone
    onProgress(++initialDone / initial, true);
    request();
    const worker = async () => {
      for (;;) {
        const job = nextJob();
        if (!job) {
          if (!jobs.length) return;
          await new Promise((r) => waiting.push(r)); // nothing in the window yet; wait for scroll
          continue;
        }
        const img = await loadImage(job.src);
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
  resize();
  load();

  return {
    set(progress) {
      p = progress;
      waiting.splice(0).forEach((resume) => resume()); // the window moved: look again
      request();
    },
    circle: () => circleTarget(w, h),
    // Dev-only inspection of the loader (see main.js).
    debug: () => ({ p, pending: jobs.length, parked: waiting.length, phone, AHEAD }),
  };
}
