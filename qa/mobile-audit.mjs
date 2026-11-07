// Mobile layout audit + full-page shots. node mobile.mjs <outDir> <tag> [base]
// Checks at 375/390/430: horizontal scroll, visible elements closer than 12px to an edge,
// tap targets under 44px, and centring of images/headings/buttons.
import { chromium } from 'playwright';
import fs from 'node:fs';
const [OUT, TAG, BASE = 'https://minutemenmarketing.com'] = process.argv.slice(2);
fs.mkdirSync(OUT, { recursive: true });
const PAGES = [['home', '/?reduced'], ['about', BASE.includes('localhost') ? '/about/' : '/about'], ['portfolio', BASE.includes('localhost') ? '/portfolio/' : '/portfolio'], ['contact', BASE.includes('localhost') ? '/contact/' : '/contact'], ['404', BASE.includes('localhost') ? '/404.html' : '/nope-404']];
const b = await chromium.launch();
const report = {};
for (const w of [375, 390, 430]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 812 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  for (const [name, path] of PAGES) {
    await p.goto(BASE + path, { waitUntil: 'networkidle' });
    await p.evaluate(async () => {
      document.querySelectorAll('img').forEach((i) => (i.loading = 'eager'));
      for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
      scrollTo(0, 0);
      await new Promise((r) => setTimeout(r, 600));
    });
    const r = await p.evaluate(() => {
      const W = innerWidth, out = { sw: document.documentElement.scrollWidth, edge: [], tap: [], offCenter: [] };
      const vis = (el) => { const s = getComputedStyle(el); const r = el.getBoundingClientRect(); return s.visibility !== 'hidden' && s.display !== 'none' && r.width > 0 && r.height > 0 && !el.closest('.hero, [aria-hidden=true], .visually-hidden, .hp, .skip'); };
      const lab = (el) => el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/)[0] : '') + ' "' + (el.textContent || el.alt || '').trim().slice(0, 30) + '"';
      // Content (text/images/controls) too close to an edge. Full-bleed backgrounds are fine.
      for (const el of document.querySelectorAll('main p, main h1, main h2, main h3, main li, main dt, main dd, main a, main button, main img, main label, main input, main textarea, footer p, footer a, footer li')) {
        if (!vis(el) || el.closest('.carousel__track')) continue;
        const r = el.getBoundingClientRect();
        if (r.left < 12 || r.right > W - 12) out.edge.push(lab(el) + ` L${Math.round(r.left)} R${Math.round(W - r.right)}`);
      }
      for (const el of document.querySelectorAll('a, button, input:not(.check input), textarea, select, label.check')) {
        if (!vis(el)) continue;
        const r = el.getBoundingClientRect();
        // Inline links inside running text are exempt (WCAG 2.5.8 inline exception).
        const inline = el.tagName === 'A' && getComputedStyle(el).display === 'inline' && el.parentElement.closest('p') && el.parentElement.closest('p').textContent.trim().length > el.textContent.trim().length + 5;
        if ((r.height < 44 || r.width < 44) && !inline) out.tap.push(lab(el) + ` ${Math.round(r.width)}x${Math.round(r.height)}`);
      }
      for (const el of document.querySelectorAll('main img, main picture, main h1, main h2, main .eyebrow, main .btn, main .portfolio-window, main .project__window, main .slide__card, footer img')) {
        if (!vis(el)) continue;
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        const textCentered = /^(H1|H2|P)$/.test(el.tagName) ? cs.textAlign === 'center' : true;
        const off = Math.round((r.left + r.right) / 2 - W / 2);
        if (Math.abs(off) > 3 || !textCentered) out.offCenter.push(lab(el) + ` off${off}${textCentered ? '' : ' text-' + cs.textAlign}`);
      }
      return out;
    });
    report[`${name}@${w}`] = { sw: r.sw, edge: r.edge.length, tap: r.tap.length, offCenter: r.offCenter.length, detail: r };
    await p.addStyleTag({ content: '.nav{position:absolute!important}' });
    await p.screenshot({ path: `${OUT}/${TAG}-${name}-${w}.png`, fullPage: true, scale: 'css' });
  }
  await ctx.close();
}
await b.close();
fs.writeFileSync(`${OUT}/${TAG}-report.json`, JSON.stringify(report, null, 1));
for (const [k, v] of Object.entries(report)) console.log(k.padEnd(16), 'scrollW', v.sw, 'edge', v.edge, 'tap<44', v.tap, 'offCenter', v.offCenter);
