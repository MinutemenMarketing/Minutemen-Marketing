# Next steps — minutemenmarketing.com

Updated 2026-11-08, end of session. `CLAUDE.md` is the contract (hero spec, rules, every
approved asset with its Runway task ID); `DESIGN.md` is the approved four-page design. Read both first.

**Runway credits: 1,280** (2026-11-08 late: smoke removal 60 within Noah's 150-credit cap; K1 edit 80 within Noah's 120-credit cap; earlier: 95 within Noah's 200-credit approval — C1 regeneration 94,
background removal 1; then 72 within the 250-credit C1 rebuild approval — C2 v3, failed). Rule unchanged: quote the cost and wait for Noah's OK before every
generation.

Live: **https://minutemenmarketing.com** (Vercel auto-deploys `main`; the old `*.vercel.app` address now returns 404). Local: `npm run dev`, then
http://localhost:5173. QA switches on any build: `?motion` ignores reduced motion, `?reduced` forces
it, `?herofail` / `?herofail=script` show the load-failure still version.
Playwright QA scripts (cross-browser run, mobile alignment audit, full hero pass) are in `qa/`.

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

## Done 2026-11-08

**Hero glitches (first pass):** first wheel click moves the push-in (0.8% hold, C1 remap, scrub
0.35); the one-frame giant ball in C2b repaired in all three sets (`f_0017-fix1.webp`); slow-4G
loading keeps frames within a few of the scroll; beat text fades in once (no on/off/on). See
CLAUDE.md for causes and measurements.

**A. Hero**
- **C1 regenerated, failed, current C1 kept.** Kling 4.0, 6s, 720p, cool K1 → K2, with Noah's added
  line (task `af00ab27-83cc-476f-8f03-cc1f014e2ac8`, 94 credits, saved as `assets/drafts/c1-v2.mp4`).
  Frame by frame it repeats v1's faults: from frame ~10 a second soldier fades in out of the smoke
  behind K1's man, the camera pushes past the original man to him, and new puffs appear on background
  muskets. The cause is structural: K1's man stands **in** the rank, K2's man stands alone **in front
  of** the line, so a start+end interpolation has to invent a figure. The second try was not run: no
  free end frame can fix it, because C2 starts on K2 (a K1 crop would need a K1→K2 crossfade at the
  hold; a K2 with the line painted out leaves a ghost and the line would fade back in). Fix that would
  work: a new K2 made from K1's own man (Nano Banana Pro edit of a K1 crop), then C1 to it and C2 from
  it, about 20 + 94 + 60-94 credits plus upscales. **Needs Noah's OK.**
- **Globe → logo aligned.** The logo ring's centre and size were measured from the old square PNG,
  not the vector the hero draws: it sat ~1.5% left, ~0.8% low and 2.7% too big. Refitted to
  `logo-stacked.svg`; on screen the ring edge is within 0–2.5px of the globe edge at 1440×900 and
  390×844 (was 2–13px off).
- **Returning visitors:** once someone has watched the hero (95% or Skip intro), Home lands just past
  it for the rest of the browser session, nav showing; a small **Replay intro** link (`/?intro`)
  restarts it. A new session gets the full hero.

**B. Fonts:** headings and labels in **Outfit** (closest free match to the MINUTEMEN / MARKETING
wordmark; emphasis in light weight instead of italic; labels letter-spaced like MARKETING); body in
**Public Sans**. Neither is used on any client site. DESIGN.md and CLAUDE.md updated.

**C. Home:** two big cards for Website Design & Development and Social Media Management, small cards
for Search Engine Optimization (SEO), GEO and Domain Acquisition; portfolio heading "Client sites we
built, live today.", no View Our Portfolio button, carousel centred, the active card links to
`/portfolio#beauty` / `#smiles`; founders without role lines, Ethan Eghbali in full; the closing
ring removed and the band centred; section rhythm tightened and headings widened to cut dead space.

**D. Founder photos:** Noah on a soft blue studio backdrop (Runway cutout, 1 credit; clean edges),
Ethan stays gray; same crop and sizes. Scripts in `scripts/noah-*.cjs`.

**E. About:** heading "We use AI to work faster and charge less." (after stop-slop) with Ethan's
paragraph exactly as supplied; founders full width with large portraits, bios and the "Noah and
Ethan" title removed; How We Work removed; the closing-band sentence removed.

**F. Portfolio:** each window renders the site in a real 1440×900 viewport scaled to fit (about
1240×775 on desktop), so it looks exactly like a laptop, on every screen; the drip addict sentence
removed; "doctor and nurse-led"; nothing on the page is sticky any more (the text column used to
stick under the nav); closing-band sentence removed.

**G. Footer and Contact:** "Serving Long Island, New York" removed; email and phone shown without
"Or reach us:"; the footer's services sentence removed; **Terms of Service** link wired to
`SITE.terms` (hidden until the text exists); **Instagram** shows in the footer and on Contact as soon
as `SITE.instagram` is set.

**H. Checks:** see the quality table below.

Live minutemenmarketing.com, 2026-11-08, Lighthouse mobile (two runs each):

| Page | Performance | Accessibility | Best practices | SEO |
|---|---|---|---|---|
| Home | 94–99 (LCP 1.4–1.9s) | 100 | 100 | 100 |
| About | 100 | 100 | 100 | 100 |
| Portfolio | 98–100 | 100 | 100 | 100 |
| Contact | 100 | 100 | 100 | 100 |

The font change first dropped Home to ~75: the opening words repainted later and larger (pre-hidden
before Outfit drew them, a blur on their entrance, a smaller fallback face). Fixed without changing
the look (details in the commit "Home performance and founder lists"). Founder lists became plain
lists (accessibility was 91–96 with photos inside `<dl>`s).

Also on live: cross-browser run (Chromium, Edge, WebKit, iPhone 14, Galaxy S9+) passes everything
except WebKit frame pacing (Windows software rendering, same as before; check on a real iPhone);
mobile audit at 375/390/430: no horizontal scroll, no tap target under 44px, centred columns; every
link resolves (LinkedIn answers scripts with 403/999); contact form validation, success, error and
honeypot checked with the request intercepted (no email sent); hero pass with wheel, trackpad and
touch on fast and slow 4G clean. Firefox still can't run on this machine.

## Done 2026-11-08 (evening)

- **Hero controls:** Reduce motion + Skip intro are one small group top-right: under the nav while it
  shows, up in its space (safe-area aware) once it fades; half-transparent while scrolling, full on
  hover/focus/tap. Every beat is centred; beat 1 starts below the group, beat 2 ends above the Scroll
  cue and progress line (`--hud-t` / `--hud-b`). The Scroll cue no longer moves up on phones.
- **Collision check** in `qa/hero-pass.mjs` (`--collide-only`, `--shots <dir>`, `--selftest`): every beat at
  375×812, 375×667, 390, 430, 768, 1280 and 1920, controls both low and up, asserts no control box
  (motion toggle, Skip, Scroll cue, progress line) overlaps any word, and that the text is centred.
  All pass on live; `--selftest` (controls pinned onto beat 1) fails as it must. Not modelled:
  real iPhone safe-area/home-bar insets and a collapsing address bar (emulators report 0).
- **Names:** "Noah Medina" and "Ethan Eghbali" on Home and About, photo alt text, About title and
  description, Home lede, and new Organization JSON-LD on Home and About (there was no schema
  before). About's "Founder · Design/Strategy" lines removed.
- **C1 rebuild: failed, current C1 and C2 kept** (72 of 250 credits spent). New K2 = crop of K1's own
  man (0 credits). C2 (new K2 → `c2-last.png`) generated first: background soldiers fire, men climb the
  wall, and the field morphs into K2's layout around 4s. C1 was then not generated. Details and task
  ID in CLAUDE.md; contact sheets in `qa/shots/c2v3-*.jpg` (git-ignored).

- **C1 is now code (0 credits):** a scroll-driven push-in on the K1 painting itself (high-res detail
  layer, so it stays sharp at ~2.3× on desktop), then a painted-smoke band drifts right to left in two
  depths and K1 crossfades to K2 under it. No AI footage, so no figure fading in and no background
  smoke. Beat 1 timing unchanged; the first wheel click moves the frame as much as before (measured
  7.21 vs 7.24). Fully covered by smoke for ~2% of the scroll (about two wheel clicks). Figure/background
  parallax was left out: K1 has no clean figure mask, and a cutout would cost credits or leave halos.
  The 276 old C1 frame files are gone from `public/hero/v1`. Live: full hero pass clean (WebKit swipe
  shows its usual scripted-scroll opacity jumps) and the collision check 56/56. Sheets:
  `qa/shots/pushin-desktop.jpg`, `smoke-desktop.jpg`, `pushin-smoke-phone.jpg`.

- **New K1 with K2's soldier** (80 credits, two Nano Banana Pro variants; Noah chose B). The push-in
  now lands on exactly K2's framing (same man, same place and size, desktop and phone) and K2
  crossfades in at that place under a light smoke pass. Side-by-sides: `qa/shots/handoff-desktop.jpg`,
  `handoff-phone.jpg` (last push-in frame, K2 hold, first full C2 frame) and the two `-sequence` sheets.
  The new K1 is also the opening frame, the reduced-motion still and the share image (`og-v2.jpg`:
  painting with the horizontal logo over a soft paper wash). First click unchanged (7.19 vs 7.24,
  live). Live hero pass clean (WebKit swipe: its usual scripted-scroll jumps); collision check 56/56.
  Seen in the side-by-side: the first fully shown C2 frame already has small muzzle flashes in the
  background line (that is the existing C2 footage, not new).

## Done 2026-11-08 (late)

- **Hero:** Skip intro only (Reduce motion chip removed). Returning visitors land at Services with the
  full hero above; scrolling up shows the logo, then the whole animation backwards (Replay link
  removed). Globe line: "With the right marketing, you can **reach an audience around the world.**"
- **Background smoke and flashes removed** (60 of 150 credits): the musket puffs were in the K1
  painting (fixed by an edit, k1-v3); the muzzle flashes and chest-level puffs were in the C2 footage
  (every frame repaired with a clean plate); K2's still had one faint puff (same plate). Details in
  CLAUDE.md.
- **Page titles:** "Minutemen Marketing"; "About | Minutemen Marketing"; "Portfolio | Minutemen
  Marketing"; "Contact | Minutemen Marketing". Meta descriptions unchanged.
- **Services:** Noah's exact copy; GEO card titled "Generative Engine Optimization (GEO)" like SEO.
- **Founders:** Ethan first (left, first on mobile), Noah second, everywhere incl. schema; new intro.
- **About:** "Why we started" set as a quoted message from the founders; nothing on the site is
  sticky any more (the split heading was `position: sticky`).
- **Instagram** live in the footer and on Contact.
- **Portfolio:** root cause of the frosted windows was the fractional CSS transform scale (0.86) on the
  1440px iframe; windows 1024px+ now show the site unscaled, narrower ones keep the scaled desktop
  view; no opacity layer; full-resolution fallback screenshots. Case-study structure with hairlines.
  (The soft photo at the top of Beauty & Wellness is that site's own `blur(3px)` design.)
- **Contact:** form panel left, details right (form first on mobile); Email / Phone / Instagram
  (@minutemenmarketing) / LinkedIn under small labels; error lines reserved so errors cause zero
  layout shift (CLS 0 at 1440/375/390/430).

## Done 2026-11-09

- **Live checklist** of the 2026-11-08 batch: every item passes on minutemenmarketing.com
  (`qa/verify-live.mjs`, plus the returning-visitor flow, hand-off screenshots and the form-shift test).
- **Client name:** "Beauty & Wellness addict" (no "NY") on Home, Portfolio, alt text, meta and
  LAUNCH.md; the location line stays "Great Neck, NY".
- **Portfolio:** Beauty & Wellness addict's "What we built" now says we highlighted their top client
  reviews: one Google review featured on their homepage, five together on their About page (checked
  on beautyandwellnessny.com).
- **Contact:** service checkboxes = the Home card titles, in card order; the Web3Forms email lists the
  full names (checked by intercepting the request; nothing sent).
- **Skip intro** flush in the top-right corner, aligned to the nav's edge (gutter on phones, the 1240px
  column on wide screens), centred in the nav band, below the notch. **Phone glitch root cause:** Skip
  was tied to the nav, which flipped on every change of scroll direction, so Skip slid 72px up and down
  over the hero (62–69 moves per run in emulation). The nav now stays hidden inside the hero and Skip
  fades (not slides) the one time it changes place: 2 moves per run. Collision check 56/56; hero pass
  clean. Note: the WebKit emulator on Windows draws Outfit/Public Sans thin (default instance) while
  laying them out at the right weights; real iPhones render the weights normally.
- **Caching:** HTML revalidates on every visit, JS/CSS are content-hashed, hero frames are versioned and
  every changed frame has a new name, no service worker. Anything that looked old was a deploy still
  in progress or an already-open tab.

- **Phones: no more blurry moving fill.** Root cause: on portrait screens the soldier scenes were
  shrunk to fit his whole figure across the width and the space above was filled with the top of
  the current frame averaged to 3×3 and stretched, so it shifted with every C2 frame. Phones now get
  the real painting full-screen (`CHOREO.phoneFill = 'cover'`), centred on the soldier, then panning
  to the muzzle and the ball. A static K1-sky alternative (`?fill=sky`) was compared at 390px and
  looked worse (soft, upscaled sky with a seam). Sheet: `qa/shots/phone-fill-compare.jpg`.

### Declined 2026-11-09: true 9:16 phone versions (Runway video expand)

**Decision (Noah): keep the cover crop, no credits spent.** Reason: a 9:16 expand turns the 16:9
picture into a band about a third of the screen tall, so the soldier would be smaller than in today's
cover crop, with everything above and below him newly painted. The quote stays below for reference.
The `?fill=sky` comparison option was test code and is removed.

#### The quote (28 credits per source second)

| Asset | Length | Credits |
|---|---|---|
| C2 firing | 5.04s | ≈141 (168 if billed per whole second) |
| C2b follow the bullet | 6.04s | ≈169 (196) |
| C3 climb to the globe | 8.04s | ≈225 (252) |
| C4 orbit | 6.04s | ≈169 (196) |
| K1, K2, K4 stills, 9:16 image outpaint (Nano Banana Pro, 2K) | — | 3 × 20 = 60 |
| Video upscale of the four 9:16 clips (expand outputs at most 1080p) | — | ≈ 4 × 13 = 52 |
| **Total** | | **≈ 816 (up to ≈ 924)** of 1,280 |

C1 needs nothing (it is drawn in code from K1). Process: upload the four 1280px clips; expand each to
9:16 with the existing scene continued; check every frame; upscale; extract a new phone set
(`public/hero/v2/m/`, e.g. 1080×1920, same frame counts: C2 from 1.8s at 24fps = 78, C2b 92, C3 122,
C4 91) with `vframes.mjs`; redo the free per-frame fixes in the new geometry (C2 gold flash and the
clean-plate background, which needs a new 9:16 plate, ~20 credits more; C2b matte ball track and
f_0017; C3 globe-settle and C4 globe positions); new 9:16 K1/K2/K4 stills and K1 detail layer; and a
phone tier in `choreography.js` with its own FOCUS coordinates. Trade-off: in a 9:16 expand the
original 16:9 picture becomes a band about a third of the screen tall, so the soldier is smaller than
in today's cover crop; everything above and below him is newly painted.

- **Terms:** `/terms` built from the Hosting, Maintenance & Support Terms PDF (title, effective date,
  contents I–XXI + Client Acknowledgment, Download PDF; text checked word for word with pdf.js: 2,099
  words, 0 differences). Footer 'Terms of Service' link on. PDF at `public/legal/`.
- **Service card:** Website Design & Development now says 'include ongoing maintenance and updates.'
- **Privacy policy draft** at `/privacy` (footer link beside Terms; a note under the Contact form).
- Both pages in the sitemap; checked at 1440 and 375px (no horizontal scroll, 44px tap targets,
  contents links land under the nav); Contact form still zero layout shift.

## Open items (waiting on Noah)

1. **Review the Privacy policy draft** at /privacy; once approved, remove 'Draft' from its date line
   (`privacy/index.html`).
2. **Real client testimonials** (name, business, town, and permission to publish). LAUNCH.md step 4
   has the two request texts.
3. **Noah's LinkedIn URL** → `founders.noah.linkedin` in `src/site-config.js`.
