# Next steps — minutemenmarketing.com

Written 2026-11-05 at the end of the session. `CLAUDE.md` is the contract (hero spec, rules, every
approved asset with its Runway task ID); `DESIGN.md` is the approved post-hero design. Read both first.

**Runway credits: 1,627** (1,302 plan + 325 purchased), confirmed at the end of the session.
Rule unchanged: quote the cost and wait for Noah's OK before every generation.

Preview: `npm run dev`, then http://localhost:5173/?motion (`?motion` forces the motion version even
where the system asks for reduced motion — the Claude browser pane always does).

---

## Done

**Hero — runs start to finish on approved footage**

| Scroll | Asset | Notes |
|---|---|---|
| 0–10% | K1 `k1-cool.png` | Beat 1: "Minutemen Marketing. / *Ready at a minute's notice.*" |
| 10–28% | C1 `c1-pushin.mp4` | Push-in K1 → K2; hold stays on C1's last frame |
| 32–44% | C2 `c2-firing.mp4` | Trimmed start, warm-gold flash, no audio |
| 44–58% | C2b `c2b-follow.mp4` | Follow the bullet; chrome ball repainted as matte lead (free). Beat 2 |
| 58–72% | C3 `c3-climb.mp4` | Climb through clouds; white stretch compressed; globe settles onto the 50% circle |
| 72–84% | C4 `c4-orbit.mp4` | One orbit; hidden stretch compressed. Beat 3 while the ball comes round the front |
| 84–100% | K4 → brand globe → logo | Slow fades on one circle, no size jump, no visible edges |

- One pinned, scrubbed timeline; every timing in `src/hero/choreography.js`.
- 5-frame dissolve at every join; one shared canvas grade and one grain layer.
- Large Caslon beats with italic key phrases, staggered word reveals, soft invisible scrim.
- Logo-ring preloader, bullet-trail progress line, "Scroll" cue.
- Reduced-motion fallback: no pinning, all three lines stacked.
- Checked at 1440×900, 861×906 and 375×812; no horizontal scroll.

**Post-hero site** (per `DESIGN.md`): nav, intro, plain-language services, Ready / Aim / Fire / Heard
chapters (one brief pin each), work plates from the real builds, Work → Contact crossfade, two-column
contact form that never reports a false success, footer. A creative-director pass fixed ten things
(listed in `DESIGN.md`); before/after sheet: `assets/drafts/review/before-after.png`.

## Open

- ~~Hero frames total ≈ 20MB for everyone~~ — **fixed 2026-11-05 (item 1):** phones get a 960px
  set (≈ 9.2MB total) and everyone loads only just ahead of the scroll position (a phone loads 38
  files at the top instead of 475). Desktop frames are unchanged.
- The logo circle is still the placeholder PNG (`brand/logo-square.png`).
- All five clips are **720p drafts** (Kling 4.0).
- Work → Contact crossfade is a placeholder (battlefield → navy). Planned: Smiles by Nilou's real
  old site → the site we built. Wayback has no usable capture (images and styles weren't archived),
  so Noah will send a screenshot. Never use a fake "before".
- Launch facts still missing (see item 6).

---

## Tomorrow, in order

1. ~~**Cut the hero download size.**~~ **Done 2026-11-05.** Phones use 960px frames (720px tested as
   too soft once a phone scales the frame to its height); frames load just ahead of the scroll
   position; desktop frames and drawing unchanged. Still to confirm on a real phone over cellular.
2. **Million-dollar hero polish** — seamless joins with one shared grade and grain, Caslon text with
   italic key phrases and staggered word reveals, the logo-ring preloader, the bullet-trail progress
   line, slow globe-to-logo fades.
   *Status: built on 2026-11-05 (see Done). Tomorrow: review it in a real browser and refine what
   doesn't feel right — don't rebuild it.*
3. **Logo SVG.** Recraft V4.1 Vector (quote first; listed at ~8 credits) or trace by hand from
   `brand/logo-square.png`. Then swap it into the hero's logo stage and the site.
4. **Creative-director pass on the whole site vs pear.no: top 10 fixes.**
   *Status: the first pass was done on 2026-11-05 (ten fixes in `DESIGN.md`). Tomorrow: a second pass
   on what's left, with fresh before/after screenshots.*
5. **Quote 1080p finals for C1, C2, C2b, C3 and C4 as one batch.** Same start/end frames and prompts as
   the approved drafts (all recorded in `CLAUDE.md`). Kling 4.0 has charged 12 credits/s at 720p; check
   the 1080p rate before quoting. C2b's matte-ball repaint and C2's gold flash must be re-applied at
   extraction.
6. **Launch TODOs from Noah** (all marked `TODO(client)` in the code):
   - real email address (currently `hello@minutemenmarketing.com`, unconfirmed)
   - phone number (or confirm there is none)
   - Instagram and LinkedIn URLs
   - real turnaround time for the speed line ("Most sites go live in …")
   - client permissions for each work plate, plus towns and live URLs; Ray Nail Spa (a pitch site)
     stays out unless shown labelled as a concept; Nilou's permission for the before/after
   - testimonials: up to three real, attributed quotes (the section stays hidden until then)
   - also: the inquiry endpoint (Resend keys or a webhook) and the production domain
