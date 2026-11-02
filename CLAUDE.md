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

1. An 18th-century oil painting of a Revolutionary War battlefield.
2. The camera pushes in to **one Minuteman in side profile, facing right**.
3. He fires.
4. The camera follows the **spinning musket ball** through the air and **around a painted globe**.
5. The globe fades into our **navy logo circle**, and the page becomes the normal site.

Scrolling down plays forward; scrolling up plays backward (canvas image-sequence scrubbed by scroll).

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
