// HERO CHOREOGRAPHY — every timing in one place (see CLAUDE.md). Values are % of the pinned scroll.
// Tweak freely: scenes and text read these numbers; nothing else hard-codes timing.

export const CHOREO = {
  pin: { desktop: 900, mobile: 600 }, // pinned length in vh
  scrub: 1,
  lenisLerp: 0.08,
  textFade: 3, // each text fade-in / fade-out takes this % of the scroll

  scenes: {
    k1Hold: [0, 10], // battlefield (beat 1 fades in on load, out 6–10)
    c1: [10, 28], // push-in to the soldier — PLACEHOLDER: zoom K1, crossfade to K2
    k2Hold: [28, 32], // hold on the soldier
    c2: [32, 44], // the shot and the ball leaving the muzzle
    c2b: [44, 58], // FOLLOW THE BULLET — side-tracking with the ball — PLACEHOLDER until C2b exists
    c3: [58, 72], // ball climbs to the globe — PLACEHOLDER until C3 exists (starts on C2b's last frame)
    k4Hold: [72, 84], // the globe; C4 (ball orbits it) plays here — PLACEHOLDER: still K4
    toBrand: [84, 89], // painted globe → navy-and-white globe
    toLogo: [89, 95], // brand globe → logo circle with Minuteman and wordmark
    toSite: [95, 100], // logo settles, page becomes the site
  },

  beats: {
    1: { in: 'load', out: 6 }, // "Minutemen Marketing. Ready at a minute's notice."
    2: { in: 47, out: 54 }, // "Response time as fast as a bullet." — over C2b
    3: { in: 74, out: 81 }, // "With the right website…" — below the globe, during C4
  },
};

// Assets. Swap a placeholder for the real thing by editing this block only.
export const ASSETS = {
  base: '/hero/v1',
  k1: 'k1', // + '-1920.webp' / '-1280.webp'
  k2: 'k2',
  k4: 'k4', // K4 v1 (superseded) used as a placeholder until K4 v2 is approved
  logo: 'logo.webp', // placeholder until the Recraft vector exists
  c2: { dir: 'c2', count: 78, pattern: 'f_%04d.webp' },
  c1: null, // TODO: generated push-in frames
  c2b: null, // TODO: generated follow-the-bullet frames
  c3: null, // TODO: generated globe clip frames
  c4: null, // TODO: generated orbit frames (or the code-drawn orbit fallback)
};

// Where things sit inside each still, as fractions of the image (measured from the files).
export const FOCUS = {
  k1Soldier: { x: 0.585, y: 0.5 }, // featured soldier in k1-cool
  k2Soldier: { x: 0.36, y: 0.48 }, // soldier body in k2 / C2
  c2Muzzle: { x: 0.66, y: 0.26 }, // muzzle + flash in C2
  c2Ball: { x: 0.95, y: 0.25 }, // ball at the end of C2
  // K4 v1 globe: centre and diameter (fraction of image height). K4 v2 should be ~0.5.
  k4Globe: { x: 0.5, y: 0.493, d: 0.797 },
  // Logo ring inside logo-square: centre and diameter (fraction of image width).
  logoRing: { x: 0.5, y: 0.41, d: 0.674 },
};

// Shared circle target (CLAUDE.md): centred, diameter = 50% of frame height,
// capped on narrow screens so the globe and ring never crop.
export const circleTarget = (w, h) => {
  const d = Math.min(h * 0.5, w * 0.82);
  return { x: w / 2, y: h / 2, d };
};
