// Hero end -> Services hand-off, iPhone WebKit (2026-11-12).
// node ios-end.mjs <base> <w>x<h> [mismatchPx] [shotsDir]
// mismatchPx > 0 re-creates the iPhone failure: the stage renders that much taller than ScrollTrigger
// measured it. At every position from 90% of the pin to well past it (down, then back up), the
// Services eyebrow and the heading's first line must be the top-most element at their spot.
import { webkit, devices } from 'playwright';
const [base, size = '390x844', mis = '0', out] = process.argv.slice(2);
const [w, h] = size.split('x').map(Number);
const b = await webkit.launch();
const ctx = await b.newContext({ ...devices['iPhone 14'], viewport: { width: w, height: h } });
const p = await ctx.newPage();
await p.goto(base + '/?intro&motion', { waitUntil: 'domcontentloaded' });
await p.waitForSelector('.preload.is-done', { state: 'attached', timeout: 60000 });
await p.waitForTimeout(1500);
const geo = await p.evaluate(() => { const st = document.querySelector('.hero__stage'); const sp = st.parentElement; const start = sp.getBoundingClientRect().top + scrollY; const dur = parseFloat(getComputedStyle(sp).paddingBottom); return { start, end: start + dur, pull: getComputedStyle(document.documentElement).getPropertyValue('--hero-pull') || '-', stageH: st.getBoundingClientRect().height }; });
if (+mis) await p.addStyleTag({ content: `.motion .hero__stage{max-height:none!important;height:calc(100lvh + ${+mis}px)!important}` });
const check = () => p.evaluate(() => {
  const vis = (el) => {
    const r = el.getClientRects()[0];
    const nb = document.querySelector(".nav").getBoundingClientRect().bottom; if (!r || r.bottom < nb + 6 || r.top > innerHeight - 2) return null; // off screen (or under the nav)
    const y = Math.min(innerHeight - 2, Math.max(r.top + 4, nb + 3));
    const hit = document.elementFromPoint(r.left + Math.min(r.width / 2, 40), y);
    const ok = !!hit && (hit === el || el.contains(hit)); if (!ok) window.__hit = (hit ? hit.tagName + "." + hit.className : "none") + " @" + Math.round(y) + " top " + Math.round(r.top); return ok;
  };
  const eb = document.querySelector('#services .eyebrow');
  const hd = document.querySelector('#services-h');
  return { y: Math.round(scrollY), eyebrow: vis(eb), heading: vis(hd) };
});
let bad = 0, seen = 0;
const ys = [];
for (let q = 0.9; q <= 1.0 + 1.2 * h / (geo.end - geo.start); q += 0.005) ys.push(Math.round(geo.start + q * (geo.end - geo.start)));
for (const y of [...ys, ...ys.slice().reverse()]) {
  await p.evaluate((yy) => window.scrollTo(0, yy), y);
  await p.waitForTimeout(90);
  const r = await check();
  if (r.eyebrow !== null || r.heading !== null) seen++;
  if (r.eyebrow === false || r.heading === false) { bad++; if (bad < 4) console.log("  covered at", JSON.stringify(r), await p.evaluate(() => window.__hit)); }
}
// the settled hand-off: gap from the logo's bottom to the shot line
await p.evaluate((yy) => window.scrollTo(0, yy), Math.round(geo.end + 40));
await p.waitForTimeout(1500);
const gap = await p.evaluate(() => {
  const st = document.querySelector('.hero__stage').getBoundingClientRect();
  const op = document.querySelector('#services .opener').getBoundingClientRect();
  return { stageTop: Math.round(st.top), openerTop: Math.round(op.top), openerFromStageTop: Math.round(op.top - st.top) };
});
console.log(`${size} mismatch ${mis}px | pull ${geo.pull.trim()} stage ${geo.stageH} | ${seen} positions with Services on screen, ${bad} covered | ${JSON.stringify(gap)}`);
if (out) {
  for (const [name, q] of [['a-98', 0.98], ['b-end', 1.0], ['c-past', 1.0 + 0.35 * h / (geo.end - geo.start)], ['d-services', 1.0 + 0.8 * h / (geo.end - geo.start)]]) {
    await p.evaluate((yy) => window.scrollTo(0, yy), Math.round(geo.start + q * (geo.end - geo.start)));
    await p.waitForTimeout(1600);
    await p.screenshot({ path: `${out}/${size}-m${mis}-${name}.png` });
  }
}
await b.close();
process.exitCode = bad ? 1 : 0;
