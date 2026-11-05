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
5. **Media is generated one approved stage at a time** (see Production stages). Never start the next
   stage, a variation or a retry unprompted.

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
   musket, light and geography stay consistent. Ends in a **full-body side view facing screen-right**:
   hat to boots with comfortable margins, the **entire musket** visible from stock at the shoulder to
   muzzle tip, him slightly left of center, the **right third of the frame open** beyond the muzzle.
   No early close-up that crops his body or the gun.
4. **Fire:** he is already aimed (barrel about horizontal toward screen-right, cheek to the stock, eye
   along the barrel). One discharge with his full body and the whole gun still in frame: brief muzzle
   flash, restrained recoil, expanding white-gray black-powder smoke. Only **after the ball visibly
   clears the muzzle** does the camera smoothly start following it.
5. **The ball:** extreme close side view of the muzzle as a single **round lead musket ball** (never a
   modern pointed bullet or cartridge) emerges in extreme slow motion. It travels screen-right along
   the barrel axis; the camera tracks alongside as the muzzle and soldier fall back into soft focus.
   Same painted texture and cool steel-blue grade even in close-up (the muzzle flash is the one warm
   accent). Clear space ahead of the ball.
6. **Globe:** the camera follows the ball through the air and **around a painted globe**. Documented
   K4 frame: a painted Earth, North America facing the viewer, floating in a deep blue-black sky with
   soft clouds below; the small musket ball trails a glowing gold arc curving around the globe's edge;
   the globe is centered and fills the middle third of the frame.
7. **Transition (Prompt 7)** — three slow stages, each tied to scroll:
   a) The painted globe slowly fades from the oil-painting look into our **navy-and-white brand
      colors** (like the column turning into a tree on pear.no) — same globe, same position, only the
      rendering changes.
   b) The brand-colored globe fades into our **logo circle**, with the **Minuteman and wordmark**
      appearing inside it.
   c) The page settles into the normal site.
   **Shared circle target (Noah, 2026-11-05 — stays 50%):** in the 16:9 hero frame the painted
   globe (K4), the brand-colored globe and the logo circle all sit **dead center, diameter = 50% of
   frame height** (≈ 28% of frame width). The code positions the logo ring to that same box so the
   hand-off doesn't jump. On portrait/mobile the canvas `cover`-crop keeps it centered.
   Anything beyond these three stages is undocumented — ask Noah before inventing choreography.

Scrolling down plays forward; scrolling up plays backward (canvas image-sequence scrubbed by scroll).

## HERO CHOREOGRAPHY (Noah, 2026-11-05)

The feel is pear.no: smooth, scroll-driven, **holding on each scene while text fades in, then
continuing.** Never lock or hijack the scroll. Every percentage lives in one config object,
`src/hero/choreography.js`, so Noah can tweak timing without touching logic.

**One pinned GSAP timeline (scrub)** with hold segments where the frame stays still while text plays:

| Scroll | Picture | Text |
|---|---|---|
| 0–9% | HOLD on the battlefield (K1) | **Beat 1** in on load, fully visible 0–9%: "Minutemen Marketing." / "Ready at a minute's notice." |
| 9–12% | K1 (C1 starts at 11%) | Beat 1 fades out |
| 11–27% | C1 push-in to the soldier (K1 → K2); the 27–30% hold stays on C1's own last frame | — |
| 27–30% | HOLD on the soldier | — |
| 30–41% | C2, the shot and the ball leaving the muzzle | — |
| 41–56% | **C2b, FOLLOW THE BULLET** — side-tracking with the ball (start frame `c2-last.png`) | **Beat 2** in 43%, fully visible 46–55%, out 55–58%: "Response time as fast as a bullet." |
| 56–68% | C3, the ball climbs to the globe (start = C2b's last frame, end = K4); its globe settles onto the 50% circle | — |
| 68–85% | The globe; **C4, BULLET AROUND THE GLOBE** — one orbit, behind the globe on the far side | **Beat 3** in 69%, fully visible 72–85%, fades out 85–88% as the globe turns navy: "With the right website, you can reach an audience around the world." — below the globe, **never overlapping it** |
| 85–100% | Three slow fades: painted globe → navy-and-white globe (85–91%) → logo circle (91–96%) → site (96–100%) | — |
(Updated 2026-11-05 for C2b and C4; the numbers live in `src/hero/choreography.js`.)

- **Pinned length:** **1000vh desktop, 650vh mobile** (Noah, 2026-11-05).
- **Text timing rule (Noah, 2026-11-05):** beats 1 and 2 fully visible for at least 8% of the scroll each, beat 3 at least 12% and fading only as the globe turns navy; fades about 3%.
- **Smoothness:** Lenis `lerp ≈ 0.08`; ScrollTrigger `scrub: 1`; draw on `requestAnimationFrame`
  **only when the frame or scene state changes**; preload frames with a minimal progress indicator.
- **Text fades:** opacity + 16px rise + slight blur-to-sharp, about **3% of the scroll** each.

**Below the hero:** each chapter (Ready, Aim, Fire, Heard) gets **one brief pinned moment** where its
headline fades in on the shot line, then the content scrolls up. **One cross-fade** of one image into
another between Work and Contact, like pear.no's column-to-tree. **No other scroll tricks.**

**Placeholders until generated** (swap in by changing the config, not the logic): C1 = zoom on K1
then crossfade to K2; C3 = pull back from the C2 last frame and crossfade into K4; brand globe =
K4 duotoned navy/off-white in canvas; logo circle = `public/brand/logo-stacked.svg` (traced
from `brand/logo-square.png`).

### Production stages (one candidate at a time, Noah approves each before the next)

Opening still (K1) → full-body aim (K2) → firing frame (K3) → ball tracking → painted globe →
brand-colored globe → logo circle with Minuteman and wordmark → site. Each approved
frame is the reference for the next stage where the model supports it. Never put the whole sequence in
one prompt. No automatic variations, upscales, retries or model switches. Approved assets are never
overwritten; new versions are saved under new names. Artwork has no lettering, signatures, watermarks,
interface elements or borders.

- **`reference/start.png` rule:** if that file exists, use it as K1 (or as K1's style reference) instead
  of generating a new battlefield. As of 2026-11-04 it does not exist; K1 below was generated.
- **APPROVED opening still (current): `assets/keyframes/k1-cool.png`** — `k1.png` with a local
  cool color grade (0 credits; GDI+ color matrix: red cut, blue lifted, saturation ~0.75). Steel-blue
  sky, cooler smoke, gray-olive field, coats near the logo navy. **Noah wants the sequence cool, to
  match the navy brand:** every later stage must match this grade, so drop "warm golden-hour" from the
  STYLE LOCK in new prompts and describe cool steel-blue light instead. It is a local file, so it must
  go up with `init_upload` to be a Runway reference. Slight mauve in the far hills was accepted.
- **APPROVED K2 (end of push-in): `assets/keyframes/k2.png`** = K2 v2 (Runway task
  `8c07f123-1043-440f-8284-a17c56b44287`, 5504×3072). Full body hat to boots, whole musket, him about
  a third across, muzzle about two-thirds across, right third open smoke. Aiming, not fired; cool grade
  matches. Accepted as-is: tight bottom margin at the boots, slightly upright stance, a faint white
  farmhouse in the smoke just under the muzzle, faint corner marks. Reference for the firing stage.
- **APPROVED C2 firing clip (draft): `assets/clips/c2-firing.mp4`** — Kling 4.0, 5s, 1280×716,
  start `k2.png` → end K3 v1 (`assets/drafts/k3-v1.png`, task `7881e024-2587-4b53-a956-65ca5b221eb4`),
  task `f31d4a21-699b-4688-8145-92edb0b9fcde`. Pan flash ~2.8s, muzzle ~3.1s, ball travels to the end.
  **Free fixes to apply when extracting frames:** trim the start to ~1s before the pan flash (begin at
  ~1.8s); tone the muzzle flash down to warm gold, never pure white; strip the audio.
- **APPROVED K4 globe: `assets/keyframes/k4.png`** = K4 v2 with the ball shrunk (Nano Banana Pro
  edit, Runway task `b34c727f-c7e1-4354-a613-c1df34b26eb3`, 5504×3072; source K4 v2 is
  `assets/drafts/k4-v2.png`, task `1021b28f-5f5a-456d-b871-bb0b1b205925`). More painterly than v1,
  small round ball, arc behind/in front, Long Island glint. Globe ≈ 67% of frame height (code scales
  it to the 50% target). Start and end frame of C4. (Ideogram precise edit can't be used: it rejects
  images over 16MP and can't read Runway uploads.)
- **APPROVED C2b (follow the bullet): `assets/clips/c2b-follow.mp4`** = C2b v1 (task
  `0784a479-d1b0-4ee6-94d9-fc5b2d23cb22`). Its chrome ball was fixed **for free at extraction**: the
  ball is repainted per frame as a matte, upper-left-lit lead sphere with grain (auto-detected before
  2.4s, a hand-measured track after), and the first frames get the same warm-gold flash as C2.
  Frames: `public/hero/v1/c2b/` (15fps, 92). Last frame `assets/keyframes/c2b-last.png` = C3's start.
  (C2b v2, task `130bef5a-…`, was matte but egg-shaped and huge — not used.)
- **APPROVED C4 (orbit): `assets/clips/c4-orbit.mp4`** (task `dbb25ecc-895f-4f88-baeb-03cc158fd6a4`),
  start = end = `k4.png`. Ball passes cleanly behind the globe. Frames `public/hero/v1/c4/` (15fps,
  91), played through `CHOREO.c4Remap` so the hidden stretch (≈2.2–3.8s) takes ~0.7% of the scroll;
  beat 3 shows while the ball comes round the front.
- **Hero finish (2026-11-05):** every clip opens on the previous clip's last frame with a 5-frame
  cross-dissolve; one CSS grade on the canvas plus one grain tile over the whole hero; beats in large
  Caslon with the key phrase italic, words staggered, a soft blurred scrim (no box); preloader = the
  logo's open ring drawing itself; scroll progress = the bullet's trail with a gold dot; a "Scroll"
  cue that fades on the first move. The globe scene is zoomed to the 50% circle over a blurred,
  globe-free copy of itself with softly erased edges, so no edge shows; globe → brand globe → logo
  use slow sine fades with all three on the same circle (no size jump).
- **K4 v1 — superseded, not approved:** `assets/keyframes/superseded/k4-v1.png` (Runway task
  `89047228-3b71-4b66-b7e2-ff6b7ed00ec7`). Kept what worked (centered, North America facing, deep
  blue-black sky, painted clouds below, gold arc passing behind, the glint at Long Island) but the
  globe is ~80% of frame height and reads as a satellite render. Noah wants K4 v2: ~50% of frame
  height, clearly visible oil brushwork on the globe matching K1, a small round ball with a thin
  trail (no capsule). (Superseded by the approved K4 below.)
- **APPROVED C1 (push-in): `assets/clips/c1-pushin.mp4`** (task `70a8541a-58c3-4697-a2e2-aaa4bbc0dec0`),
  start `k1-cool`, end `k2.png`, 6s. Frames `public/hero/v1/c1/` (15fps, 92); the crop travels from
  K1's focus to K2's.
- **APPROVED C3 (climb to the globe): `assets/clips/c3-climb.mp4`** (task
  `eaba141e-9eda-4513-b416-97b59cd31732`), start `c2b-last.png`, end `k4.png`, 8s. Frames
  `public/hero/v1/c3/` (15fps, 122). Its white-cloud middle is compressed (`CHOREO.c3Remap`), and over
  `CHOREO.c3Settle` its globe eases from full-frame onto the 50% circle so it hands C4 the same size.
  Measured: C3's last frame globe 0.675 of height vs K4 0.678, C4 0.658 — a seamless join.
- **The hero now runs entirely on approved footage.** It ends on the stacked logo vector
  (`public/brand/logo-stacked.svg`, traced from `brand/logo-square.png`). Hero frames total ≈ 20MB.
- **C2 last frame: `assets/keyframes/c2-last.png`** (1280×716, exported from the clip) — the **start
  frame for the globe clip C3**, not K3, so C2 → C3 joins without a jump.
- **K2 v1** (`assets/drafts/k2-v1.png`, Runway task `af215836-1672-4bee-99a5-9257ff86677d`) — medium
  close aim, too tight; not approved. Same soldier/face as k2.png, useful as a close identity reference.
- **Approved warm original: `assets/keyframes/k1.png`** = opening v4 (Runway task
  `913bb252-82a3-4a28-b648-dbfb0ee2a5f2`, 5504×3072). Featured soldier center-right, aiming
  screen-right, no flash yet. Accepted as-is: two brown/olive coats left of center, his muzzle sits
  just above his right-hand neighbour's hat (leave that man out of the muzzle close-up), face partly
  covered by hands/stock. Kept for reference; `k1-cool.png` is the reference for the next stage.
- **Opening base before approval:** opening v3 (Runway task `4acb642e-73e2-4595-b31c-07abe01d5b23`, 5504×3072,
  `assets/drafts/opening-v3.png`) — fresh composition, whole militia facing right. Narrower framing
  and the corner signature are accepted by Noah.
- **Selected style reference:** K1 variation B (Runway task `a35c7f7f-af20-4f69-8541-940dc8d78a0a`,
  5504×3072, local copy `assets/drafts/k1-b.png`) — navy-coated figure, stone walls, meetinghouse.
  Always reference the original generated files, never photos of a monitor.

### Hero copy (HTML, overlaid on the canvas — exact wording, each line fades in at its moment)

1. Over the battlefield (opening/push-in): **"Minutemen Marketing."** / "Ready at a minute's notice."
2. As he fires and the bullet flies (fire + ball tracking): **"Response time as fast as a bullet."**
3. As the bullet circles the globe: **"With the right website, you can reach an audience around the
   world."**

The copy says "bullet" by Noah's choice; the artwork still shows a round lead musket ball.

### Reduced motion

With `prefers-reduced-motion: reduce`, there is no scrubbing and no Lenis smooth scroll: show a single
still (the final logo-circle frame or the painting) with all three copy beats as stacked static text.
Note: the Claude desktop browser pane reports reduced motion — QA the motion path in a real browser.

## The site after the hero

**DESIGN SKILLS:** for everything after the hero (nav, services, process, work, contact, footer),
**load and follow the `ui-ux-pro-max` and `frontend-design` skills** before designing or building it.

- They work **inside our brand, not instead of it**: navy on warm off-white, the Libre Caslon Text +
  Hanken Grotesk pairing already chosen, restrained and premium like pear.no.
- **Don't apply their preset styles, palettes or fonts.**
- Use them for **layout, hierarchy, spacing, components, accessibility and UX quality**.
- The hero and the globe-to-logo transition stay governed by the hero spec in this file, not by the
  skills.

**QUALITY BAR — it has to look like a million bucks, like the sites we've shipped.** The reference is
the finished house work in `C:\Claude Code`: `wealth-advisory-group`, `smiles-by-nilou`,
`beauty-wellness-addict`, `muses-nails`, `ray-nail-spa`. Follow the `client-site` skill's process:

1. **Mine those sites for method** (token block, type scale, spacing rhythm, signature device, motion,
   head/JSON-LD boilerplate). Never copy their palettes or fonts; this site is unmistakably itself.
2. **Write `DESIGN.md` at the project root and get Noah's approval before any post-hero markup or
   CSS** — anti-default stance, palette tokens with contrast, type scale numbers, one signature
   element carried through every section, section rhythm, motion tokens, component rules.
   (`legacy/DESIGN.md` is the archived Sept site's spec, superseded.)
3. Build to the spec; if something needs to deviate, change `DESIGN.md` first and say so.
4. Run the skill's QA checklist (contrast, keyboard, reduced motion, mobile, every fact) before calling
   it done.

**Facts:** never invent stats, client counts, years in business, prices, testimonials or awards. The
Work section shows the real portfolio sites above, captured from the real builds. Missing facts get a
`TODO(client):` marker and go in the handoff list. Project exceptions to the skill: this site keeps
the Vite stack and pushes to `main`, both by Noah's explicit choice.

## Brand

- **Navy `#032249`** — sampled from `brand/logo-square.png` (dominant mark color; the cluster is
  `#022148`–`#02224A`). Use it for the logo, headlines on light, and the dark hero ground.
- **Warm off-white `#F7F4EC`** for page paper (the logo files sit on `#FEFDF9`).
- Navy on the off-white is ~14:1 contrast — fine for any text size.
- **Headlines: Libre Caslon Text** (Google Fonts, self-hosted via `@fontsource`). Caslon is the face
  the Declaration of Independence was printed in — period-correct without being costume.
- **Body: Hanken Grotesk** (variable, self-hosted via `@fontsource-variable`).
- Logo files live in `/brand` (`logo-full.png`, `logo-square.png`, LinkedIn banners). `Images/` holds
  the originals Noah dropped in and is not committed. Clean vectors traced from them (navy `#032249`,
  2026-11-05) live in `public/brand/`: `logo-stacked.svg` (mark over MINUTEMEN MARKETING; the hero
  ends on it), `logo-horizontal.svg` (mark beside the banner wordmark, no slogan or underline; the nav
  on every page) and `logo-mark.svg` (the circle mark alone).

## Stack

- **Vite**, vanilla JS (no framework — the hero is one canvas and a few DOM nodes).
- **GSAP + ScrollTrigger** for scroll timelines; **Lenis** for smooth scroll (synced to ScrollTrigger).
- **Canvas image-sequence scrubbing** — stills and frames in `public/hero/<version>/` (versioned so they
  can be cached forever; bump the version when any file changes), wired up in `src/hero/choreography.js`. The stage draws
  `cover`-fit on a DPR-aware canvas and falls back to the nearest loaded frame (or the still a clip
  starts/ends on).
- **Hero payload (2026-11-05):** phones (< 768px wide) load a **960×537 frame set** from
  `public/hero/v1/m/<clip>/` (≈ 9.2MB in all vs ≈ 19MB for the 1280 desktop set; made from the
  approved 1280 frames, so C2b's matte ball and C2's gold flash are kept). Frames load **just ahead
  of the scroll position**: each frame knows where in the hero it is needed, and six workers fetch the
  nearest pending frames within a window (30% ahead on desktop, 18% on phones, 10% with Save-Data;
  6% behind), every 4th frame of a clip first. At the top of the page a phone loads 38 files (K1 + the
  first part of C1) instead of all 475. When adding or replacing a clip, regenerate both sets.
  In dev, `window.__hero.debug()` shows the loader state.
- **ffmpeg** extracts frames from approved finals (`npm run frames -- <video> <version>`).
  Not installed on this machine yet: `winget install Gyan.FFmpeg`.
- **Vercel** for hosting (`vercel.json`). Frame folders are versioned (`v1`, `v2`…) so they can be
  cached long; never set long browser `max-age` on unhashed, unversioned files.

## Media pipeline (Runway) — every step needs a cost quote + OK first

| Step | Model |
| --- | --- |
| Keyframes (painting, Minuteman profile, musket ball, painted globe, logo circle) | **Nano Banana Pro** |
| Video drafts between keyframes | **Kling 3.0 Turbo** (start frame only). Clips that must land on an end keyframe need start+end: Noah chose **Kling 4.0** (720p, charged 60 credits for 5s) for the K2→K3 firing draft |
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
