// Every page (and the hero) at every screen size Noah listed (2026-11-10).
// node qa/screen-matrix.mjs [baseUrl] [outDir] [--sizes 390x844,1440x900]
// Checks per size and page: no horizontal scroll; no text cropped by its container or pushed off
// screen; no two text blocks overlapping; on Home the hero canvas fills the screen and the hero text
// stays clear of the Skip button, Scroll cue and progress line at four points; on Portfolio the
// windows have the right shape (phone 9:16 below 768px, laptop 16:10 above). Saves screenshots for a
// contact sheet (hero, soldier, services, about, portfolio window, contact) per size.
import { chromium } from 'playwright';
import fs from 'node:fs';
const args = process.argv.slice(2);
const BASE = args.find((a) => a.startsWith('http')) || 'https://minutemenmarketing.com';
const OUT = args.find((a, i) => !a.startsWith('http') && !a.startsWith('--') && args[i - 1] !== '--sizes') || 'qa/shots/matrix';
const ALL = [
  [320, 568], [360, 800], [375, 667], [390, 844], [412, 915], [430, 932], [844, 390],
  [768, 1024], [820, 1180], [1024, 1366], [1280, 720], [1440, 900], [1920, 1080], [2560, 1440], [3440, 1440],
];
const only = args.includes('--sizes') ? args[args.indexOf('--sizes') + 1].split(',').map((s) => s.split('x').map(Number)) : null;
const SIZES = only || ALL;
const PAGES = ['/', '/about', '/portfolio', '/contact', '/terms', '/privacy', '/nope-404'];
fs.mkdirSync(OUT, { recursive: true });

// In-page layout audit (runs in the browser).
const audit = () => {
  const vw = document.documentElement.clientWidth;
  const out = { hscroll: document.documentElement.scrollWidth > vw + 1, cropped: [], offscreen: [], overlaps: [] };
  const visible = (e) => {
    for (let n = e; n && n !== document.body; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.05) return false;
    }
    const r = e.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  // leaf-ish text elements outside the hero canvas stage, carousels and embedded windows
  const skip = (e) => e.closest('.hero, .carousel, .browser__view, .visually-hidden, .preload, .nav, [aria-hidden="true"]');
  const texts = [...document.querySelectorAll('main h1, main h2, main h3, main p, main li, main a, main button, main label, main dt, main dd, main legend, footer p, footer a, .nav a')]
    .filter((e) => !skip(e) && visible(e) && e.textContent.trim());
  for (const e of texts) {
    const r = e.getBoundingClientRect();
    const label = e.tagName.toLowerCase() + ' «' + e.textContent.trim().replace(/\s+/g, ' ').slice(0, 40) + '»';
    if (r.right > vw + 1 || r.left < -1) out.offscreen.push(label);
    // cropped: an ancestor clips it (overflow not visible) and it sticks out of that ancestor
    for (let n = e.parentElement; n && n !== document.body; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') {
        const a = n.getBoundingClientRect();
        if (r.right > a.right + 1 || r.left < a.left - 1 || r.bottom > a.bottom + 1 || r.top < a.top - 1) out.cropped.push(label);
        break;
      }
    }
    // a text box wider than its own box's content (a single word too long for its line)
    // a word too long for its line: some visible descendant line box sticks out of the element
    // (only what is drawn: text lines, icons and images, not invisible tap-target padding)
    const drawn = [];
    const tw = document.createTreeWalker(e, NodeFilter.SHOW_TEXT);
    for (let t = tw.nextNode(); t; t = tw.nextNode()) {
      if (!t.textContent.trim() || t.parentElement.closest('.visually-hidden') || !visible(t.parentElement)) continue;
      const rg = document.createRange();
      rg.selectNodeContents(t);
      drawn.push(...rg.getClientRects());
    }
    for (const k of e.querySelectorAll('svg, img')) if (visible(k)) drawn.push(k.getBoundingClientRect());
    if (drawn.some((q) => q.right > r.right + 2 || q.left < r.left - 2)) out.cropped.push(label + ' (sticks out of its box)');
  }
  // overlaps between text blocks (leaf blocks only: no element that contains another in the list)
  const leaves = texts.filter((e) => !texts.some((o) => o !== e && e.contains(o)));
  // per-line boxes, so two links wrapping inside one paragraph never count as overlapping
  const boxes = leaves.flatMap((e) => [...e.getClientRects()].map((q) => [e, q]));
  for (let i = 0; i < boxes.length; i++)
    for (let j = i + 1; j < boxes.length; j++) {
      const [ea, a] = boxes[i];
      const [eb, b] = boxes[j];
      if (ea === eb || ea.contains(eb) || eb.contains(ea)) continue;
      const ix = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const iy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (ix > 2 && iy > 2) out.overlaps.push(`${ea.textContent.trim().slice(0, 24)} × ${eb.textContent.trim().slice(0, 24)}`);
    }
  out.cropped = [...new Set(out.cropped)];
  out.offscreen = [...new Set(out.offscreen)];
  out.overlaps = [...new Set(out.overlaps)].slice(0, 6);
  return out;
};

let fails = 0;
const report = [];
const b = await chromium.launch();
for (const [w, h] of SIZES) {
  const touch = w < 1280 || h > w;
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: w >= 1920 ? 1 : 2, isMobile: touch && w < 1100, hasTouch: touch });
  const p = await ctx.newPage();
  const tag = `${w}x${h}`;
  const lines = [];
  for (const path of PAGES) {
    await p.goto(BASE + path + (path === '/' ? '?intro' : ''), { waitUntil: 'domcontentloaded' });
    if (path === '/') await p.waitForSelector('.preload.is-done', { state: 'attached', timeout: 60000 }).catch(() => {});
    await p.waitForTimeout(1600);
    if (path === '/') {
      // hero fills the screen; beats clear of controls at 4 points
      const pin = w >= 768 ? 10 : 6.5;
      const hero = await p.evaluate(() => { const c = document.querySelector('.hero__canvas').getBoundingClientRect(); return { cw: Math.round(c.width), ch: Math.round(c.height), iw: innerWidth, ih: innerHeight }; });
      const fill = hero.cw >= hero.iw - 1 && hero.ch >= hero.ih - 1;
      if (!fill) lines.push(`FAIL hero does not fill the screen: canvas ${hero.cw}x${hero.ch} vs ${hero.iw}x${hero.ih}`);
      await p.screenshot({ path: `${OUT}/${tag}-1-hero.png` });
      for (const [at, n] of [[2, 1], [29, 0], [50, 2], [78, 3]]) {
        await p.evaluate(([y]) => window.scrollTo(0, y), [Math.round((at / 100) * pin * h)]);
        await p.waitForTimeout(1300);
        if (at === 29) await p.screenshot({ path: `${OUT}/${tag}-2-soldier.png` });
        if (!n) continue;
        const hits = await p.evaluate(([n]) => {
          const vis = (el) => { for (let e = el; e && e !== document.body; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.05) return false; } return true; };
          const words = [...document.querySelectorAll(`.beat--${n} .w`)].filter(vis).map((x) => x.getBoundingClientRect());
          const ctr = ['.hero__skip', '.hero__cue', '.hero__trail'].map((s) => document.querySelector(s)).filter((x) => x && vis(x)).map((x) => [x.className, x.getBoundingClientRect()]);
          const out = [];
          for (const [nm, c] of ctr) for (const q of words) if (c.left < q.right && q.left < c.right && c.top < q.bottom && q.top < c.bottom) out.push(nm);
          const off = words.filter((q) => q.left < -1 || q.right > innerWidth + 1 || q.top < 0 || q.bottom > innerHeight).length;
          return { hits: [...new Set(out)], off, words: words.length };
        }, [n]);
        if (hits.hits.length || hits.off) lines.push(`FAIL hero beat ${n} @p${at}: ${hits.hits.length ? 'overlaps ' + hits.hits.join(', ') : ''}${hits.off ? ' ' + hits.off + ' words off screen' : ''}`);
      }
      // below the hero
      await p.evaluate(() => window.scrollTo(0, document.querySelector('#services').getBoundingClientRect().top + scrollY - 72));
      await p.waitForTimeout(1200);
      await p.screenshot({ path: `${OUT}/${tag}-3-services.png` });
    }
    if (path === '/about') await p.screenshot({ path: `${OUT}/${tag}-4-about.png` });
    if (path === '/portfolio') {
      const win = p.locator('#beauty .browser');
      await win.scrollIntoViewIfNeeded();
      await p.waitForTimeout(5000);
      const shape = await p.evaluate(() => [...document.querySelectorAll('.browser__view')].map((v) => +(v.clientHeight / v.clientWidth).toFixed(3)));
      const want = w < 768 ? 16 / 9 : 900 / 1440;
      if (shape.some((r) => Math.abs(r - want) > 0.02)) lines.push(`FAIL portfolio window shape ${shape.join(', ')} (want ${want.toFixed(3)})`);
      await p.screenshot({ path: `${OUT}/${tag}-5-portfolio.png` });
    }
    if (path === '/contact') await p.screenshot({ path: `${OUT}/${tag}-6-contact.png` });
    // full layout audit at the top and the bottom of the page (sections that only render in view)
    await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await p.waitForTimeout(700);
    const r = await p.evaluate(audit);
    const pg = path === '/' ? 'home' : path.slice(1);
    if (r.hscroll) lines.push(`FAIL ${pg}: horizontal scroll`);
    if (r.offscreen.length) lines.push(`FAIL ${pg}: off screen ${r.offscreen.slice(0, 4).join('; ')}`);
    if (r.cropped.length) lines.push(`FAIL ${pg}: cropped ${r.cropped.slice(0, 4).join('; ')}`);
    if (r.overlaps.length) lines.push(`FAIL ${pg}: overlapping text ${r.overlaps.join('; ')}`);
  }
  const ok = !lines.length;
  if (!ok) fails += lines.length;
  report.push(`${ok ? 'PASS' : 'FAIL'}  ${tag}${ok ? '' : '\n      ' + lines.join('\n      ')}`);
  console.log(report.at(-1));
  await ctx.close();
}
await b.close();
console.log(fails ? `SCREEN MATRIX: ${fails} problem(s)` : 'SCREEN MATRIX: all sizes PASS');
process.exitCode = fails ? 1 : 0;
