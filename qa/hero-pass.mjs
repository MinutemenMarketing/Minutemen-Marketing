// Full hero pass on the live site. Every rAF logs p and beats 2/3 effective opacity.
// node fullpass.mjs base
import { chromium, webkit, devices } from 'playwright';
const BASE = process.argv[2] || 'https://minutemenmarketing.com';
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
for (const [name, bt, opts, how, slow, channel] of runs) {
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
    else { await p.evaluate(([d]) => scrollBy(0, d), [dir * (fast ? 260 : 90)]); await p.waitForTimeout(fast ? 50 : 200); }
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
  const jumps = (k) => s.filter((r, i) => i && Math.abs(r[k] - s[i - 1][k]) > 0.5).length;
  const maxP = Math.max(...s.map((r) => r[0]));
  console.log(`${name.padEnd(28)} reached p${maxP.toFixed(0)} | beat2 shown ${episodes(1)}x, beat3 shown ${episodes(2)}x (2 = down + up) | 1-frame opacity jumps: ${jumps(1) + jumps(2)} | f_0017 files: ${[...new Set(frames17)].join(',') || 'none'} | errors: ${errors.length ? errors.join(' / ').slice(0, 160) : 0} | ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  await b.close();
}
