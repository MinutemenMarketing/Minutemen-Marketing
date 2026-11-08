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
    c1: [0.8, 27], // C1: the push-in across the battlefield to the soldier
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

  // C1 remap: Kling's camera eases in very slowly over the first ~12 frames, so the scroll moves
  // through that stretch faster and the first wheel click visibly moves the frame.
  c1Remap: [
    [0, 0],
    [0.06, 0.2],
    [1, 1],
  ],

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
    1: { in: 'load', out: 9 }, // "Minutemen Marketing. Ready at a minute's notice." — 0–9% (9%)
    2: { in: 43, out: 55 }, // "Response time as fast as a bullet." — 46–55% (9%), over C2b
    3: { in: 69, out: 85 }, // "With the right website…" — 72–85% (13%), out as toBrand begins
  },
};

// Assets. Swap a placeholder for the real thing by editing this block only.
export const ASSETS = {
  base: '/hero/v1',
  k1: 'k1', // + '-1920.webp' / '-1280.webp'
  k2: 'k2',
  k4: 'k4v2', // approved K4 (v2, ball shrunk)
  logo: '/brand/logo-stacked.svg', // stacked logo (mark over MINUTEMEN MARKETING), traced vector
  // `fix`: frame files replaced after a repair, saved under a new name because /hero/v1 is cached
  // as immutable. `dupes`: files that repeat the previous frame in the 1280 and 960 sets (a 24→15fps
  // extraction artefact; the 1920 set has none), skipped so the scrub never stalls on them.
  c1: { dir: 'c1', count: 92, pattern: 'f_%04d.webp', dupes: [46, 61, 76] },
  c2: { dir: 'c2', count: 78, pattern: 'f_%04d.webp' },
  // f_0017: the matte-ball repaint drew the ball ~6× too big on this one frame (2026-11-08). Rebuilt
  // from f_0016 + f_0018 with one ball at the midpoint size and position, in all three sets.
  c2b: { dir: 'c2b', count: 92, pattern: 'f_%04d.webp', fix: { 17: 'f_0017-fix1.webp' }, dupes: [46, 61, 76] },
  c3: { dir: 'c3', count: 122, pattern: 'f_%04d.webp', dupes: [46, 61, 76] },
  c4: { dir: 'c4', count: 91, pattern: 'f_%04d.webp' },
};

// Where things sit inside each still, as fractions of the image (measured from the files).
export const FOCUS = {
  k1Soldier: { x: 0.585, y: 0.5 }, // featured soldier in k1-cool
  k2Soldier: { x: 0.36, y: 0.48 }, // soldier body in k2 / C2
  // His whole figure plus the musket to just past the muzzle, in C1's end, the hold and C2. Portrait
  // screens fit this box to their width so he is never cropped (Noah, 2026-11-05).
  soldierBox: { x0: 0.2, x1: 0.72, y0: 0.1, y1: 1.0 },
  c2Muzzle: { x: 0.66, y: 0.26 }, // muzzle + flash in C2
  c2Ball: { x: 0.95, y: 0.25 }, // ball at the end of C2
  c2bBall: { x: 0.5, y: 0.45 }, // ball in the side-tracking shot (C2b)
  // K4 v2 globe (and every C4 frame): centre and diameter as a fraction of image height.
  k4Globe: { x: 0.498, y: 0.505, d: 0.685 },
  // Logo ring inside /brand/logo-stacked.svg: centre (fractions of width / height) and diameter
  // (fraction of width). Measured from logo-square, which the vector was traced from.
  logoRing: { x: 0.4964, y: 0.4215, d: 0.8616 },
};

// Shared circle target (CLAUDE.md): centred, diameter = 50% of frame height,
// capped on narrow screens so the globe and ring never crop.
export const circleTarget = (w, h) => {
  const d = Math.min(h * 0.5, w * 0.82);
  return { x: w / 2, y: h / 2, d };
};
