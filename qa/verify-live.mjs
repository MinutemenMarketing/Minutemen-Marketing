// Live checklist for Noah's 2026-11-08 batch. node verify.mjs [base]
import { chromium } from 'playwright';
const BASE = process.argv[2] || 'https://minutemenmarketing.com';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
const out = [];
const check = (name, ok, detail = '') => out.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
const go = async (path) => {
  await p.goto(BASE + path + (path.includes('?') ? '&' : '?') + 'v=' + Date.now(), { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1500);
};

// Home
await go('/?intro');
const home = await p.evaluate(() => {
  const t = (s) => document.querySelector(s)?.textContent.replace(/\s+/g, ' ').trim();
  const beat3 = document.querySelector('.beat--3 .beat__title');
  const strong = beat3?.querySelector('strong');
  return {
    title: document.title,
    controls: [...document.querySelectorAll('.hero__controls button')].map((x) => x.textContent.trim()),
    motionBtn: !!document.querySelector('[data-motion-toggle], .hero__motion'),
    beat3: t('.beat--3 .beat__title'),
    strong: strong?.textContent.replace(/\s+/g, ' ').trim(),
    wReg: beat3 && getComputedStyle(beat3).fontWeight,
    wBold: strong && getComputedStyle(strong).fontWeight,
    cards: [...document.querySelectorAll('#services .card')].map((c) => ({ h: c.querySelector('.card__h').textContent.replace(/\s+/g, ' ').trim(), p: c.querySelector('p').textContent.trim(), sub: c.querySelector('.card__sub')?.textContent.trim() || '' })),
    founders: [...document.querySelectorAll('.founders__names .founder__name')].map((x) => x.firstChild.textContent.trim()),
    lede: t('.founders .lede'),
    schema: JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent).founder.map((f) => f.name),
    roles: /Founder ·|Founder ·/.test(document.body.innerText),
    k1: document.querySelector('.hero__still')?.getAttribute('src'),
  };
});
check('Hero: only "Skip intro"', home.controls.join('|') === 'Skip intro' && !home.motionBtn, JSON.stringify(home.controls));
check('Globe line text', home.beat3 === 'With the right marketing, you can reach an audience around the world.', home.beat3);
check('Globe line: only the phrase bold', home.strong === 'reach an audience around the world.' && +home.wReg < 600 && +home.wBold >= 700, `regular ${home.wReg}, bold ${home.wBold}`);
check('Home title', home.title === 'Minutemen Marketing', home.title);
const want = [
  ['Website Design & Development', 'A custom site built to fit your brand. Our websites are mobile friendly and include ongoing maintenance and updates.'],
  ['Social Media Management', 'We will create and manage content that keeps your channels active and optimizes reach.'],
  ['Search Engine Optimization (SEO)', 'Helps customers find you when they search for what you offer.'],
  ['Generative Engine Optimization (GEO)', 'Content structured so AI search tools understand what you do and surface it in answers.'],
  ['Domain Acquisition', "We can find, secure, and connect a personalized domain for your site so you don't have to."],
];
const cardsOk = want.every(([h, d], i) => home.cards[i]?.h === h && home.cards[i]?.p === d);
check('Service cards: exact titles and descriptions', cardsOk, cardsOk ? '' : JSON.stringify(home.cards));
check('GEO formatted like SEO', home.cards[2]?.sub === '(SEO)' && home.cards[3]?.sub === '(GEO)');
check('Founders (Home): Ethan first, Noah second, full names', home.founders.join('|') === 'Ethan Eghbali|Noah Medina', home.founders.join(', '));
check('Founders intro line', home.lede === 'Ethan Eghbali and Noah Medina started Minutemen Marketing on Long Island. You talk to them directly, from the first call to launch day.');
check('Schema founder order', home.schema.join('|') === 'Ethan Eghbali|Noah Medina', home.schema.join(', '));
check('No role lines (Home)', !home.roles);
check('Opening still is the cleaned K1', /k1v4/.test(home.k1 || ''), home.k1);

// About
await go('/about');
const about = await p.evaluate(() => ({
  title: document.title,
  people: [...document.querySelectorAll('.person__name')].map((x) => x.firstChild.textContent.trim()),
  quote: document.querySelector('.note__quote p')?.textContent.trim(),
  by: document.querySelector('.note__by')?.textContent.trim(),
  roles: /Founder ·/.test(document.body.innerText),
  schema: JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent).founder.map((f) => f.name),
}));
check('About title', about.title === 'About | Minutemen Marketing', about.title);
check('Founders (About): Ethan first, Noah second', about.people.join('|') === 'Ethan Eghbali|Noah Medina', about.people.join(', '));
check('About schema order', about.schema.join('|') === 'Ethan Eghbali|Noah Medina');
check('"Why we started" quoted as a founders\' message', /^“.*”$/.test(about.quote || '') && /founders/i.test(about.by || ''), about.by);
check('No role lines (About)', !about.roles);

// sticky + Instagram + titles on every page
const pages = { '/': 'Minutemen Marketing', '/about': 'About | Minutemen Marketing', '/portfolio': 'Portfolio | Minutemen Marketing', '/contact': 'Contact | Minutemen Marketing' };
let sticky = 0;
let instaFooter = 0;
for (const [path, title] of Object.entries(pages)) {
  await go(path === '/' ? '/?intro' : path);
  const r = await p.evaluate(() => ({
    t: document.title,
    sticky: [...document.querySelectorAll('*')].filter((e) => getComputedStyle(e).position === 'sticky').length,
    insta: !!document.querySelector('.footer a[href="https://www.instagram.com/minutemenmarketing/"]'),
  }));
  if (path !== '/') check(`Title ${path}`, r.t === title, r.t);
  sticky += r.sticky;
  instaFooter += r.insta ? 1 : 0;
}
check('Nothing sticky on any page', sticky === 0, `${sticky} sticky elements`);
check('Instagram in the footer (all 4 pages)', instaFooter === 4, `${instaFooter}/4`);

// Portfolio
await go('/portfolio');
await p.locator('#beauty .browser__view').scrollIntoViewIfNeeded();
await p.waitForTimeout(6000);
const port = await p.evaluate(() => ({
  divider: !!document.querySelector('main hr.divider'),
  blocks: [...document.querySelectorAll('.project')].map((pr) => [...pr.children].map((c) => c.className.split(' ')[0] || c.tagName).join('>')),
  frame: (() => { const f = document.querySelector('#beauty iframe'); const v = document.querySelector('#beauty .browser__view'); return f ? { fw: f.getAttribute('width'), vw: v.clientWidth, tf: getComputedStyle(f).transform, op: getComputedStyle(f).opacity } : null; })(),
}));
check('Portfolio: divider under the intro', port.divider);
check('Portfolio: structured blocks (head > brief > window > link)', port.blocks.every((x) => x === 'project__head>brief>browser>link-out'), port.blocks.join(' | '));
check('Portfolio windows unscaled at desktop (crisp)', port.frame && port.frame.tf === 'none' && +port.frame.fw === port.frame.vw && port.frame.op === '1', JSON.stringify(port.frame));

// Contact
await go('/contact');
const con = await p.evaluate(() => ({
  panel: (() => { const f = document.querySelector('.contact-page__form'); const cs = f && getComputedStyle(f); return cs && cs.borderTopStyle !== 'none' && cs.backgroundColor !== 'rgba(0, 0, 0, 0)'; })(),
  labels: [...document.querySelectorAll('.details dt')].map((x) => x.textContent.trim()),
  insta: document.querySelector('.details a[href="https://www.instagram.com/minutemenmarketing/"]')?.textContent.trim(),
  side: (() => { const a = document.querySelector('.contact-page__form').getBoundingClientRect(); const d = document.querySelector('.contact-page__details').getBoundingClientRect(); return d.left > a.right; })(),
}));
check('Contact: form panel', con.panel);
check('Contact: details beside the form (desktop)', con.side);
check('Contact: Email / Phone / Instagram subtitles', ['Email', 'Phone', 'Instagram'].every((l) => con.labels.includes(l)), con.labels.join(', '));
check('Contact: Instagram shown as @minutemenmarketing', con.insta === '@minutemenmarketing', con.insta);

console.log(out.join('\n'));
await b.close();
