// C2 background clean-up (2026-11-08). The footage has gunsmoke puffs on the background soldiers'
// chests in every frame, muzzle flashes on them in frames 1–17, and a glow in the smoke under the
// featured man's raised arm in frames 1–13. The camera is static, so:
// - the background line (left of him) comes from a clean plate in every frame: C2 hd frame 19 with the
//   puffs painted out by Nano Banana Pro (Runway task 4a6c7b43-1c8d-49eb-977d-633ce727fc8c, 20
//   credits, assets/drafts/c2-plate.png), brightness-matched per frame on the stone wall below it, so
//   the shot's flash still lights the scene;
// - the glow under his arm comes from frame 19 (already clean there), full through frame 14 and easing
//   back to the footage by frame 17.
// Writes f_00NN-fix1.webp for all 78 frames in every tier (/hero/v1 is cached as immutable, so
// repaired frames get new names; ASSETS.c2.pattern points at them).
// node scripts/fix-c2-background-flashes.cjs   (needs sharp; the source frames f_00NN.webp were removed
// from public/ after the repair — restore them from git history (commit before 2026-11-08 A3) to re-run)
const sharp = require('sharp');
const path = require('path');
const ROOT = path.join(__dirname, '..', 'public', 'hero', 'v1');
const PLATE = path.join(__dirname, '..', 'assets', 'drafts', 'c2-plate.png');
const SETS = ['c2', 'm/c2', 'hd/c2'];
const COUNT = 78;
const REF = 19;
const LINE = { x0: 0, x1: 0.25, y0: 0.2, y1: 0.74 }; // the background line, left of him
const ARM = { x0: 0.37, x1: 0.53, y0: 0.38, y1: 0.54 }; // the smoke under his raised arm
const WALL = { x0: 0.02, x1: 0.25, y0: 0.76, y1: 0.86 }; // brightness reference, never repainted
const armWeight = (i) => (i <= 14 ? 1 : Math.max(0, (18 - i) / 4));
const name = (i, fix) => `f_${String(i).padStart(4, '0')}${fix ? '-fix1' : ''}.webp`;
const raw = async (file, W, H) => {
  let s = sharp(file);
  if (W) s = s.resize(W, H, { fit: 'fill' });
  return s.removeAlpha().raw().toBuffer({ resolveWithObject: true });
};
async function featheredMask(W, H, r) {
  const m = Buffer.alloc(W * H);
  for (let y = Math.round(r.y0 * H); y < Math.round(r.y1 * H); y++)
    for (let x = Math.round(r.x0 * W); x < Math.round(r.x1 * W); x++) m[y * W + x] = 255;
  // sharp can hand back a blurred 1-channel image as 3 channels: read every `ch`-th byte
  const b = await sharp(m, { raw: { width: W, height: H, channels: 1 } }).blur(Math.max(1, W * 0.012)).raw().toBuffer({ resolveWithObject: true });
  return (p) => b.data[p * b.info.channels] / 255;
}
function mean(buf, W, H, r) {
  const s = [0, 0, 0];
  let n = 0;
  for (let y = Math.round(r.y0 * H); y < Math.round(r.y1 * H); y++)
    for (let x = Math.round(r.x0 * W); x < Math.round(r.x1 * W); x++) {
      const i = (y * W + x) * 3;
      s[0] += buf[i];
      s[1] += buf[i + 1];
      s[2] += buf[i + 2];
      n++;
    }
  return s.map((v) => v / n);
}

(async () => {
  for (const set of SETS) {
    const dir = path.join(ROOT, set);
    const ref = await raw(path.join(dir, name(REF)));
    const { width: W, height: H } = ref.info;
    const plate = (await raw(PLATE, W, H)).data;
    const lineM = await featheredMask(W, H, LINE);
    const armM = await featheredMask(W, H, ARM);
    const plateWall = mean(plate, W, H, WALL);
    for (let i = 1; i <= COUNT; i++) {
      const src = (await raw(path.join(dir, name(i)))).data;
      const g = mean(src, W, H, WALL).map((v, c) => v / plateWall[c]);
      const ka = armWeight(i);
      const out = Buffer.alloc(src.length);
      for (let p = 0, q = 0; p < W * H; p++, q += 3) {
        const a = lineM(p);
        const b = ka ? armM(p) * ka : 0;
        for (let c = 0; c < 3; c++) {
          let v = src[q + c];
          if (b) v = v * (1 - b) + ref.data[q + c] * b;
          if (a) v = v * (1 - a) + Math.min(255, plate[q + c] * g[c]) * a;
          out[q + c] = v;
        }
      }
      await sharp(out, { raw: { width: W, height: H, channels: 3 } }).webp({ quality: 82 }).toFile(path.join(dir, name(i, true)));
    }
    console.log(set, W, H, 'frames 1-' + COUNT);
  }
})();
