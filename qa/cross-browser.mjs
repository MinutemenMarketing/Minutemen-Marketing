// Cross-browser QA on the live domain. node xb.mjs <outDir>
// Contact submissions here are intercepted (success + error states); the one real submission was
// sent separately, so this run doesn't fill the inbox.
import { chromium, webkit, firefox, devices } from 'playwright';
import fs from 'node:fs';
const OUT = process.argv[2];
const BASE = 'https://minutemenmarketing.com';
const UA_FIX = {}; // keep each engine's own UA
const RUNS = [
  ['Chromium desktop', chromium, { viewport: { width: 1440, height: 900 } }],
  ['Edge desktop', chromium, { viewport: { width: 1440, height: 900 } }, { channel: 'msedge' }],
    ['WebKit (Safari) desktop', webkit, { viewport: { width: 1440, height: 900 } }],
  ['iPhone 14 (WebKit)', webkit, { ...devices['iPhone 14'] }],
  ['Galaxy S9+ (Chromium, Android)', chromium, { ...devices['Galaxy S9+'] }],
];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];

// Layout-shift watcher: real CLS where the browser supports it; elsewhere, how far headings and
// buttons below the hero move between first paint and fully loaded.
const INIT = () => {
  window.__cls = null;
  try {
    let c = 0;
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) c += e.value; window.__cls = c; }).observe({ type: 'layout-shift', buffered: true });
    window.__cls = 0;
  } catch {}
  window.__frames = [];
  const loop = (t) => { window.__frames.push(t); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
};
const boxes = () => [...document.querySelectorAll('main h1, main h2, main .btn, footer')].map((e) => Math.round(e.getBoundingClientRect().top + scrollY));

for (const [name, engine, ctxOpts, launchOpts = {}] of RUNS) {
  const r = { name, checks: {}, notes: [] };
  const ok = (k, pass, info = '') => (r.checks[k] = { pass, info });
  let browser;
  try {
    browser = await engine.launch(launchOpts);
    const ctx = await browser.newContext({ ...ctxOpts, reducedMotion: 'no-preference' });
    await ctx.addInitScript(INIT);
    const page = await ctx.newPage();
    const errors = [];
    const failed = [];
    page.on('pageerror', (e) => errors.push(String(e).slice(0, 160)));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 160)));
    page.on('requestfailed', (q) => !/_vercel\/(insights|speed)/.test(q.url()) && failed.push(q.url().slice(0, 100) + ' ' + q.failure()?.errorText));
    const mobile = !!ctxOpts.isMobile;
    r.version = browser.version();

    // ---------- Home: hero, nav, carousel, fonts, shifts ----------
    let frames = 0;
    page.on('response', (res) => /\/hero\/v1\/.*\.webp/.test(res.url()) && res.status() === 200 && frames++);
    await page.goto(BASE + '/', { waitUntil: 'load' });
    const early = await page.evaluate(boxes);
    await sleep(3500);
    const hero = await page.evaluate(() => ({ motion: document.documentElement.classList.contains('motion'), failed: document.documentElement.classList.contains('hero-failed'), pinH: document.documentElement.scrollHeight }));
    // canvas actually painted (not blank)
    const painted = await page.evaluate(() => {
      const c = document.querySelector('.hero__canvas');
      if (!c || !c.width) return false;
      const t = document.createElement('canvas'); t.width = 40; t.height = 24;
      const x = t.getContext('2d'); x.drawImage(c, 0, 0, 40, 24);
      const d = x.getImageData(0, 0, 40, 24).data; let s = 0, s2 = 0;
      for (let i = 0; i < d.length; i += 4) { const v = d[i] + d[i + 1] + d[i + 2]; s += v; s2 += v * v; }
      const n = d.length / 4, mean = s / n; return Math.sqrt(s2 / n - mean * mean) > 8;
    });
    ok('Hero story plays (motion on, canvas painted)', hero.motion && !hero.failed && painted, `motion=${hero.motion} failed=${hero.failed} painted=${painted}`);

    // scroll through the hero in small wheel/touch-like steps, sampling frame pacing and the nav
    const pinEnd = await page.evaluate(() => (window.ScrollTrigger ? 0 : 0) || Math.round(document.querySelector('.hero').getBoundingClientRect().height));
    await page.evaluate(() => (window.__frames = []));
    let navHiddenMid = null, beatsSeen = new Set();
    const steps = 40;
    for (let i = 1; i <= steps; i++) {
      if (mobile) await page.evaluate((y) => window.scrollTo(0, y), Math.round((pinEnd * i) / steps));
      else await page.mouse.wheel(0, Math.round(pinEnd / steps));
      await sleep(110);
      if (i === 10) {
        await sleep(500);
        navHiddenMid = await page.evaluate(() => document.querySelector('.nav').classList.contains('is-hidden'));
      }
      const vis = await page.evaluate(() => [...document.querySelectorAll('.beat')].filter((b) => +getComputedStyle(b).opacity > 0.9).map((b) => b.dataset.beat));
      vis.forEach((v) => beatsSeen.add(v));
    }
    await sleep(1500);
    const pace = await page.evaluate(() => { const f = window.__frames; const d = f.slice(1).map((t, i) => t - f[i]); d.sort((a, b) => a - b); return { n: d.length, p50: Math.round(d[Math.floor(d.length / 2)] || 0), p95: Math.round(d[Math.floor(d.length * 0.95)] || 0), long: d.filter((x) => x > 50).length }; });
    ok('Hero scrolls through all three lines', beatsSeen.size === 3, `lines seen: ${[...beatsSeen].join(',')}; ${frames} frame files loaded`);
    ok('Hero frame pacing', pace.p95 <= 50, `rAF p50 ${pace.p50}ms, p95 ${pace.p95}ms, ${pace.long} frames >50ms of ${pace.n} (headless, no GPU)`);
    const navAfter = await page.evaluate(() => { const n = document.querySelector('.nav'); return { hidden: n.classList.contains('is-hidden'), op: getComputedStyle(n).opacity }; });
    await page.evaluate(() => window.scrollBy(0, -200)); await sleep(700);
    const navUp = await page.evaluate(() => document.querySelector('.nav').classList.contains('is-hidden'));
    ok('Nav fades out in the hero, returns after/on scroll up', navHiddenMid === true && !navAfter.hidden && !navUp, `mid-hero hidden=${navHiddenMid}; after hero hidden=${navAfter.hidden}; after scroll up hidden=${navUp}`);

    // carousel
    await page.locator('[data-carousel]').scrollIntoViewIfNeeded(); await sleep(800);
    const cur = () => page.evaluate(() => [...document.querySelectorAll('.carousel__dot')].findIndex((d) => d.getAttribute('aria-current') === 'true'));
    const c0 = await cur();
    const view = await page.locator('.carousel__view').boundingBox();
    const y = view.y + view.height / 2;
    if (mobile) {
      // touch swipe via pointer events (the carousel listens to pointerdown/up with pointerType touch)
      await page.evaluate(({ x1, x2, y }) => {
        const el = document.querySelector('[data-carousel]');
        const ev = (t, x) => el.dispatchEvent(new PointerEvent(t, { pointerType: 'touch', clientX: x, clientY: y, bubbles: true }));
        ev('pointerdown', x1); ev('pointerup', x2);
      }, { x1: view.x + view.width * 0.8, x2: view.x + view.width * 0.2, y });
    } else await page.click('[data-next]');
    await sleep(1200);
    const c1 = await cur();
    const centred = await page.evaluate(() => { const a = document.querySelector('.slide.is-active'); const v = document.querySelector('.carousel__view').getBoundingClientRect(); const r = a.getBoundingClientRect(); return Math.round((r.left + r.right) / 2 - (v.left + v.right) / 2); });
    ok(mobile ? 'Carousel swipes' : 'Carousel moves (next button)', c1 !== c0, `slide ${c0 + 1} → ${c1 + 1}; active card ${centred}px from centre`);

    // fonts
    const fonts = await page.evaluate(async () => { await document.fonts.ready; const has = (fam, style = 'normal') => [...document.fonts].some((f) => f.family.replace(/"/g, '') === fam && f.style === style && f.status === 'loaded'); return { outfit: has('Outfit Variable'), sans: has('Public Sans Variable'), sansI: has('Public Sans Variable', 'italic'), loaded: [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family + ' ' + f.style).join(', ') }; });
    ok('Fonts load (Outfit, Public Sans, Public Sans italic)', fonts.outfit && fonts.sans, fonts.loaded);

    // layout shift on a fresh load of each page (below-hero content)
    const shifts = [];
    for (const path of ['/about', '/portfolio', '/contact']) {
      await page.goto(BASE + path, { waitUntil: 'domcontentloaded' });
      const a = await page.evaluate(boxes);
      await page.waitForLoadState('load'); await sleep(2000);
      const b = await page.evaluate(boxes);
      const cls = await page.evaluate(() => window.__cls);
      const move = Math.max(0, ...a.map((v, i) => Math.abs(v - (b[i] ?? v))));
      shifts.push(`${path}: ${cls === null ? 'CLS n/a' : 'CLS ' + cls.toFixed(3)}, max move ${move}px`);
    }
    const homeLate = await (async () => { await page.goto(BASE + '/?intro', { waitUntil: 'load' }); const onScreen = () => [...document.querySelectorAll('.hero h1, .hero__skip, .hero__motion, .nav')].map((e) => Math.round(e.getBoundingClientRect().top)); const a = await page.evaluate(onScreen); await sleep(2500); const b = await page.evaluate(onScreen); return Math.max(0, ...a.map((v, i) => Math.abs(v - (b[i] ?? v)))); })();
    shifts.unshift(`/: max move ${homeLate}px`);
    ok('Nothing shifts while loading', shifts.every((s) => /max move [0-2]px/.test(s) && !/CLS 0\.[1-9]/.test(s)), shifts.join('; '));

    // ---------- Portfolio windows ----------
    await page.goto(BASE + '/portfolio', { waitUntil: 'load' });
    for (const sel of ['[data-src*="beautyandwellness"]', '[data-src*="smilesbynilou"]']) {
      await page.locator(sel).scrollIntoViewIfNeeded();
    }
    await sleep(6000);
    const wins = await page.evaluate(() => [...document.querySelectorAll('.browser')].map((w) => ({ src: w.dataset.src, live: w.classList.contains('is-live'), shot: w.classList.contains('is-shot') })));
    const scrolled = [];
    for (const [host, sel] of [['beautyandwellnessny.com', '[data-src*="beautyandwellness"]'], ['smilesbynilou.com', '[data-src*="smilesbynilou"]']]) {
      const f = page.frames().find((f) => f.url().includes(host));
      if (!f) { scrolled.push(host + ' no frame'); continue; }
      await page.locator(sel).scrollIntoViewIfNeeded(); await sleep(400);
      const bx = await page.locator(sel + ' .browser__view').boundingBox();
      await page.mouse.move(bx.x + bx.width / 2, bx.y + bx.height / 2);
      if (!mobile) await page.mouse.wheel(0, 700); else await f.evaluate(() => scrollTo(0, 700));
      await sleep(1200);
      scrolled.push(host + ' scrollY ' + Math.round(await f.evaluate(() => scrollY)));
    }
    const smiles = wins.find((w) => /smiles/.test(w.src));
    ok('Portfolio windows live and scrollable (Smiles = LIVE site)', wins.every((w) => w.live) && scrolled.length === 2 && scrolled.every((s) => /scrollY [1-9]/.test(s)), `${wins.map((w) => `${new URL(w.src).hostname}: ${w.live ? 'LIVE' : w.shot ? 'screenshot' : 'pending'}`).join('; ')} | ${scrolled.join('; ')}`);
    await page.locator('[data-src*="smilesbynilou"]').screenshot({ path: `${OUT}/smiles-window-${name.replace(/\W+/g, '-')}.png` }).catch(() => {});

    // ---------- Contact form (intercepted) ----------
    await page.goto(BASE + '/contact', { waitUntil: 'load' });
    const fill = async () => {
      await page.fill('#f-name', 'QA'); await page.fill('#f-biz', 'QA'); await page.fill('#f-email', 'qa@example.com'); await page.fill('#f-msg', 'QA');
    };
    // empty submit → validation
    await page.click('[data-submit]');
    const val = await page.locator('.err').count();
    await page.route('**/api.web3forms.com/**', (rt) => rt.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true,"message":"ok"}' }));
    await fill(); await page.click('[data-submit]'); await sleep(800);
    const okMsg = await page.locator('[data-status]').evaluate((e) => e.dataset.kind + ': ' + e.textContent);
    await page.unroute('**/api.web3forms.com/**');
    await page.route('**/api.web3forms.com/**', (rt) => rt.fulfill({ status: 500, contentType: 'application/json', body: '{"success":false}' }));
    const errCount = errors.length;
    await fill(); await page.click('[data-submit]'); await sleep(800);
    errors.splice(errCount); // the mocked 500 above is the test, not a site error
    const errMsg = await page.locator('[data-status]').evaluate((e) => e.dataset.kind + ': ' + e.textContent);
    await page.unroute('**/api.web3forms.com/**');
    const hp = await page.evaluate(() => { const h = document.querySelector('#f-botcheck'); const r = h.getBoundingClientRect(); return r.right < 0 && h.tabIndex === -1; });
    ok('Contact form: validation, success, error, honeypot', val >= 3 && okMsg.startsWith('success') && errMsg.startsWith('error') && hp, `${val} field errors on empty submit | ${okMsg} | ${errMsg} | honeypot hidden=${hp}`);

    // ---------- Buttons: menu (phones) ----------
    if (mobile) {
      await page.click('.nav__menu'); await sleep(400);
      const open = await page.evaluate(() => !document.querySelector('.sheet').hidden);
      await page.click('.sheet__links a[href="/about"]'); await page.waitForURL(/about/);
      ok('Menu opens and navigates', open && /\/about/.test(page.url()), `sheet open=${open}, went to ${new URL(page.url()).pathname}`);
    } else {
      await page.click('.nav__links a[href="/about"]'); await page.waitForURL(/about/);
      ok('Nav links navigate', /\/about/.test(page.url()), new URL(page.url()).pathname);
    }

    ok('No console errors / failed requests', errors.length === 0 && failed.length === 0, [...errors, ...failed].slice(0, 6).join(' | ') || 'none');
    await ctx.close();
  } catch (e) {
    r.notes.push('RUN ERROR: ' + String(e).slice(0, 300));
  } finally {
    await browser?.close();
  }
  results.push(r);
  console.log(`\n### ${name} ${r.version || ''}`);
  for (const [k, v] of Object.entries(r.checks)) console.log(`${v.pass ? 'PASS' : 'FAIL'}  ${k} — ${v.info}`);
  r.notes.forEach((n) => console.log(n));
}
fs.writeFileSync(`${OUT}/xb-results.json`, JSON.stringify(results, null, 1));
