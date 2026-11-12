// Full hero pass on the live site. Every rAF logs p and beats 2/3 effective opacity.
// node qa/hero-pass.mjs [baseUrl] [--collide-only] [--shots <dir>] [--selftest]
// Part 1 (scroll runs): wheel, trackpad, touch, slow 4G; beats show once per direction, no flashes.
// Part 2 (collision check): at every beat, at 375/390/430/768/1280/1920px, no control box (motion
// toggle, Skip, Scroll cue, progress line) may overlap any word of hero text. Each beat is checked
// with the controls both under the nav and up in its space.
import { chromium, webkit, devices } from 'playwright';
const args = process.argv.slice(2);
const BASE = args.find((a) => a.startsWith('http')) || 'https://minutemenmarketing.com';
const COLLIDE_ONLY = args.includes('--collide-only');
// --selftest pins the controls onto beat 1 so the overlap check must fail (proves it can).
const SELFTEST = args.includes('--selftest');
const SHOTS = args.includes('--shots') ? args[args.indexOf('--shots') + 1] : null;
const SLOW4G = { offline: false, latency: 150, downloadThroughput: (1.6e6 / 8) * 0.9, uploadThroughput: (750e3 / 8) * 0.9 };
const runs = [
  ['Desktop wheel', chromium, { viewport: { width: 1440, height: 900 } }, 'wheel', false],
  ['Desktop wheel, slow 4G', chromium, { viewport: { width: 1440, height: 900 } }, 'wheel', true],
  ['Desktop trackpad', chromium, { viewport: { width: 1280, height: 800 } }, 'trackpad', false],
  ['Edge wheel', chromium, { viewport: { width: 1920, height: 1080 } }, 'wheel', false, 'msedge'],
  ['iPhone 14 (WebKit) swipe', webkit, { ...devices['iPhone 14'] }, 'swipe', false],
  ['Android S9+ swipe', chromium, { ...devices['Galaxy S9+'] }, 'touch', false],
  ['Android S9+ swipe, slow 4G', chromium, { ...devices['Galaxy S9+'] }, 'touch', true],
];
for (const [name, bt, opts, how, slow, channel] of COLLIDE_ONLY ? [] : runs.filter((r) => process.env.ONLY ? new RegExp(process.env.ONLY).test(r[0]) : true)) {
  const b = await bt.launch(channel ? { channel } : {}); const ctx = await b.newContext(opts); const p = await ctx.newPage();
  const errors = []; p.on('pageerror', (e) => errors.push(e.message)); p.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  const frames17 = []; p.on('request', (r) => /c2b\/f_0017/.test(r.url()) && frames17.push(r.url().split('/').pop()));
  let cdp = null; if (bt === chromium) { cdp = await ctx.newCDPSession(p); if (slow) { await cdp.send('Network.enable'); await cdp.send('Network.emulateNetworkConditions', SLOW4G); } }
  await p.goto(BASE + '/?motion', { waitUntil: 'domcontentloaded' });
  await p.waitForSelector('.preload.is-done', { state: 'attached', timeout: 60000 }); await p.waitForTimeout(400);
  await p.evaluate(() => { const tr = document.querySelector('.hero__trail span'); const eff = (n) => { const el = document.querySelector('.beat--' + n); const cs = getComputedStyle(el); if (cs.visibility !== 'visible') return 0; const ws = [...el.querySelectorAll('.w')].map((w) => +getComputedStyle(w).opacity); return +cs.opacity * ws.reduce((a, x) => a + x, 0) / ws.length; };
    window.__s = []; const loop = () => { const m = getComputedStyle(tr).transform; window.__s.push([m === 'none' ? 0 : +m.split('(')[1].split(',')[0] * 100, eff(2), eff(3), scrollY]); requestAnimationFrame(loop); }; loop(); });
  const vh = opts.viewport ? opts.viewport.height : 800; const mob = !!opts.isMobile; const end = (mob ? 6.5 : 10) * (await p.evaluate(() => innerHeight));
  const W = opts.viewport?.width || 390;
  const touch = async (dy, steps = 8) => { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: W / 2, y: 600 }] }); for (let k = 1; k <= steps; k++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: W / 2, y: 600 - (k * dy) / steps }] }); await p.waitForTimeout(16); } await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); };
  const step = async (dir, fast) => {
    if (how === 'wheel') { await p.mouse.move(W / 2, 400); await p.mouse.wheel(0, dir * 100); await p.waitForTimeout(fast ? 40 : 180); }
    else if (how === 'trackpad') { await p.mouse.move(W / 2, 400); for (let k = 0; k < 6; k++) { await p.mouse.wheel(0, dir * (fast ? 24 : 7)); await p.waitForTimeout(16); } await p.waitForTimeout(fast ? 20 : 120); }
    else if (how === 'touch') { await touch(dir * (fast ? 300 : 110)); await p.waitForTimeout(fast ? 60 : 220); }
    // iPhone (2026-11-12): a fling scrolls every frame with iOS momentum decay (0.998/ms), as Safari
    // does. The old step teleported 260px at a time; emulated WebKit on Windows draws only ~6 frames a
    // second, so a whole 3% text fade fell between two frames and read as a "missed beat" or a jump.
    else { await p.evaluate(([v]) => new Promise((res) => { let last = performance.now(); const f = (t) => { const dt = t - last; last = t; scrollBy(0, (v * dt) / 1000); v *= Math.pow(0.998, dt); if (Math.abs(v) > 40) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); }), [dir * (fast ? 3000 : 900)]); await p.waitForTimeout(fast ? 60 : 200); }
  };
  const t0 = Date.now(); const y = () => p.evaluate(() => scrollY);
  // slowly to the globe's end, quickly to past the hero, then back up to the top
  while ((await y()) < end * 0.9 && Date.now() - t0 < 150000) await step(1, false);
  while ((await y()) < end * 1.05 && Date.now() - t0 < 170000) await step(1, true);
  await p.waitForTimeout(800);
  while ((await y()) > 5 && Date.now() - t0 < 230000) await step(-1, true);
  await p.waitForTimeout(1200);
  const s = await p.evaluate(() => window.__s);
  // A beat "episode" = rising from < 0.05 to > 0.6. Count episodes per direction of travel.
  const episodes = (k) => { let n = 0, low = true; for (const r of s) { if (low && r[k] > 0.6) { n++; low = false; } else if (!low && r[k] < 0.05) low = true; } return n; };
  // Flash check: effective opacity of a beat jumping by > 0.5 in one frame.
  // A jump = a beat's opacity changing by > 0.5 while the page moved < 60px (a 3% fade needs ~82px
  // for that much change on a phone), so it measures the page, not how often the browser draws.
  const jumps = (k) => s.filter((r, i) => i && Math.abs(r[k] - s[i - 1][k]) > 0.5 && Math.abs(r[3] - s[i - 1][3]) < 60).length;
  const maxP = Math.max(...s.map((r) => r[0]));
  console.log(`${name.padEnd(28)} reached p${maxP.toFixed(0)} | beat2 shown ${episodes(1)}x, beat3 shown ${episodes(2)}x (2 = down + up) | opacity jumps (<60px of scroll): ${jumps(1) + jumps(2)} | f_0017 files: ${[...new Set(frames17)].join(',') || 'none'} | errors: ${errors.length ? errors.join(' / ').slice(0, 160) : 0} | ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  await b.close();
}

// ---------- Part 2: collision check ----------
const sizes = [
  [375, 812, true], [375, 667, true], [390, 844, true], [430, 932, true], [768, 1024, false], [1280, 800, false], [1920, 1080, false],
];
// Progress (0–100) at which each beat is fully on screen (choreography.js: 1 load–9, 2 46–55, 3 72–85).
const beatAt = { 1: [0, 5], 2: [50], 3: [78] };
let failures = 0;
for (const [w, h, phone] of sizes) {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: phone ? 3 : 1, isMobile: phone, hasTouch: phone });
  const p = await ctx.newPage();
  await p.goto(BASE + '/?intro', { waitUntil: 'domcontentloaded' });
  await p.waitForSelector('.preload.is-done', { state: 'attached', timeout: 60000 });
  if (SELFTEST) await p.addStyleTag({ content: '.hero__controls{top:calc(var(--hud-t) + 20px)!important;left:0;right:0;justify-content:center}' });
  await p.waitForTimeout(1600);
  const pinVh = w >= 768 ? 1000 : 650;
  for (const n of [1, 2, 3]) {
    for (const at of beatAt[n]) {
      await p.evaluate(([y]) => window.scrollTo(0, y), [Math.round((at / 100) * (pinVh / 100) * h) + (at ? 0 : 0)]);
      await p.waitForTimeout(1400);
      for (const up of [false, true]) {
        // Controls under the nav (nav showing) and up in its space (nav faded out).
        await p.evaluate(([u]) => document.querySelector('.hero__controls')?.classList.toggle('is-up', u), [up]);
        await p.waitForTimeout(550);
        const r = await p.evaluate(([n]) => {
          const vis = (el) => { for (let e = el; e && e !== document.body; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.05) return false; } return true; };
          const box = (el, pad = 0) => { const r = el.getBoundingClientRect(); return { l: r.left - pad, t: r.top - pad, r: r.right + pad, b: r.bottom + pad }; };
          const beat = document.querySelector('.beat--' + n);
          const words = [...beat.querySelectorAll('.w')].filter(vis).flatMap((w) => [...w.getClientRects()].map((q) => ({ l: q.left, t: q.top, r: q.right, b: q.bottom, txt: w.textContent })));
          const ctrls = [['Reduce motion', '.hero__motion', 0], ['Skip intro', '.hero__skip', 0], ['Scroll cue', '.hero__cue', 0], ['progress line', '.hero__trail', 4]]
            .map(([name, sel, pad]) => { const el = document.querySelector(sel); return el && vis(el) ? { name, ...box(el, pad) } : null; }).filter(Boolean);
          const hits = [];
          for (const c of ctrls) for (const q of words) if (c.l < q.r && q.l < c.r && c.t < q.b && q.t < c.b) hits.push(c.name + ' × "' + q.txt.trim() + '"');
          // Also: text off screen, or not centred (word span centre vs viewport centre).
          const L = Math.min(...words.map((q) => q.l)), R = Math.max(...words.map((q) => q.r)), B = Math.max(...words.map((q) => q.b));
          return { words: words.length, ctrls: ctrls.map((c) => c.name), hits, off: Math.round((L + R) / 2 - innerWidth / 2), bottom: Math.round(innerHeight - B) };
        }, [n]);
        const ok = r.words > 0 && !r.hits.length && Math.abs(r.off) <= 12 && r.bottom > 0;
        if (!ok) failures++;
        console.log(`${ok ? 'PASS' : 'FAIL'}  ${String(w).padStart(4)}x${h} beat ${n} @p${at} controls ${up ? 'up  ' : 'low '} | words ${r.words} | checked vs ${r.ctrls.join(', ')} | off-centre ${r.off}px | ${r.hits.length ? 'OVERLAP: ' + r.hits.join('; ') : 'no overlap'}`);
      }
      if (SHOTS) {
        await p.evaluate(() => document.querySelector('.hero__controls')?.classList.remove('is-up'));
        if (n > 1 || at > 0) await p.evaluate(() => { document.querySelector('.nav').classList.add('is-hidden'); document.querySelector('.hero__controls')?.classList.add('is-up'); });
        await p.waitForTimeout(600);
        await p.screenshot({ path: `${SHOTS}/beat${n}-p${at}-${w}x${h}.png` });
      }
    }
  }
  await b.close();
}
console.log(failures ? `COLLISION CHECK: ${failures} FAIL` : 'COLLISION CHECK: all PASS');
process.exitCode = failures ? 1 : 0;
