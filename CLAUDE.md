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
| 0–0.8% | Short HOLD on the battlefield (K1) | **Beat 1** in on load, fully visible 0–9%: "Minutemen Marketing." / "Ready at a minute's notice." |
| 0.8–27% | C1, drawn in code (2026-11-08): the camera pushes in on the K1 painting to the featured soldier from the first wheel click, then painted smoke drifts right to left across the frame and K1 crossfades to K2 under its core (`CHOREO.pushIn`); the 27–30% hold is the K2 still | Beat 1 stays fully visible over the start of the push-in, fades out 9–12% |
| 27–30% | HOLD on the soldier | — |
| 30–41% | C2, the shot and the ball leaving the muzzle | — |
| 41–56% | **C2b, FOLLOW THE BULLET** — side-tracking with the ball (start frame `c2-last.png`) | **Beat 2** in 43%, fully visible 46–55%, out 55–58%: "Response time as fast as a bullet." |
| 56–68% | C3, the ball climbs to the globe (start = C2b's last frame, end = K4); its globe settles onto the 50% circle | — |
| 68–85% | The globe; **C4, BULLET AROUND THE GLOBE** — one orbit, behind the globe on the far side | **Beat 3** in 69%, fully visible 72–85%, fades out 85–88% as the globe turns navy: "With the right marketing, you can **reach an audience around the world.**" (only that phrase bold) — below the globe, **never overlapping it** |
| 85–100% | Three slow fades: painted globe → navy-and-white globe (85–91%) → logo circle (91–96%) → site (96–100%) | — |
(Updated 2026-11-05 for C2b and C4, 2026-11-08 for the short opening hold; the numbers live in
`src/hero/choreography.js`.)

- **Pinned length:** **1000vh desktop, 650vh mobile** (Noah, 2026-11-05).
- **Text timing rule (Noah, 2026-11-05):** beats 1 and 2 fully visible for at least 8% of the scroll each, beat 3 at least 12% and fading only as the globe turns navy; fades about 3%.
- **Smoothness:** Lenis `lerp ≈ 0.08`; ScrollTrigger `scrub: 0.35` (was 1: stacked on Lenis it added a
  second ~1s catch-up, so the first wheel click felt dead); draw on `requestAnimationFrame`
  **only when the frame or scene state changes**; preload frames with a minimal progress indicator.
- **Hero exit (2026-11-12):** the progress line fades out over 96-99.5% (`CHOREO.trailOut`); at full
  width it used to ride up the page with the unpinned stage onto the Services shot line as that drew.
  The nav comes back at 96% (`CHOREO.navBack`), while the logo settles on paper, so its 450ms fade is
  done before Services slides under it. The Services shot line draws once (traced, no re-trigger).
- **Hero end on phones (2026-11-12, Noah's iPhone screenshot):** the hero stage is an opaque,
  positioned layer earlier in the page, so wherever it overlapped Services it painted over the
  eyebrow and the heading (the shot line, itself positioned, still showed on top). On Noah's iPhone
  the stage ended ~134px (about one Safari toolbar) lower than the space ScrollTrigger reserved for
  it; WebKit emulation never reproduces that offset (stage and spacer always agree there, and
  ScrollTrigger keeps the stage at its measured px height after unpinning), so the fix does not
  depend on it: `.motion #main` (paper, `z-index: 1`) always paints above the stage. Below 768px
  #main is also pulled up by `--hero-pull` (stage height minus the settled logo's bottom edge,
  `logoEndBottom()` in choreography.js, measured at every ScrollTrigger refresh), so Services follows
  the logo with the normal section gap instead of a third of a screen of paper; it slides over that
  empty paper during the last ~5% of the pin and never reaches the logo. The end logo is
  `CHOREO.logoEnd` (0.78) of the circle: about 67% of the screen width on phones. Desktop unchanged.
  Check: `qa/ios-end.mjs <base> 390x844 134` (stage forced 134px taller; Services eyebrow and heading must be
  top-most at every position, 90% of the pin to past it, down and up).
- **Text fades:** opacity + 16px rise + slight blur-to-sharp, about **3% of the scroll** each. The
  words are hidden by a `tl.set` at the moment their line switches on; without it a ScrollTrigger
  refresh left them at full opacity and the line flashed on, off, on (fixed 2026-11-08).

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
- **Opening still served since 2026-11-13: `assets/keyframes/k1-v5.png`** = k1-v4 with K2's musket in the
  featured soldier's hands. Root cause: K1 showed him with a short fowler-style gun, wood to the muzzle,
  while K2 and C2 show a long musket with an exposed steel barrel and ramrod whose muzzle sits ~7% further
  right; the code maps K1 onto K2 exactly, so the change of gun at the push-in was in the paintings. A
  crop of k1-v4 around him (x 2700, y 1000, 2400 x 1350) was edited by Nano Banana Pro with K2's musket
  as reference (Noah approved up to 150 credits for this round; task `591aed08-6121-46f1-81a6-34e1580e827a`,
  20 credits, `assets/drafts/k1-musket-{crop,edit}.png`). `scripts/k1-musket.cjs` registers the edit,
  shortens the barrel so the muzzle lands exactly on K2's (mapped into K1), colour-matches it and pastes
  back only what changed (gun, hands, his head, now in K2's profile). Served as `k1v5-*`, detail
  `k1dv5-*` (`scripts/k1-detail.cjs`), share image `og-v5.jpg` (the same pixel change carried into
  og-v4's wash). Sheet: `qa/shots/2026-11-13-musket-handoff.jpg`.
- **Previous opening still (2026-11-12): `assets/keyframes/k1-v4.png`** = k1-v3 regraded cool
  (0 credits, `scripts/k1-regrade.cjs`). Root cause of the pink: each Nano Banana Pro edit of K1 pushed it
  toward magenta (Lab a* 7.6 in k1-cool, 11.0 in k1-v2, 14.1 in k1-v3, vs 5-7 in K2 and C2). The script
  shifts a* to K2 and b* to k1-cool per brightness band, brightness untouched. Served as `k1v4-*`,
  detail `k1dv4-*`, share image `og-v4.jpg`. Any future K1 edit: re-run it and check a* against K2.
- **APPROVED opening still (2026-11-08 late): `assets/keyframes/k1-v3.png`** = k1-v2 with the
  musket smoke puffs along the firing line removed (Nano Banana Pro, task `f4c41b0e-e9aa-4d6c-b8d3-bb10f1121692`,
  40 credits). Same geometry as k1-v2 (refit: scale 1.85, NCC 0.635, `FOCUS.k1K2Frame` unchanged). Served as
  `k1v3-1920/-1280.webp`, detail `k1dv3-*`, share image `og-v3.jpg`.
- **K2 hold still: `k2v2-1920/-1280.webp`** = k2.png with the C2 clean plate on its background line
  (`scripts/fix-k2-background.cjs`), so the hold matches C2.
- **C2 frames are all repaired (`f_00NN-fix1.webp`, 2026-11-08):** the footage had muzzle flashes on the
  background soldiers (frames 1–17), gunsmoke puffs at their chests (all 78 frames) and a glow under his
  arm (1–13). A clean plate (C2 hd frame 19 edited by Nano Banana Pro, task
  `4a6c7b43-1c8d-49eb-977d-633ce727fc8c`, 20 credits, `assets/drafts/c2-plate.png`) is blended into the
  background line of every frame in every tier, brightness-matched per frame on the stone wall
  (`scripts/fix-c2-background-flashes.cjs`). The camera is static over C2, so the plate holds.
- **C2 frames 13-22 are `-fix2` (2026-11-13, Noah: "a flare from thin air"):** before the shot a small
  warm streak flew through the smoke under his barrel (x 0.42-0.86, y 0.33-0.47), outside the band the
  2026-11-08 plate repaired. `scripts/fix-c2-streak.cjs` replaces it with the time-interpolation of
  clean frames 12 and 23 wherever the frame is brighter than that (feathered), in all three sets
  (`ASSETS.c2.fix`). K2's hold, C2b and the phone plates had none. The smoke puff that rises from
  his lock before the pan flashes (frames 6-22) is on his musket and stays.
- **Previous opening still (k1-v2): `assets/keyframes/k1-v2.png`**: `k1-cool.png` edited with
  Nano Banana Pro (K2 as the reference; tasks `bd2dfdf9-…` = variant A, **`17ff2483-6687-45e8-870f-1845cb0a222b` =
  variant B, chosen by Noah**; 80 credits for both, `assets/drafts/k1-edit-{a,b}.png`) so the featured
  soldier is K2's man (hat with pale trim, navy coat, red cuffs, strap and box, boots, profile aim),
  a step in front of the line; everything else unchanged (the corner signature dropped out). Served as
  `k1v2-1920/-1280.webp` (opening frame, reduced-motion still, preload) and in the share image
  `og-v2.jpg`. Its region `FOCUS.k1K2Frame` (x 0.418–0.959, y 0.297–0.837) is K2's whole frame: same man
  at the same place and size (scale 1.85, fitted by normalised cross-correlation on his head and torso).
- **Previous opening still: `assets/keyframes/k1-cool.png`** — `k1.png` with a local
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
  **File `f_0017` (2026-11-08):** the repaint drew the ball ~6× too big on that one frame in all three
  sets (the one-frame "giant ball" right after the shot). Rebuilt from f_0016 + f_0018 by
  `scripts/fix-c2b-frame17.cjs` and served as `f_0017-fix1.webp` (`ASSETS.c2b.fix`), because
  `/hero/v1` is cached as immutable: never overwrite a file there, add a new name.
  (C2b v2, task `130bef5a-…`, was matte but egg-shaped and huge — not used.)
- **C2b ball = a sprite since 2026-11-13 (Noah: blurry, and on phones it filled the screen).** Root
  causes: the extraction repaint drew the ball at each set's resolution with a soft edge, and phones load
  the 960 set, whose pixels the cover crop draws ~4.7 device pixels wide; in the footage its radius
  reaches 0.30 of the frame height, which a phone's cover crop puts at ~1.3x the screen width.
  `scripts/c2b-ball.cjs` tracks it in the hd frames (`src/hero/ball-track.js`, frames 17-92) and removes
  it from those frames in all three sets (`-ball1`, each row rebuilt from the shifted texture beside it,
  feathered rim). `scripts/ball-sprite.cjs` cuts out a painted lead ball (Nano Banana Pro, footage ball
  as reference, task `748cfbeb-a091-4460-a085-2b53f23ad887`, 20 credits) toned to the footage ball:
  `ball-v1.webp` (1024) / `ball-v1-512.webp` (phones). `stage.js` `drawBall` draws it on the frame's
  own rect at the tracked centre and size; on portrait screens a soft limit of `CHOREO.ballMax` (0.44)
  of the screen width, easing back to the footage size over frames 80-92 so C3 (ball in its footage)
  picks up at the same size. Under the C2b-to-C3 dissolve the sprite fades with 1 - dissolve: C3 crops
  around its globe, so its ball lands ~55px away (that offset predates the sprite). Frames 1-16 keep the
  footage ball (a few pixels in the smoke). Sheet: `qa/shots/2026-11-13-ball-before-after.jpg`.
- **APPROVED C4 (orbit): `assets/clips/c4-orbit.mp4`** (task `dbb25ecc-895f-4f88-baeb-03cc158fd6a4`),
  start = end = `k4.png`. Ball passes cleanly behind the globe. Frames `public/hero/v1/c4/` (15fps,
  91), played through `CHOREO.c4Remap` so the hidden stretch (≈2.2–3.8s) takes ~0.7% of the scroll;
  beat 3 shows while the ball comes round the front.
- **Hero finish (2026-11-05):** every clip opens on the previous clip's last frame with a 5-frame
  cross-dissolve; one CSS grade on the canvas plus one grain tile over the whole hero; beats in large
  Outfit (key phrase in light weight since 2026-11-08; was Caslon italic), words staggered, a soft blurred scrim (no box); preloader = the
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
- **C1 is code since 2026-11-08 (Noah: no more credits on C1).** `src/hero/stage.js` `k1Rect()`/`k1Cam()`
  move a camera rect over the K1 still from the opening framing to the K1 region that matches K2's
  hold framing exactly (`FOCUS.k1K2Frame`; on portrait screens the fitted framing, with K1 narrowing
  to that region late in the push so the edge and soft wash match K2's hold). The curve is a cubic
  with set start/end speeds; `CHOREO.pushIn.start` is tuned so the first wheel click moves the frame as
  much as the original Kling clip (per-pixel change 7.19 vs 7.24 at 1440×900). The high-resolution
  detail layer `k1dv3-1920/-1280/-m.webp` (`scripts/k1-detail.cjs`) keeps it sharp. Then K2 crossfades in
  drawn at the same matched place (`pushIn.fade`), under a light pass of the painted smoke from
  `src/hero/smoke.js` (`pushIn.smoke` 0.5, densest mid-crossfade) that softens the small face and
  musket-length differences. No figure parallax (K1 has no clean figure mask). In dev,
  `window.__noSmoke = true` hides the smoke for hand-off checks.
- **Retired C1 (push-in): `assets/clips/c1-pushin.mp4`** (task `70a8541a-58c3-4697-a2e2-aaa4bbc0dec0`),
  Kling 4.0, 6s, 72 credits, start `k1-cool`, end `k2.png`. Frames `public/hero/v1/c1/` (15fps, 92); the
  crop travels from K1's focus to K2's. **Known footage flaws (2026-11-08):** the end soldier is not
  K1's featured man: Kling fades a new figure in out of the smoke behind the line (frames 8–16) and
  pushes past K1's man to him, which reads as the soldier popping in; and it adds muzzle flashes
  and smoke puffs on the background soldiers' muskets (frames 16–32). Both are in the footage,
  not the code. **C1 v2 (2026-11-08, Noah approved, Kling 4.0 6s, 94 credits, task
  `af00ab27-83cc-476f-8f03-cc1f014e2ac8`, `assets/drafts/c1-v2.mp4`) failed the same way**, so v1 stays:
  K1's man stands in the rank and K2's man stands alone in front of the line, so any K1→K2
  interpolation invents a second figure. **Rebuild attempt (2026-11-08, Noah approved, cap 250):**
  new K2 = a 2656×1494 crop of `k1-cool.png` around his own man (`assets/drafts/k2-v3.png`, 0 credits),
  so C1 would be a pure push-in. C2 was generated first because it carries the hard part (him leaving
  the rank to stand alone as in `c2-last.png`): Kling 4.0 6s 720p, task
  `60e215a6-b209-4234-8306-ec8626bb5cd7`, **72 credits**, `assets/drafts/c2-v3.mp4`. **Failed:** background
  soldiers fire (muzzle flash ~1.7s), men climb the wall and walk out of the smoke, and around 3.7–4.2s
  the field morphs into K2's wall-and-line layout; the shot itself is squeezed into the last 2 frames.
  C1 was not generated (useless without a matching C2). **Current C1 and C2 stay.** Lesson: Kling
  cannot move a man out of a rank between two fixed frames; any future try needs an end frame that
  keeps K1's surroundings (and a new C2b/C3 chain) rather than `c2-last.png`.
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
3. As the bullet circles the globe: "With the right marketing, you can **reach an audience around the
   world.**" (Noah, 2026-11-08: regular weight, only "reach an audience around the world." bold)

The copy says "bullet" by Noah's choice; the artwork still shows a round lead musket ball.

### Hero controls and returning visitors (2026-11-08)

Only **Skip intro**, centred in the nav's band, below the notch. **Desktop (1024px+, Noah 2026-11-13): the
hero's own top-right corner, 32px from the viewport edge at every width** (16px under the nav while it
shows), not on the 1240px nav column, which left it adrift at 2560-3440px; 2026-11-12 it was top-left
under the logo. **Phones and tablets: top-right**, its right edge on the nav's content edge (the
gutter). Check: `qa/skip-check.mjs <base>` (1280-3440px: 32px gap, no overlap with nav links, click
lands at Services with focus on its heading). Inside the
hero the nav stays hidden after the first scroll (it returns at the very top, after the hero and on
keyboard focus); while it shows, Skip waits just under it, and a change of place is a quick fade, never
a slide. (2026-11-09: Skip used to slide 72px with the nav on every change of scroll direction, which
read as a glitch on phones.) The "Reduce motion" chip and its saved
still choice were removed at Noah's request; any saved choice is cleared on load. Returning visitors
(watched the hero this session) land at Services with the whole hero above them, settled on the logo;
scrolling up plays it backwards (the frame loader looks ahead in the direction of travel). No
"Replay intro" link.

### Reduced motion

With `prefers-reduced-motion: reduce`, there is no scrubbing and no Lenis smooth scroll: show the **still
version**: the K1 painting full-screen with only "Minutemen Marketing. Ready at a minute's notice." in the
Outfit opening style, then the stacked logo, then the site. Never a stacked list of the hero lines
(Noah, 2026-11-05). The same still version appears automatically if the hero script fails to load or
throws, the opening frame fails, over 30% of the opening frames fail, or nothing arrives in 10s.
QA on any build: `?motion` forces the story, `?herofail` / `?herofail=script` show the failure path.
Windows "Animation effects" off makes Chrome report reduced motion, which is why a desktop can show
the still version.
Note: the Claude desktop browser pane reports reduced motion — QA the motion path in a real browser.

### QA scripts (`qa/`, run with Playwright)

- `screen-matrix.mjs [baseUrl] [outDir] [--sizes 390x844,...]` (2026-11-10): every page at 15 sizes
  (320x568, 360x800, 375x667, 390x844, 412x915, 430x932, 844x390, 768x1024, 820x1180, 1024x1366,
  1280x720, 1440x900, 1920x1080, 2560x1440, 3440x1440). Fails on horizontal scroll, text off screen,
  text cropped by its container or sticking out of its box, overlapping text, a hero canvas that does
  not fill the screen, hero beats touching Skip / Scroll / the progress line, and portfolio windows of
  the wrong shape. Saves a screenshot set per size for a contact sheet.
- `hero-pass.mjs [baseUrl] [--collide-only]` (`ONLY=iPhone` env runs one scroll run): scroll runs
  (wheel, trackpad, touch, slow 4G) and the collision check (hero text vs controls at every beat,
  375-1920px). The iPhone run flings frame by frame with iOS momentum (2026-11-12); a jump is > 0.5
  opacity within < 60px of scroll. Emulated WebKit on Windows draws ~6 frames a second, so the old
  260px-step swipe and per-frame jump count reported missed beats and jumps that were frame gaps.
- `mobile-audit.mjs`, `cross-browser.mjs`, `verify-live.mjs`: see `qa/README.md`.

### Portfolio windows (phones 2026-11-11)

Below 768px each client site shows in a small phone-shaped window (9:16, 6px dark bezel, rounded
corners), scrollable inside. The client name, the window and "Open Live Website" fit on one screen
together (Noah, 2026-11-11): the window's screen is at most 62% of the small viewport (`svh`) less
its bar and bezel, and never taller than what is left after the nav, that project's name block and
button (`--chrome-h`, measured by `src/portfolio.js`). On phones the brief (what they needed / what
we built) moves below the button (CSS `order`). The iframe renders the site's mobile layout at the
window's own width, unscaled, but never narrower than 320px: below that the Beauty site's text runs
off the side, so a narrower window shows the 320px layout scaled down (phones are 2-3x density, and
Chrome re-rasterises the scaled frame, so it stays sharp; checked at 3x). In practice the 9:16 window
is 140-305px wide on phones, so phones see the 320px layout. Phones load mobile screenshots for the
loading still (`work-beauty-m-1170.webp`) and the Smiles scroll (`smiles-full-m-780.webp`). Tablets
and desktops keep the laptop windows (1440x900 scaled; unscaled at 1024px+). Once a live iframe has
loaded, the loading screenshot is hidden (`.browser.is-live`): an iframe is transparent where the
embedded page does not paint, so on iPhone overscroll the screenshot behind showed through as a
second hero image in the Beauty & Wellness window (2026-11-10, our bug, not the Beauty site's).

## The site after the hero

**DESIGN SKILLS:** for everything after the hero (nav, services, process, work, contact, footer),
**load and follow the `ui-ux-pro-max` and `frontend-design` skills** before designing or building it.

- They work **inside our brand, not instead of it**: navy on warm off-white, the Outfit + Public Sans
  pairing (DESIGN.md, 2026-11-08), restrained and premium like pear.no.
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
- **Headlines and labels: Outfit** (variable), the closest free match to the logo wordmark; labels
  use the logo's letter-spaced MARKETING style. **Body: Public Sans** (variable, real italic).
  Self-hosted via `@fontsource-variable`. Replaced Libre Caslon Text + Hanken Grotesk on 2026-11-08
  (too close to Beauty & Wellness / Smiles by Nilou). Never use a client site's fonts here.
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
  6% behind), every 4th frame of a clip first. At the top of the page a phone loads K1, its detail layer
  and K2, then C2 frames as the reader nears them. When adding or replacing a clip, regenerate every set. Clip frames start loading as soon as K1
  is in (not when the preloader lifts), and the queue takes every 4th frame, then every 2nd, before
  the in-betweens (2026-11-08: on slow 4G the frame on screen now stays within a few frames of the
  scroll). The 1280 and 960 sets of C2b and C3 repeat files 46/61/76 (24→15fps extraction);
  `ASSETS.<clip>.dupes` skips them. A clip with nothing loaded yet stands in with its neighbouring
  clip's frame, never an unrelated still.
- **Phone framing (2026-11-12, Noah, decided): zoomed out over tall painted plates, always
  full-screen.** The cover crop showed only ~26% of the painting's width on a phone. C2 (firing) and C4
  (globe) have locked cameras and the push-in is drawn from K1, so those scenes are drawn zoomed OUT over
  static tall plates: the same paintings outpainted with sky above and ground below (Nano Banana Pro,
  Noah approved up to 200 credits, **80 spent**: K1 `238780f0-…`, C2 background (the K2 hold)
  `24ba7e05-…` rejected (it repeated the treeline above the band) and `33d1abbc-…` used, K4
  `84bd01f0-…`; raw plates in `assets/plates/`). `scripts/plate-fit.cjs` finds the original frame
  inside each plate (NCC 0.97+, fit in `ASSETS.plates`); `scripts/plate-prep.cjs` colour-matches the
  plate to the frame and matches the seams (sampling a few rows in from the frame edge, which carries a
  light compression line; `bridge-top` for K4's smooth sky), and writes `m/plate-*-v1.webp`.
  On portrait screens (`CHOREO.phone`, views { f = share of the frame width on screen, x = centre }):
  the battlefield (f 0.62), the push-in from it to the hold (f 0.52, hat to boots and the whole musket),
  C2 zooming out to f 0.62 as he fires (body, musket, flash and ball), then easing into the cover crop
  on the ball over its last quarter so C2b starts without a jump; C2b and C3 (moving cameras) keep the
  cover crop that pans with the action; C3 settles onto the globe over the K4 plate; the globe and
  brand globe (the plate's duotone) sit over it with the whole globe in view. The frame's edges
  feather into the plate (`PLATE_FEATHER`). A view never zooms out further than its plate can fill
  the screen, and without a plate (not loaded) it falls back to the cover crop. Portrait screens load
  K1's plate with K1 itself, so the opening never jumps. Landscape screens are unchanged. Beat 1 sits
  high and fades out at 4% on portrait. History: 2026-11-10 morning, zoomed-out band on a dark
  gradient (rejected: bars); 2026-11-10 evening, full-bleed cover crop with a smart pan (rejected: too
  zoomed in). The 9:16 Runway video expand stays declined.
- **Short landscape phones (2026-11-10):** under 560px tall, `circleTarget` makes the globe 42% of
  the height and sets it at 42% from the top, and beat 3 uses smaller type, so it fits between the
  globe and the progress line.
- **Mobile edge-to-edge (2026-11-05):** the pinned stage and canvas are `100lvh` (largest viewport,
  `100vh` fallback) on a navy ground, so collapsing/expanding the browser bar never shows a strip.
  Bottom-anchored controls lift by `--bar` (`100lvh - 100svh`) plus the safe-area inset;
  `viewport-fit=cover` on every page; `ScrollTrigger.config({ ignoreMobileResize: true })`; the canvas
  redraws on `visualViewport` resize. Never size the pinned hero with `svh`/`dvh`.
- **1920 tier (2026-11-05, Noah approved, 62 credits):** the five approved clips were run through
  Runway's video upscaler (4096×2292, same duration and motion; tasks C1 `a87b7c1d-…`, C2 `719f0ec9-…`,
  C2b `e91d9c0a-…`, C3 `1d4e027f-…`, C4 `b187376d-…`; files in `assets/upscaled/`, git-ignored). A
  **1920×1074 set** in `public/hero/v1/hd/<clip>/` was extracted with the exact same procedure as the
  1280 set (C2 from 1.8s at 24fps with the warm-gold flash; C2b's flash toning and matte lead ball at
  1.5× the 1280 track; 15fps elsewhere; same frame counts). It loads only on screens **1440px+ wide, or
  1024px+ at 2× density** (not with Save-Data), together with the 1920 stills; everyone else is
  unchanged (1280 set, 960 phone set). ≈ 35MB in all, fetched in the same scroll window.
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
