// HERO CHOREOGRAPHY — every timing in one place (see CLAUDE.md). Values are % of the pinned scroll.
// Tweak freely: scenes and text read these numbers; nothing else hard-codes timing.

export const CHOREO = {
  pin: { desktop: 1000, mobile: 650 }, // pinned length in vh
  // Scrub smoothing in seconds. Lenis already smooths the wheel; a long scrub on top of it adds a
  // second catch-up, so the first wheel click felt dead (2026-11-08: 1 → 0.35).
  scrub: 0.35,
  lenisLerp: 0.08,
  textFade: 3, // each text fade-in / fade-out takes this % of the scroll
  dissolveFrames: 5, // cross-dissolve at every clip join (frames of the incoming clip)

  scenes: {
    // A short hold, then the push-in starts on the first wheel click (Noah, 2026-11-08). Beat 1 stays
    // fully visible over the start of the push-in (to 9%) and fades out 9–12%.
    k1Hold: [0, 0.8], // battlefield
    c1: [0.8, 27], // C1: the push-in on K1 to the soldier, then the smoke wipe to K2 (code, no footage)
    k2Hold: [27, 30], // hold on the soldier
    c2: [30, 41], // the shot and the ball leaving the muzzle
    c2b: [41, 56], // FOLLOW THE BULLET — side-tracking with the ball (beat 2 over it)
    c3: [56, 68], // C3: the ball climbs through the clouds to the globe (starts on C2b's last frame)
    k4Hold: [68, 85], // the globe; C4: the ball makes one orbit (beat 3 over it)
    toBrand: [85, 91], // painted globe → navy-and-white globe (beat 3 fades out here)
    toLogo: [91, 96], // brand globe → logo circle with Minuteman and wordmark
    toSite: [96, 100], // logo settles, page becomes the site
  },

  // C4 remap: [scroll fraction of k4Hold, clip fraction]. The ball is behind the globe from about
  // 2.2s to 3.8s of the 6s clip (0.364–0.629); the scroll moves through that stretch quickly.
  c4Remap: [
    [0, 0],
    [0.3, 0.364],
    [0.36, 0.629],
    [1, 1],
  ],

  // C1, drawn in code since 2026-11-08: a camera push-in on the K1 painting (k1-v3, whose featured
  // soldier is K2's man) that ends on exactly K2's framing, then K2 crossfades in on top of it.
  // Fractions of the c1 scene:
  // - push: the camera moves over [0, push] on a cubic with start speed `start` (set so the first
  //   wheel click moves the frame as much as the old clip did) and end speed `end`;
  // - fade: K1 -> K2 crossfade, both drawn at the matched place;
  // - wipe/smoke: a light painted-smoke band (strength `smoke`) drifts across, densest mid-crossfade,
  //   to soften the small differences in his face and musket.
  // Portrait screens (phones, portrait tablets), 2026-11-10: each scene's frame. vw = share of the
  // image width shown (zoomed out), maxH = most of the screen height the image may take, cy = where
  // its centre sits (fraction of screen height), fx = the image point kept central. The band is
  // feathered into a static dark gradient above and below; beat 1 sits in the top space.
  phone: {
    k1: { vw: 0.62, maxH: 0.5, cy: 0.64, fx: 0.63 }, // the opening battlefield, beat 1 above it
    soldier: { vw: 0.56, maxH: 0.56, cy: 0.52, fx: 0.47, fxFire: 0.74 }, // hold + firing: musket, flash, ball
    bullet: { vw: 0.62, maxH: 0.56, cy: 0.48, fx: 0.5 }, // C2b: the ball and its trail with context
    globeW: 0.72, // the globe circle at most this share of the screen width (whole globe + margin)
  },
  pushIn: { push: 0.74, start: 0.84, end: 0.15, fade: [0.72, 0.9], wipe: [0.58, 1], smoke: 0.5 },

  // C3 remap: its middle (about 2.2–4.4s of 8s, 0.274–0.547) is almost all white cloud, so the
  // scroll moves through it faster.
  c3Remap: [
    [0, 0],
    [0.3, 0.274],
    [0.45, 0.547],
    [1, 1],
  ],
  // When C3's globe settles onto the 50% circle (fraction of C3); C4 continues at that size.
  c3Settle: [0.62, 1],

  // Each beat is fully visible from `in + textFade` to `out` (Noah: beats 1–2 at least 8%, beat 3 at
  // least 12% and fading only as the globe turns navy).
  beats: {
    1: { in: 'load', out: 9, outPortrait: 4 }, // "Minutemen Marketing. Ready at a minute's notice." — 0–9% (9%); portrait screens 0–4% (it sits in the top space, then gets out of the push-in's way)
    2: { in: 43, out: 55 }, // "Response time as fast as a bullet." — 46–55% (9%), over C2b
    3: { in: 69, out: 85 }, // "With the right website…" — 72–85% (13%), out as toBrand begins
  },
};

// Assets. Swap a placeholder for the real thing by editing this block only.
export const ASSETS = {
  base: '/hero/v1',
  k1: 'k1v3', // + '-1920.webp' / '-1280.webp': k1-v3.png (K2's soldier in the line, no musket smoke)
  k2: 'k2v2', // k2.png with the C2 clean plate on the background line (scripts/fix-k2-background.cjs)
  k4: 'k4v2', // approved K4 (v2, ball shrunk)
  logo: '/brand/logo-stacked.svg', // stacked logo (mark over MINUTEMEN MARKETING), traced vector
  // `fix`: frame files replaced after a repair, saved under a new name because /hero/v1 is cached
  // as immutable. `dupes`: files that repeat the previous frame in the 1280 and 960 sets (a 24→15fps
  // extraction artefact; the 1920 set has none), skipped so the scrub never stalls on them.
  // K1 at high resolution for the code push-in (scripts/k1-detail.cjs): the right/lower part of
  // k1-cool.png, feathered at its left and top edges, drawn over the K1 still. -1920 / -1280 / -m.
  k1Detail: { name: 'k1dv3', x0: 0.3, y0: 0.12, x1: 1, y1: 1 },
  // C2: every frame repaired (2026-11-08): the background line comes from a clean plate (no gunsmoke
  // puffs or muzzle flashes on the soldiers behind him), see scripts/fix-c2-background-flashes.cjs.
  c2: { dir: 'c2', count: 78, pattern: 'f_%04d-fix1.webp' },
  // f_0017: the matte-ball repaint drew the ball ~6× too big on this one frame (2026-11-08). Rebuilt
  // from f_0016 + f_0018 with one ball at the midpoint size and position, in all three sets.
  c2b: { dir: 'c2b', count: 92, pattern: 'f_%04d.webp', fix: { 17: 'f_0017-fix1.webp' }, dupes: [46, 61, 76] },
  c3: { dir: 'c3', count: 122, pattern: 'f_%04d.webp', dupes: [46, 61, 76] },
  c4: { dir: 'c4', count: 91, pattern: 'f_%04d.webp' },
};

// Where things sit inside each still, as fractions of the image (measured from the files).
export const FOCUS = {
  k1Soldier: { x: 0.63, y: 0.5 }, // featured soldier in k1-v3 (the opening framing centres on him)
  k1Man: { x: 0.634, y: 0.6 }, // his centre in k1-v3: the point the push-in zooms toward
  // The region of k1-v3 that is K2's whole frame: the same man at the same place and size. Fitted
  // 2026-11-08 by a scale + offset search (normalised cross-correlation on his head and torso, 0.62):
  // scale 1.85. The push-in ends on it and K2 crossfades in on top.
  k1K2Frame: { x0: 0.4179, y0: 0.2969, w: 0.5407, h: 0.5404 },
  k2Soldier: { x: 0.36, y: 0.48 }, // soldier body in k2 / C2
  // His whole figure plus the musket to just past the muzzle, in C1's end, the hold and C2. Portrait
  // screens fit this box to their width so he is never cropped (Noah, 2026-11-05).
  soldierBox: { x0: 0.2, x1: 0.72, y0: 0.1, y1: 1.0 },
  c2Muzzle: { x: 0.66, y: 0.26 }, // muzzle + flash in C2
  c2Ball: { x: 0.95, y: 0.25 }, // ball at the end of C2
  c2bBall: { x: 0.5, y: 0.45 }, // ball in the side-tracking shot (C2b)
  // K4 v2 globe (and every C4 frame): centre and diameter as a fraction of image height.
  k4Globe: { x: 0.498, y: 0.505, d: 0.685 },
  // Logo ring inside /brand/logo-stacked.svg: centre (fractions of width / height) and OUTER
  // diameter (fraction of width). Fitted to the vector itself (2026-11-08, circle fit to the ring's
  // sides, ±0.3% across fits); the old numbers came from logo-square and put the ring ~1.5% left,
  // ~0.8% low and 2.7% too big, so it visibly missed the globe.
  logoRing: { x: 0.511, y: 0.4138, d: 0.8388 },
};

// Shared circle target (CLAUDE.md): centred, diameter = 50% of frame height,
// capped on narrow screens so the globe and ring never crop.
export const circleTarget = (w, h) => {
  const d = Math.min(h * 0.5, w * CHOREO.phone.globeW);
  return { x: w / 2, y: h / 2, d };
};
