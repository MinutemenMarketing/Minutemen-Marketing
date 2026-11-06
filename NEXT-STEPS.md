# Next steps — minutemenmarketing.com

Updated 2026-11-05, end of session. `CLAUDE.md` is the contract (hero spec, rules, every approved
asset with its Runway task ID); `DESIGN.md` is the approved four-page design. Read both first.

**Runway credits: 1,627** (1,302 plan + 325 purchased, Pro plan), checked at the end of the session.
Nothing was spent this session. Rule unchanged: quote the cost and wait for Noah's OK before every
generation.

Live: https://minutemen-marketing.vercel.app (Vercel auto-deploys `main`). Local: `npm run dev`, then
http://localhost:5173. QA switches on any build: `?motion` ignores reduced motion, `?reduced` forces
it, `?herofail` / `?herofail=script` show the load-failure still version.

---

## Done

**Hero**
- Runs start to finish on the approved footage (K1 → C1 → C2 → C2b → C3 → C4 → brand globe → stacked
  logo). Timings in `src/hero/choreography.js`; pin 1000vh desktop / 650vh phone.
- Plays for everyone, including visitors whose system asks for reduced motion: it only moves when
  they scroll. Reduced motion drops the extras (Lenis, word staggers, blur, grain, scrub lag).
- Discreet **Reduce motion** chip (bottom-left) switches to the still version and is remembered on the
  device; **Play animation** switches back. The automatic still version appears only when the hero
  script or its frames fail to load.
- Still version: the K1 painting full-screen with only "Minutemen Marketing. *Ready at a minute's
  notice.*", then the stacked logo, then the site. Never a stacked list of the hero lines.
- Opens at the top every time, full-screen after the logo-ring preloader; nothing else in view until
  the visitor scrolls. The nav is a thin overlay that fades out while scrolling down through the hero.
- Phones fit the minuteman's whole body and musket during the push-in and shot (code only).
- Skip intro chip, bullet-trail progress line, Scroll cue, globe → logo hand-off without a grey wash.
- Phone frame set (960px) and a windowed loader: frames load just ahead of the scroll position.

**Site** (four pages, shared nav + footer, per `DESIGN.md`)
- Home: hero, five service cards, client-work carousel (factual highlights; a labelled draft quote in
  dev only), Meet the Founders, closing "A marketing plan built around your business."
- About: why we started, the founders (`#founders`), how we work.
- Portfolio: Beauty & Wellness *addict* NY (live iframe) and Smiles by Nilou in browser windows.
  Smiles allows framing only from minutemenmarketing.com, so elsewhere its window shows a full-page
  capture that scrolls inside the window (desktop and phone captures in `public/work/`); on our domain
  it switches to the live embed by itself. Wheel and touch scroll the window, not the page.
- Contact: work email minutemenmrktng@gmail.com and (631) 882-8022 (tap to call) on Contact and in
  every footer. The form is built (Web3Forms, honeypot, real error state) but **hidden until the key
  arrives**; until then the page says to email or call.
- Logos: traced vectors in `public/brand/` (stacked, horizontal, horizontal-light, mark).
- SEO: unique title, description, canonical and H1 per page; OG image; `sitemap.xml` with the four
  routes; `robots.txt`; Vercel `cleanUrls` so each route loads directly.
- Copy passed through stop-slop (protected: the three hero lines and the closing heading).
- Smiles by Nilou: the frame-ancestors header change was promoted by Noah and verified (site unchanged
  otherwise).

## Open

1. **Web3Forms access key** (Noah, today). Put it in `src/site-config.js` → the form appears on the live
   site. Then send one test submission and confirm it reaches the inbox.
2. **Point minutemenmarketing.com at the Vercel project.** Needed for the Smiles live embed and so the
   canonical/OG URLs match the site.
3. **1080p clips — quote ready, not approved, nothing spent.** Runway's video upscaler on the approved
   clips keeps motion and joins identical (no re-render):

   | Clip | File | Length | Cost at 2 credits/s |
   |---|---|---|---|
   | C1 | `assets/clips/c1-pushin.mp4` | 6.04 s | ~12–14 |
   | C2 | `assets/clips/c2-firing.mp4` | 5.04 s | ~10–12 |
   | C2b | `assets/clips/c2b-follow.mp4` | 6.04 s | ~12–14 |
   | C3 | `assets/clips/c3-climb.mp4` | 8.04 s | ~16–18 |
   | C4 | `assets/clips/c4-orbit.mp4` | 6.04 s | ~12–14 |
   | **Total** | | **31.2 s** | **~62–72 credits** (range covers per-second rounding) |

   Notes: the upscaler outputs up to 4K; we'd scale frames down to 1920px. Noah's Pro plan lists
   "unlimited 4K video upscaling" in the Runway web app, so running it there may cost 0 credits; the
   API route bills per second. The approved clips must be uploaded first (free). C2b's matte-ball
   repaint and C2's gold flash are applied at frame extraction, so they carry over. Desktop frames
   would grow about 2.25× in pixels — decide whether 1920px goes to large screens only.
4. **Still from Noah:** other email, Instagram, LinkedIn, other links (hidden until filled); founder
   photos and surnames; real testimonials (name, business, town, permission); other finished client
   sites with live production domains (Muses Nails, Wealth Advisory Group, Gym Grindz, Bang Bang
   Barbershop exist only as `.vercel.app` builds; Ray Nail Spa was a pitch).
5. **QA in a real, visible browser:** the Claude browser pane pauses animation frames while hidden, so
   live fades were verified structurally (classes, pin lengths, scroll position, full-screen hero) and
   on localhost with frames running. Look once in Chrome with Windows "Animation effects" on and off.
6. Empty folder `C:\c` left over from a path mix-up; safe to delete.
