# Next steps — minutemenmarketing.com

Updated 2026-11-05 (late), end of session. `CLAUDE.md` is the contract (hero spec, rules, every
approved asset with its Runway task ID); `DESIGN.md` is the approved four-page design. Read both first.

**Runway credits: 1,565** (was 1,627; **62 spent** this session on the approved 1080p upscale:
C1 12, C2 10, C2b 12, C3 16, C4 12). Rule unchanged: quote the cost and wait for Noah's OK before
every generation.

Live: https://minutemen-marketing.vercel.app (Vercel auto-deploys `main`). Local: `npm run dev`, then
http://localhost:5173. QA switches on any build: `?motion` ignores reduced motion, `?reduced` forces
it, `?herofail` / `?herofail=script` show the load-failure still version, `?formoff` (dev only) shows
the Contact page as it looks without a Web3Forms key.

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

## Waiting on Noah

Step-by-step instructions for items 1, 2 and 5 (plus email forwarding for hello@ and the two
testimonial texts) are in **`LAUNCH.md`**. The domain is registered at GoDaddy, with DNS at GoDaddy.

1. **Web3Forms access key: waiting on Ethan.** → `src/site-config.js`. The form then appears on the
   live site; send one test submission and confirm it reaches minutemenmrktng@gmail.com.
2. ~~GoDaddy domain access.~~ **Domain connected (seen 2026-11-07):** minutemenmarketing.com resolves
   to Vercel (216.198.79.1), serves the latest build, `www` redirects to it, and pages are indexable;
   og.jpg is served there, so share cards now have their image. The old minutemen-marketing.vercel.app
   address now returns 404. Still to do from LAUNCH.md step 5 on the real domain: the real-phone
   scroll, the Smiles live embed check, Search Console + sitemap, and share previews (LinkedIn Post
   Inspector).
3. Other email, Instagram, **Noah's LinkedIn URL**, other links (hidden until filled).
4. Surnames on the founder cards, if wanted.
5. Real testimonials (name, business, town, permission). The carousel shows project highlights until
   then.
6. Other finished client sites with live production domains and the client's OK (Muses Nails, Wealth
   Advisory Group, Gym Grindz and Bang Bang Barbershop are `.vercel.app` builds only; Ray Nail Spa was
   a pitch).
7. One look in a real Chrome window with Windows "Animation effects" on and off (the session verified
   both paths in headless Chrome; a real-device pass on a phone over cellular is still worth doing).
8. Empty folder `C:\c` left over from a path mix-up; safe to delete.
9. ~~Turn on Vercel Web Analytics.~~ **Done 2026-11-06** (enabled in Vercel, flag on, verified live).
10. **Your notes from the live site** (today's step 2 was left blank).
11. ~~Decide whether to trade the headline fade for a 98+ mobile score.~~ **Closed 2026-11-06:**
    keep the fade; 94–96 is the target.
