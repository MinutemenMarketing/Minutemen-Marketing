# minutemenmarketing.com

Website for **Minutemen Marketing**, Noah's own web design agency (Long Island, NY). We build premium
websites for local businesses. This site is the pitch: it has to be the fastest, most polished thing
a prospect sees that week.

Repo: https://github.com/MinutemenMarketing/Minutemen-Marketing (branch `main`). Deploys on Vercel.

## Rules (non-negotiable)

1. **Runway credits:** before EVERY Runway generation (image, video, vector, upscale, anything that
   spends credits), quote the model and the credit cost and **wait for Noah's explicit OK**. One OK
   covers one generation, not a batch, unless he says otherwise.
2. **Git:** make a commit before every major change, and **push to GitHub after every commit**
   (`git push origin main`).
3. **Mobile-first, fast, accessible.** Respect `prefers-reduced-motion` (see Hero → Reduced motion).
4. **Copy is real HTML text.** Never bake headlines or words into images or video frames.
5. **No media generated yet** — the pipeline below is planned, not run. Do not start it unprompted.

## Concept — the scroll-driven hero

One continuous story, inspired by pear.no: dark, restrained, premium.

1. **Wide opening:** a very wide 18th-century oil painting of **one unified militia formation**, all
   facing screen-right (no opposing line), with broad landscape, stone walls, the distant white
   meetinghouse and open sky for text. No oversized or isolated foreground soldier.
2. **Our Minuteman is already in the group** — center-right, normal scale and spacing, black tricorn,
   **already aiming**: musket at the shoulder toward screen-right, eye/shoulder/hands/stock/barrel
   aligned, poised just before the shot (no flash, smoke or recoil from his barrel yet). Others may
   already be firing. Nobody blocks the camera's path to his face and musket. Every soldier wears the
   same navy coat (no red coats that read as British).
3. **Push-in:** a smooth, deliberate camera move toward him. His position in the scene stays fixed;
   neighbours and the stone wall slide to the edges through perspective. Face, hat, coat, hands,
   musket, light and geography stay consistent. Ends in a **medium close side profile facing
   screen-right** (head, upper torso, hands, stock, enough barrel to read the action).
4. **Fire:** he is already aimed (barrel about horizontal toward screen-right, cheek to the stock, eye
   along the barrel). One discharge: brief warm muzzle flash, restrained recoil, expanding white-gray
   black-powder smoke.
5. **The ball:** extreme close side view of the muzzle as a single **round lead musket ball** (never a
   modern pointed bullet or cartridge) emerges in extreme slow motion. It travels screen-right along
   the barrel axis; the camera tracks alongside as the muzzle and soldier fall back into soft focus.
   Same painted texture, warm light and palette even in close-up. Clear space ahead of the ball.
6. **Globe:** the camera follows the ball through the air and **around a painted globe**. Documented
   K4 frame: a painted Earth, North America facing the viewer, floating in a deep blue-black sky with
   soft clouds below; the small musket ball trails a glowing gold arc curving around the globe's edge;
   the globe is centered and fills the middle third of the frame.
7. **Logo:** the globe **fades into our navy logo circle**, and the page becomes the normal site.
   Nothing more specific is documented for this hand-off — ask Noah before inventing choreography.

Scrolling down plays forward; scrolling up plays backward (canvas image-sequence scrubbed by scroll).

### Production stages (one candidate at a time, Noah approves each before the next)

Opening still → closer character view → muzzle/projectile view → globe → logo circle. Each approved
frame is the reference for the next stage where the model supports it. Never put the whole sequence in
one prompt. No automatic variations, upscales, retries or model switches. Approved assets are never
overwritten; new versions are saved under new names. Artwork has no lettering, signatures, watermarks,
interface elements or borders.

- **APPROVED opening still: `assets/keyframes/k1.png`** = opening v4 (Runway task
  `913bb252-82a3-4a28-b648-dbfb0ee2a5f2`, 5504×3072). Featured soldier center-right, aiming
  screen-right, no flash yet. Accepted as-is: two brown/olive coats left of center, his muzzle sits
  just above his right-hand neighbour's hat (leave that man out of the muzzle close-up), face partly
  covered by hands/stock. Use it as the reference for the closer character view.
- **Opening base before approval:** opening v3 (Runway task `4acb642e-73e2-4595-b31c-07abe01d5b23`, 5504×3072,
  `assets/drafts/opening-v3.png`) — fresh composition, whole militia facing right. Narrower framing
  and the corner signature are accepted by Noah.
- **Selected style reference:** K1 variation B (Runway task `a35c7f7f-af20-4f69-8541-940dc8d78a0a`,
  5504×3072, local copy `assets/drafts/k1-b.png`) — navy-coated figure, stone walls, meetinghouse.
  Always reference the original generated files, never photos of a monitor.

### Hero copy (HTML, overlaid on the canvas — exact wording)

1. **"Minutemen Marketing."** / "Ready at a minute's notice."
2. **"Your site, live in days. Not months."**
3. **"The shot heard round the world. Now make yours heard round town."**

Beat 1 sits over the painting, beat 2 over the push-in/shot, beat 3 over the ball and globe.

### Reduced motion

With `prefers-reduced-motion: reduce`, there is no scrubbing and no Lenis smooth scroll: show a single
still (the final logo-circle frame or the painting) with all three copy beats as stacked static text.
Note: the Claude desktop browser pane reports reduced motion — QA the motion path in a real browser.

## Brand

- **Navy `#032249`** — sampled from `brand/logo-square.png` (dominant mark color; the cluster is
  `#022148`–`#02224A`). Use it for the logo, headlines on light, and the dark hero ground.
- **Warm off-white `#F7F4EC`** for page paper (the logo files sit on `#FEFDF9`).
- Navy on the off-white is ~14:1 contrast — fine for any text size.
- **Headlines: Libre Caslon Text** (Google Fonts, self-hosted via `@fontsource`). Caslon is the face
  the Declaration of Independence was printed in — period-correct without being costume.
- **Body: Hanken Grotesk** (variable, self-hosted via `@fontsource-variable`).
- Logo files live in `/brand` (`logo-full.png`, `logo-square.png`, LinkedIn banners). `Images/` holds
  the originals Noah dropped in and is not committed. A clean `brand/logo-mark.svg` will come from the
  Recraft vector step.

## Stack

- **Vite**, vanilla JS (no framework — the hero is one canvas and a few DOM nodes).
- **GSAP + ScrollTrigger** for scroll timelines; **Lenis** for smooth scroll (synced to ScrollTrigger).
- **Canvas image-sequence scrubbing** — frames in `public/frames/<version>/`, listed by a
  `manifest.json` (`{ "count": N, "pattern": "f_%04d.webp", "width", "height" }`). The scrubber draws
  `cover`-fit on a DPR-aware canvas, preloads progressively, and falls back to the nearest loaded frame.
- **ffmpeg** extracts frames from approved finals (`npm run frames -- <video> <version>`).
  Not installed on this machine yet: `winget install Gyan.FFmpeg`.
- **Vercel** for hosting (`vercel.json`). Frame folders are versioned (`v1`, `v2`…) so they can be
  cached long; never set long browser `max-age` on unhashed, unversioned files.

## Media pipeline (Runway) — every step needs a cost quote + OK first

| Step | Model |
| --- | --- |
| Keyframes (painting, Minuteman profile, musket ball, painted globe, logo circle) | **Nano Banana Pro** |
| Video drafts between keyframes | **Kling 3.0 Turbo** |
| Video finals | **Kling O3 Pro** (backup: **Veo 3.1**) |
| Logo vector | **Recraft V4.1 Vector** |

- Drafts and rejected takes go in `assets/drafts/` (gitignored). Approved keyframes in
  `assets/keyframes/`, approved finals in `assets/finals/`; extracted frames in `public/frames/`.
- Keep the Minuteman consistent across shots: same figure, side profile facing right, same palette.
- Style target: 18th-century oil painting (visible brushwork, varnish, muted earth tones), dark and
  restrained — it must sit next to clean navy/off-white UI without looking like a game trailer.

## Layout

```
brand/            logo files (source of truth for brand color)
public/frames/    extracted hero frames, versioned folders
assets/           keyframes/, finals/ (committed), drafts/ (ignored)
scripts/          extract-frames.mjs (ffmpeg wrapper)
src/              main.js, hero/sequence.js, styles/
legacy/           the Sept 2026 static site (archived, not committed; its no-colonial-imagery rule
                  is superseded by this concept)
```

## Commands

```
npm run dev       # Vite dev server on :5173
npm run build     # production build to dist/
npm run preview   # serve dist/
npm run frames -- assets/finals/hero.mp4 v1   # extract frames + manifest
```
