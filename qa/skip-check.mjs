// Skip intro on desktop (2026-11-13): 32px from the right edge at 1280-3440px, never over the nav, click lands at Services.
// node skipcheck.mjs <base> [shotsDir]
import { chromium } from 'playwright';
const [base, out] = process.argv.slice(2);
const b = await chromium.launch();
let bad = 0;
for (const [w, h] of [[1280, 800], [1440, 900], [1920, 1080], [2560, 1440], [3440, 1440]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  await p.goto(base + '/?intro&motion', { waitUntil: 'domcontentloaded' });
  await p.waitForSelector('.preload.is-done', { state: 'attached', timeout: 60000 });
  await p.waitForTimeout(1200);
  const measure = () => p.evaluate(() => {
    const s = document.querySelector('.hero__skip').getBoundingClientRect();
    const navShown = !document.querySelector('.nav').classList.contains('is-hidden');
    const ctrls = [...document.querySelectorAll('.nav a, .nav button')].filter((e) => { const r = e.getBoundingClientRect(); return r.width && getComputedStyle(e).visibility !== 'hidden'; }).map((e) => e.getBoundingClientRect());
    const hit = navShown && ctrls.some((r) => !(r.right <= s.left || r.left >= s.right || r.bottom <= s.top || r.top >= s.bottom));
    return { navShown, top: Math.round(s.top), right: Math.round(innerWidth - s.right), overlap: hit };
  });
  const atTop = await measure();
  if (out) await p.screenshot({ path: `${out}/skip-${w}-navshown.png`, clip: { x: w - 700, y: 0, width: 700, height: 200 } });
  await p.mouse.move(w / 2, h / 2);
  for (let i = 0; i < 8; i++) { await p.mouse.wheel(0, 120); await p.waitForTimeout(80); }
  await p.waitForTimeout(1200);
  const inHero = await measure();
  if (out) await p.screenshot({ path: `${out}/skip-${w}-inhero.png`, clip: { x: w - 700, y: 0, width: 700, height: 200 } });
  await p.click('.hero__skip');
  await p.waitForTimeout(2500);
  const landed = await p.evaluate(() => ({ head: Math.round(document.querySelector('#services').getBoundingClientRect().top), focus: document.activeElement?.id }));
  const ok = !atTop.overlap && !inHero.overlap && atTop.right === 32 && inHero.right === 32 && landed.focus === 'services-h' && Math.abs(landed.head) < 120;
  if (!ok) bad++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${w}x${h} | nav shown: top ${atTop.top}, right gap ${atTop.right}, overlap ${atTop.overlap} | in hero: top ${inHero.top}, right gap ${inHero.right} | click: Services at ${landed.head}px, focus ${landed.focus}`);
  await p.close();
}
await b.close();
process.exitCode = bad ? 1 : 0;
