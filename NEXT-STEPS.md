# Next steps — minutemenmarketing.com

Updated 2026-11-07, end of session. `CLAUDE.md` is the contract (hero spec, rules, every
approved asset with its Runway task ID); `DESIGN.md` is the approved four-page design. Read both first.

**Runway credits: 1,565** (was 1,627; **62 spent** this session on the approved 1080p upscale:
C1 12, C2 10, C2b 12, C3 16, C4 12). Rule unchanged: quote the cost and wait for Noah's OK before
every generation.

Live: **https://minutemenmarketing.com** (Vercel auto-deploys `main`; the old `*.vercel.app` address now returns 404). Local: `npm run dev`, then
http://localhost:5173. QA switches on any build: `?motion` ignores reduced motion, `?reduced` forces
it, `?herofail` / `?herofail=script` show the load-failure still version.
Playwright QA scripts (cross-browser run, mobile alignment audit) are in `qa/`.

---

## Done

**Hero**
- Runs start to finish on the approved footage and plays for everyone; reduced motion only drops the
  extras. Remembered **Reduce motion** chip; the still version is also the automatic load-failure
  fallback. Opens full-screen at the top; the nav fades out while scrolling down through the hero.
- **Three frame tiers:** 1920px set (new, from the Runway-upscaled clips) on screens 1440px+ wide or
  1024px+ at 2×; 1280px set on other desktops; 960px set on phones. Stills follow the same tier.
  Extraction repeated the approved fixes exactly (C2 trim + gold flash, C2b flash + matte lead ball).
  Joins measured unchanged; the new set also fixes a duplicated frame in the old C1 set.
- Verified live in headless Chrome (animation frames running): 1600px loads only `hd/` frames,
  375px only phone frames, **0 failed requests**, each line fully visible on cue.

**Site** (four pages per `DESIGN.md`)
- Creative-director pass (10 fixes): tighter rhythm, paper service cards with an ink rule, a carousel
  that keeps the active project centred between two neighbours, founders and About copy level with
  their headings in reading-size Caslon, closing bands with email + phone, balanced portfolio names,
  sentence-case checkboxes, a real Contact panel (Email us / Call) while the form is offline, a
  cleaner footer. Before/after screenshots were sent in the session.
- Bug fixed: the contact form showed on the live site despite `hidden` (CSS overrode it). It now stays
  hidden until the Web3Forms key arrives.
- Portfolio windows: Beauty & Wellness *addict* NY live iframe; Smiles by Nilou full-page capture that
  scrolls inside the window until our domain is live. Iframes are out of the tab order (keyboard users
  use "Open Live Website").

**Quality (live URL, Lighthouse mobile)**

| Page | Performance | Accessibility | Best practices | SEO |
|---|---|---|---|---|
| Home | 94 | 100 | 100 | 69* |
| About | 98 | 100 | 100 | 69* |
| Portfolio | 100 | 100 | 100 | 69* |
| Contact | 99 | 100 | 100 | 69* |

\*SEO fails one audit on `*.vercel.app` only: our own `X-Robots-Tag: noindex` for the preview domain.
The same build scores **SEO 100** on all four pages without it, which is how minutemenmarketing.com
will serve it. No horizontal scroll at 375px on any page; every link resolves (internal routes,
`/about#founders`, mailto, tel, both client sites); keyboard tab order starts at Skip to content and
every stop shows a focus ring.

**Mobile edge-to-edge hero (fixed 2026-11-05):** the white strip at the bottom while the hero played
came from sizing the pinned stage to the small viewport (`100svh`); when the address bar collapsed,
the page background showed below it. Now `100lvh` on navy, with chips/cue/trail lifted clear of the
bar and safe areas. Tested live at 375×667, 390×844 and 430×932 with the bar shown and hidden at the
start, middle and end of the hero: 27/27 checks pass, no scroll jumps. Chrome emulation can't model a
real collapsing bar, so give it one scroll on a real iPhone and Android phone (LAUNCH.md step 5).

## Done 2026-11-06

- **Mobile edge-to-edge hero:** confirmed live again (27/27 checks at 375, 390 and 430 px, bar shown
  and hidden, start/middle/end; no scroll jumps).
- **Vercel Speed Insights and Web Analytics: done.** Both load after the page, production only.
  Analytics was enabled in Vercel on 2026-11-06 and `vercelAnalytics` is `true` in
  `src/site-config.js`. Verified live on all four pages: both scripts return 200, each page sends a
  page view that Vercel accepts (`POST /_vercel/insights/view` → 200), and there are no console
  errors or failed requests. (Vercel ignores headless/automated browsers, so the check used a normal
  Chrome user agent.) Vercel's analytics query API still answered "Web Analytics not found", so the
  dashboard count itself wasn't read from here: look at Vercel → minutemen-marketing → Analytics.
- **Branded 404** (`404.html`: shot line, one sentence, Back to the home page; real 404 status).
- **Favicon set** from the logo mark: `favicon.ico`, `favicon.svg`, `apple-touch-icon.png`, 192/512 and
  maskable icons, `site.webmanifest`.
- **Share cards:** full `og:*` and `twitter:*` tags with a 1200×630 JPEG and alt text. Previews will
  show the image once minutemenmarketing.com points at Vercel (the image URL lives on that domain).
- **Home performance:** live Lighthouse mobile **94–96** (was 78–94 and swinging), accessibility and
  best practices 100; other pages 99–100. Changes kept the hero looking the same: the preloader lifts
  as soon as the opening painting is in, hero words are split at build time, clip frames wait for the
  preloader to lift, CSS is inlined, Caslon is preloaded, the hero module is preloaded, and the globe
  prep waits until the reader scrolls.
- **Why not 98:** the first headline word can't appear before the ring's 0.9s minimum plus the 0.8s
  word reveal. A test build with a 0.5s ring and words starting as the preloader lifts scored 95–96, so
  98 would need the headline visible from the very first paint (no fade-in). **Decided 2026-11-06
  (Noah): keep the headline fade.** 94–96 with a 2.1s LCP is the accepted target; don't remove the
  preloader ring or the word reveal to chase 98.
- **Notes from the live site (step 2 of today's brief):** none were pasted. `TODO(Noah)`: send them and
  they'll be fixed and verified.

## Done 2026-11-07

- **Founder photos:** Noah and Ethan's headshots saved in `assets/founders/` (noah.jpg, ethan.jpg) and
  used in Meet the Founders on Home and on About: a matched square set (same eye height and spacing,
  same gray backdrop tone), AVIF + WebP at 240/400px in `public/founders/` with width/height set, alt
  text "Noah, co-founder of Minutemen Marketing" / "Ethan Eghbali, co-founder of Minutemen Marketing".
  Ethan's source is 400×400, so both export at 400px max.
- **LinkedIn:** company page in the footer and on Contact; a small LinkedIn icon on Ethan's founder
  cards. Noah's icon appears once his URL is set in `src/site-config.js` (`founders.noah.linkedin`).

## Done 2026-11-07 (launch polish)

- **Contact form live.** Web3Forms key in `src/site-config.js`; the form shows on /contact and the
  "online form isn't connected yet" panel is gone (code and styles removed). Honeypot, field
  validation, the thank-you message and the real error message all kept. One real test sent from
  minutemenmarketing.com at 13:59 ET: Web3Forms returned success and the page showed the thank-you
  message (subject "Consultation request from Site test (Minutemen Marketing (test))").
- **Founders check:** close-ups of Home and About sent to Noah to confirm each photo sits on the right
  name.
- **Phones (≤ 767px):** one centred column on every page: headings, eyebrows with their shot line,
  names, roles, buttons, founder portraits (About stacks photo over name), service cards, carousel
  cards, portfolio windows, the contact panel, closing band and footer. Paragraphs over about three
  lines stay left-aligned in the centred column. Tap targets reach 44px (logo, founder LinkedIn,
  carousel dots, footer and contact links). Audit at 375/390/430: no horizontal scroll, no content
  within 12px of an edge, no tap target under 44px. Before/after screenshots were sent.
- **Two layout bugs fixed at every width:** the carousel measured a scaled side card, so the active
  card sat off centre (33px at 375px); the portfolio list kept the browser's 40px list indent, pushing
  each project right.
- **Cross-browser QA on the live domain** (Chromium, Edge, WebKit desktop, iPhone 14 and Galaxy S9+
  emulation): hero plays and reaches all three lines, nav fades, carousel moves and swipes and stays
  centred, fonts load, no layout shift (CLS 0), both portfolio windows load **live** and scroll
  (Smiles included), contact form states work, menu and links work, no console errors. No
  browser-specific fixes were needed. Notes: Playwright's Firefox build is blocked from running on
  this Windows machine, so Firefox wasn't tested; WebKit on Windows renders the hero's CSS colour grade
  in software and can't show real Safari smoothness, so the real-iPhone scroll in LAUNCH.md step 5
  is the check (if it stutters: drop or bake in the grade for Safari).
- **LAUNCH.md step 5:** everything checkable from here passed on the live domain (HTTPS/HSTS and
  redirects, direct page loads and 404, the phone edge test 27/27, tel/mailto, Reduce motion toggle,
  share tags and og.jpg to LinkedIn's crawler, Analytics beacons, sitemap/robots). The phone,
  inbox, Search Console and LinkedIn Post Inspector checks are written up click by click there.

## Open items

1. **Noah's LinkedIn URL** → `src/site-config.js` (`founders.noah.linkedin`). His icon appears on
   the founder cards once it's set.
2. **Real client testimonials** (name, business, town, and permission to publish). LAUNCH.md step 4
   has the two request texts. The carousel shows project highlights until then.
